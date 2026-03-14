import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { Order } from '@/models/Order';

type LeanOrder = {
  _id: mongoose.Types.ObjectId | string;
  orderId: string;
  totalAmount: number;
  orderStatus: string;
  purchaseType?: 'online' | 'offline';
  createdAt: Date | string;
  products?: Array<{
    productName: string;
    image?: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);

    await connectToDatabase();

    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .lean<LeanOrder[]>();

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: String(order._id),
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        purchaseType: order.purchaseType ?? 'online',
        orderDate: order.createdAt,
        products: (order.products ?? []).map((product: NonNullable<LeanOrder['products']>[number]) => ({
          productName: product.productName,
          image: product.image || '/paints/new-product.svg',
          quantity: product.quantity,
          price: product.price,
          category: product.category || 'General',
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
