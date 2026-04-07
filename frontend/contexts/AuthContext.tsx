'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setAccessToken, getAccessToken } from '@/lib/fetcher';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (user: User, access: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });

  // On mount, try to restore session via refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const { access, user } = await res.json();
          setAccessToken(access);
          setState({ user, accessToken: access, isLoading: false });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback((user: User, access: string) => {
    setAccessToken(access);
    setState({ user, accessToken: access, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const { access } = await res.json();
        setAccessToken(access);
        setState((s) => ({ ...s, accessToken: access }));
        return access;
      }
    } catch {}
    setAccessToken(null);
    setState({ user: null, accessToken: null, isLoading: false });
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
