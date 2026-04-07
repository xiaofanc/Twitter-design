'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.non_field_errors?.[0] ?? data.message ?? 'Login failed');
        return;
      }
      login(data.user, data.access);
      router.push('/');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <XLogo />
        </div>
        <h1 className="text-3xl font-bold mb-8">Sign in to X</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold rounded-full py-3 text-base hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-black hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
