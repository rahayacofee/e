import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LoginPage } from './pages/login/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/common/LoadingState';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { startRealtimeSync } from './services/api';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!user) return;
    return startRealtimeSync(user.business_id || null, user.role === 'MASTER');
  }, [user?.id, user?.business_id, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoadingState
          message="Memuat Sesi Rahaya Coffee POS..."
          subMessage="Memeriksa otentikasi server & multi-tenant workspace"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <CartProvider>
      <AppLayout />
    </CartProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
