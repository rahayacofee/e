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
  const [isRefreshingDb, setIsRefreshingDb] = useState<boolean>(false);

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

  const refreshDatabaseStatus = async () => {
    setIsRefreshingDb(true);
    try {
      const status = await api.database.getStatus();
      setSupabaseStatus(status);
    } catch (err: any) {
      setSupabaseStatus({ supabase: { connected: false, error: err.message || 'Koneksi PostgreSQL tidak dapat diperiksa.' } });
    } finally {
      setIsRefreshingDb(false);
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
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-800" />
              <span>Koneksi Supabase PostgreSQL</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Koneksi menggunakan konfigurasi Supabase aplikasi secara otomatis. Tidak perlu memasukkan URL atau key lagi.</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            supabaseStatus?.supabase?.connected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {supabaseStatus?.supabase?.connected ? '🟢 Terhubung' : '🔴 Tidak Terhubung'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Storage</div>
            <div className="font-bold text-slate-700 mt-1">{supabaseStatus?.supabase?.storage_engine || 'Supabase PostgreSQL'}</div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Outlet</div>
            <div className="font-bold text-slate-700 mt-1">{form.name || 'Outlet aktif'}</div>
          </div>
        </div>

        {supabaseStatus?.supabase?.error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {supabaseStatus.supabase.error}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-400">Data Owner dan Cashier tersimpan langsung di PostgreSQL outlet yang sedang aktif.</span>
          <button
            type="button"
            onClick={refreshDatabaseStatus}
            disabled={isRefreshingDb}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDb ? 'animate-spin' : ''}`} />
            {isRefreshingDb ? 'Memeriksa...' : 'Periksa Koneksi'}
          </button>
        </div>
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
