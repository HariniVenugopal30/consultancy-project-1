'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Users, Zap, Award, Heart, Target } from 'lucide-react';

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute top-10 right-10 text-blue-200 opacity-10 text-9xl"
          >
            🎨
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4 relative z-10"
          >
            About ColorBurst Paints
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-100 relative z-10"
          >
            Leading the industry in paint innovation and quality for over 15 years
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  ColorBurst Paints was founded in 2009 with a simple mission: provide premium-quality paints that transform spaces and exceed customer expectations.
                </p>
                <p>
                  What started as a small local paint shop has grown into a trusted regional supplier serving thousands of homeowners, contractors, and commercial clients.
                </p>
                <p>
                  Today, we continue to innovate, offering eco-friendly options, professional-grade formulations, and exceptional customer service.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl shadow-lg border border-blue-200"
            >
              <h3 className="text-2xl font-bold text-blue-900 mb-6">Fast Facts</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Founded', value: '2009' },
                  { label: 'Projects Completed', value: '5000+' },
                  { label: 'Customer Satisfaction', value: '98%' },
                  { label: 'Paint Products', value: '25+ varieties' },
                ].map((fact, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="text-blue-900 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">{fact.label}</p>
                      <p className="text-gray-600">{fact.value}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Our Core Values
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Zap, title: 'Quality', desc: 'We never compromise on quality. Every gallon of ColorBurst paint meets rigorous standards.' },
              { icon: Users, title: 'Customer First', desc: 'Your satisfaction is our priority. We provide expert advice and exceptional support.' },
              { icon: Heart, title: 'Sustainability', desc: 'We\'re committed to eco-friendly practices and environmentally responsible products.' },
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-gray-100"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-3 rounded-lg">
                      <Icon size={32} className="text-white" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{value.title}</h3>
                  <p className="text-gray-600 text-center">{value.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Meet Our Team
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { name: 'Sarah Johnson', role: 'Founder & CEO', bio: '25+ years in paint industry' },
              { name: 'Michael Chen', role: 'Product Development', bio: 'Expert in paint formulation' },
              { name: 'Jessica Williams', role: 'Customer Success', bio: 'Passionate about customer service' },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="text-center bg-gradient-to-b from-blue-50 to-white p-8 rounded-xl shadow-lg hover:shadow-2xl border border-blue-100"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold"
                >
                  {member.name.charAt(0)}
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-blue-900 font-semibold text-sm mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
