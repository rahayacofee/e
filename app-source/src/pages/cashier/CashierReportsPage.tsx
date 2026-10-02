import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { StatCard } from '../../components/common/StatCard';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import {
  exportTransactionsToCSV,
  printFormattedReport,
} from '../../utils/exportReport';
import {
  FileText,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Eye,
  Search,
} from 'lucide-react';

export const CashierReportsPage: React.FC = () => {
  const { user, business } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('today');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
  const [orderType, setOrderType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        period,
        payment_method: paymentMethod,
        order_type: orderType,
      };
      if (period === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.cashier.getReports(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, paymentMethod, orderType, startDate, endDate]);

  const summary = data?.summary || { total_sales: 0, total_orders: 0, average_order_value: 0 };
  const transactions: any[] = data?.transactions || [];

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.invoice_number?.toLowerCase().includes(q) ||
      t.customer_name?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    exportTransactionsToCSV(
      `Laporan-Shift-Kasir-${user?.username}-${new Date().toISOString().slice(0, 10)}`,
      filteredTransactions
    );
  };

  const handlePrint = () => {
    printFormattedReport(
      `Laporan Penjualan Kasir (${user?.full_name})`,
      business?.name || 'RAHAYA COFFEE',
      `Periode: ${period.toUpperCase()} • Kasir: ${user?.full_name}`,
      filteredTransactions,
      summary
    );
  };

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

  if (isLoading && !data) return <LoadingState message="Memuat laporan transaksi kasir..." />;

  return (
    <div className="space-y-5 select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Laporan Shift & Transaksi Kasir
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekap transaksi yang Anda tangani selama shift kerja aktif
          </p>
        </div>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Download CSV transaksi shift"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh CSV Shift</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Cetak Ringkasan Shift Kasir"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ringkasan Shift</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Cashier */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          title="Total Penjualan Saya"
          value={`Rp ${(summary.total_sales || 0).toLocaleString('id-ID')}`}
          subValue={`Dari ${summary.total_orders || 0} transaksi berhasil`}
          icon={DollarSign}
          variant="accent"
        />
        <StatCard
          title="Jumlah Pesanan Diproses"
          value={`${summary.total_orders || 0} Trx`}
          subValue="Total tiket pesanan kasir"
          icon={ShoppingBag}
          variant="default"
        />
        <StatCard
          title="Rata-rata Nilai Order"
          value={`Rp ${(summary.average_order_value || 0).toLocaleString('id-ID')}`}
          subValue="Nilai rata-rata per transaksi"
          icon={CreditCard}
          variant="success"
        />
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Period selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Periode:</span>
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: 'this_week', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'custom', label: 'Kustom' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  period === id
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Payment Method filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Metode:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">Cash (Tunai)</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          {/* Order Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Tipe:</span>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="DINE_IN">Dine-in</option>
              <option value="TAKEAWAY">Takeaway</option>
            </select>
          </div>
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">Rentang Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
            />
          </div>
        )}

        {/* Search */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor invoice, pelanggan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-800 focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filteredTransactions.length} transaksi shift ditemukan
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Pelanggan & Meja</th>
                <th className="py-3 px-4">Rincian Item</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-right">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {tx.invoice_number}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{tx.customer_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {tx.table_number || tx.order_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {tx.items?.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[11px] text-slate-800 px-2 py-0.5 rounded-md bg-slate-100">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      Rp {tx.total_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(tx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={true}
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onNewOrder={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
