import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import { StatCard } from '../../components/common/StatCard';
import { KasminiHeader } from '../../components/layout/KasminiHeader';
import { ProfileOutletCard } from '../../components/layout/ProfileOutletCard';
import { FeatureGrid } from '../../components/layout/FeatureGrid';
import { SupplierModal } from '../../components/common/SupplierModal';
import { TableReservationModal } from '../../components/common/TableReservationModal';
import { PromoWholesaleModal } from '../../components/common/PromoWholesaleModal';
import { CustomerModal } from '../../components/common/CustomerModal';
import { BluetoothPrinterModal } from '../../components/pos/BluetoothPrinterModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Receipt,
  Eye,
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigate: (tab: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals for the 12 squircle features
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false);
  const [showWholesaleModal, setShowWholesaleModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showPrinterModal, setShowPrinterModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) return <LoadingState message="Memuat Dashboard Rahaya Coffee..." />;

  const { metrics, business, top_selling, low_stock_items, recent_transactions, payment_breakdown } =
    data || {
      metrics: {},
      business: {},
      top_selling: [],
      low_stock_items: [],
      recent_transactions: [],
      payment_breakdown: {},
    };

  const dailySales = metrics?.today_revenue || 0;
  const dailyProfit = metrics?.today_net_profit || 0;

  const handleViewReceipt = (tx: any) => {
    setSelectedReceipt({
      business: {
        name: business?.name || 'Rahaya Coffee',
        address: business?.address || '',
        phone: business?.phone || '',
        header: business?.receipt_header || '',
        footer: business?.receipt_footer || '',
      },
      transaction: {
        id: tx.id,
        invoice_number: tx.invoice_number,
        date: tx.created_at,
        cashier: tx.cashier_name,
        customer: tx.customer_name,
        order_type: tx.order_type,
        table_number: tx.table_number,
        items: tx.items,
        subtotal: tx.subtotal,
        discount_amount: tx.discount_amount,
        tax_amount: tx.tax_amount,
        service_amount: tx.service_amount,
        total_amount: tx.total_amount,
        payment_method: tx.payment_method,
        amount_paid: tx.amount_paid,
        change_amount: tx.change_amount,
      },
    });
  };

  return (
    <div className="space-y-4 select-none pb-12">
      {/* 1. Header Banner strictly matching reference image: Deep Teal with Daily Sales & Profit */}
      <KasminiHeader
        dailySales={dailySales}
        dailyProfit={dailyProfit}
        onOpenPrinterModal={() => setShowPrinterModal(true)}
      />

      {/* 2. User & Outlet Card matching reference layout */}
      <ProfileOutletCard
        onEditOutlet={() => onNavigate('settings')}
      />

      {/* 3. 12 Squircle Features Grid matching the reference layout + Big Transaksi Button */}
      <div className="pt-1">
        <FeatureGrid
          onNavigate={onNavigate}
          onOpenPOS={() => onNavigate('pos')}
          onOpenSupplierModal={() => setShowSupplierModal(true)}
          onOpenReservationModal={() => setShowReservationModal(true)}
          onOpenWholesaleModal={() => setShowWholesaleModal(true)}
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onOpenPrinterModal={() => setShowPrinterModal(true)}
          lowStockCount={metrics?.low_stock_count || 0}
          todayTxCount={metrics?.today_orders || 0}
        />
      </div>

      {/* 4. Active Shift Quick Banner */}
      {metrics?.active_shift ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Shift Sedang Berjalan:</strong> Kasir{' '}
              <strong>{metrics.active_shift.cashier_name}</strong> (Mulai jam{' '}
              {new Date(metrics.active_shift.opened_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              )
            </span>
          </div>
          <button
            onClick={() => onNavigate('shifts')}
            className="font-bold text-emerald-800 hover:underline"
          >
            Lihat Shift
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
          <span>Belum ada shift kasir yang aktif saat ini.</span>
          <button
            onClick={() => onNavigate('shifts')}
            className="font-bold text-teal-800 hover:underline"
          >
            Buka Shift Baru
          </button>
        </div>
      )}

      {/* 5. Quick KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <StatCard
          title="Omzet Hari Ini"
          value={`Rp ${(dailySales).toLocaleString('id-ID')}`}
          subValue="Total bruto"
          icon={DollarSign}
          variant="accent"
        />
        <StatCard
          title="Pesanan Selesai"
          value={`${metrics?.today_orders || 0} Trx`}
          subValue="Hari ini"
          icon={ShoppingBag}
          variant="default"
        />
        <StatCard
          title="Laba Bersih"
          value={`Rp ${(dailyProfit).toLocaleString('id-ID')}`}
          subValue="Omzet - HPP - Biaya"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Stok Kritis"
          value={`${metrics?.low_stock_count || 0} Menu`}
          subValue="Perlu restock"
          icon={AlertTriangle}
          variant={metrics?.low_stock_count > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* 6. Middle Split: Top Selling & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* Top Selling */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Menu Kopi Terlaris Hari Ini
              </h3>
              <p className="text-[11px] text-slate-400">Paling banyak dipesan</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-teal-700 font-bold hover:underline"
            >
              Laporan Lengkap
            </button>
          </div>
          <div className="space-y-2.5">
            {top_selling.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada penjualan hari ini.</p>
            ) : (
              top_selling.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{item.name || item.product_name || "Menu"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-teal-950">{item.quantity} cup</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      (Rp {Number(item.revenue ?? item.total ?? 0).toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Peringatan Stok Kritis
              </h3>
              <p className="text-[11px] text-slate-400">Mendekati batas minimal</p>
            </div>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs text-teal-700 font-bold hover:underline"
            >
              Kelola Stok
            </button>
          </div>
          <div className="space-y-2">
            {low_stock_items.length === 0 ? (
              <div className="py-4 text-center text-xs text-emerald-700 font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Semua stok aman di atas batas minimal.</span>
              </div>
            ) : (
              low_stock_items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900">{item.product_name}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600">
                      Sisa: {item.current_stock} {item.unit}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Min: {item.min_stock_alert}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. Recent Transactions List with Reprint thermal receipt */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Transaksi Terkini
            </h3>
            <p className="text-[11px] text-slate-400">Riwayat struk yang baru terjadi</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-teal-700 font-bold hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Invoice</th>
                <th className="py-2.5 px-4">Pelanggan</th>
                <th className="py-2.5 px-4">Kasir</th>
                <th className="py-2.5 px-4">Metode</th>
                <th className="py-2.5 px-4">Total</th>
                <th className="py-2.5 px-4 text-right">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_transactions.slice(0, 5).map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {tx.invoice_number}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-slate-800">{tx.customer_name}</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({tx.table_number || tx.order_type})
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{tx.cashier_name}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px]">
                      {tx.payment_method}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-black text-teal-950">
                    Rp {tx.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleViewReceipt(tx)}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Struk</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals triggered from FeatureGrid or Dashboard */}
      {showSupplierModal && (
        <SupplierModal
          isOpen={true}
          onClose={() => setShowSupplierModal(false)}
        />
      )}

      {showReservationModal && (
        <TableReservationModal
          isOpen={true}
          onClose={() => setShowReservationModal(false)}
          onSelectTableForPOS={(tableNum) => {
            onNavigate('pos');
          }}
        />
      )}

      {showWholesaleModal && (
        <PromoWholesaleModal
          isOpen={true}
          onClose={() => setShowWholesaleModal(false)}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          isOpen={true}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {showPrinterModal && (
        <BluetoothPrinterModal
          isOpen={true}
          onClose={() => setShowPrinterModal(false)}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          isOpen={true}
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onNewOrder={() => setSelectedReceipt(null)}
          isReprint={true}
        />
      )}
    </div>
  );
};
