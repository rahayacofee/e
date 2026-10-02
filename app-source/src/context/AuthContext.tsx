import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Business, Shift } from '../types';
import { api, getAuthToken, setAuthToken, startRealtimeSync } from '../services/api';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  activeShift: Shift | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setActiveShift: (shift: Shift | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const realtimeCleanup = useRef<(() => void) | null>(null);

  const clearSession = () => {
    setAuthToken(null);
    realtimeCleanup.current?.();
    realtimeCleanup.current = null;
    setUser(null);
    setBusiness(null);
    setActiveShift(null);
  };

  const setupRealtime = (nextUser: any) => {
    realtimeCleanup.current?.();
    realtimeCleanup.current = startRealtimeSync(nextUser?.business_id || null, nextUser?.role === 'MASTER');
  };

  const refreshMe = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusiness(data.business);
      setActiveShift(data.open_shift || null);
      setupRealtime(data.user);
    } catch (err: any) {
      // Do not destroy a valid local session because of a temporary network/API error.
      // Only clear the token when the backend explicitly reports an invalid/expired session.
      const message = String(err?.message || '');
      const sessionInvalid = Number(err?.status) === 401;
      if (sessionInvalid) clearSession();
      else console.warn('[Rahaya Auth] refreshMe failed without clearing session:', message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (getAuthToken()) void refreshMe();
    else setIsLoading(false);

    return () => {
      realtimeCleanup.current?.();
    };
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setBusiness(res.business);
      setupRealtime(res.user);
      if (res.user.role === 'CASHIER') {
        const shiftRes = await api.cashier.getCurrentShift().catch(() => null);
        setActiveShift(shiftRes?.shift || null);
      } else {
        setActiveShift(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const token = getAuthToken();
    if (token) void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rahaya-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path: '/auth/logout', method: 'POST', body: {} }),
    }).catch(() => undefined);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, business, activeShift, isLoading, login, logout, refreshMe, setActiveShift }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
