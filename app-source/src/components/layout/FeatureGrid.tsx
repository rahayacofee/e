import React from 'react';
import {
  ShoppingBag,
  Package,
  Receipt,
  Truck,
  Boxes,
  Calendar,
  Tag,
  Wallet,
  FileSpreadsheet,
  Users,
  Store,
  CreditCard,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface GridItem {
  id: string;
  title: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  badge?: string | number;
  roles: Array<'MASTER' | 'OWNER' | 'CASHIER'>;
  action: () => void;
}

interface FeatureGridProps {
  onNavigate: (tabId: string) => void;
  onOpenPOS: () => void;
  onOpenSupplierModal?: () => void;
  onOpenReservationModal?: () => void;
  onOpenWholesaleModal?: () => void;
  onOpenCustomerModal?: () => void;
  onOpenPrinterModal?: () => void;
  lowStockCount?: number;
  todayTxCount?: number;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onNavigate,
  onOpenPOS,
  onOpenSupplierModal,
  onOpenReservationModal,
  onOpenWholesaleModal,
  onOpenCustomerModal,
  onOpenPrinterModal,
  lowStockCount = 0,
  todayTxCount = 0,
}) => {
  const { user } = useAuth();

  // Reference image 12 squircle items
  const items: GridItem[] = [
    {
      id: 'products',
      title: 'F&B Produk',
      icon: Coffee,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => onNavigate('products'),
    },
    {
      id: 'ingredients',
      title: 'Bahan Baku',
      icon: Package,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      roles: ['OWNER'],
      action: () => onNavigate('stock'),
    },
    {
      id: 'history',
      title: 'Riwayat',
      icon: Receipt,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      badge: todayTxCount > 0 ? todayTxCount : undefined,
      roles: ['OWNER', 'CASHIER'],
      action: () => onNavigate('transactions'),
    },
    {
      id: 'supplier',
      title: 'Supplier',
      icon: Truck,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      roles: ['OWNER'],
      action: () => onOpenSupplierModal ? onOpenSupplierModal() : onNavigate('stock'),
    },
    {
      id: 'stock',
      title: 'Stok',
      icon: Boxes,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: lowStockCount > 0 ? '!' : undefined,
      roles: ['OWNER'],
      action: () => onNavigate('stock'),
    },
    {
      id: 'reservation',
      title: 'Reservasi',
      icon: Calendar,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => onOpenReservationModal ? onOpenReservationModal() : onNavigate('pos'),
    },
    {
      id: 'wholesale',
      title: 'Harga Grosir',
      icon: Tag,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      roles: ['OWNER'],
      action: () => onOpenWholesaleModal ? onOpenWholesaleModal() : onNavigate('products'),
    },
    {
      id: 'expenses',
      title: 'Pengeluaran',
      icon: Wallet,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      roles: ['OWNER'],
      action: () => onNavigate('expenses'),
    },
    {
      id: 'reports',
      title: 'Laporan',
      icon: FileSpreadsheet,
      iconColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => onNavigate('reports'),
    },
    {
      id: 'customers',
      title: 'Pelanggan',
      icon: Users,
      iconColor: 'text-teal-700',
      bgColor: 'bg-teal-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => onOpenCustomerModal ? onOpenCustomerModal() : onNavigate('pos'),
    },
    {
      id: 'cashiers',
      title: 'Kasir',
      icon: Store,
      iconColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => (user?.role === 'CASHIER' ? onNavigate('shift') : onNavigate('cashiers')),
    },
    {
      id: 'payment_methods',
      title: 'Metode Bayar',
      icon: CreditCard,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      roles: ['OWNER', 'CASHIER'],
      action: () => (onOpenPrinterModal ? onOpenPrinterModal() : onNavigate('settings')),
    },
  ];

  // Filter items permissible for current user role
  const allowedItems = items.filter((item) =>
    user?.role ? item.roles.includes(user.role as any) : true
  );

  return (
    <div className="space-y-4 select-none pb-24 md:pb-4">
      {/* 3-Column Mobile Squircle Grid (expanding to 4-6 on tablet/desktop) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all active:scale-95 flex flex-col items-center justify-center text-center relative group"
            >
              {/* Badge if present */}
              {item.badge !== undefined && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
              {/* Icon Container with soft background */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bgColor} ${item.iconColor} flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              {/* Title */}
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight leading-tight line-clamp-1">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Big Prominent Floating Bottom Action Button: Transaksi (Kasir POS) */}
      <div className="pt-2">
        <button
          onClick={onOpenPOS}
          className="w-full py-4 px-6 rounded-2xl bg-[#00695c] hover:bg-[#005f56] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-teal-900/20 active:scale-98 transition-all"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <span className="tracking-wide">Buka Kasir & Transaksi POS</span>
        </button>
      </div>
    </div>
  );
};
