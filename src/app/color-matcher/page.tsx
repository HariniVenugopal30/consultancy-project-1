'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Sparkles, Palette } from 'lucide-react';

const AIColorMatcher = dynamic(
  () => import('@/frontend/components/AIColorMatcher'),
  { ssr: false, loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-2xl w-full" /> }
);

export default function ColorMatcherPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-16 text-gray-900 isolate relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-100 border border-blue-200 mb-6 shadow-sm">
            <Palette className="text-blue-800 w-8 h-8 mr-2" />
            <Sparkles className="text-yellow-500 w-8 h-8" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 via-purple-800 to-indigo-900">
            Professional Color Matcher Lab
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload any room photo and let our advanced AI pinpoint the exact underlying colors. Instantly visualize your space with our premium paint overlays to find your perfect match.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <AIColorMatcher />
        </motion.div>
      </div>
    </div>
  );
}
