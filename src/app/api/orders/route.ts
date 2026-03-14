import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser } from '@/lib/auth';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { ensureInventorySeeded } from '@/lib/inventory';

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const user = getAuthUser(request);
      userId = user.userId;
    } catch {
      userId = null;
    }

    const {
      products,
      customerName = 'Guest Customer',
      phone = '0000000000',
      email = 'guest@colorburst.local',
      address = 'Address not provided',
      city = 'Unknown',
      pincode = '000000',
      paymentMethod = 'cod',
    } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      throw new ApiError(400, 'Products array is required');
    }

    await connectToDatabase();
    await ensureInventorySeeded();
    let totalAmount = 0;
    const orderItems: {
      productId: mongoose.Types.ObjectId;
      productName: string;
      quantity: number;
      price: number;
    }[] = [];
    const reservedItems: { productId: mongoose.Types.ObjectId; quantity: number }[] = [];

    try {
      for (const item of products) {
        if (!item?.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new ApiError(400, 'Each product requires productId and quantity');
        }

        const product = await Product.findById(item.productId);

        if (!product) {
          throw new ApiError(404, 'Product not found');
        }

        const updatedProduct = await Product.findOneAndUpdate(
          { _id: product._id, stockQuantity: { $gte: item.quantity } },
          { $inc: { stockQuantity: -item.quantity, soldCount: item.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          throw new ApiError(400, 'Insufficient stock for product');
        }

        reservedItems.push({ productId: product._id, quantity: item.quantity });

        totalAmount += updatedProduct.price * item.quantity;
        orderItems.push({
          productId: updatedProduct._id,
          productName: updatedProduct.name,
          quantity: item.quantity,
          price: updatedProduct.price,
        });
      }

      const orderId = `CB-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;

      await Order.create({
        orderId,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        customerName,
        phone,
        email,
        shippingAddress: { address, city, pincode },
        products: orderItems,
        totalAmount,
        paymentMethod,
        purchaseType: 'online',
        orderStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      });

      return NextResponse.json({ message: 'Order placed', orderId, totalAmount });
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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return handleApiError(new ApiError(404, error.message));
      }

      if (
        error.message === 'Insufficient stock for product' ||
        error.message === 'Invalid product quantity'
      ) {
        return handleApiError(new ApiError(400, error.message));
      }
    }

    return handleApiError(error);
  }
}
