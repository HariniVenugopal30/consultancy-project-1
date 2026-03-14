const mongoose = require('mongoose');
const dotenv = require('dotenv');
const imageManifest = require('../src/data/product-image-manifest.json');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const SEED_RESET = process.env.SEED_RESET === 'true';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    colorCode: { type: String, required: true, trim: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const imagePathByName = new Map(
  imageManifest.products.map((product) => [product.name, `/paints/${product.slug}.svg`])
);

const seedProducts = [
  {
    name: 'Premium Interior Matte',
    price: 34.99,
    category: 'Interior',
    colorCode: '#E5E7EB',
    stockQuantity: 150,
    soldCount: 42,
    image: imagePathByName.get('Premium Interior Matte'),
    description: 'Ultra-smooth matte finish for perfect interior walls',
    rating: 4.8,
  },
  {
    name: 'Gloss Exterior Pro',
    price: 44.99,
    category: 'Exterior',
    colorCode: '#1D4ED8',
    stockQuantity: 120,
    soldCount: 58,
    image: imagePathByName.get('Gloss Exterior Pro'),
    description: 'Weather-resistant exterior paint with high gloss shine',
    rating: 4.9,
  },
  {
    name: 'Satin Semi-Gloss',
    price: 39.99,
    category: 'Interior',
    colorCode: '#FDE68A',
    stockQuantity: 200,
    soldCount: 67,
    image: imagePathByName.get('Satin Semi-Gloss'),
    description: 'Elegant satin finish for kitchens and bathrooms',
    rating: 4.7,
  },
  {
    name: 'Eco-Friendly Acrylic',
    price: 32.99,
    category: 'Eco-Friendly',
    colorCode: '#A7F3D0',
    stockQuantity: 180,
    soldCount: 35,
    image: imagePathByName.get('Eco-Friendly Acrylic'),
    description: 'Low-VOC, environmentally friendly paint for conscious homes',
    rating: 4.6,
  },
  {
    name: 'Deck & Patio Stain',
    price: 49.99,
    category: 'Exterior',
    colorCode: '#F59E0B',
    stockQuantity: 100,
    soldCount: 22,
    image: imagePathByName.get('Deck & Patio Stain'),
    description: 'Durable stain for outdoor wood surfaces',
    rating: 4.8,
  },
  {
    name: 'Cabinet & Trim Paint',
    price: 54.99,
    category: 'Specialty',
    colorCode: '#111827',
    stockQuantity: 110,
    soldCount: 19,
    image: imagePathByName.get('Cabinet & Trim Paint'),
    description: 'Premium finish perfect for cabinets and trim work',
    rating: 4.9,
  },
  {
    name: 'Ultra Washable Eggshell',
    price: 42.5,
    category: 'Interior',
    colorCode: '#EAD7B7',
    stockQuantity: 140,
    soldCount: 27,
    image: imagePathByName.get('Ultra Washable Eggshell'),
    description: 'Easy-clean eggshell paint ideal for high-traffic family rooms',
    rating: 4.7,
  },
  {
    name: 'RainShield Exterior Shield',
    price: 58,
    category: 'Exterior',
    colorCode: '#3B82F6',
    stockQuantity: 95,
    soldCount: 31,
    image: imagePathByName.get('RainShield Exterior Shield'),
    description: 'All-weather exterior protection with superior rain resistance',
    rating: 4.8,
  },
  {
    name: 'Premium Wall Primer Pro',
    price: 29.99,
    category: 'Primer',
    colorCode: '#D1D5DB',
    stockQuantity: 210,
    soldCount: 24,
    image: imagePathByName.get('Premium Wall Primer Pro'),
    description: 'High-bond primer for smooth topcoat adhesion and stain blocking',
    rating: 4.6,
  },
  {
    name: 'Kitchen & Bath Anti-Mold',
    price: 47.75,
    category: 'Specialty',
    colorCode: '#14B8A6',
    stockQuantity: 125,
    soldCount: 29,
    image: imagePathByName.get('Kitchen & Bath Anti-Mold'),
    description: 'Moisture-resistant interior paint with anti-mold protection',
    rating: 4.8,
  },
  {
    name: 'Velvet Texture Designer Coat',
    price: 63.5,
    category: 'Designer',
    colorCode: '#A855F7',
    stockQuantity: 70,
    soldCount: 14,
    image: imagePathByName.get('Velvet Texture Designer Coat'),
    description: 'Decorative texture coat for premium accent walls and spaces',
    rating: 4.9,
  },
  {
    name: 'Heat Reflect Roof Coat',
    price: 66.99,
    category: 'Exterior',
    colorCode: '#0EA5E9',
    stockQuantity: 88,
    soldCount: 18,
    image: imagePathByName.get('Heat Reflect Roof Coat'),
    description: 'Reflective roof coating designed to reduce surface heat gain',
    rating: 4.7,
  },
  {
    name: 'Child-Safe Odorless Paint',
    price: 51.25,
    category: 'Eco-Friendly',
    colorCode: '#86EFAC',
    stockQuantity: 132,
    soldCount: 21,
    image: imagePathByName.get('Child-Safe Odorless Paint'),
    description: 'Ultra low-odor, child-safe formula for nurseries and kids rooms',
    rating: 4.9,
  },
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false, dbName: 'paintcalculator' });

    const existingCount = await Product.countDocuments();

    if (existingCount > 0 && !SEED_RESET) {
      console.log('Products already exist. Set SEED_RESET=true to reseed.');
      return;
    }

    if (SEED_RESET) {
      await Product.deleteMany({});
    }

    await Product.insertMany(seedProducts);
    console.log('Seed complete:', seedProducts.length, 'products added.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
