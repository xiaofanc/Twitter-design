'use client';

import { use } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import FeedList from '@/components/FeedList';
import FollowButton from '@/components/FollowButton';
import { Avatar } from '@/components/Sidebar';
import { SkeletonFeed } from '@/components/SkeletonCard';
import ErrorBanner from '@/components/ErrorBanner';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile?: { nickname?: string; avatar?: string };
}

interface FollowerCount {
  count: number;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: me } = useAuth();

  const { data: profileUser, error, isLoading } = useSWR<{ results: UserProfile[] }>(
    `${API_URL}/api/users/?search=${encodeURIComponent(username)}`,
    fetcher,
  );

  const targetUser = profileUser?.results?.find((u) => u.username === username);

  const { data: followers } = useSWR<FollowerCount>(
    targetUser ? `${API_URL}/api/friendships/${targetUser.id}/followers_count/` : null,
    fetcher,
  );
  const { data: followings } = useSWR<FollowerCount>(
    targetUser ? `${API_URL}/api/friendships/${targetUser.id}/followings_count/` : null,
    fetcher,
  );
  const { data: friendship } = useSWR<{ has_followed: boolean }>(
    targetUser && me ? `${API_URL}/api/friendships/${targetUser.id}/has_followed/` : null,
    fetcher,
  );

  if (isLoading) return <SkeletonFeed count={3} />;
  if (error || !targetUser) return <ErrorBanner message={`@${username} not found.`} />;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-4 py-3 z-10">
        <h1 className="font-bold text-xl">{targetUser.username}</h1>
      </div>

      {/* Profile banner + info */}
      <div className="border-b border-zinc-100 pb-4">
        <div className="h-32 bg-zinc-200" />
        <div className="px-4">
          <div className="flex justify-between items-end -mt-10 mb-3">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden">
              <Avatar username={targetUser.username} size={20} />
            </div>
            <FollowButton
              userId={targetUser.id}
              username={targetUser.username}
              initialFollowing={friendship?.has_followed ?? false}
            />
          </div>

          <div>
            <p className="font-bold text-xl">{targetUser.profile?.nickname || targetUser.username}</p>
            <p className="text-zinc-500 text-sm">@{targetUser.username}</p>
          </div>

          <div className="flex gap-4 mt-3 text-sm">
            <span>
              <strong>{followings?.count ?? '—'}</strong>{' '}
              <span className="text-zinc-500">Following</span>
            </span>
            <span>
              <strong>{followers?.count ?? '—'}</strong>{' '}
              <span className="text-zinc-500">Followers</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tweets */}
      <div>
        <div className="px-4 py-3 border-b border-zinc-100">
          <h2 className="font-bold">Posts</h2>
        </div>
        <FeedList
          apiPath={`/api/tweets/?user_id=${targetUser.id}`}
          type="tweet"
          emptyMessage="No posts yet."
        />
      </div>
    </div>
  );
}
