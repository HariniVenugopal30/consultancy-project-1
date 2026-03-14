'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  soldCount: number;
  colorCode: string;
  image: string;
  description: string;
  rating: number;
};

type AuthUser = {
  role: 'admin' | 'customer';
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stockQuantity: string;
  colorCode: string;
  image: string;
  description: string;
  rating: string;
};

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const emptyForm: ProductForm = {
  name: '',
  category: '',
  price: '',
  stockQuantity: '',
  colorCode: '#1e3a8a',
  image: '',
  description: '',
  rating: '4.5',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(editingProductId), [editingProductId]);

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

    loadProducts();
  }, [router]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to load products');
      }

      setProducts(data.products ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setEditingProductId(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
  };

  const startEdit = (product: Product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stockQuantity: String(product.stock),
      colorCode: product.colorCode || '#1e3a8a',
      image: product.image || '',
      description: product.description || '',
      rating: String(product.rating ?? 4.5),
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      colorCode: form.colorCode.trim() || '#1e3a8a',
      image: form.image.trim(),
      description: form.description.trim(),
      rating: Number(form.rating),
    };

    if (!payload.name || !payload.category || Number.isNaN(payload.price) || Number.isNaN(payload.stockQuantity)) {
      setError('Name, category, price, and stock are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/products/${editingProductId}` : '/api/products';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to save product');
      }

      setSuccess(isEditing ? 'Product updated successfully' : 'Product added successfully');
      setEditingProductId(null);
      setForm(emptyForm);
      await loadProducts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateImage = async (productId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setIsGeneratingImage(productId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/products/${productId}/generate-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Failed to generate image');
      }

      const sourceLabel = data.source === 'dall-e' ? 'AI (DALL-E 3)' : 'free stock image';
      setSuccess(`Image updated for "${data.product.name}" using ${sourceLabel}`);

      // Update the image field in the form if we're currently editing this product
      if (editingProductId === productId) {
        setForm((prev) => ({ ...prev, image: data.product.image }));
      }

      await loadProducts();
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handleDelete = async (productId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to delete product');
      }

      setSuccess('Product deleted successfully');
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete product');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Products</h1>
            <p className="text-gray-600 mt-2">Add new products and edit existing products from admin.</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition"
          >
            Back to Admin
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            {isEditing && (
              <button
                type="button"
                onClick={startCreate}
                className="text-sm font-semibold text-blue-900 hover:underline"
              >
                Create New Instead
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Product name"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <input
                id="category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Interior / Exterior"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-1">Stock Quantity</label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={(event) => setForm((prev) => ({ ...prev, stockQuantity: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-semibold text-gray-700 mb-1">Rating (0-5)</label>
              <input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(event) => setForm((prev) => ({ ...prev, rating: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="colorCode" className="block text-sm font-semibold text-gray-700 mb-1">Color Code</label>
              <input
                id="colorCode"
                value={form.colorCode}
                onChange={(event) => setForm((prev) => ({ ...prev, colorCode: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="#1e3a8a"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                id="image"
                value={form.image}
                onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="/paints/new-product.svg"
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="Product preview"
                  className="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {isEditing && editingProductId && (
                <button
                  type="button"
                  disabled={isGeneratingImage === editingProductId}
                  onClick={() => handleGenerateImage(editingProductId)}
                  className="mt-2 px-4 py-2 rounded-lg bg-purple-700 text-white text-sm font-semibold hover:bg-purple-600 transition disabled:opacity-70"
                >
                  {isGeneratingImage === editingProductId ? 'Applying...' : 'Apply Paint-Shop Image'}
                </button>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Short product description"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={startCreate}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>Loading products...</td>
                </tr>
              )}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>No products found</td>
                </tr>
              )}
              {!isLoading && products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{product.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{rupeeFormatter.format(product.price)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{product.stock}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="text-sm font-semibold text-blue-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingImage === product.id}
                        onClick={() => handleGenerateImage(product.id)}
                        className="text-sm font-semibold text-purple-700 hover:underline disabled:opacity-50"
                      >
                        {isGeneratingImage === product.id ? 'Generating...' : '✨ Image'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="text-sm font-semibold text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
