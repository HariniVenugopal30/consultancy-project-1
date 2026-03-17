'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/frontend/context/CartContext';

const prefetchRoutes = [
  '/',
  '/about',
  '/products',
  '/portfolio',
  '/contact',
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/track-order',
  '/orders',
  '/login',
  '/signup',
  '/paint-calculator',
  '/wall',
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { getTotalItems } = useCart();

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem('authToken');
      const authUser = localStorage.getItem('authUser');
      setIsLoggedIn(Boolean(token || authUser));
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-changed', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-changed', syncAuthState);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.dispatchEvent(new Event('auth-changed'));
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  useEffect(() => {
    const prefetchAll = () => {
      prefetchRoutes.forEach((route) => router.prefetch(route));
    };

    if (
      typeof window !== 'undefined' &&
      typeof window.requestIdleCallback === 'function' &&
      typeof window.cancelIdleCallback === 'function'
    ) {
      const idleId = window.requestIdleCallback(() => prefetchAll(), { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(prefetchAll, 300);
    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-lg">CB</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">ColorBurst</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-yellow-400 transition">
              Home
            </Link>
            <Link href="/about" className="hover:text-yellow-400 transition">
              About
            </Link>
            <Link href="/products" className="hover:text-yellow-400 transition">
              Products
            </Link>
            <Link href="/portfolio" className="hover:text-yellow-400 transition">
              Portfolio
            </Link>
            <Link href="/contact" className="hover:text-yellow-400 transition">
              Contact
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/orders" className="hover:text-yellow-400 transition">
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-yellow-400 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-yellow-400 transition">
                  Login
                </Link>
                <Link href="/signup" className="hover:text-yellow-400 transition">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link href="/about" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
            <Link href="/products" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
              Products
            </Link>
            <Link href="/portfolio" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
              Portfolio
            </Link>
            <Link href="/contact" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/orders" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block py-2 hover:text-yellow-400 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="block py-2 hover:text-yellow-400" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

