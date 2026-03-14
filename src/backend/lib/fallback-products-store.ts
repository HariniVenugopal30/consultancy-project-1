import { products as seedProducts } from '@/shared/data/products';
import fs from 'fs';
import path from 'path';

type FallbackProduct = {
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

type FallbackProductInput = {
  name: string;
  price: number;
  category: string;
  colorCode: string;
  stock: number;
  image?: string;
  description?: string;
  rating?: number;
};

type FallbackStoreState = {
  products: FallbackProduct[];
  nextIdCounter: number;
};

type FallbackOrderItem = {
  productId: string;
  quantity: number;
};

// Keep runtime fallback data outside Next build output to avoid dev reload loops.
const storeDirectory = path.join(process.cwd(), '.runtime-data');
const storeFilePath = path.join(storeDirectory, 'fallback-products-store.json');

function mapSeedProductToFallback(product: (typeof seedProducts)[number], id: string): FallbackProduct {
  return {
    id,
    name: product.name,
    price: product.price,
    category: product.category,
    colorCode: '#1e3a8a',
    stock: product.stock,
    soldCount: 0,
    image: product.image ?? '',
    description: product.description ?? '',
    rating: product.rating ?? 4.5,
  };
}

function buildSeedState(): FallbackStoreState {
  return {
    products: seedProducts.map((product) => mapSeedProductToFallback(product, String(product.id))),
    nextIdCounter: seedProducts.length + 1,
  };
}

function mergeMissingSeedProducts(state: FallbackStoreState) {
  const existingNames = new Set(state.products.map((product) => product.name.toLowerCase()));
  let nextId = state.nextIdCounter;
  let hasChanges = false;

  for (const product of seedProducts) {
    if (existingNames.has(product.name.toLowerCase())) {
      continue;
    }

    state.products.push(mapSeedProductToFallback(product, String(nextId)));
    existingNames.add(product.name.toLowerCase());
    nextId += 1;
    hasChanges = true;
  }

  if (nextId !== state.nextIdCounter) {
    state.nextIdCounter = nextId;
    hasChanges = true;
  }

  return hasChanges;
}

function ensureStoreFile() {
  if (!fs.existsSync(storeDirectory)) {
    fs.mkdirSync(storeDirectory, { recursive: true });
  }

  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, JSON.stringify(buildSeedState()), 'utf8');
  }
}

function readState(): FallbackStoreState {
  ensureStoreFile();

  try {
    const raw = fs.readFileSync(storeFilePath, 'utf8');
    const parsed = JSON.parse(raw) as FallbackStoreState;

    if (!Array.isArray(parsed.products) || typeof parsed.nextIdCounter !== 'number') {
      throw new Error('Invalid fallback store file');
    }

    if (mergeMissingSeedProducts(parsed)) {
      writeState(parsed);
    }

    return parsed;
  } catch {
    const seedState = buildSeedState();
    fs.writeFileSync(storeFilePath, JSON.stringify(seedState), 'utf8');
    return seedState;
  }
}

function writeState(state: FallbackStoreState) {
  ensureStoreFile();
  fs.writeFileSync(storeFilePath, JSON.stringify(state), 'utf8');
}

function normalizePayload(input: FallbackProductInput) {
  return {
    name: input.name.trim(),
    price: Number(input.price),
    category: input.category.trim(),
    colorCode: input.colorCode.trim() || '#1e3a8a',
    stock: Number(input.stock),
    image: input.image?.trim() ?? '',
    description: input.description?.trim() ?? '',
    rating: input.rating === undefined ? 4.5 : Number(input.rating),
  };
}

export function listFallbackProducts() {
  const state = readState();
  return [...state.products].sort((a, b) => Number(b.id) - Number(a.id));
}

export function createFallbackProduct(input: FallbackProductInput) {
  const state = readState();
  const normalized = normalizePayload(input);
  const product: FallbackProduct = {
    id: String(state.nextIdCounter),
    soldCount: 0,
    ...normalized,
  };

  state.nextIdCounter += 1;
  state.products.unshift(product);
  writeState(state);
  return product;
}

export function updateFallbackProduct(id: string, input: Partial<FallbackProductInput>) {
  const state = readState();
  const index = state.products.findIndex((product) => product.id === id);
  if (index < 0) {
    return null;
  }

  const existing = state.products[index];
  state.products[index] = {
    ...existing,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.price !== undefined ? { price: Number(input.price) } : {}),
    ...(input.category !== undefined ? { category: input.category.trim() } : {}),
    ...(input.colorCode !== undefined ? { colorCode: input.colorCode.trim() || '#1e3a8a' } : {}),
    ...(input.stock !== undefined ? { stock: Number(input.stock) } : {}),
    ...(input.image !== undefined ? { image: input.image.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.rating !== undefined ? { rating: Number(input.rating) } : {}),
  };

  writeState(state);
  return state.products[index];
}

export function updateFallbackStock(id: string, stock: number) {
  return updateFallbackProduct(id, { stock });
}

export function deleteFallbackProduct(id: string) {
  const state = readState();
  const index = state.products.findIndex((product) => product.id === id);
  if (index < 0) {
    return false;
  }

  state.products.splice(index, 1);
  writeState(state);
  return true;
}

export function processFallbackOrder(items: FallbackOrderItem[]) {
  const state = readState();

  for (const item of items) {
    const product = state.products.find((candidate) => candidate.id === item.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Invalid product quantity');
    }

    if (product.stock < item.quantity) {
      throw new Error('Insufficient stock for product');
    }
  }

  let totalAmount = 0;

  for (const item of items) {
    const product = state.products.find((candidate) => candidate.id === item.productId)!;
    product.stock -= item.quantity;
    product.soldCount += item.quantity;
    totalAmount += product.price * item.quantity;
  }

  writeState(state);
  return totalAmount;
}

