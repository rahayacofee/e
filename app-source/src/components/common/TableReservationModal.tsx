import React, { useState } from 'react';
import { Calendar, Users, Clock, Plus, X, CheckCircle2 } from 'lucide-react';

interface TableReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTableForPOS?: (tableNumber: string) => void;
}

export const TableReservationModal: React.FC<TableReservationModalProps> = ({
  isOpen,
  onClose,
  onSelectTableForPOS,
}) => {
  const [tables, setTables] = useState([
    { number: 'Meja 01', capacity: 2, status: 'AVAILABLE', customer: null },
    { number: 'Meja 02', capacity: 4, status: 'OCCUPIED', customer: 'Budi Santoso' },
    { number: 'Meja 03', capacity: 4, status: 'AVAILABLE', customer: null },
    { number: 'Meja 04', capacity: 6, status: 'RESERVED', customer: 'Rina (19:00)' },
    { number: 'Meja 05', capacity: 2, status: 'AVAILABLE', customer: null },
    { number: 'Meja 06', capacity: 4, status: 'AVAILABLE', customer: null },
    { number: 'Meja 07', capacity: 8, status: 'AVAILABLE', customer: null },
    { number: 'Meja 08', capacity: 4, status: 'AVAILABLE', customer: null },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Meja & Reservasi Dine-in</h3>
              <p className="text-[10px] text-teal-200">Denah meja & status pemesanan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-teal-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Denah Meja Outlet:</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Kosong
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Terisi
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Dipesan
              </span>
            </div>
          </div>

          {/* Grid of Tables */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tables.map((tbl) => (
              <div
                key={tbl.number}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  tbl.status === 'AVAILABLE'
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer'
                    : tbl.status === 'OCCUPIED'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
                onClick={() => {
                  if (onSelectTableForPOS && tbl.status === 'AVAILABLE') {
                    onSelectTableForPOS(tbl.number);
                    onClose();
                  }
                }}
              >
                <div className="font-black text-sm text-slate-800">{tbl.number}</div>
                <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" />
                  <span>Kapasitas {tbl.capacity}</span>
                </div>
                <div className="mt-2 text-[10px] font-bold">
                  {tbl.status === 'AVAILABLE' ? (
                    <span className="text-emerald-700">Tersedia</span>
                  ) : tbl.status === 'OCCUPIED' ? (
                    <span className="text-rose-700">{tbl.customer || 'Terisi'}</span>
                  ) : (
                    <span className="text-amber-700">{tbl.customer || 'Reservasi'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600">
            <strong>Info Dine-in:</strong> Klik meja kosong untuk langsung menghubungkannya ke transaksi POS kasir.
          </div>
        </div>
      </div>
    </div>
  );
};
