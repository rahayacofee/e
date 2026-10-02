import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shift } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export const OwnerShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getShifts();
      setShifts(res.shifts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  return (
    <div className="space-y-5 select-none">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Shift Kasir</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Rekap modal awal, omzet per sesi kasir, dan selisih uang fisik laci (cash audit)
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Memuat riwayat shift..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kasir & ID Shift</th>
                  <th className="py-3 px-4">Waktu Buka / Tutup</th>
                  <th className="py-3 px-4">Modal Awal</th>
                  <th className="py-3 px-4">Penjualan Kasir</th>
                  <th className="py-3 px-4">Uang Sistem</th>
                  <th className="py-3 px-4">Uang Fisik</th>
                  <th className="py-3 px-4">Selisih</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada riwayat shift kasir.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.cashier_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">#{s.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          Buka:{' '}
                          {new Date(s.opened_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {s.closed_at ? (
                          <div className="text-[10px] text-slate-400">
                            Tutup:{' '}
                            {new Date(s.closed_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-semibold">Sedang berjalan</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        Rp {s.starting_cash.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.total_transactions} Trx (Rp {s.total_sales_amount.toLocaleString('id-ID')})
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-950">
                        Rp {s.expected_cash.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {s.actual_cash !== null ? `Rp ${s.actual_cash.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {s.cash_difference !== null ? (
                          <span
                            className={`font-bold text-[11px] ${
                              s.cash_difference === 0
                                ? 'text-emerald-700'
                                : s.cash_difference > 0
                                ? 'text-blue-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {s.cash_difference === 0
                              ? 'Pas (0)'
                              : s.cash_difference > 0
                              ? `+Rp ${s.cash_difference.toLocaleString('id-ID')}`
                              : `-Rp ${Math.abs(s.cash_difference).toLocaleString('id-ID')}`}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            s.status === 'OPEN' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {s.status === 'OPEN' ? 'Buka' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
