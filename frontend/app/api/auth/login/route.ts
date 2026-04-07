import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export async function POST(request: Request) {
  const body = await request.json();

  const djangoRes = await fetch(`${API_URL}/api/accounts/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await djangoRes.json();
  if (!djangoRes.ok) {
    return Response.json(data, { status: djangoRes.status });
  }

  const { access, refresh, user } = data;
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === 'production';
  cookieStore.set('refresh_token', refresh, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return Response.json({ access, user });
}
