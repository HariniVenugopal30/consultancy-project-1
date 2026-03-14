'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedProductCard from '@/components/AnimatedProductCard';
import { products as seedProducts } from '@/data/products';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description: string;
  category: string;
  stock: number;
  soldCount: number;
};

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

function mapSeedProductsToUiProducts(): Product[] {
  return seedProducts.map((product) => ({
    id: String(product.id),
    name: product.name,
    price: product.price,
    image: product.image,
    rating: product.rating,
    description: product.description,
    category: product.category,
    stock: product.stock,
    soldCount: 0,
  }));
}

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>(() => mapSeedProductsToUiProducts());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>('popular');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load products');
        }
        const data = await response.json();
        if (isMounted && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category))],
    [products]
  );

  const bestSellers = useMemo(
    () => [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 3),
    [products]
  );

  const newArrivals = useMemo(
    () => [...products].slice(0, 3),
    [products]
  );

  const dealProducts = useMemo(
    () => [...products].filter((product) => product.stock >= 120).slice(0, 3),
    [products]
  );

  const newArrivalIds = useMemo(
    () => new Set(newArrivals.map((product) => product.id)),
    [newArrivals]
  );
  
  const filteredProducts = useMemo(() => {
    const categoryFiltered =
      selectedCategory === 'All'
        ? products
        : products.filter((product) => product.category === selectedCategory);

    const textFiltered = categoryFiltered.filter((product) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    });

    return [...textFiltered].sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.price - b.price;
      }

      if (sortBy === 'price-high') {
        return b.price - a.price;
      }

      if (sortBy === 'newest') {
        return Number(b.id) - Number(a.id);
      }

      return b.soldCount - a.soldCount;
    });
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Paint Products</h1>
          <p className="text-xl text-gray-600">
            Discover our complete range of premium paint solutions for every project
          </p>
        </motion.div>

        {/* Sales Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Best Sellers</h3>
            <div className="space-y-2">
              {bestSellers.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate pr-2">{product.name}</span>
                  <span className="text-blue-900 font-semibold">{product.soldCount} sold</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 mb-3">New Arrivals</h3>
            <div className="space-y-2">
              {newArrivals.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate pr-2">{product.name}</span>
                  <span className="text-green-700 font-semibold">New</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Value Deals</h3>
            <div className="space-y-2">
              {dealProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate pr-2">{product.name}</span>
                  <span className="text-red-600 font-semibold">{rupeeFormatter.format(product.price * 0.9)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search + Sort */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search paint by name, category or usage"
              className="md:col-span-2 w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'popular' | 'newest' | 'price-low' | 'price-high')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Sort: Price Low to High</option>
              <option value="price-high">Sort: Price High to Low</option>
            </select>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-3">
            {categories.map((category, idx) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-900 hover:text-blue-900'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {isLoading && (
            <div className="col-span-full text-center text-gray-600 text-sm">Syncing latest products...</div>
          )}
          {errorMessage && (
            <div className="col-span-full text-center text-red-600">{errorMessage}</div>
          )}
          {filteredProducts.map((product) => (
            <AnimatedProductCard key={product.id} {...product} isNew={newArrivalIds.has(product.id)} />
          ))}
          {!errorMessage && filteredProducts.length === 0 && (
            <div className="col-span-full text-center text-gray-600">No products match your search.</div>
          )}
        </div>

        {/* Specifications Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Coverage',
                description: 'Most paints cover 300-400 square feet per gallon, depending on surface and finish type.'
              },
              {
                title: 'Durability',
                description: 'Our paints last 10-15 years for interior applications and 15+ years for exterior finishes.'
              },
              {
                title: 'Application',
                description: 'Apply with brush, roller, or spray equipment. Most products dry in 2-4 hours.'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <h3 className="text-xl font-bold text-blue-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
