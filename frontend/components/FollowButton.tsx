'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  userId: number;
  username: string;
  initialFollowing: boolean;
  onChanged?: (following: boolean) => void;
}

export default function FollowButton({ userId, username, initialFollowing, onChanged }: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!user || user.username === username) return null;

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const action = following ? 'unfollow' : 'follow';
    try {
      const res = await apiFetch(`/api/friendships/${userId}/${action}/`, { method: 'POST' });
      if (res.ok) {
        setFollowing(!following);
        onChanged?.(!following);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
        following
          ? 'border border-zinc-300 text-black hover:border-red-300 hover:text-red-600 hover:bg-red-50'
          : 'bg-black text-white hover:bg-zinc-800'
      } disabled:opacity-50`}
    >
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}
