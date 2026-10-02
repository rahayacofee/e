import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { OpenShiftModal } from '../../components/shift/OpenShiftModal';
import { CloseShiftModal } from '../../components/shift/CloseShiftModal';
import { LoadingState } from '../../components/common/LoadingState';
import { Clock, DollarSign, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';

export const CashierShiftPage: React.FC = () => {
  const { user, business, activeShift, setActiveShift } = useAuth();
  const [shiftData, setShiftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchShift = async () => {
    setIsLoading(true);
    try {
      const res = await api.cashier.getCurrentShift();
      setShiftData(res.shift);
      setActiveShift(res.shift);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, []);

  if (isLoading) return <LoadingState message="Memeriksa status shift kasir..." />;

  return (
    <div className="space-y-6 max-w-2xl select-none">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Sesi Kerja & Shift Kasir</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola modal laci kasir (starting cash), catat jam kerja, dan lakukan tutup shift harian
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {shiftData ? (
        /* Active Shift Card */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Shift Aktif
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Bertugas: {shiftData.cashier_name}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">Waktu Buka</span>
              <p className="text-xs font-bold text-slate-800">
                {new Date(shiftData.opened_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          {/* Shift Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Modal Awal Laci</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                Rp {shiftData.starting_cash.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Penjualan Shift Ini</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                Rp {shiftData.total_sales_amount.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-slate-500">{shiftData.total_transactions} pesanan</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80">
              <span className="text-[10px] uppercase font-bold text-blue-800">Uang Kas Sistem</span>
              <p className="text-base font-black text-blue-950 mt-0.5">
                Rp {shiftData.expected_cash.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-blue-700">Modal + Penjualan Tunai</span>
            </div>
          </div>

          {shiftData.notes && (
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
              <strong>Catatan Awal:</strong> {shiftData.notes}
            </div>
          )}

          {/* Action to Close Shift */}
          <div className="pt-2">
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Tutup Shift & Hitung Uang Laci Kasir</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Shift Card */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Belum Ada Shift Terbuka</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan input modal awal kasir untuk mulai bertugas melayani pesanan di kasir POS.
            </p>
          </div>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* Modals */}
      {showOpenModal && (
        <OpenShiftModal
          isOpen={true}
          onClose={() => setShowOpenModal(false)}
          onSuccess={(s) => {
            setShiftData(s);
            setActiveShift(s);
            setShowOpenModal(false);
            setNotice('Shift berhasil dibuka! Selamat bertugas.');
            setTimeout(() => setNotice(null), 3000);
          }}
        />
      )}

      {showCloseModal && shiftData && (
        <CloseShiftModal
          isOpen={true}
          onClose={() => setShowCloseModal(false)}
          onSuccess={(s) => {
            setShiftData(null);
            setActiveShift(null);
            setShowCloseModal(false);
            setNotice('Shift kasir berhasil ditutup dan direkonsiliasi.');
            setTimeout(() => setNotice(null), 3000);
          }}
        />
      )}
    </div>
  );
};
