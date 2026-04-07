'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/architecture', label: 'Architecture', icon: ArchIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="flex flex-col h-full py-4 px-3 gap-1">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center w-12 h-12 mb-2 rounded-full hover:bg-zinc-100 transition-colors">
        <XLogo />
      </Link>

      {/* Nav items */}
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 px-3 py-3 rounded-full text-xl transition-colors hover:bg-zinc-100 ${active ? 'font-bold' : 'font-normal'}`}
          >
            <Icon active={active} />
            <span className="hidden xl:block">{label}</span>
          </Link>
        );
      })}

      {/* Profile link */}
      {user && (
        <Link
          href={`/${user.username}`}
          className={`flex items-center gap-4 px-3 py-3 rounded-full text-xl transition-colors hover:bg-zinc-100 ${pathname === `/${user.username}` ? 'font-bold' : 'font-normal'}`}
        >
          <PersonIcon active={pathname === `/${user.username}`} />
          <span className="hidden xl:block">Profile</span>
        </Link>
      )}

      {/* Post button */}
      {user && (
        <Link
          href="/"
          className="mt-4 flex items-center justify-center xl:justify-start gap-2 bg-black text-white font-bold rounded-full px-6 py-3 hover:bg-zinc-800 transition-colors"
        >
          <span className="text-xl leading-none xl:hidden">+</span>
          <span className="hidden xl:block">Post</span>
        </Link>
      )}

      {/* Login / logout */}
      <div className="mt-auto">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-full hover:bg-zinc-100 transition-colors text-left"
          >
            <Avatar username={user.username} size={10} />
            <div className="hidden xl:block leading-tight">
              <div className="font-bold text-sm">{user.username}</div>
              <div className="text-zinc-500 text-sm">Log out</div>
            </div>
          </button>
        ) : (
          <Link href="/login" className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-zinc-100 transition-colors">
            <span className="font-semibold">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Avatar({ username, size = 10 }: { username: string; size?: number }) {
  const initial = username[0]?.toUpperCase() ?? '?';
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} ${color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {initial}
    </div>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-black" aria-label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill={active ? 'black' : 'none'} stroke="black" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill={active ? 'black' : 'none'} stroke="black" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ArchIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill={active ? 'black' : 'none'} stroke="black" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}
