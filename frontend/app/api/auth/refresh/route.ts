import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token')?.value;

  if (!refresh) {
    return Response.json({ error: 'No refresh token' }, { status: 401 });
  }

  const djangoRes = await fetch(`${API_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!djangoRes.ok) {
    cookieStore.delete('refresh_token');
    return Response.json({ error: 'Refresh failed' }, { status: 401 });
  }

  const { access, refresh: newRefresh } = await djangoRes.json();

  // Rotate the refresh cookie
  const isSecure = process.env.NODE_ENV === 'production';
  cookieStore.set('refresh_token', newRefresh ?? refresh, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  // Also return user info from Django me endpoint if available
  let user = null;
  try {
    const meRes = await fetch(`${API_URL}/api/accounts/login_status/`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      user = me.user ?? null;
    }
  } catch {}

  return Response.json({ access, user });
}
