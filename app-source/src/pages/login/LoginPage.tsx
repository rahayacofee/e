import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RahayaLogo } from '../../components/layout/RahayaLogo';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Store, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('owner_rahaya');
  const [password, setPassword] = useState('RahayaOwner2026!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'MASTER' | 'OWNER' | 'CASHIER') => {
    if (role === 'MASTER') {
      // Requirement 4: mdqputra@gmail.com / 990830
      setUsername('mdqputra@gmail.com');
      setPassword('990830');
    } else if (role === 'OWNER') {
      setUsername('owner_rahaya');
      setPassword('RahayaOwner2026!');
    } else if (role === 'CASHIER') {
      setUsername('kasir_1');
      setPassword('Kasir123!');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80"
          alt="Coffee shop background"
          className="w-full h-full object-cover scale-105 filter blur-xs"
        />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo and Brand Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2 mb-2">
            <RahayaLogo size="lg" showText={false} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            RAHAYA <span className="text-red-600">COFFEE</span> POS
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Sistem Kasir & Manajemen Multi-Tenant F&B Artisan
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke POS'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 mb-2.5 text-center">
            Pilih Role Akun Terverifikasi:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('MASTER')}
              className={`p-2 rounded-xl border text-center transition-all ${
                username === 'mdqputra@gmail.com'
                  ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
              <div className="text-[11px] leading-tight">Master</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Kelola Owner</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('OWNER')}
              className={`p-2 rounded-xl border text-center transition-all ${
                username === 'owner_rahaya'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
              }`}
            >
              <Store className="w-4 h-4 mx-auto mb-1 text-blue-700" />
              <div className="text-[11px] leading-tight">Owner</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Full Tenant</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('CASHIER')}
              className={`p-2 rounded-xl border text-center transition-all ${
                username === 'kasir_1'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
              }`}
            >
              <UserCheck className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
              <div className="text-[11px] leading-tight">Cashier</div>
              <div className="text-[9px] text-slate-400 mt-0.5">POS & Shift</div>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-[10px] text-slate-400">
          Enkripsi Kata Sandi Bcrypt • Multi-Tenant Terisolasi • Supabase PostgreSQL
        </div>
      </div>
    </div>
  );
};
