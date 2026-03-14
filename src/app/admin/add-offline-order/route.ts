import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { Product } from '@/models/Product';

type SelectedUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
};

type MatchedProduct = {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  stockQuantity: number;
  soldCount: number;
  price: number;
  image?: string;
};

function sanitize(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CB-OFF-${timestamp}-${random}`;
}

function toStoredStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'processing') return 'pending';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'delivered') return 'delivered';
  throw new ApiError(400, 'Order status must be Processing, Completed, or Delivered');
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    requireAdmin(authUser);

    const payload = await request.json();

    const userId = sanitize(payload.userId, 100);
    const productId = sanitize(payload.productId, 100);
    const phone = sanitize(payload.phone, 20);
    const address = sanitize(payload.address, 300);
    const city = sanitize(payload.city, 100);
    const pincode = sanitize(payload.pincode, 10);

    const quantity = Number(payload.quantity);
    const price = Number(payload.price);

    const paymentMethodInput = sanitize(payload.paymentMethod, 20).toLowerCase();
    const paymentMethod =
      paymentMethodInput === 'cash' ? 'cod' : paymentMethodInput === 'upi' ? 'upi' : paymentMethodInput === 'card' ? 'card' : null;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Please select a valid user');
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new ApiError(400, 'Please select a valid product from inventory');
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new ApiError(400, 'Quantity must be at least 1');
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new ApiError(400, 'Price must be a non-negative number');
    }
    if (!paymentMethod) {
      throw new ApiError(400, 'Payment method must be Cash, UPI, or Card');
    }

    const purchaseDate = payload.purchaseDate ? new Date(payload.purchaseDate) : new Date();
    if (Number.isNaN(purchaseDate.getTime())) {
      throw new ApiError(400, 'Invalid purchase date');
    }

    await connectToDatabase();

    const selectedUserResult = await User.findById(userId)
      .select('_id name email')
      .lean();
    const selectedUser = selectedUserResult as SelectedUser | null;
    if (!selectedUser) {
      throw new ApiError(404, 'Selected user not found');
    }

    const matchedProductResult = await Product.findById(productId).lean();
    const matchedProduct = matchedProductResult as MatchedProduct | null;

    if (!matchedProduct) {
      throw new ApiError(404, 'Selected product not found');
    }

    const stockUpdate = await Product.findOneAndUpdate(
      { _id: matchedProduct._id, stockQuantity: { $gte: quantity } },
      { $inc: { stockQuantity: -quantity, soldCount: quantity } },
      { new: true }
    );

    if (!stockUpdate) {
      throw new ApiError(400, 'Insufficient stock for this product');
    }

    const totalPrice = quantity * price;

    const order = await Order.create({
      orderId: generateOrderId(),
      userId: new mongoose.Types.ObjectId(userId),
      customerName: selectedUser.name,
      email: selectedUser.email,
      phone: phone || 'N/A',
      shippingAddress: {
        address: address || 'Offline in-store purchase',
        city: city || 'N/A',
        pincode: pincode || '000000',
      },
      products: [
        {
          productId: matchedProduct ? matchedProduct._id : undefined,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          image: matchedProduct.image || '/paints/new-product.svg',
          quantity,
          price,
        },
      ],
      totalAmount: totalPrice,
      paymentMethod,
      purchaseType: 'offline',
      orderStatus: toStoredStatus(sanitize(payload.orderStatus, 20)),
      createdAt: purchaseDate,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: 'Offline purchase added successfully',
      orderId: order.orderId,
      orderDbId: String(order._id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
