'use client';

import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ContactForm from '@/frontend/components/ContactForm';

export default function ContactPage() {
  const infoItems = [
    {
      icon: Phone,
      title: 'Phone',
      lines: ['1-800-PAINT-PRO', '(1-800-724-6877)'],
      href: 'tel:+18007246877',
      action: 'Call now',
    },
    {
      icon: Mail,
      title: 'Email',
      lines: ['info@colorburst.com', 'support@colorburst.com'],
      href: 'mailto:info@colorburst.com',
      action: 'Send email',
    },
    {
      icon: MapPin,
      title: 'Address',
      lines: ['123 Paint Street', 'Color City, CC 12345'],
      href: 'https://maps.google.com/?q=123+Paint+Street+Color+City+CC+12345',
      action: 'Open map',
    },
    {
      icon: Clock,
      title: 'Hours',
      lines: ['Mon-Fri: 8AM - 6PM', 'Sat: 9AM - 5PM', 'Sun: Closed'],
      href: '#contact-form',
      action: 'Request callback',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-900 shadow-sm">
            We reply within 1 business day
          </div>
          <h1 className="mb-4 text-5xl font-bold text-gray-900">Get In Touch</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Have questions? We&apos;d love to hear from you. Reach out for product help, custom paint advice, or bulk orders.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+18007246877"
              className="rounded-full bg-blue-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800"
            >
              Call 1-800-PAINT-PRO
            </a>
            <a
              href="mailto:info@colorburst.com"
              className="rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-blue-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              Email Sales Team
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="space-y-6">
            {infoItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={idx}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group block rounded-xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 p-3">
                        <Icon className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="mb-1 font-bold text-gray-900">{item.title}</h3>
                        {item.lines.map((line, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-900 opacity-70 transition group-hover:opacity-100">
                      {item.action}
                    </span>
                  </div>
                </motion.a>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -8 }}
              className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="mb-2 text-lg font-bold text-gray-900">Why contact us?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Expert product recommendations for your project</li>
                <li>• Fast support for order and delivery questions</li>
                <li>• Bulk and contractor pricing assistance</li>
              </ul>
            </motion.div>
          </div>

          <div id="contact-form" className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}

