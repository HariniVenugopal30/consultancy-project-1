'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/frontend/lib/api';

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  year: number;
  paints: string[];
};

type AuthUser = {
  role: 'admin' | 'customer';
};

type ProjectForm = {
  title: string;
  description: string;
  category: string;
  image: string;
  year: string;
  paints: string;
};

const emptyForm: ProjectForm = {
  title: '',
  description: '',
  category: '',
  image: '',
  year: String(new Date().getFullYear()),
  paints: '',
};

export default function AdminPortfolioPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = useMemo(() => Boolean(editingProjectId), [editingProjectId]);

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

    loadProjects();
  }, [router]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/portfolio'), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to load portfolio projects');
      }

      setProjects(data.projects ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load portfolio projects');
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setEditingProjectId(null);
    setForm({ ...emptyForm, year: String(new Date().getFullYear()) });
    setError('');
    setSuccess('');
  };

  const startEdit = (project: PortfolioProject) => {
    setEditingProjectId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      category: project.category,
      image: project.image,
      year: String(project.year),
      paints: project.paints.join(', '),
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
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      image: form.image.trim(),
      year: Number(form.year),
      paints: form.paints
        .split(',')
        .map((paint) => paint.trim())
        .filter(Boolean),
    };

    if (!payload.title || !payload.description || !payload.category || Number.isNaN(payload.year) || payload.paints.length === 0) {
      setError('Title, description, category, year, and paints are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/portfolio/${editingProjectId}` : '/api/portfolio';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to save portfolio project');
      }

      setSuccess(isEditing ? 'Portfolio project updated' : 'Portfolio project created');
      setEditingProjectId(null);
      setForm({ ...emptyForm, year: String(new Date().getFullYear()) });
      await loadProjects();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save portfolio project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.replace('/admin/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch(getApiUrl(`/api/portfolio/${projectId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to delete portfolio project');
      }

      setSuccess('Portfolio project deleted');
      await loadProjects();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete portfolio project');
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manage Portfolio</h1>
            <p className="text-gray-600 mt-2">Add or update portfolio works shown on the user portfolio page.</p>
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
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Portfolio Work' : 'Add Portfolio Work'}</h2>
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
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Project title"
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
                placeholder="Residential / Commercial"
                required
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
              <input
                id="year"
                type="number"
                value={form.year}
                onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
              <input
                id="image"
                value={form.image}
                onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="/portfolio/new-work.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="paints" className="block text-sm font-semibold text-gray-700 mb-1">Paints Used</label>
              <input
                id="paints"
                value={form.paints}
                onChange={(event) => setForm((prev) => ({ ...prev, paints: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Premium Interior Matte, Gloss Exterior Pro"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Project details"
                required
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-blue-900 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-70"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Work' : 'Add Work'}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paints</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>Loading portfolio works...</td>
                </tr>
              )}
              {!isLoading && projects.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>No portfolio works found</td>
                </tr>
              )}
              {!isLoading && projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{project.title}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.year}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{project.paints.join(', ')}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="text-sm font-semibold text-blue-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
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
