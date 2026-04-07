'use client';

import { useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/fetcher';
import { API_URL } from '@/lib/api';
import TweetCard from './TweetCard';
import { SkeletonFeed } from './SkeletonCard';
import ErrorBanner from './ErrorBanner';

interface Page {
  results: unknown[];
  next: string | null;
}

interface Props {
  /** Django API path, e.g. /api/newsfeeds/ or /api/tweets/?user_id=1 */
  apiPath: string;
  type: 'newsfeed' | 'tweet';
  emptyMessage?: string;
}

function getKey(apiPath: string) {
  return (pageIndex: number, previousPage: Page | null) => {
    if (pageIndex === 0) return `${API_URL}${apiPath}`;
    if (!previousPage?.next) return null;
    // next is an opaque cursor token; append to the base URL
    const base = `${API_URL}${apiPath}`;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}cursor=${previousPage.next}`;
  };
}

export default function FeedList({ apiPath, type, emptyMessage = 'Nothing here yet.' }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<Page>(
    getKey(`${apiPath}${refreshKey > 0 ? (apiPath.includes('?') ? '&' : '?') + `_r=${refreshKey}` : ''}`),
    fetcher,
    { revalidateFirstPage: false }
  );

  const pages = data ?? [];
  const items = pages.flatMap((p) => p.results);
  const isLoadingMore = size > 0 && data && typeof data[size - 1] === 'undefined';
  const hasMore = pages.length > 0 && pages[pages.length - 1]?.next != null;
  const isEmpty = !isLoading && items.length === 0;

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    mutate();
  };

  if (isLoading) return <SkeletonFeed />;
  if (error) return <ErrorBanner message="Failed to load feed." onRetry={refresh} />;
  if (isEmpty) return <div className="py-10 text-center text-zinc-400 text-sm">{emptyMessage}</div>;

  return (
    <div>
      {items.map((item, i) => (
        <TweetCard
          key={i}
          type={type}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={item as any}
        />
      ))}
      {hasMore && (
        <button
          onClick={() => setSize(size + 1)}
          disabled={!!isLoadingMore}
          className="w-full py-4 text-sm font-semibold text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
