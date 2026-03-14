'use client';

import { motion } from 'framer-motion';
import { Palette, ShoppingCart, Award, Truck, Target, Award as AwardIcon } from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Premium Quality',
    description: 'High-quality ingredients for superior coverage and durability',
  },
  {
    icon: Award,
    title: 'Professional Grade',
    description: 'Used by professional painters nationwide',
  },
  {
    icon: ShoppingCart,
    title: 'Easy to Order',
    description: 'Browse and order online with convenient delivery',
  },
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Quick and reliable delivery to your door',
  },
  {
    icon: Target,
    title: 'Perfect Color Match',
    description: 'Thousands of colors to match any style',
  },
  {
    icon: AwardIcon,
    title: 'Satisfaction Guarantee',
    description: 'We stand behind every gallon we sell',
  },
];

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose ColorBurst?</h2>
          <p className="text-xl text-gray-600">Everything you need for perfect paint results</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg mb-6 group-hover:shadow-lg transition-all"
                >
                  <Icon className="text-white" size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-900 transition">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
