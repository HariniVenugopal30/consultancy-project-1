import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/backend/lib/db';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { Order, OrderDocument } from '@/backend/models/Order';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import { Product } from '@/backend/models/Product';

const editableStatuses = ['processing', 'completed', 'shipped', 'delivered', 'cancelled'] as const;

type EditableStatus = (typeof editableStatuses)[number];

type EditableProduct = {
  productId: string | null;
  productName: string;
  category?: string;
  image?: string;
  quantity: number;
  price: number;
};

function resolveStatus(status: string | undefined): EditableStatus {
  if (!status) {
    return 'processing';
  }

  if (status === 'pending' || status === 'paid') {
    return 'processing';
  }
  if (status === 'completed') {
    return 'completed';
  }

  if (editableStatuses.includes(status as EditableStatus)) {
    return status as EditableStatus;
  }

  throw new ApiError(400, 'Invalid order status');
}

function mapStoredStatus(status: EditableStatus) {
  if (status === 'processing') {
    return 'pending';
  }
  if (status === 'completed') {
    return 'completed';
  }
  return status;
}

async function findOrder(orderIdOrDocId: string) {
  const byOrderId = await Order.findOne({ orderId: orderIdOrDocId });
  if (byOrderId) {
    return byOrderId;
  }

  if (mongoose.Types.ObjectId.isValid(orderIdOrDocId)) {
    return Order.findById(orderIdOrDocId);
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ApiError(400, 'Order ID is required');
    }

    const orderId = id.trim().toUpperCase();

    await connectToDatabase();

    const order = await Order.findOne({ orderId }).lean<OrderDocument>();

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const statusTimeline: Record<string, { label: string; done: boolean }[]> = {
      pending: [
        { label: 'Order Placed', done: true },
        { label: 'Payment Confirmed', done: false },
        { label: 'Shipped', done: false },
        { label: 'Delivered', done: false },
      ],
      paid: [
        { label: 'Order Placed', done: true },
        { label: 'Payment Confirmed', done: true },
        { label: 'Shipped', done: false },
        { label: 'Delivered', done: false },
      ],
      completed: [
        { label: 'Order Placed', done: true },
        { label: 'Payment Completed', done: true },
        { label: 'Delivered', done: false },
      ],
      shipped: [
        { label: 'Order Placed', done: true },
        { label: 'Payment Confirmed', done: true },
        { label: 'Shipped', done: true },
        { label: 'Delivered', done: false },
      ],
      delivered: [
        { label: 'Order Placed', done: true },
        { label: 'Payment Confirmed', done: true },
        { label: 'Shipped', done: true },
        { label: 'Delivered', done: true },
      ],
      cancelled: [
        { label: 'Order Placed', done: true },
        { label: 'Cancelled', done: true },
      ],
    };

    const userOrderFilter = order.userId
      ? { userId: order.userId }
      : { email: String(order.email).toLowerCase() };

    const [userOrderCount, userOrderAggregate] = await Promise.all([
      Order.countDocuments(userOrderFilter),
      Order.aggregate([
        { $match: userOrderFilter },
        { $group: { _id: null, totalSpent: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const userTotalSpent = Number(userOrderAggregate[0]?.totalSpent ?? 0);

    return NextResponse.json({
      orderId: order.orderId,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      shippingAddress: order.shippingAddress,
      products: order.products,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      purchaseType: order.purchaseType ?? 'online',
      orderStatus: order.orderStatus,
      timeline: statusTimeline[order.orderStatus] ?? [],
      userOrderCount,
      userTotalSpent,
      orderDate: order.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const { id } = await params;
    const order = await findOrder(id);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const payload = await request.json();

    const nextStatus = resolveStatus(payload.orderStatus);
    const deliveryDate = payload.deliveryDate ? new Date(payload.deliveryDate) : null;

    if (payload.deliveryDate && Number.isNaN(deliveryDate?.getTime())) {
      throw new ApiError(400, 'Invalid delivery date');
    }

    const inputProducts = Array.isArray(payload.products) ? payload.products : order.products;
    const validatedProducts: EditableProduct[] = inputProducts.map((item: EditableProduct) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!item.productName || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(price) || price < 0) {
        throw new ApiError(400, 'Each order item requires valid productName, quantity, and price');
      }

      return {
        productId: item.productId ?? null,
        productName: String(item.productName).trim(),
        category: String(item.category ?? '').trim(),
        image: String(item.image ?? '').trim(),
        quantity,
        price,
      };
    });

    const previousQuantities = new Map<string, number>();
    for (const item of order.products) {
      const key = item.productId ? String(item.productId) : null;
      if (!key) {
        continue;
      }
      previousQuantities.set(key, (previousQuantities.get(key) ?? 0) + Number(item.quantity));
    }

    const nextQuantities = new Map<string, number>();
    for (const item of validatedProducts) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        continue;
      }
      nextQuantities.set(item.productId, (nextQuantities.get(item.productId) ?? 0) + Number(item.quantity));
    }

    const allProductIds = new Set<string>([
      ...Array.from(previousQuantities.keys()),
      ...Array.from(nextQuantities.keys()),
    ]);

    for (const productId of allProductIds) {
      const previousQty = previousQuantities.get(productId) ?? 0;
      const nextQty = nextQuantities.get(productId) ?? 0;
      const delta = nextQty - previousQty;

      if (delta === 0) {
        continue;
      }

      if (delta > 0) {
        const updated = await Product.findOneAndUpdate(
          { _id: productId, stockQuantity: { $gte: delta } },
          { $inc: { stockQuantity: -delta, soldCount: delta } },
          { new: true }
        );

        if (!updated) {
          throw new ApiError(400, 'Insufficient stock to increase order quantity');
        }
      } else {
        await Product.updateOne(
          { _id: productId },
          { $inc: { stockQuantity: Math.abs(delta), soldCount: -Math.abs(delta) } }
        );
      }
    }

    order.products = validatedProducts.map((item) => ({
      productId: item.productId && mongoose.Types.ObjectId.isValid(item.productId)
        ? new mongoose.Types.ObjectId(item.productId)
        : undefined,
      productName: item.productName,
      category: item.category,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
    }));
    order.totalAmount = validatedProducts.reduce((sum, item) => sum + item.quantity * item.price, 0);
    order.orderStatus = mapStoredStatus(nextStatus);
    order.deliveryDate = deliveryDate;

    await order.save();

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const { id } = await params;
    const order = await findOrder(id);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    for (const item of order.products) {
      if (!item.productId) {
        continue;
      }

      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: item.quantity, soldCount: -item.quantity } }
      );
    }

    await Order.deleteOne({ _id: order._id });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

