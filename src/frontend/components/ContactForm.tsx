"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Send } from 'lucide-react';
import { getApiUrl } from '@/frontend/lib/api';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subjectOptions = [
    { label: 'Product Inquiry', value: 'product-inquiry' },
    { label: 'Bulk Order', value: 'bulk-order' },
    { label: 'Customer Support', value: 'support' },
    { label: 'Feedback', value: 'feedback' },
    { label: 'Other', value: 'other' },
  ];

  const completedFields = useMemo(() => {
    const fields = [formData.name, formData.email, formData.subject, formData.message];
    return fields.filter((field) => field.trim().length > 0).length;
  }, [formData]);

  const progress = (completedFields / 4) * 100;

  const selectedSubjectLabel =
    subjectOptions.find((option) => option.value === formData.subject)?.label ?? 'Select a subject';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Failed to submit contact form');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      <div className="mb-6">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Send us a Message</h2>
        <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
          <span>Form completion</span>
          <span>{completedFields}/4 required fields</span>
        </div>
        <progress
          value={progress}
          max={100}
          aria-label="Contact form completion"
          className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-blue-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-blue-900 [&::-webkit-progress-value]:to-blue-700"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
            <input
              id="contact-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="Your name"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength={255}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="your@email.com"
            />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
          <input
            id="contact-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            maxLength={30}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition text-gray-900 bg-white placeholder:text-gray-500"
            placeholder="(555) 123-4567"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <label htmlFor="contact-subject" className="block text-sm font-semibold text-gray-900 mb-2">Subject *</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {subjectOptions.map((option) => {
              const isActive = formData.subject === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, subject: option.value }))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'border-blue-900 bg-blue-900 text-white'
                      : 'border-blue-200 bg-white text-blue-900 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <select
            id="contact-subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition text-gray-900 bg-white"
          >
            <option value="">Select a subject</option>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">Selected: {selectedSubjectLabel}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-900 mb-2">Message *</label>
          <textarea
            id="contact-message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 transition resize-none text-gray-900 bg-white placeholder:text-gray-500"
            placeholder="Tell us about your project..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Minimum 10 characters</span>
            <span>{formData.message.length}/600</span>
          </div>
        </motion.div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 py-3 font-bold text-white shadow-lg transition hover:from-blue-800 hover:to-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-80"
        >
          <Send size={20} />
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </motion.button>
      </form>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-4 rounded-lg border-2 border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 size={18} />
            <p className="font-semibold">Thank you! We&apos;ll get back to you soon.</p>
          </div>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-4"
        >
          <p className="font-semibold text-red-700">{errorMessage}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
