'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { API_URL } from '@/lib/api';
import { Avatar } from '@/components/Sidebar';
import { SkeletonFeed } from '@/components/SkeletonCard';
import ErrorBanner from '@/components/ErrorBanner';

interface Comment {
  id: number;
  user: { id: number; username: string };
  content: string;
  created_at: string;
  likes_count: number;
}

interface TweetDetail {
  id: number;
  user: { id: number; username: string; nickname?: string };
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  photo_urls?: string[];
  comments: Comment[];
}

export default function TweetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tweet, error, isLoading } = useSWR<TweetDetail>(
    `${API_URL}/api/tweets/${id}/`,
    fetcher,
  );

  if (isLoading) return <SkeletonFeed count={3} />;
  if (error || !tweet) return <ErrorBanner message="Tweet not found." />;

  const postedAt = new Date(tweet.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-4 py-3 z-10 flex items-center gap-4">
        <Link href="/" className="rounded-full p-2 hover:bg-zinc-100 transition-colors">
          <BackIcon />
        </Link>
        <h1 className="font-bold text-xl">Post</h1>
      </div>

      {/* Tweet */}
      <article className="px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/${tweet.user.username}`}>
            <Avatar username={tweet.user.username} size={10} />
          </Link>
          <div>
            <Link href={`/${tweet.user.username}`} className="font-bold hover:underline block">
              {tweet.user.username}
            </Link>
            <Link href={`/${tweet.user.username}`} className="text-zinc-500 text-sm">
              @{tweet.user.username}
            </Link>
          </div>
        </div>

        <p className="text-xl leading-normal mb-3">{tweet.content}</p>

        {tweet.photo_urls && tweet.photo_urls.length > 0 && (
          <div className={`mb-3 grid gap-1 rounded-xl overflow-hidden ${tweet.photo_urls.length > 1 ? 'grid-cols-2' : ''}`}>
            {tweet.photo_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full object-cover max-h-96" />
            ))}
          </div>
        )}

        <p className="text-zinc-400 text-sm border-t border-zinc-100 pt-3">{postedAt}</p>

        <div className="flex gap-6 mt-3 pt-3 border-t border-zinc-100 text-sm text-zinc-500">
          <span><strong className="text-black">{tweet.comments_count}</strong> Replies</span>
          <span><strong className="text-black">{tweet.likes_count}</strong> Likes</span>
        </div>
      </article>

      {/* Comments */}
      <div>
        {tweet.comments.length === 0 ? (
          <div className="py-10 text-center text-zinc-400 text-sm">No replies yet.</div>
        ) : (
          tweet.comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 px-4 py-3 border-b border-zinc-100">
              <Link href={`/${comment.user.username}`} className="flex-shrink-0">
                <Avatar username={comment.user.username} size={10} />
              </Link>
              <div>
                <div className="flex items-baseline gap-1">
                  <Link href={`/${comment.user.username}`} className="font-bold text-sm hover:underline">
                    {comment.user.username}
                  </Link>
                  <span className="text-zinc-500 text-sm">@{comment.user.username}</span>
                </div>
                <p className="text-sm mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
