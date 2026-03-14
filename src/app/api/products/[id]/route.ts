import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { Product } from '@/backend/models/Product';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import { parseProductPayload, serializeProduct } from '@/backend/lib/inventory';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getAuthUser(request);
    requireAdmin(user);

    const parsedPayload = parseProductPayload(await request.json());

    await connectToDatabase();

    const product = await Product.findByIdAndUpdate(id, parsedPayload, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}

