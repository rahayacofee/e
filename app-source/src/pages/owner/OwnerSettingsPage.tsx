import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Store,
  Database,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const OwnerSettingsPage: React.FC = () => {
  const { refreshMe } = useAuth();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    tax_percentage: 10,
    service_percentage: 0,
    receipt_header: '',
    receipt_footer: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Supabase integration state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isConfiguringSupabase, setIsConfiguringSupabase] = useState<boolean>(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [res, dbStatus] = await Promise.all([
        api.owner.getSettings(),
        api.database.getStatus().catch(() => null),
      ]);
      const b = res.business;
      if (b) {
        setForm({
          name: b.name || '',
          address: b.address || '',
          phone: b.phone || '',
          tax_percentage: b.tax_percentage ?? 10,
          service_percentage: b.service_percentage ?? 0,
          receipt_header: b.receipt_header || '',
          receipt_footer: b.receipt_footer || '',
        });
      }
      setSupabaseStatus(dbStatus);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengaturan bisnis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.owner.updateSettings(form);
      setSuccessMsg('Pengaturan bisnis dan struk berhasil diperbarui!');
      refreshMe();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) return;
    setIsConfiguringSupabase(true);
    setSupabaseFeedback(null);
    try {
      const res = await api.database.configure({
        supabase_url: supabaseUrl.trim(),
        supabase_key: supabaseKey.trim(),
      });
      setSupabaseFeedback({
        type: 'success',
        message: `${res.message} ${res.test_result?.message || ''}`,
      });
      const updated = await api.database.getStatus();
      setSupabaseStatus(updated);
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: err.message || 'Gagal menghubungkan ke Supabase.',
      });
    } finally {
      setIsConfiguringSupabase(false);
    }
  };

  if (isLoading) return <LoadingState message="Memuat pengaturan outlet..." />;

  return (
    <div className="space-y-6 max-w-3xl select-none">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Bisnis & Integrasi</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sesuaikan profil outlet, format cetak struk thermal kasir, dan koneksi Supabase PostgreSQL
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Supabase PostgreSQL Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-800" />
            <span>Koneksi Supabase PostgreSQL Online</span>
          </h3>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              supabaseStatus?.supabase_configured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {supabaseStatus?.supabase_configured ? '🟢 Terhubung' : '🟡 Belum Terhubung'}
          </span>
        </div>

        {supabaseFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              supabaseFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {supabaseFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{supabaseFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleConnectSupabase} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              required
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              required
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border rounded-xl border-slate-200 font-mono bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              🔒 Hanya kunci Public/Anon yang digunakan. Multi-tenant terisolasi aman.
            </span>
            <button
              type="submit"
              disabled={isConfiguringSupabase}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isConfiguringSupabase ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyambungkan...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Koneksikan ke Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-800" />
            <span>Profil Outlet Rahaya Coffee</span>
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nama Bisnis / Outlet</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">No. Telepon Toko</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pajak Restoran PB1 (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.tax_percentage}
                onChange={(e) => setForm({ ...form, tax_percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
            />
          </div>
        </div>

        {/* Receipt Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Header & Footer Struk Thermal (58mm/80mm)
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Pesan Header Struk (di bawah nama toko)
            </label>
            <textarea
              rows={2}
              value={form.receipt_header}
              onChange={(e) => setForm({ ...form, receipt_header: e.target.value })}
              placeholder="Contoh: Artisan Espresso & Roastery&#10;Nikmati Setiap Tegukan Kopi Terbaik"
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Pesan Footer Struk (di bagian paling bawah)
            </label>
            <textarea
              rows={2}
              value={form.receipt_footer}
              onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              placeholder="Contoh: Terima kasih atas kunjungan Anda!&#10;WiFi: rahayacoffee / Pass: kopiindonesia"
              className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Outlet'}</span>
        </button>
      </form>
    </div>
  );
};
