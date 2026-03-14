import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import { handleApiError } from '@/backend/lib/api-error';
import { Order } from '@/backend/models/Order';
import { Product } from '@/backend/models/Product';

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
  deliveryDate?: Date | string | null;
  createdAt: Date | string;
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

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const orders = await Order.find({}).sort({ createdAt: -1 }).lean<LeanOrder[]>();

    // Hide orphaned records in admin UI: orders must be tied to a user identity.
    const ordersWithUserIdentity = orders.filter((order) => {
      const hasOrderId = Boolean(String(order.orderId ?? '').trim());
      const hasUserId = Boolean(order.userId);
      const hasName = Boolean(String(order.customerName ?? '').trim());
      const hasEmail = Boolean(String(order.email ?? '').trim());
      return hasOrderId && (hasUserId || hasName || hasEmail);
    });

    const productIds = ordersWithUserIdentity.flatMap((order) =>
      order.products
        .map((product) => product.productId?.toString())
        .filter((value): value is string => Boolean(value))
    );

    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id category image name')
      .lean();

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        {
          category: product.category ?? '',
          image: product.image ?? '',
          name: product.name ?? '',
        },
      ])
    );

    const formattedOrders = ordersWithUserIdentity.map((order) => {
      const addressParts = [
        order.shippingAddress?.address,
        order.shippingAddress?.city,
        order.shippingAddress?.pincode,
      ].filter(Boolean);

      return {
        id: String(order._id),
        orderId: order.orderId,
        userId: order.userId ? String(order.userId) : null,
        userName: order.customerName,
        email: order.email,
        phone: order.phone,
        address: addressParts.join(', '),
        products: order.products.map((item) => {
          const productLookup = item.productId ? productMap.get(String(item.productId)) : null;
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          return {
            productId: item.productId ? String(item.productId) : null,
            productName: item.productName || productLookup?.name || 'Unknown Product',
            category: item.category || productLookup?.category || 'General',
            image: item.image || productLookup?.image || '/paints/new-product.svg',
            quantity,
            price,
            totalPrice: quantity * price,
          };
        }),
        total: Number(order.totalAmount) || 0,
        orderStatus: normalizeStatus(order.orderStatus),
        purchaseType: order.purchaseType ?? 'online',
        orderDate: order.createdAt,
        deliveryDate: order.deliveryDate ?? null,
      };
    });

    const userSummaryMap = new Map<string, {
      userId: string | null;
      userName: string;
      email: string;
      phone: string;
      address: string;
      totalOrders: number;
      totalSpent: number;
    }>();

    for (const order of formattedOrders) {
      const normalizedEmail = String(order.email ?? '').trim().toLowerCase();
      const key = normalizedEmail || order.userId || order.orderId;
      const existing = userSummaryMap.get(key);

      if (!existing) {
        userSummaryMap.set(key, {
          userId: order.userId,
          userName: order.userName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          totalOrders: 1,
          totalSpent: order.total,
        });
        continue;
      }

      existing.totalOrders += 1;
      existing.totalSpent += order.total;

      if (!existing.phone && order.phone) {
        existing.phone = order.phone;
      }
      if (!existing.address && order.address) {
        existing.address = order.address;
      }
    }

    return NextResponse.json({
      users: Array.from(userSummaryMap.values()).sort((a, b) => b.totalOrders - a.totalOrders),
      orders: formattedOrders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

