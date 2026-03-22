'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Hero from '@/frontend/components/Hero';

const Features = dynamic(() => import('@/frontend/components/Features'), { loading: () => null });
const Testimonials = dynamic(() => import('@/frontend/components/Testimonials'), { loading: () => null });
const FAQ = dynamic(() => import('@/frontend/components/FAQ'), { loading: () => null });

export default function Home() {
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.3 + i * 0.1, duration: 0.6 },
    }),
  };

  return (
    <div>
      <Hero
        title="Transform Your Spaces with Premium Paint"
        subtitle="ColorBurst provides high-quality paints for residential and commercial projects. Professional results guaranteed."
      />

      {/* CTA Buttons */}
      <section className="py-12 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              custom={0}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href="/products"
                className="block bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-10 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                Shop Now
                <ArrowRight size={20} />
              </Link>
            </motion.div>
            <motion.div
              custom={1}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href="/portfolio"
                className="block bg-white/20 hover:bg-white/30 text-white px-10 py-4 rounded-lg font-bold text-lg transition border border-white shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center whitespace-nowrap"
              >
                View Portfolio
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Features />

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Featured Products</h2>
            <p className="text-lg text-gray-600">Discover our best-selling paints trusted by thousands</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl shadow-lg"
            >
              <h3 className="text-2xl font-bold text-blue-900 mb-3">Premium Interior Matte</h3>
              <p className="text-gray-700 mb-4">Perfect for living rooms, bedrooms, and any interior space. Ultra-smooth finish with excellent coverage.</p>
              <p className="text-3xl font-bold text-blue-900 mb-6">₹34.99</p>
              <Link href="/products" className="text-blue-900 font-bold hover:underline flex items-center gap-2">
                View All Interior Paints <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl shadow-lg"
            >
              <h3 className="text-2xl font-bold text-orange-900 mb-3">Gloss Exterior Pro</h3>
              <p className="text-gray-700 mb-4">Weather-resistant and UV-protected. Ideal for siding, trim, and outdoor surfaces. Lasts 15+ years.</p>
              <p className="text-3xl font-bold text-orange-900 mb-6">₹44.99</p>
              <Link href="/products" className="text-orange-900 font-bold hover:underline flex items-center gap-2">
                View All Exterior Paints <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <Testimonials />

      <FAQ />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-6"
          >
            Ready to Transform Your Space?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto"
          >
            Browse our complete collection and get expert paint solutions today
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-10 py-4 rounded-lg font-bold transition shadow-lg hover:shadow-xl"
            >
              Shop Products <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

