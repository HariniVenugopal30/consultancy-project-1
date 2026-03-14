'use client';

import { motion } from 'framer-motion';

interface HeroProps {
  title: string;
  subtitle: string;
  gradient?: string;
}

export default function Hero({ title, subtitle, gradient = 'from-blue-900 to-blue-800' }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className={`relative bg-gradient-to-r ${gradient} text-white py-32 overflow-hidden`}>
      {/* Animated background elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-10 right-10 text-blue-200 opacity-10 text-9xl"
      >
        🎨
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-10 left-10 text-blue-200 opacity-10 text-9xl"
      >
        🖌️
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-bold mb-6">
            {title}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
            {subtitle}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
