import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get('refresh_token')?.value;

  if (refresh) {
    // Blacklist the refresh token on Django
    await fetch(`${API_URL}/api/token/blacklist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    }).catch(() => {}); // best-effort
  }

  cookieStore.delete('refresh_token');
  return Response.json({ success: true });
}
