'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/frontend/lib/api';

type OrderHistoryItem = {
  id: string;
  orderId: string;
  totalAmount: number;
  orderStatus: string;
  purchaseType: 'online' | 'offline';
  orderDate: string;
  products: Array<{
    productName: string;
    image: string;
    quantity: number;
    price: number;
    category: string;
  }>;
};

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.replace('/login');
          return;
        }

        const response = await fetch(getApiUrl('/api/orders/my'), {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load order history');
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load order history');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-linear-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Order History</h1>
        <p className="text-gray-600 mb-8">All your online and offline purchases appear here.</p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {isLoading && <p className="text-sm text-gray-500">Loading your orders...</p>}

        {!isLoading && orders.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
            No orders found yet.
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-bold text-gray-900">{order.orderId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {order.purchaseType === 'offline' && (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                      Offline Purchase
                    </span>
                  )}
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 capitalize">
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.products.map((product, index) => (
                  <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                        <Image src={product.image || '/paints/new-product.svg'} alt={product.productName} fill className="object-cover" sizes="48px" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{product.productName}</p>
                        <p className="text-xs text-gray-600">{product.category} • Qty {product.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{rupeeFormatter.format(product.price * product.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">{new Date(order.orderDate).toLocaleString()}</p>
                <p className="font-bold text-blue-900">Total: {rupeeFormatter.format(order.totalAmount)}</p>
              </div>

              <div className="mt-4">
                <Link href={`/track-order?id=${encodeURIComponent(order.orderId)}`} className="text-sm font-semibold text-blue-900 hover:underline">
                  Track this order
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
