'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { getApiUrl } from '@/frontend/lib/api';

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

type OrderStatus = 'processing' | 'completed' | 'shipped' | 'delivered' | 'cancelled';
type PurchaseType = 'online' | 'offline';

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

type OrderProduct = {
  productId: string | null;
  productName: string;
  category: string;
  image: string;
  quantity: number;
  price: number;
  totalPrice: number;
};

type AdminOrder = {
  id: string;
  orderId: string;
  userId: string | null;
  userName: string;
  email: string;
  phone: string;
  address: string;
  products: OrderProduct[];
  total: number;
  orderStatus: OrderStatus;
  purchaseType: PurchaseType;
  orderDate: string;
  deliveryDate: string | null;
};

type UserSummary = {
  userId: string | null;
  userName: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
};

type EditDraft = {
  orderId: string;
  orderStatus: OrderStatus;
  deliveryDate: string;
  products: Array<{
    productId: string | null;
    productName: string;
    category: string;
    image: string;
    quantity: string;
    price: string;
  }>;
};

type OfflineForm = {
  userId: string;
  productId: string;
  quantity: string;
  price: string;
  purchaseDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  orderStatus: 'Processing' | 'Completed' | 'Delivered';
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

const statusOptions: OrderStatus[] = ['processing', 'completed', 'shipped', 'delivered', 'cancelled'];

const initialOfflineForm: OfflineForm = {
  userId: '',
  productId: '',
  quantity: '1',
  price: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  orderStatus: 'Processing',
  phone: '',
  address: '',
  city: '',
  pincode: '',
};

function toDateInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function statusBadgeClass(status: OrderStatus) {
  if (status === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'shipped') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [offlineForm, setOfflineForm] = useState<OfflineForm>(initialOfflineForm);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const selectedOfflineProduct = useMemo(
    () => inventoryProducts.find((product) => product.id === offlineForm.productId) ?? null,
    [inventoryProducts, offlineForm.productId]
  );

  const availableInventoryProducts = useMemo(
    () => inventoryProducts.filter((product) => product.stock > 0),
    [inventoryProducts]
  );

  const offlineTotal = useMemo(() => {
    const quantity = Number(offlineForm.quantity);
    const price = Number(offlineForm.price);
    if (!Number.isFinite(quantity) || !Number.isFinite(price)) {
      return 0;
    }
    return Math.max(0, quantity * price);
  }, [offlineForm.quantity, offlineForm.price]);

  const tableRows = useMemo(
    () =>
      orders.flatMap((order) =>
        order.products.map((product, index) => ({
          rowId: `${order.id}-${index}`,
          order,
          product,
        }))
      ),
    [orders]
  );

  const themedFieldClass =
    'rounded-md border border-gray-500 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-700/70';
  const themedReadonlyFieldClass =
    'rounded-md border border-gray-400 bg-gray-100 px-3 py-2 text-sm font-medium text-blue-900 placeholder:text-blue-700/70';

  const userOrderCards = useMemo(() => {
    const grouped = new Map<
      string,
      {
        groupKey: string;
        userId: string | null;
        userName: string;
        email: string;
        phone: string;
        address: string;
        totalOrders: number;
        totalSpent: number;
      }
    >();

    for (const order of orders) {
      const normalizedEmail = String(order.email ?? '').trim().toLowerCase();
      const key = normalizedEmail || order.userId || order.orderId;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          groupKey: key,
          userId: order.userId,
          userName: order.userName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          totalOrders: 1,
          totalSpent: order.total,
        });
        continue;
      }

      existing.totalOrders += 1;
      existing.totalSpent += order.total;

      if (!existing.phone && order.phone) {
        existing.phone = order.phone;
      }
      if (!existing.address && order.address) {
        existing.address = order.address;
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.totalOrders - a.totalOrders);
  }, [orders]);

  const fetchAdminOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Admin session expired. Please login again.');
      }

      const response = await fetch(getApiUrl('/api/orders/admin'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to load admin orders');
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load orders');
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Admin session expired. Please login again.');
      }

      const response = await fetch(getApiUrl('/api/admin/users'), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to load users');
      }

      setRegisteredUsers(Array.isArray(data.users) ? data.users : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
    }
  };

  const fetchInventoryProducts = async () => {
    try {
      const response = await fetch(getApiUrl('/api/products'), { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to load products');
      }

      const allProducts: InventoryProduct[] = Array.isArray(data.products)
        ? (data.products as InventoryProduct[])
        : [];
      setInventoryProducts(allProducts);

      if (allProducts.every((product) => Number(product.stock) <= 0)) {
        setOfflineForm((previous) => ({ ...previous, productId: '' }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load products');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError('');
      await Promise.all([fetchAdminOrders(), fetchRegisteredUsers(), fetchInventoryProducts()]);
      setIsLoading(false);
    };

    initialize();
  }, []);

  const openEditModal = (order: AdminOrder) => {
    setEditDraft({
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      deliveryDate: toDateInputValue(order.deliveryDate),
      products: order.products.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        image: product.image,
        quantity: String(product.quantity),
        price: String(product.price),
      })),
    });
  };

  const handleAddOfflineOrder = async () => {
    setIsSubmittingOffline(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Admin session expired. Please login again.');
      }

      if (!offlineForm.userId) {
        throw new Error('Please select a user');
      }
      if (!offlineForm.productId) {
        throw new Error('Please select a product from inventory');
      }
      if (!selectedOfflineProduct) {
        throw new Error('Selected product is invalid');
      }

      const quantity = Number(offlineForm.quantity);
      const price = Number(offlineForm.price);

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      if (quantity > selectedOfflineProduct.stock) {
        throw new Error(`Only ${selectedOfflineProduct.stock} units are available in stock`);
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be non-negative');
      }

      const response = await fetch(getApiUrl('/admin/add-offline-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: offlineForm.userId,
          productId: offlineForm.productId,
          quantity,
          price,
          purchaseDate: offlineForm.purchaseDate,
          paymentMethod: offlineForm.paymentMethod,
          orderStatus: offlineForm.orderStatus,
          phone: offlineForm.phone,
          address: offlineForm.address,
          city: offlineForm.city,
          pincode: offlineForm.pincode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to add offline order');
      }

      setOfflineForm(initialOfflineForm);
      setSuccess('Offline purchase added successfully');
      await Promise.all([fetchAdminOrders(), fetchInventoryProducts()]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add offline order');
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editDraft) return;

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Admin session expired. Please login again.');
      }

      const payload = {
        orderStatus: editDraft.orderStatus,
        deliveryDate: editDraft.deliveryDate ? new Date(editDraft.deliveryDate).toISOString() : null,
        products: editDraft.products.map((product) => ({
          productId: product.productId,
          productName: product.productName.trim(),
          category: product.category.trim(),
          image: product.image.trim(),
          quantity: Number(product.quantity),
          price: Number(product.price),
        })),
      };

      for (const product of payload.products) {
        if (!product.productName || !Number.isFinite(product.quantity) || product.quantity < 1) {
          throw new Error('Each item requires a name and quantity of at least 1');
        }
        if (!Number.isFinite(product.price) || product.price < 0) {
          throw new Error('Each item requires a valid non-negative price');
        }
      }

      const response = await fetch(getApiUrl(`/api/orders/${encodeURIComponent(editDraft.orderId)}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to update order');
      }

      setEditDraft(null);
      setSuccess('Order updated successfully');
      await fetchAdminOrders();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm('Delete this order? This will restock products automatically.');
    if (!confirmed) return;

    setIsDeletingId(orderId);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Admin session expired. Please login again.');
      }

      const response = await fetch(getApiUrl(`/api/orders/${encodeURIComponent(orderId)}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to delete order');
      }

      setSuccess('Order deleted successfully');
      await fetchAdminOrders();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete order');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <section className="mt-12 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Customer Orders</h2>
        <p className="text-gray-600 mt-1">Track users and manage purchased products from one place.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Offline Purchase</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={offlineForm.userId}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, userId: event.target.value }))}
            className={themedFieldClass}
          >
            <option value="">Select User</option>
            {registeredUsers.map((user) => (
              <option key={user.id} value={user.id}>{`${user.name} (${user.email})`}</option>
            ))}
          </select>
          <select
            value={offlineForm.productId}
            onChange={(event) => {
              const nextProduct = availableInventoryProducts.find((product) => product.id === event.target.value);
              setOfflineForm((previous) => ({
                ...previous,
                productId: event.target.value,
                price: nextProduct ? String(nextProduct.price) : previous.price,
              }));
            }}
            disabled={availableInventoryProducts.length === 0}
            className={themedFieldClass}
          >
            <option value="">
              {availableInventoryProducts.length === 0
                ? 'No products currently in stock'
                : 'Select Product (In Stock)'}
            </option>
            {availableInventoryProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {`${product.name} | ${product.category} | Stock: ${product.stock}`}
              </option>
            ))}
          </select>
          <input
            value={selectedOfflineProduct?.name ?? ''}
            readOnly
            placeholder="Product Name"
            className={themedReadonlyFieldClass}
          />
          <input
            value={selectedOfflineProduct?.category ?? ''}
            readOnly
            placeholder="Category"
            className={themedReadonlyFieldClass}
          />
          <input
            value={selectedOfflineProduct ? String(selectedOfflineProduct.stock) : ''}
            readOnly
            placeholder="Available Stock"
            className={themedReadonlyFieldClass}
          />
          <input
            type="number"
            min={1}
            value={offlineForm.quantity}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, quantity: event.target.value }))}
            placeholder="Quantity"
            className={themedFieldClass}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={offlineForm.price}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, price: event.target.value }))}
            placeholder="Price"
            className={themedFieldClass}
          />
          <input
            value={rupeeFormatter.format(offlineTotal)}
            readOnly
            className={themedReadonlyFieldClass}
          />
          <input
            type="date"
            value={offlineForm.purchaseDate}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, purchaseDate: event.target.value }))}
            className={themedFieldClass}
          />
          <select
            value={offlineForm.paymentMethod}
            onChange={(event) =>
              setOfflineForm((previous) => ({
                ...previous,
                paymentMethod: event.target.value as OfflineForm['paymentMethod'],
              }))
            }
            className={themedFieldClass}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
          <select
            value={offlineForm.orderStatus}
            onChange={(event) =>
              setOfflineForm((previous) => ({
                ...previous,
                orderStatus: event.target.value as OfflineForm['orderStatus'],
              }))
            }
            className={themedFieldClass}
          >
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
          </select>
          <input
            value={offlineForm.phone}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, phone: event.target.value }))}
            placeholder="Phone Number (optional)"
            className={themedFieldClass}
          />
          <input
            value={offlineForm.address}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, address: event.target.value }))}
            placeholder="Address (optional)"
            className={themedFieldClass}
          />
          <input
            value={offlineForm.city}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, city: event.target.value }))}
            placeholder="City (optional)"
            className={themedFieldClass}
          />
          <input
            value={offlineForm.pincode}
            onChange={(event) => setOfflineForm((previous) => ({ ...previous, pincode: event.target.value }))}
            placeholder="Pincode (optional)"
            className={themedFieldClass}
          />
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleAddOfflineOrder}
            disabled={isSubmittingOffline}
            className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 disabled:opacity-70"
          >
            {isSubmittingOffline ? 'Saving...' : 'Add Offline Purchase'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Users Who Placed Orders</h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading users...</p>
        ) : userOrderCards.length === 0 ? (
          <p className="text-sm text-gray-500">No users have placed orders yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {userOrderCards.map((user) => (
              <div key={user.groupKey} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="font-bold text-gray-900">{user.userName || 'Guest User'}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-600">{user.phone || 'Phone not provided'}</p>
                <p className="text-sm text-gray-600 mt-1">{user.address || 'Address not provided'}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Orders</span>
                  <span className="font-semibold text-gray-900">{user.totalOrders}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-semibold text-blue-900">{rupeeFormatter.format(user.totalSpent)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>Loading orders...</td>
              </tr>
            )}
            {!isLoading && tableRows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>No orders found</td>
              </tr>
            )}
            {!isLoading && tableRows.map(({ rowId, order, product }) => (
              <tr key={rowId}>
                <td className="px-4 py-4 align-top">
                  <p className="text-sm font-semibold text-gray-900">{order.userName}</p>
                  <p className="text-xs text-gray-600">{order.email}</p>
                  <p className="text-xs text-gray-600">{order.phone}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                      <Image src={product.image || '/paints/new-product.svg'} alt={product.productName} fill className="object-cover" sizes="48px" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{product.productName}</p>
                      <p className="text-xs text-gray-600">{product.category}</p>
                      <p className="text-xs text-gray-500">Order: {order.orderId}</p>
                      {order.purchaseType === 'offline' && (
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                          Offline Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700 align-top">{product.quantity}</td>
                <td className="px-4 py-4 align-top">
                  <p className="text-sm text-gray-700">{rupeeFormatter.format(product.price)}</p>
                  <p className="text-xs text-gray-500">Total: {rupeeFormatter.format(product.totalPrice)}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEditModal(order)} className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50">Edit</button>
                    <button type="button" onClick={() => setSelectedOrder(order)} className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100">View Details</button>
                    <button type="button" onClick={() => handleDeleteOrder(order.orderId)} disabled={isDeletingId === order.orderId} className="px-3 py-1.5 rounded-md border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-60">
                      {isDeletingId === order.orderId ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">Order Details - {selectedOrder.orderId}</h4>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p><span className="font-semibold">User:</span> {selectedOrder.userName}</p>
              <p><span className="font-semibold">Email:</span> {selectedOrder.email}</p>
              <p><span className="font-semibold">Phone:</span> {selectedOrder.phone}</p>
              <p><span className="font-semibold">Address:</span> {selectedOrder.address}</p>
              <p><span className="font-semibold">Type:</span> {selectedOrder.purchaseType === 'offline' ? 'Offline Purchase' : 'Online Purchase'}</p>
              <p><span className="font-semibold">Order Date:</span> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
              <p><span className="font-semibold">Status:</span> {selectedOrder.orderStatus}</p>
              <p><span className="font-semibold">Total:</span> {rupeeFormatter.format(selectedOrder.total)}</p>
            </div>
          </div>
        </div>
      )}

      {editDraft && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">Edit Order - {editDraft.orderId}</h4>
              <button onClick={() => setEditDraft(null)} className="text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order Status</label>
                  <select value={editDraft.orderStatus} onChange={(event) => setEditDraft((previous) => previous ? { ...previous, orderStatus: event.target.value as OrderStatus } : previous)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label>
                  <input type="date" value={editDraft.deliveryDate} onChange={(event) => setEditDraft((previous) => previous ? { ...previous, deliveryDate: event.target.value } : previous)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" />
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-base font-bold text-gray-900">Products</h5>
                {editDraft.products.map((product, index) => (
                  <div key={`${product.productName}-${index}`} className="rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input value={product.productName} onChange={(event) => setEditDraft((previous) => {
                      if (!previous) return previous;
                      const products = [...previous.products];
                      products[index] = { ...products[index], productName: event.target.value };
                      return { ...previous, products };
                    })} placeholder="Product name" className="md:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input value={product.category} onChange={(event) => setEditDraft((previous) => {
                      if (!previous) return previous;
                      const products = [...previous.products];
                      products[index] = { ...products[index], category: event.target.value };
                      return { ...previous, products };
                    })} placeholder="Category" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input type="number" min={1} value={product.quantity} onChange={(event) => setEditDraft((previous) => {
                      if (!previous) return previous;
                      const products = [...previous.products];
                      products[index] = { ...products[index], quantity: event.target.value };
                      return { ...previous, products };
                    })} placeholder="Quantity" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input type="number" min={0} step="0.01" value={product.price} onChange={(event) => setEditDraft((previous) => {
                      if (!previous) return previous;
                      const products = [...previous.products];
                      products[index] = { ...products[index], price: event.target.value };
                      return { ...previous, products };
                    })} placeholder="Price" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    <input value={product.image} onChange={(event) => setEditDraft((previous) => {
                      if (!previous) return previous;
                      const products = [...previous.products];
                      products[index] = { ...products[index], image: event.target.value };
                      return { ...previous, products };
                    })} placeholder="Image URL" className="md:col-span-6 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditDraft(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-semibold">Cancel</button>
                <button type="button" onClick={handleUpdateOrder} disabled={isUpdating} className="px-4 py-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-800 disabled:opacity-70">
                  {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
