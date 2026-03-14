'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Star, Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCart } from '@/frontend/context/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description: string;
  category: string;
  stock: number;
  isNew?: boolean;
}

function AnimatedProductCard({
  id,
  name,
  price,
  image,
  rating,
  description,
  category,
  stock,
  isNew,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { addToCart } = useCart();

  // Currency conversion: USD to INR (1 USD = 83 INR)
  const USD_TO_INR = 83;
  const priceInINR = price * USD_TO_INR;
  const subtotal = priceInINR * quantity;

  // Stock status
  const isInStock = stock > 0;
  const isLowStock = stock > 0 && stock <= 10;
  const isOutOfStock = stock === 0;

  const getStockStatus = () => {
    if (isOutOfStock) return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
    if (isLowStock) return { text: 'Limited Stock', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
    return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
  };

  const status = getStockStatus();
  const StatusIcon = status.icon;
  const stockPercentage = (stock / 200) * 100; // Assuming max stock is 200

  useEffect(() => {
    if (!isToastVisible) {
      return;
    }

    const timer = setTimeout(() => {
      setIsToastVisible(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [isToastVisible]);

  const handleAddToCart = () => {
    addToCart({
      id,
      name,
      price: priceInINR,
      quantity,
      category,
      image,
      description,
      stock,
    });
    setToastMessage(`${quantity} x ${name} added to cart`);
    setIsToastVisible(true);
    setQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-2xl"
    >
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-blue-100 to-purple-100">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        {isNew && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            NEW
          </div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
        >
          <div className="text-center text-white">
            <p className="text-sm font-semibold mb-2">View Details</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-900 transition">{name}</h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">{category}</p>
          </div>
          {isNew && (
            <Zap size={18} className="text-yellow-500 fill-yellow-500" />
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>

        <div className="flex items-center gap-1 py-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-2">({rating.toFixed(1)})</span>
        </div>

        {/* Stock Status */}
        <div className={`p-3 rounded-lg ${status.bg} border border-current`}>
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon size={16} className={status.color} />
            <span className={`text-sm font-semibold ${status.color}`}>{status.text}</span>
            <span className="text-xs text-gray-600 ml-auto">{stock} available</span>
          </div>
          {/* Stock Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${stockPercentage}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                isOutOfStock
                  ? 'bg-red-500'
                  : isLowStock
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
            />
          </div>
        </div>

        {/* Quantity Selector */}
        {isInStock && (
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <span className="text-xs font-semibold text-gray-700">Qty:</span>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold disabled:opacity-50"
            >
              −
            </button>
            <span className="flex-1 text-center font-semibold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              disabled={quantity >= stock}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold disabled:opacity-50"
            >
              +
            </button>
          </div>
        )}

        <div className="border-t pt-3 flex justify-between items-center">
          <div>
            <motion.p
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              className="text-2xl font-bold text-blue-900"
            >
              ₹{subtotal.toFixed(2)}
            </motion.p>
            <p className="text-xs text-gray-500">per gallon (₹ INR) • ₹{priceInINR.toFixed(2)} each</p>
          </div>
          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: isInStock ? 1.1 : 1 }}
            whileTap={{ scale: isInStock ? 0.95 : 1 }}
            disabled={!isInStock}
            className="rounded-lg bg-linear-to-r from-blue-900 to-blue-800 p-2 text-white shadow-md transition hover:from-blue-800 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={20} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isToastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute left-3 right-3 bottom-3 z-20"
          >
            <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <p className="text-xs font-semibold text-gray-800">{toastMessage}</p>
              </div>
              <button
                type="button"
                aria-label="Close notification"
                onClick={() => setIsToastVisible(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(AnimatedProductCard);

