'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminOrdersPanel from '@/frontend/components/admin/AdminOrdersPanel';
import { getApiUrl } from '@/frontend/lib/api';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  soldCount: number;
};

type AdminOrder = {
  id: string;
  userId: string | null;
  email: string;
  purchaseType?: 'online' | 'offline';
};

type AdminUserSummary = {
  userId: string | null;
  email: string;
};

type AuthUser = {
  id: string;
  role: 'admin' | 'customer';
  name: string;
  email: string;
};

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const widthSteps = [
  'w-0',
  'w-[10%]',
  'w-[20%]',
  'w-[30%]',
  'w-[40%]',
  'w-[50%]',
  'w-[60%]',
  'w-[70%]',
  'w-[80%]',
  'w-[90%]',
  'w-full',
];

function getWidthClass(percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  const index = Math.round(clamped / 10);
  return widthSteps[index];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [offlineOrders, setOfflineOrders] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const rawUser = localStorage.getItem('authUser');

    if (!token || !rawUser) {
      router.replace('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser) as AuthUser;
      if (user.role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
    } catch {
      router.replace('/admin/login');
      return;
    }

    const loadProducts = async () => {
      try {
        const response = await fetch(getApiUrl('/api/products'), { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load inventory');
        }

        const loadedProducts: Product[] = data.products ?? [];
        setProducts(loadedProducts);
        setStockInputs(
          loadedProducts.reduce<Record<string, string>>((acc, product) => {
            acc[product.id] = String(product.stock);
            return acc;
          }, {})
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory');
      }
    };

    const loadOrderCounters = async () => {
      try {
        const response = await fetch(getApiUrl('/api/orders/admin'), {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load order counters');
        }

        const orders: AdminOrder[] = Array.isArray(data.orders) ? data.orders : [];
        const users: AdminUserSummary[] = Array.isArray(data.users) ? data.users : [];

        setTotalOrders(orders.length);
        setTotalCustomers(users.length);
        setOfflineOrders(
          orders.filter((order) => String(order.purchaseType ?? 'online') === 'offline').length
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load order counters');
      }
    };

    const loadDashboardData = async () => {
      try {
        await Promise.all([loadProducts(), loadOrderCounters()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  const totalProducts = useMemo(() => products.length, [products]);
  const totalStockUnits = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products]
  );
  const totalSoldUnits = useMemo(
    () => products.reduce((sum, product) => sum + product.soldCount, 0),
    [products]
  );
  const totalInventoryValue = useMemo(
    () => products.reduce((sum, product) => sum + product.stock * product.price, 0),
    [products]
  );
  const totalSalesValue = useMemo(
    () => products.reduce((sum, product) => sum + product.soldCount * product.price, 0),
    [products]
  );
  const turnoverPercent = useMemo(() => {
    const denominator = totalSoldUnits + totalStockUnits;
    if (denominator === 0) {
      return 0;
    }
    return (totalSoldUnits / denominator) * 100;
  }, [totalSoldUnits, totalStockUnits]);
  const marginValue = useMemo(
    () => totalSalesValue - totalInventoryValue,
    [totalSalesValue, totalInventoryValue]
  );

  const topSellingProducts = useMemo(
    () => [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 10).length,
    [products]
  );

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    router.push('/admin/login');
  };

  const handleUpdateStock = async (productId: string) => {
    const token = localStorage.getItem('authToken');
    const nextValue = Number(stockInputs[productId]);

    setError('');
    setSuccess('');

    if (!Number.isInteger(nextValue) || nextValue < 0) {
      setError('Stock must be a non-negative whole number');
      return;
    }

    if (!token) {
      setError('Session expired. Please login again.');
      router.replace('/admin/login');
      return;
    }

    setIsSaving((previous) => ({ ...previous, [productId]: true }));

    try {
      const response = await fetch(getApiUrl(`/api/products/${productId}/stock`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockQuantity: nextValue }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to update stock');
      }

      setProducts((previous) =>
        previous.map((product) =>
          product.id === productId ? { ...product, stock: data.product.stock } : product
        )
      );
      setStockInputs((previous) => ({ ...previous, [productId]: String(data.product.stock) }));
      setSuccess('Stock updated successfully');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update stock');
    } finally {
      setIsSaving((previous) => ({ ...previous, [productId]: false }));
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Inventory</h1>
            <p className="text-gray-600 mt-2">Manage shop stock details for all paint products.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total orders</p>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Customers placed orders</p>
            <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Offline orders</p>
            <p className="text-3xl font-bold text-gray-900">{offlineOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total products</p>
            <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total stock units</p>
            <p className="text-3xl font-bold text-gray-900">{totalStockUnits}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total sold units</p>
            <p className="text-3xl font-bold text-gray-900">{totalSoldUnits}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Low stock products (≤10)</p>
            <p className="text-3xl font-bold text-gray-900">{lowStockProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Sales value</p>
            <p className="text-3xl font-bold text-green-700">{rupeeFormatter.format(totalSalesValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inventory value</p>
            <p className="text-3xl font-bold text-blue-900">{rupeeFormatter.format(totalInventoryValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Stock turnover</p>
            <p className="text-3xl font-bold text-gray-900">{turnoverPercent.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Gain/Loss indicator</p>
            <p className={`text-3xl font-bold ${marginValue >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {marginValue >= 0 ? '+' : '-'}
              {rupeeFormatter.format(Math.abs(marginValue))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sales vs Stock Visualization</h2>
            <div className="space-y-4">
              {topSellingProducts.length === 0 && (
                <p className="text-gray-500 text-sm">No products available for visualization.</p>
              )}
              {topSellingProducts.map((product) => {
                const total = product.soldCount + product.stock;
                const soldRatio = total === 0 ? 0 : (product.soldCount / total) * 100;
                const stockRatio = total === 0 ? 0 : (product.stock / total) * 100;

                return (
                  <div key={product.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">Sold {product.soldCount} • Stock {product.stock}</p>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden bg-gray-200 flex">
                      <div
                        className={`bg-green-500 h-full ${getWidthClass(soldRatio)}`}
                      />
                      <div
                        className={`bg-blue-500 h-full ${getWidthClass(stockRatio)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Health</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Sales contribution</p>
                <p className="text-2xl font-bold text-green-700">{rupeeFormatter.format(totalSalesValue)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Unsold inventory worth</p>
                <p className="text-2xl font-bold text-blue-900">{rupeeFormatter.format(totalInventoryValue)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Business trend</p>
                <p className={`text-2xl font-bold ${marginValue >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {marginValue >= 0 ? 'Gain' : 'Loss'} ({rupeeFormatter.format(Math.abs(marginValue))})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Trend is calculated from sales value compared to current inventory value.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Manage Orders
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Manage Products
          </Link>
          <Link
            href="/admin/portfolio"
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Manage Portfolio
          </Link>
          <Link
            href="/admin/paint-mixer"
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Open Paint Mixer
          </Link>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sold
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Update Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    Loading inventory...
                  </td>
                </tr>
              )}

              {!isLoading && products.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    No products found
                  </td>
                </tr>
              )}

              {!isLoading &&
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{product.category}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{rupeeFormatter.format(product.price)}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{product.soldCount}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-semibold">{product.stock}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          aria-label={`Stock quantity for ${product.name}`}
                          min={0}
                          step={1}
                          value={stockInputs[product.id] ?? ''}
                          onChange={(event) =>
                            setStockInputs((previous) => ({
                              ...previous,
                              [product.id]: event.target.value,
                            }))
                          }
                          className="w-28 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          onClick={() => handleUpdateStock(product.id)}
                          disabled={Boolean(isSaving[product.id])}
                          className="px-3 py-2 rounded-md bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-70"
                        >
                          {isSaving[product.id] ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <AdminOrdersPanel />
      </div>
    </div>
  );
}

