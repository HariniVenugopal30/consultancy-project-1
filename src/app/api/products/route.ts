import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { Product } from '@/backend/models/Product';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import { ensureInventorySeeded, parseProductPayload, serializeProduct } from '@/backend/lib/inventory';

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

