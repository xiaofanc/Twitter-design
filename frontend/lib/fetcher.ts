import { API_URL } from './api';

// Module-level token store — survives React re-renders, cleared on page reload.
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  return fetch(fullUrl, { ...options, headers });
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  let res = await apiFetch(url);

  if (res.status === 401 && _accessToken) {
    // Try to refresh via the Next.js route handler (same-origin, reads httpOnly cookie)
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
    if (refreshRes.ok) {
      const { access } = await refreshRes.json();
      setAccessToken(access);
      res = await apiFetch(url);
    } else {
      setAccessToken(null);
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? `API ${res.status}`), { status: res.status, info: err });
  }

  return res.json() as T;
}

export { apiFetch };
