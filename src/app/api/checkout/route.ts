import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/backend/lib/db';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { getAuthUser } from '@/backend/lib/auth';
import { Order } from '@/backend/models/Order';
import { Product } from '@/backend/models/Product';
import { ensureInventorySeeded } from '@/backend/lib/inventory';
import { consumeRateLimit, getClientIp } from '@/backend/lib/rate-limit';

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CB-${timestamp}-${random}`;
}

function sanitize(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`checkout:${ip}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimit.success) {
      throw new ApiError(429, 'Too many checkout attempts. Please try again in a few minutes.');
    }

    let userId: string | null = null;
    try {
      const user = getAuthUser(request);
      userId = user.userId;
    } catch {
      // Guest checkout allowed
    }

    const body = await request.json();

    // --- Validate shipping details ---
    const customerName = sanitize(body.customerName, 120);
    const phone = sanitize(body.phone, 20);
    const email = sanitize(body.email, 200).toLowerCase();
    const address = sanitize(body.address, 300);
    const city = sanitize(body.city, 100);
    const pincode = sanitize(body.pincode, 10);
    const paymentMethod = sanitize(body.paymentMethod, 10);

    if (!customerName) throw new ApiError(400, 'Customer name is required');
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) throw new ApiError(400, 'Valid 10-digit Indian phone number is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Valid email address is required');
    if (!address) throw new ApiError(400, 'Delivery address is required');
    if (!city) throw new ApiError(400, 'City is required');
    if (!pincode || !/^\d{6}$/.test(pincode)) throw new ApiError(400, 'Valid 6-digit pincode is required');
    if (!['cod', 'upi', 'card'].includes(paymentMethod)) throw new ApiError(400, 'Invalid payment method');

    // --- Validate products ---
    const cartProducts: { productId: string; name: string; quantity: number; price: number }[] = body.products;
    if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
      throw new ApiError(400, 'Cart is empty');
    }

    await connectToDatabase();
    await ensureInventorySeeded();

    let createdOrderId = '';
    let finalTotal = 0;
    const orderLineItems: { productId: mongoose.Types.ObjectId; productName: string; quantity: number; price: number }[] = [];

    const reservedItems: { productId: mongoose.Types.ObjectId; quantity: number }[] = [];

    try {
      for (const item of cartProducts) {
        if (!item?.productId || typeof item.quantity !== 'number' || item.quantity < 1) {
          throw new ApiError(400, 'Each product requires productId and a valid quantity');
        }

        let product = null;

        // Try ObjectId lookup first (DB products), then fall back to seed index.
        if (mongoose.Types.ObjectId.isValid(item.productId)) {
          product = await Product.findById(item.productId);
        }

        if (!product) {
          product = await Product.findOne({ name: { $exists: true } })
            .sort({ createdAt: 1 })
            .skip(Math.max(0, Number(item.productId) - 1))
            .limit(1);
        }

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.name ?? item.productId}`);
        }

        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id, stockQuantity: { $gte: item.quantity } },
          { $inc: { stockQuantity: -item.quantity, soldCount: item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new ApiError(400, `Insufficient stock for "${product.name}"`);
        }

        reservedItems.push({ productId: product._id, quantity: item.quantity });

        finalTotal += updatedProduct.price * item.quantity;
        orderLineItems.push({
          productId: updatedProduct._id,
          productName: updatedProduct.name,
          quantity: item.quantity,
          price: updatedProduct.price,
        });
      }

      createdOrderId = generateOrderId();

      await Order.create({
        orderId: createdOrderId,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        customerName,
        phone,
        email,
        shippingAddress: { address, city, pincode },
        products: orderLineItems,
        totalAmount: finalTotal,
        paymentMethod,
        purchaseType: 'online',
        orderStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      });
    } catch (error) {
      if (reservedItems.length > 0) {
        await Product.bulkWrite(
          reservedItems.map((item) => ({
            updateOne: {
              filter: { _id: item.productId },
              update: { $inc: { stockQuantity: item.quantity, soldCount: -item.quantity } },
            },
          }))
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      orderId: createdOrderId,
      totalAmount: finalTotal,
      customerName,
      email,
      paymentMethod,
      products: orderLineItems.map((p) => ({
        productName: p.productName,
        quantity: p.quantity,
        price: p.price,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

