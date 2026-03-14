import { ApiError } from '@/lib/api-error';
import { products as seedProducts } from '@/data/products';
import { Product, ProductDocument } from '@/models/Product';

type ProductPayload = {
  name: unknown;
  price: unknown;
  category: unknown;
  colorCode: unknown;
  stockQuantity: unknown;
  image?: unknown;
  description?: unknown;
  rating?: unknown;
};

export type InventoryProductResponse = {
  id: string;
  name: string;
  price: number;
  category: string;
  colorCode: string;
  stock: number;
  soldCount: number;
  image: string;
  description: string;
  rating: number;
};

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toOptionalTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }

  return Number.NaN;
}

export function serializeProduct(product: ProductDocument): InventoryProductResponse {
  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    category: product.category,
    colorCode: product.colorCode,
    stock: product.stockQuantity,
    soldCount: product.soldCount,
    image: product.image ?? '',
    description: product.description ?? '',
    rating: product.rating ?? 4.5,
  };
}

export function parseProductPayload(payload: ProductPayload) {
  const name = toTrimmedString(payload.name);
  const category = toTrimmedString(payload.category);
  const colorCode = toTrimmedString(payload.colorCode) || '#1e3a8a';
  const image = toOptionalTrimmedString(payload.image);
  const description = toOptionalTrimmedString(payload.description);
  const price = toFiniteNumber(payload.price);
  const stockQuantity = toFiniteNumber(payload.stockQuantity);
  const ratingValue = payload.rating === undefined ? 4.5 : toFiniteNumber(payload.rating);

  if (!name || !category || !colorCode || Number.isNaN(price) || Number.isNaN(stockQuantity)) {
    throw new ApiError(400, 'Name, category, price, stock quantity, and color code are required');
  }

  if (name.length < 2 || name.length > 120) {
    throw new ApiError(400, 'Product name must be between 2 and 120 characters');
  }

  if (category.length < 2 || category.length > 60) {
    throw new ApiError(400, 'Category must be between 2 and 60 characters');
  }

  if (price < 0) {
    throw new ApiError(400, 'Price cannot be negative');
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new ApiError(400, 'Stock quantity must be a non-negative whole number');
  }

  if (description.length > 2000) {
    throw new ApiError(400, 'Description must be 2000 characters or less');
  }

  if (image.length > 500) {
    throw new ApiError(400, 'Image URL must be 500 characters or less');
  }

  if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
    throw new ApiError(400, 'Rating must be between 0 and 5');
  }

  return {
    name,
    category,
    colorCode,
    image,
    description,
    price,
    stockQuantity,
    rating: ratingValue,
  };
}

export async function ensureInventorySeeded() {
  const existingCount = await Product.estimatedDocumentCount();
  if (existingCount > 0) {
    return;
  }

  await Product.insertMany(
    seedProducts.map((product, index) => ({
      name: product.name,
      price: product.price,
      category: product.category,
      colorCode: ['#E5E7EB', '#1D4ED8', '#FDE68A', '#A7F3D0', '#F59E0B', '#111827', '#EAD7B7', '#3B82F6', '#D1D5DB', '#14B8A6', '#A855F7', '#0EA5E9', '#86EFAC'][index] ?? '#1e3a8a',
      stockQuantity: product.stock,
      soldCount: 0,
      image: product.image ?? '',
      description: product.description ?? '',
      rating: product.rating ?? 4.5,
    }))
  );
}
