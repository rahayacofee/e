import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shift: any) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeShift, setActiveShift } = useAuth();
  const [actualCash, setActualCash] = useState<number>(activeShift?.expected_cash || 0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activeShift) return null;

  const expected = activeShift.expected_cash || 0;
  const difference = Number(actualCash) - expected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.cashier.closeShift({
        actual_cash: Number(actualCash),
        notes,
      });
      setActiveShift(null);
      onSuccess(res.shift);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tutup Shift Kasir</h3>
              <p className="text-xs text-slate-500">Hitung uang fisik di laci dan rekap penjualan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-slate-500">Kasir:</span>
            <p className="font-bold text-slate-900">{activeShift.cashier_name}</p>
          </div>
          <div>
            <span className="text-slate-500">Waktu Buka:</span>
            <p className="font-bold text-slate-900">
              {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Modal Awal:</span>
            <p className="font-bold text-slate-900">
              Rp {activeShift.starting_cash.toLocaleString('id-ID')}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Total Transaksi:</span>
            <p className="font-bold text-slate-900">
              {activeShift.total_transactions} transaksi (Rp {activeShift.total_sales_amount.toLocaleString('id-ID')})
            </p>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200">
            <span className="text-slate-600 font-medium">Uang Kas Sistem yang Diharapkan:</span>
            <p className="text-lg font-black text-blue-900">
              Rp {expected.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hitungan Uang Fisik Aktual di Laci (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                required
                min={0}
                value={actualCash}
                onChange={(e) => setActualCash(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            {/* Difference breakdown */}
            <div
              className={`mt-2 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                difference === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : difference > 0
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {difference === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Uang Pas Sesuai Sistem (Rp 0)</span>
                </>
              ) : difference > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Selisih Lebih: +Rp {difference.toLocaleString('id-ID')}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Selisih Kurang: -Rp {Math.abs(difference).toLocaleString('id-ID')}</span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penutupan Shift (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kendala atau rincian setor tunai"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isSubmitting ? 'Menutup Shift...' : 'Selesaikan & Tutup Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
