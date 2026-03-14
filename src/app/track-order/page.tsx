'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Package,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

interface TimelineStep {
  label: string;
  done: boolean;
}

interface TrackProduct {
  productName: string;
  quantity: number;
  price: number;
}

interface TrackOrderData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: { address: string; city: string; pincode: string };
  products: TrackProduct[];
  totalAmount: number;
  paymentMethod: string;
  purchaseType?: 'online' | 'offline';
  orderStatus: string;
  timeline: TimelineStep[];
  userOrderCount?: number;
  userTotalSpent?: number;
  orderDate: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  upi: 'UPI',
  card: 'Credit / Debit Card',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputId, setInputId] = useState(searchParams.get('id') ?? '');
  const [orderData, setOrderData] = useState<TrackOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter an Order ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setOrderData(null);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Order not found');
      }

      setOrderData(data as TrackOrderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find order');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch if ID comes from the URL (e.g., redirected from confirmation page)
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      fetchOrder(idFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputId);
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-10 text-[#0f1111]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <ClipboardList size={28} className="text-[#232f3e]" />
          <h1 className="text-3xl font-normal text-[#0f1111]">Track Your Order</h1>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <div className="border-b border-[#eaeded] px-6 py-4">
            <h2 className="font-semibold text-[#0f1111]">Enter your Order ID</h2>
            <p className="text-xs text-[#565959]">e.g. CB-M4F2G1XY-AB3C</p>
          </div>
          <div className="flex gap-3 px-6 py-4">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="CB-XXXXXXXX-XXXX"
              className="flex-1 rounded-md border border-[#adb1b8] px-3 py-2.5 text-sm uppercase outline-none transition focus:border-[#e77600] focus:ring-2 focus:ring-[#e77600]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-[#232f3e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#374151] disabled:opacity-60"
            >
              <Search size={15} />
              {isLoading ? 'Searching…' : 'Track'}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <XCircle size={18} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {orderData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-[#eaeded] bg-[#f7fafa] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#565959]">Order ID</p>
                    <p className="font-mono text-xl font-bold text-[#0f1111]">{orderData.orderId}</p>
                    {orderData.purchaseType === 'offline' && (
                      <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        Offline Purchase
                      </span>
                    )}
                  </div>
                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-semibold capitalize sm:self-auto ${
                      STATUS_COLORS[orderData.orderStatus] ?? 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {orderData.orderStatus}
                  </span>
                </div>

                {/* Customer info */}
                <div className="grid grid-cols-2 gap-y-3 px-6 py-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[#565959]">Customer</p>
                    <p className="font-medium text-[#0f1111]">{orderData.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#565959]">Payment</p>
                    <p className="font-medium text-[#0f1111]">{PAYMENT_LABELS[orderData.paymentMethod] ?? orderData.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#565959]">Order Date</p>
                    <p className="font-medium text-[#0f1111]">
                      {new Date(orderData.orderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#565959]">Total Orders by User</p>
                    <p className="font-medium text-[#0f1111]">{orderData.userOrderCount ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#565959]">Total Spent by User</p>
                    <p className="font-medium text-[#0f1111]">
                      {currencyFormatter.format(orderData.userTotalSpent ?? orderData.totalAmount)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-[#565959]">Shipping to</p>
                    <p className="font-medium text-[#0f1111]">
                      {orderData.shippingAddress.address}, {orderData.shippingAddress.city} –{' '}
                      {orderData.shippingAddress.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-xl bg-white px-6 py-5 shadow-sm">
                <h2 className="mb-5 font-semibold text-[#0f1111]">Order Timeline</h2>
                <ol className="relative ml-3 border-l-2 border-[#eaeded]">
                  {orderData.timeline.map((step, idx) => (
                    <li key={idx} className="mb-5 ml-6 last:mb-0">
                      <span
                        className={`absolute -left-2.75 flex h-5 w-5 items-center justify-center rounded-full ${
                          step.done ? 'bg-[#067d62]' : 'bg-[#d5d9d9]'
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2 size={14} className="text-white" />
                        ) : (
                          <Circle size={14} className="text-white" />
                        )}
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          step.done ? 'text-[#067d62]' : 'text-[#adb1b8]'
                        }`}
                      >
                        {step.label}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Products */}
              <div className="rounded-xl bg-white px-6 py-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-[#0f1111]">Order Items</h2>
                <ul className="space-y-3">
                  {orderData.products.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[#eaeded] bg-[#f7fafa] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-[#565959]" />
                        <div>
                          <p className="text-sm font-medium text-[#0f1111]">{item.productName}</p>
                          <p className="text-xs text-[#565959]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[#0f1111]">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-[#fff8f0] px-4 py-3 text-sm">
                  <span className="font-semibold text-[#0f1111]">Order Total (incl. GST)</span>
                  <span className="text-xl font-bold text-[#b12704]">
                    {currencyFormatter.format(orderData.totalAmount * 1.18)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ffd814] py-3 text-center font-semibold text-[#0f1111] transition hover:bg-[#f7ca00]"
                >
                  <ShoppingBag size={16} />
                  Continue Shopping
                </Link>
                <button
                  onClick={() => {
                    setOrderData(null);
                    setInputId('');
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#232f3e] py-3 font-semibold text-[#232f3e] transition hover:bg-[#232f3e] hover:text-white"
                >
                  <Truck size={16} />
                  Track Another Order
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#eaeded]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e77600] border-t-transparent" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
