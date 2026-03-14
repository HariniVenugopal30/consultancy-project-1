'use client';

import AdminOrdersPanel from '@/components/admin/AdminOrdersPanel';

export default function AdminOrdersPage() {
  return (
    <div className="min-h-[calc(100vh-10rem)] bg-linear-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminOrdersPanel />
      </div>
    </div>
  );
}
