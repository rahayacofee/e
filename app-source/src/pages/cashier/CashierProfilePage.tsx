import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Store, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export const CashierProfilePage: React.FC = () => {
  const { user, business } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.changePassword({ old_password: oldPassword, new_password: newPassword });
      setSuccessMsg('Password berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl select-none">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Profil Staf Kasir</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informasi identitas akun barista/kasir dan keamanan sandi login
        </p>
      </div>

      {/* Info Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{user?.full_name}</h3>
            <span className="text-xs text-slate-400 font-mono">@{user?.username}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Peran / Role:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
              KASIR RESMI
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Outlet Bertugas:</span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {business?.name || 'Rahaya Coffee'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">No. Kontak:</span>
            <span className="font-semibold text-slate-700 block mt-0.5">
              {user?.phone || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Kode Outlet:</span>
            <span className="font-mono font-bold text-slate-800 block mt-0.5">
              {business?.code || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Lock className="w-4 h-4 text-blue-900" />
          <span>Ganti Kata Sandi Pribadi</span>
        </h3>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Password Baru (Min. 6 Karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            {isSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
