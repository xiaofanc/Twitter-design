'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) {
            flat[k] = Array.isArray(v) ? (v[0] as string) : String(v);
          }
          setErrors(flat);
        } else {
          setErrors({ general: data.message ?? 'Sign up failed' });
        }
        return;
      }
      login(data.user, data.access);
      router.push('/');
    } catch {
      setErrors({ general: 'Something went wrong. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const field = (name: keyof typeof form, label: string, type = 'text') => (
    <div>
      <input
        type={type}
        placeholder={label}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        required
        className={`w-full border rounded-lg px-4 py-3 text-base focus:outline-none transition-colors ${
          errors[name] ? 'border-red-400 focus:border-red-500' : 'border-zinc-300 focus:border-blue-500'
        }`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <XLogo />
        </div>
        <h1 className="text-3xl font-bold mb-8">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('username', 'Username')}
          {field('email', 'Email', 'email')}
          {field('password', 'Password', 'password')}

          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold rounded-full py-3 text-base hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-black hover:underline">
            Sign in
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
