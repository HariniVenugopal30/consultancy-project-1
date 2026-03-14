'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ClipboardList,
  Package,
  RotateCcw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

interface ConfirmedProduct {
  productName: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  email: string;
  paymentMethod: string;
  products: ConfirmedProduct[];
  totalAmount: number;
  gst: number;
  grandTotal: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  upi: 'UPI',
  card: 'Credit / Debit Card',
};

function getDeliveryWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 5);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  return `${fmt(start)} – ${fmt(end)}`;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const [orderData] = useState<OrderConfirmationData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('colorburst_last_order');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as OrderConfirmationData;
      return parsed?.orderId ? parsed : null;
    } catch {
      return null;
    }
  });

  const notFound = orderData === null;

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[#eaeded] px-4">
        <Package size={64} className="text-gray-300" />
        <h1 className="text-2xl font-semibold text-[#0f1111]">No recent order found</h1>
        <p className="text-sm text-[#565959]">Please proceed from the cart to place a new order.</p>
        <Link
          href="/products"
          className="rounded-full bg-[#ffd814] px-8 py-3 font-semibold text-[#0f1111] transition hover:bg-[#f7ca00]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const deliveryWindow = getDeliveryWindow();

  return (
    <div className="min-h-screen bg-[#eaeded] py-10 text-[#0f1111]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* ── Success Banner ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <div className="flex flex-col items-center gap-3 bg-[#067d62] px-6 py-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <CheckCircle size={64} className="text-white drop-shadow-lg" />
            </motion.div>
            <h1 className="text-2xl font-bold sm:text-3xl">Order Placed Successfully!</h1>
            <p className="text-sm opacity-90">
              Thank you, <strong>{orderData.customerName}</strong>! A confirmation will be sent to{' '}
              <strong>{orderData.email}</strong>.
            </p>
          </div>

          {/* Order ID strip */}
          <div className="flex flex-col items-center gap-1 border-b border-[#eaeded] bg-[#f7fafa] px-6 py-4 text-center">
            <p className="text-xs uppercase tracking-widest text-[#565959]">Order ID</p>
            <p className="select-all font-mono text-2xl font-bold text-[#0f1111] tracking-wide">
              {orderData.orderId}
            </p>
            <p className="text-xs text-[#565959]">Save this ID to track your order</p>
          </div>

          {/* ── Delivery / Payment chips ── */}
          <div className="grid grid-cols-2 divide-x divide-[#eaeded] border-b border-[#eaeded]">
            <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
              <Truck size={20} className="text-[#007185]" />
              <p className="text-xs font-medium text-[#0f1111]">Estimated Delivery</p>
              <p className="text-xs text-[#565959]">{deliveryWindow}</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
              <ClipboardList size={20} className="text-[#e77600]" />
              <p className="text-xs font-medium text-[#0f1111]">Payment</p>
              <p className="text-xs text-[#565959]">{PAYMENT_LABELS[orderData.paymentMethod] ?? orderData.paymentMethod}</p>
            </div>
          </div>

          {/* ── Product Summary ── */}
          <div className="px-6 py-5">
            <h2 className="mb-4 text-base font-semibold text-[#0f1111]">Products in this order</h2>
            <ul className="space-y-3">
              {orderData.products.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.07 }}
                  className="flex items-center justify-between rounded-lg border border-[#eaeded] bg-[#f7fafa] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232f3e] text-white">
                      <Package size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0f1111]">{item.productName}</p>
                      <p className="text-xs text-[#565959]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0f1111]">
                      {currencyFormatter.format(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-[#565959]">{currencyFormatter.format(item.price)} each</p>
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Price breakdown */}
            <div className="mt-5 space-y-2 rounded-lg border border-[#d5d9d9] bg-white p-4 text-sm text-[#565959]">
              <div className="flex justify-between">
                <span>Items subtotal</span>
                <span>{currencyFormatter.format(orderData.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-[#067d62]">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{currencyFormatter.format(orderData.gst)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#d5d9d9] pt-3">
                <span className="text-base font-semibold text-[#0f1111]">Total Paid</span>
                <span className="text-2xl font-bold text-[#b12704]">
                  {currencyFormatter.format(orderData.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── CTA Buttons ── */}
          <div className="flex flex-col gap-3 border-t border-[#eaeded] px-6 py-5 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push(`/track-order?id=${orderData.orderId}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#232f3e] bg-[#232f3e] py-3 font-semibold text-white transition hover:bg-[#374151]"
            >
              <RotateCcw size={16} />
              Track Order
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push('/products')}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ffd814] py-3 font-semibold text-[#0f1111] transition hover:bg-[#f7ca00]"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </motion.button>
          </div>
        </motion.div>

        {/* ── What happens next ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl bg-white px-6 py-5 shadow-sm"
        >
          <h2 className="mb-4 font-semibold text-[#0f1111]">What happens next?</h2>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Our team will verify your order and stock availability.' },
              { step: '2', text: 'Your paints will be carefully packaged and handed to our courier.' },
              { step: '3', text: `Delivery expected between ${deliveryWindow}.` },
              { step: '4', text: 'You will receive an SMS and email update at every stage.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3 text-sm text-[#565959]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#232f3e] text-xs font-bold text-white">
                  {step}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
