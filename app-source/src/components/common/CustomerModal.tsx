import React, { useState } from 'react';
import { Users, Plus, X, Phone, Star, ShoppingBag } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomerForPOS?: (name: string) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomerForPOS,
}) => {
  const [customers, setCustomers] = useState([
    {
      id: 'cust-1',
      name: 'Budi Santoso',
      phone: '+62 812-9876-5432',
      orders_count: 14,
      total_spent: 420000,
      member_tier: 'Gold Member',
    },
    {
      id: 'cust-2',
      name: 'Rina Wijaya',
      phone: '+62 856-7890-1234',
      orders_count: 8,
      total_spent: 215000,
      member_tier: 'Silver Member',
    },
    {
      id: 'cust-3',
      name: 'Dimas Kurniawan',
      phone: '+62 878-1122-3344',
      orders_count: 22,
      total_spent: 680000,
      member_tier: 'Platinum Member',
    },
    {
      id: 'cust-4',
      name: 'Pelanggan Walk-In',
      phone: '-',
      orders_count: 150,
      total_spent: 3800000,
      member_tier: 'Regular',
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
              <Users className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Database Pelanggan</h3>
              <p className="text-[10px] text-teal-200">Riwayat & loyalitas member Rahaya Coffee</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-teal-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {customers.map((c) => (
            <div
              key={c.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-teal-300 cursor-pointer transition-colors"
              onClick={() => {
                if (onSelectCustomerForPOS) {
                  onSelectCustomerForPOS(c.name);
                  onClose();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs">{c.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 font-bold text-[10px]">
                  {c.member_tier}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {c.phone}
                </span>
                <span>{c.orders_count} Pesanan • Total Rp {c.total_spent.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600">
            Klik nama pelanggan untuk langsung menggunakannya pada pesanan aktif POS.
          </div>
        </div>
      </div>
    </div>
  );
};
