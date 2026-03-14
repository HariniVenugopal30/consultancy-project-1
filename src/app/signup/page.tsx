'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type SignupResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'customer';
  };
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to sign up');
      }

      const auth = data as SignupResponse;
      localStorage.setItem('authToken', auth.token);
      localStorage.setItem('authUser', JSON.stringify(auth.user));
      router.push('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign up');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -8 }}
          className="bg-white rounded-2xl shadow-xl hover:shadow-2xl border border-gray-100 p-8 transition-all duration-300"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign up</h1>
          <p className="text-gray-600 mb-6">Create your ColorBurst account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Create a password"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </motion.button>
          </form>

          <p className="text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-900 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}