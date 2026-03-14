import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { Product } from '@/backend/models/Product';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { getAuthUser, requireAdmin } from '@/backend/lib/auth';
import imageManifest from '@/shared/data/product-image-manifest.json';

function resolvePaintShopImage(productName: string): string {
  const match = imageManifest.products.find((item) => item.name.toLowerCase() === productName.toLowerCase());
  return `/paints/${match?.slug ?? imageManifest.placeholder.slug}.svg`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const imageUrl = resolvePaintShopImage(product.name);
    const source = 'paint-shop';

    product.image = imageUrl;
    await product.save();

    return NextResponse.json({
      message: 'Product image updated successfully',
      source,
      product: {
        id: product._id.toString(),
        name: product.name,
        image: imageUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

