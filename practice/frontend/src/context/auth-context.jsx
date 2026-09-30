'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { setAccessToken, clearAccessToken } from '@/lib/token-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On first mount (including full page reloads), attempt a silent refresh
  // using the httpOnly cookie so the session survives navigation/reloads
  // without ever putting the JWT in localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (cancelled) return;
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // proceed with local cleanup regardless
    }
    clearAccessToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data);
    return data.data;
  }, []);

  /** Super Admin implicitly has every permission (mirrors the backend RBAC bypass). */
  const hasPermission = useCallback(
    (key) => {
      if (!user) return false;
      if (user.roleName === 'Super Admin') return true;
      if (!key) return true;
      const required = Array.isArray(key) ? key : [key];
      return required.some((k) => user.permissions?.includes(k));
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { getErrorMessage };
