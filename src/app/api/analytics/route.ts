import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import { Order } from '@/backend/models/Order';
import { Product } from '@/backend/models/Product';
import { User } from '@/backend/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const [totalUsers, totalOrders] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
    ]);

    const revenueResult = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;

    const topProducts = await Product.find()
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name soldCount price');

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      topProducts: topProducts.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        soldCount: product.soldCount,
        price: product.price,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

