import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { ApiError, handleApiError } from '@/lib/api-error';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { ensureInventorySeeded, parseProductPayload, serializeProduct } from '@/lib/inventory';

export async function GET() {
  try {
    await connectToDatabase();
    await ensureInventorySeeded();

    const products = await Product.find().sort({ createdAt: -1 });

    return NextResponse.json({ products: products.map(serializeProduct) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    const parsedPayload = parseProductPayload(await request.json());

    await connectToDatabase();

    const product = await Product.create(parsedPayload);

    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
