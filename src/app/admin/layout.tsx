'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Palette,
  ImageIcon,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/paint-mixer', label: 'Paint Mixer', icon: Palette },
  { href: '/admin/portfolio', label: 'Portfolio', icon: ImageIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page: render plain, no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
          <div className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-900 font-bold text-sm">CB</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">ColorBurst</p>
            <p className="text-blue-300 text-xs">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {adminNavLinks.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-yellow-400 text-blue-900'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer: back to site + logout */}
        <div className="px-4 pb-6 space-y-1 border-t border-blue-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-300 hover:bg-blue-800 transition-colors"
          >
            <ChevronRight size={18} className="rotate-180" />
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-blue-800 hover:text-red-200 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
