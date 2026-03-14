import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { Order } from '@/models/Order';

type LeanOrder = {
  _id: { toString(): string } | string;
  orderId: string;
  userId?: { toString(): string } | string;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress?: { address?: string; city?: string; pincode?: string };
  products: Array<{
    productId?: { toString(): string } | string;
    productName: string;
    category?: string;
    image?: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  orderStatus: string;
  purchaseType?: 'online' | 'offline';
  createdAt: Date | string;
  deliveryDate?: Date | string | null;
};

function normalizeStatus(status: string) {
  if (status === 'pending' || status === 'paid') {
    return 'processing';
  }
  if (status === 'completed') {
    return 'completed';
  }
  return status;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ identifier: string }> }
) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    const { identifier } = await context.params;
    const decodedIdentifier = decodeURIComponent(identifier).trim();

    if (!decodedIdentifier) {
      return NextResponse.json({ message: 'User identifier is required' }, { status: 400 });
    }

    await connectToDatabase();

    const filter = mongoose.Types.ObjectId.isValid(decodedIdentifier)
      ? { userId: new mongoose.Types.ObjectId(decodedIdentifier) }
      : { email: decodedIdentifier.toLowerCase() };

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean<LeanOrder[]>();

    const formattedOrders = orders.map((order) => ({
      id: String(order._id),
      orderId: order.orderId,
      userId: order.userId ? String(order.userId) : null,
      userName: order.customerName,
      email: order.email,
      phone: order.phone,
      address: [
        order.shippingAddress?.address,
        order.shippingAddress?.city,
        order.shippingAddress?.pincode,
      ]
        .filter(Boolean)
        .join(', '),
      products: (order.products ?? []).map((item) => ({
        productId: item.productId ? String(item.productId) : null,
        productName: item.productName,
        category: item.category || 'General',
        image: item.image || '/paints/new-product.svg',
        quantity: item.quantity,
        price: item.price,
        totalPrice: Number(item.quantity) * Number(item.price),
      })),
      total: order.totalAmount,
      orderStatus: normalizeStatus(order.orderStatus),
      purchaseType: order.purchaseType ?? 'online',
      orderDate: order.createdAt,
      deliveryDate: order.deliveryDate ?? null,
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    return handleApiError(error);
  }
}
