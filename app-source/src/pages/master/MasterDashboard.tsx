import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import { Users, UserCheck, UserX, Store, ArrowRight, ShieldAlert } from 'lucide-react';

interface MasterDashboardProps {
  onNavigateToOwners: () => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ onNavigateToOwners }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.master.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat dashboard master');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) return <LoadingState message="Memuat Dashboard Master..." />;

  const { summary, recent_owners } = data || { summary: {}, recent_owners: [] };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Dashboard Master Administrator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring akun mitra Owner dan status lisensi tenant Rahaya Coffee
          </p>
        </div>
        <button
          onClick={onNavigateToOwners}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start active:scale-95 transition-all"
        >
          <span>Kelola Semua Owner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Strict Privacy Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-900 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 text-purple-700 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Prinsip Privasi Multi-Tenant:</strong> Sesuai kebijakan
          keamanan, akun Master secara arsitektural tidak memiliki akses ke data operasional bisnis
          (penjualan, transaksi kasir, omzet, resep, atau stok inventaris).
        </div>
      </div>

      {/* Stat Cards - Strictly Owner Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Owner Terdaftar"
          value={summary.total_owners || 0}
          subValue="Semua akun mitra owner"
          icon={Users}
          variant="accent"
        />
        <StatCard
          title="Owner Aktif"
          value={summary.active_owners || 0}
          subValue="Memiliki akses POS & sistem"
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Owner Nonaktif"
          value={summary.inactive_owners || 0}
          subValue="Akses ditangguhkan"
          icon={UserX}
          variant={summary.inactive_owners > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Total Outlet / Bisnis"
          value={summary.total_businesses || 0}
          subValue="Workspace multi-tenant"
          icon={Store}
          variant="default"
        />
      </div>

      {/* Recent Owners Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Owner Terbaru Bergabung</h3>
            <p className="text-xs text-slate-500">Daftar akun mitra owner yang baru saja ditambahkan</p>
          </div>
          <button
            onClick={onNavigateToOwners}
            className="text-xs text-blue-900 font-semibold hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Owner / Username</th>
                <th className="py-3 px-4">Nama Bisnis & Kode</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Daftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_owners.map((owner: any) => (
                <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{owner.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{owner.username}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      {owner.business?.name || 'Tanpa Bisnis'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {owner.business?.code || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{owner.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold text-[11px] ${
                        owner.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          owner.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}
                      />
                      {owner.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(owner.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
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
