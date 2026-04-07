'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TweetComposer from '@/components/TweetComposer';
import FeedList from '@/components/FeedList';
import { SkeletonFeed } from '@/components/SkeletonCard';
import useSWR, { mutate } from 'swr';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  if (isLoading) return <SkeletonFeed />;
  if (!user) return null;

  const handlePosted = () => {
    // Revalidate the newsfeed SWR cache
    mutate((key: unknown) => typeof key === 'string' && key.includes('/api/newsfeeds/'));
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-4 py-3 z-10">
        <h1 className="font-bold text-xl">Home</h1>
      </div>

      {/* Composer */}
      <TweetComposer onPosted={handlePosted} />

      {/* Feed */}
      <FeedList
        apiPath="/api/newsfeeds/"
        type="newsfeed"
        emptyMessage="Follow someone to see their tweets here."
      />
    </div>
  );
}
