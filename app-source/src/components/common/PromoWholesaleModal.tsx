import React, { useState } from 'react';
import { Tag, Plus, X, Percent, CheckCircle2 } from 'lucide-react';

interface PromoWholesaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoWholesaleModal: React.FC<PromoWholesaleModalProps> = ({ isOpen, onClose }) => {
  const [promos, setPromos] = useState([
    {
      id: 'pr-1',
      title: 'Diskon Komunitas Kopi (Member)',
      type: 'PERCENTAGE',
      value: 10,
      description: 'Diskon 10% untuk pelanggan tetap & barista network',
      active: true,
    },
    {
      id: 'pr-2',
      title: 'Paket Kopi + Pastry Hemat',
      type: 'NOMINAL',
      value: 5000,
      description: 'Potongan Rp 5.000 setiap pembelian paket kopi & pastry',
      active: true,
    },
    {
      id: 'pr-3',
      title: 'Harga Grosir Biji Kopi (Min 3 Bag)',
      type: 'PERCENTAGE',
      value: 15,
      description: 'Diskon 15% untuk pembelian kemasan beans 250gr minimal 3 pack',
      active: true,
    },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center">
              <Tag className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Harga Grosir & Promo Menu</h3>
              <p className="text-[10px] text-teal-200">Diskon otomatis & skema pembelian grosir</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-teal-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {promos.map((p) => (
            <div
              key={p.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs">{p.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px]">
                  {p.type === 'PERCENTAGE' ? `${p.value}% OFF` : `-Rp ${p.value.toLocaleString('id-ID')}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{p.description}</p>
            </div>
          ))}

          <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-2xl text-[11px] text-teal-900">
            <strong>Info Kasir:</strong> Diskon nominal dapat dimasukkan langsung saat transaksi kasir di keranjang pemesanan POS.
          </div>
        </div>
      </div>
    </div>
  );
};
