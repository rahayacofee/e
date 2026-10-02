import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Business, Shift } from '../types';
import { api, supabase, startRealtimeSync } from '../services/api';

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
    } catch {
      await supabase.auth.signOut().catch(() => undefined);
      realtimeCleanup.current?.();
      realtimeCleanup.current = null;
      setUser(null);
      setBusiness(null);
      setActiveShift(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        await refreshMe();
      } else {
        setIsLoading(false);
      }
    };
    void boot();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        realtimeCleanup.current?.();
        realtimeCleanup.current = null;
        setUser(null);
        setBusiness(null);
        setActiveShift(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
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
    realtimeCleanup.current?.();
    realtimeCleanup.current = null;
    void supabase.auth.signOut();
    setUser(null);
    setBusiness(null);
    setActiveShift(null);
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
