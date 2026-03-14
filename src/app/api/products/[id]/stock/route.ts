import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser, requireAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getAuthUser(request);
    requireAdmin(user);

    const payload = await request.json();
    const stockQuantity = typeof payload?.stockQuantity === 'number'
      ? payload.stockQuantity
      : Number(payload?.stockQuantity);

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new ApiError(400, 'Valid stockQuantity is required');
    }

    await connectToDatabase();

    const product = await Product.findByIdAndUpdate(
      id,
      { stockQuantity },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return NextResponse.json({
      product: {
        id: product._id.toString(),
        stock: product.stockQuantity,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
