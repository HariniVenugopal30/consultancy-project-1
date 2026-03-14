export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  description: string;
  category: string;
  stock: number;
  specifications?: {
    coverage?: string;
    finish?: string;
    durability?: string;
  };
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Premium Interior Matte',
    price: 34.99,
    image: '/paints/interior-matte.svg',
    rating: 4.8,
    description: 'Ultra-smooth matte finish for perfect interior walls',
    category: 'Interior',
    stock: 150,
    specifications: {
      coverage: '350-400 sq ft/gal',
      finish: 'Matte',
      durability: '10+ years',
    },
  },
  {
    id: 2,
    name: 'Gloss Exterior Pro',
    price: 44.99,
    image: '/paints/exterior-gloss.svg',
    rating: 4.9,
    description: 'Weather-resistant exterior paint with high gloss shine',
    category: 'Exterior',
    stock: 120,
    specifications: {
      coverage: '300-350 sq ft/gal',
      finish: 'Gloss',
      durability: '15+ years',
    },
  },
  {
    id: 3,
    name: 'Satin Semi-Gloss',
    price: 39.99,
    image: '/paints/satin.svg',
    rating: 4.7,
    description: 'Elegant satin finish for kitchens and bathrooms',
    category: 'Interior',
    stock: 200,
    specifications: {
      coverage: '350-400 sq ft/gal',
      finish: 'Satin',
      durability: '12+ years',
    },
  },
  {
    id: 4,
    name: 'Eco-Friendly Acrylic',
    price: 32.99,
    image: '/paints/eco-friendly.svg',
    rating: 4.6,
    description: 'Low-VOC, environmentally friendly paint for conscious homes',
    category: 'Eco-Friendly',
    stock: 180,
    specifications: {
      coverage: '350-400 sq ft/gal',
      finish: 'Matte',
      durability: '8+ years',
    },
  },
  {
    id: 5,
    name: 'Deck & Patio Stain',
    price: 49.99,
    image: '/paints/deck-stain.svg',
    rating: 4.8,
    description: 'Durable stain for outdoor wood surfaces',
    category: 'Exterior',
    stock: 100,
    specifications: {
      coverage: '200-250 sq ft/gal',
      finish: 'Semi-Transparent',
      durability: '5-7 years',
    },
  },
  {
    id: 6,
    name: 'Cabinet & Trim Paint',
    price: 54.99,
    image: '/paints/cabinet.svg',
    rating: 4.9,
    description: 'Premium finish perfect for cabinets and trim work',
    category: 'Specialty',
    stock: 110,
    specifications: {
      coverage: '300-350 sq ft/gal',
      finish: 'Gloss',
      durability: '12+ years',
    },
  },
  {
    id: 7,
    name: 'Ultra Washable Eggshell',
    price: 42.5,
    image: '/paints/eggshell.svg',
    rating: 4.7,
    description: 'Easy-clean eggshell paint ideal for high-traffic family rooms',
    category: 'Interior',
    stock: 140,
    specifications: {
      coverage: '340-390 sq ft/gal',
      finish: 'Eggshell',
      durability: '10+ years',
    },
  },
  {
    id: 8,
    name: 'RainShield Exterior Shield',
    price: 58,
    image: '/paints/rainshield.svg',
    rating: 4.8,
    description: 'All-weather exterior protection with superior rain resistance',
    category: 'Exterior',
    stock: 95,
    specifications: {
      coverage: '280-330 sq ft/gal',
      finish: 'Low Sheen',
      durability: '15+ years',
    },
  },
  {
    id: 9,
    name: 'Premium Wall Primer Pro',
    price: 29.99,
    image: '/paints/primer-pro.svg',
    rating: 4.6,
    description: 'High-bond primer for smooth topcoat adhesion and stain blocking',
    category: 'Primer',
    stock: 210,
    specifications: {
      coverage: '320-380 sq ft/gal',
      finish: 'Flat Primer',
      durability: 'Basecoat',
    },
  },
  {
    id: 10,
    name: 'Kitchen & Bath Anti-Mold',
    price: 47.75,
    image: '/paints/anti-mold.svg',
    rating: 4.8,
    description: 'Moisture-resistant interior paint with anti-mold protection',
    category: 'Specialty',
    stock: 125,
    specifications: {
      coverage: '300-350 sq ft/gal',
      finish: 'Satin',
      durability: '12+ years',
    },
  },
  {
    id: 11,
    name: 'Velvet Texture Designer Coat',
    price: 63.5,
    image: '/paints/velvet-texture.svg',
    rating: 4.9,
    description: 'Decorative texture coat for premium accent walls and spaces',
    category: 'Designer',
    stock: 70,
    specifications: {
      coverage: '180-230 sq ft/gal',
      finish: 'Textured Velvet',
      durability: '8-10 years',
    },
  },
  {
    id: 12,
    name: 'Heat Reflect Roof Coat',
    price: 66.99,
    image: '/paints/roof-coat.svg',
    rating: 4.7,
    description: 'Reflective roof coating designed to reduce surface heat gain',
    category: 'Exterior',
    stock: 88,
    specifications: {
      coverage: '250-300 sq ft/gal',
      finish: 'Reflective Matte',
      durability: '10-12 years',
    },
  },
  {
    id: 13,
    name: 'Child-Safe Odorless Paint',
    price: 51.25,
    image: '/paints/odorless-kids.svg',
    rating: 4.9,
    description: 'Ultra low-odor, child-safe formula for nurseries and kids rooms',
    category: 'Eco-Friendly',
    stock: 132,
    specifications: {
      coverage: '330-380 sq ft/gal',
      finish: 'Matte',
      durability: '9+ years',
    },
  },
];
