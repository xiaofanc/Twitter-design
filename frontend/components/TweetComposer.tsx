'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/fetcher';
import { Avatar } from './Sidebar';

interface Props {
  onPosted?: () => void;
  placeholder?: string;
}

export default function TweetComposer({ onPosted, placeholder = "What's happening?" }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError('');
    try {
      const res = await apiFetch('/api/tweets/', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.content?.[0] ?? 'Failed to post');
        return;
      }
      setContent('');
      onPosted?.();
    } catch {
      setError('Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const remaining = 140 - content.length;
  const overLimit = remaining < 0;

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-zinc-100">
      <Avatar username={user.username} size={10} />
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none text-xl placeholder:text-zinc-400 focus:outline-none bg-transparent"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
          <span className={`text-sm ${overLimit ? 'text-red-500' : remaining < 20 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {remaining}
          </span>
          <button
            onClick={handlePost}
            disabled={posting || !content.trim() || overLimit}
            className="bg-black text-white font-bold rounded-full px-5 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
