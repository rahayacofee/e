import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business, Shift } from '../types';
import { api, setAuthToken } from '../services/api';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusiness(data.business);
      setActiveShift(data.open_shift || null);
    } catch (err) {
      setUser(null);
      setBusiness(null);
      setActiveShift(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('rahaya_token');
    if (token) {
      refreshMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setAuthToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
      if (res.user.role === 'CASHIER') {
        const shiftRes = await api.cashier.getCurrentShift().catch(() => null);
        setActiveShift(shiftRes?.shift || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setBusiness(null);
    setActiveShift(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        activeShift,
        isLoading,
        login,
        logout,
        refreshMe,
        setActiveShift,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
