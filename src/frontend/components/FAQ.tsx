'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: 'How long does paint typically last?',
    answer: 'Interior paints usually last 8-12 years, while exterior paints can last 15+ years depending on weather conditions and surface preparation. Proper application and maintenance extend paint life significantly.',
  },
  {
    id: 2,
    question: 'What is the coverage rate?',
    answer: 'Most of our paints cover 300-400 square feet per gallon. Coverage depends on surface texture, paint finish, and application method. Always check the specific product label for accurate coverage.',
  },
  {
    id: 3,
    question: 'Do you offer eco-friendly options?',
    answer: 'Yes! Our Eco-Friendly Acrylic line features low-VOC formulations that are safe for families and the environment. They provide excellent coverage while minimizing harmful emissions.',
  },
  {
    id: 4,
    question: 'Can I order online?',
    answer: 'Absolutely! You can browse our full product catalog online, view detailed specifications, and purchase paints for delivery or in-store pickup at your convenience.',
  },
  {
    id: 5,
    question: 'Do you provide painting services?',
    answer: 'We sell premium paints and provide expert advice. We can recommend professional contractors in your area. Contact our team for referrals and recommendations.',
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Everything you need to know about our paints</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg p-6 text-left transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <motion.div
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="text-blue-900" size={24} />
                  </motion.div>
                </div>
              </button>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: openId === faq.id ? 1 : 0,
                  height: openId === faq.id ? 'auto' : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-blue-50 border border-t-0 border-gray-200 rounded-b-lg p-6">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
