'use client';

import Link from 'next/link';
import { Avatar } from './Sidebar';

interface TweetUser {
  id: number;
  username: string;
  nickname?: string;
}

interface Tweet {
  id: number;
  user: TweetUser;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
  photo_urls?: string[];
}

interface NewsfeedItem {
  id: number;
  tweet: Tweet;
  created_at: string;
}

type Props =
  | { type: 'tweet'; data: Tweet }
  | { type: 'newsfeed'; data: NewsfeedItem };

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TweetCard(props: Props) {
  const tweet = props.type === 'newsfeed' ? props.data.tweet : props.data;
  const { user, content, created_at, likes_count, comments_count, photo_urls } = tweet;

  return (
    <article className="flex gap-3 px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
      <Link href={`/${user.username}`} className="flex-shrink-0">
        <Avatar username={user.username} size={10} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 flex-wrap">
          <Link href={`/${user.username}`} className="font-bold text-sm hover:underline">
            {user.nickname || user.username}
          </Link>
          <Link href={`/${user.username}`} className="text-zinc-500 text-sm">
            @{user.username}
          </Link>
          <span className="text-zinc-400 text-sm">·</span>
          <Link href={`/tweet/${tweet.id}`} className="text-zinc-400 text-sm hover:underline">
            {formatTime(created_at)}
          </Link>
        </div>

        <Link href={`/tweet/${tweet.id}`}>
          <p className="mt-0.5 text-sm leading-normal break-words">{content}</p>
        </Link>

        {photo_urls && photo_urls.length > 0 && (
          <div className={`mt-2 grid gap-1 rounded-xl overflow-hidden ${photo_urls.length > 1 ? 'grid-cols-2' : ''}`}>
            {photo_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="w-full object-cover max-h-80" />
            ))}
          </div>
        )}

        <div className="flex gap-6 mt-2 text-zinc-400 text-sm">
          <Link href={`/tweet/${tweet.id}`} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
            <CommentIcon />
            <span>{comments_count}</span>
          </Link>
          <button className={`flex items-center gap-1.5 hover:text-pink-500 transition-colors ${tweet.has_liked ? 'text-pink-500' : ''}`}>
            <HeartIcon filled={tweet.has_liked} />
            <span>{likes_count}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}
