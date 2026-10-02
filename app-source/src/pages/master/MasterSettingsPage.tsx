import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Database,
  CheckCircle2,
  Copy,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Server,
  FileCode,
  UploadCloud,
  Check,
  AlertCircle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export const MasterSettingsPage: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Supabase form
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const [statusRes, sqlRes, logsRes] = await Promise.all([
        api.master.getDatabaseStatus(),
        api.database.getSchemaSql(),
        api.master.getAuditLogs(),
      ]);
      setDbStatus(statusRes);
      setSchemaSql(sqlRes);
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setStatusFeedback(null);
    try {
      const test = await api.database.test();
      if (test.connected) {
        setStatusFeedback({ type: 'success', message: test.message });
      } else {
        setStatusFeedback({ type: 'error', message: test.message });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Koneksi gagal' });
    }
  };

  const handleConfigureSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) return;
    setIsConfiguring(true);
    setStatusFeedback(null);
    try {
      const res = await api.database.configure({
        supabase_url: supabaseUrl.trim(),
        supabase_key: supabaseKey.trim(),
      });
      setStatusFeedback({
        type: 'success',
        message: `${res.message} ${res.test_result?.message || ''}`,
      });
      fetchStatus();
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Gagal menyimpan konfigurasi Supabase' });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setStatusFeedback(null);
    try {
      const res = await api.database.syncAll();
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: `${res.message} (${JSON.stringify(res.counts)})`,
        });
      } else {
        setStatusFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setStatusFeedback({ type: 'error', message: err.message || 'Gagal sinkronisasi data' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <LoadingState message="Memeriksa status sistem & database..." />;

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Sistem Database & Supabase PostgreSQL
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fondasi database online multi-tenant, skema SQL, dan audit log keamanan
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {statusFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{statusFeedback.message}</span>
        </div>
      )}

      {/* Database Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase PostgreSQL Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Online</h3>
                <p className="text-[11px] text-slate-400">Database Relasional Cloud Production</p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                dbStatus?.supabase?.connected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {dbStatus?.supabase?.connected ? 'Terhubung Online' : 'Tidak Terhubung'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Frontend hanya menggunakan <strong>Supabase Publishable / Public Key</strong>. Akses database PostgreSQL dilakukan aman melalui Edge Function server-side; secret key tidak pernah dikirim ke browser.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] font-mono space-y-1">
            <div className="text-slate-500">
              SUPABASE_URL:{' '}
              <span className="text-slate-900 font-bold">
                {dbStatus?.supabase?.url || 'Belum diisi via env'}
              </span>
            </div>
            <div className="text-slate-500">
              Isolasi Multi-Tenant:{' '}
              <span className="text-emerald-700 font-bold">Aktif (tenant_id validation)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all active:scale-95"
            >
              Uji Koneksi Supabase
            </button>
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-[#005f56] hover:bg-[#004d40] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Data'}</span>
            </button>
          </div>
        </div>

        {/* Local Persistent Storage Engine */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mesin ACID Cache Server</h3>
                <p className="text-[11px] text-slate-400">Atomic disk engine for zero downtime</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Aktif & Persisten
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Data tersimpan persisten secara atomic pada server, menjaga seluruh akun,
            transaksi, struk, dan pergerakan stok aman dari restart server maupun kegagalan jaringan kasir.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] space-y-1">
            <span className="font-bold text-slate-700 block">Tabel Database Terdaftar:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {dbStatus?.tables?.map((table: string) => (
                <span
                  key={table}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-[10px] text-slate-600 font-semibold"
                >
                  {table}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Supabase URL & Anon Key live configuration form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <KeyRound className="w-4 h-4 text-teal-800" />
          <h3 className="text-sm font-bold text-slate-900">
            Konfigurasi Supabase Project (Anon / Public Key Only)
          </h3>
        </div>
        <form onSubmit={handleConfigureSupabase} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Supabase Project URL *
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzprojectid.supabase.co"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Supabase Anon / Public Key *
              </label>
              <input
                type="password"
                required
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              * Keamanan: Hanya gunakan Anon/Public Key. Jangan pernah memasukkan service_role key.
            </span>
            <button
              type="submit"
              disabled={isConfiguring}
              className="px-5 py-2.5 bg-[#005f56] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isConfiguring ? 'Menghubungkan...' : 'Simpan & Aktifkan Supabase'}
            </button>
          </div>
        </form>
      </div>

      {/* SQL Script for Supabase Migration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-teal-800" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Skema SQL Produksi untuk Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Salin skrip ini dan jalankan di SQL Editor Supabase untuk sinkronisasi tabel langsung
              </p>
            </div>
          </div>
          <button
            onClick={handleCopySql}
            className="px-3.5 py-2 bg-[#005f56] hover:bg-[#004d40] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
          </button>
        </div>
        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64 scrollbar-thin">
          <pre>{schemaSql}</pre>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-slate-900">Audit Log Keamanan Sistem</h3>
          </div>
          <span className="text-xs text-slate-400">100 aktivitas terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-4">Waktu</th>
                <th className="py-2.5 px-4">Peran & Aksi</th>
                <th className="py-2.5 px-4">Rincian Aktivitas</th>
                <th className="py-2.5 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 15).map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-slate-800 text-[11px]">{log.action}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-mono">({log.user_role})</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{log.details}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
