import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/common/LoadingState';
import { StatCard } from '../../components/common/StatCard';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import {
  exportExecutiveReportXLSX,
  exportExecutiveReportCSV,
  printFormattedReport,
} from '../../utils/exportReport';
import { ExecutiveReportView } from '../../components/reports/ExecutiveReportView';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Wallet,
  Eye,
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';

export const OwnerReportsPage: React.FC = () => {
  const { business } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>('today');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
  const [orderType, setOrderType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'executive' | 'overview' | 'transactions'>('executive');

  // Supabase connection state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isConnectingSupabase, setIsConnectingSupabase] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [supabaseFeedback, setSupabaseFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      const [res, dbStatus] = await Promise.all([
        api.owner.getReports(params),
        api.database.getStatus().catch(() => null),
      ]);
      setReport(res);
      setSupabaseStatus(dbStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, paymentMethod, orderType, startDate, endDate]);

  if (isLoading && !report) return <LoadingState message="Menghitung laporan bisnis & penjualan..." />;

  const { summary, best_sellers = [], payment_stats = {}, expense_by_category = {}, transactions = [] } =
    report || {
      summary: {},
      best_sellers: [],
      payment_stats: {},
      expense_by_category: {},
      transactions: [],
    };

  const filteredTransactions = transactions.filter((t: any) => {
    const q = searchQuery.toLowerCase();
    return (
      t.invoice_number?.toLowerCase().includes(q) ||
      t.customer_name?.toLowerCase().includes(q) ||
      t.cashier_name?.toLowerCase().includes(q)
    );
  });

  const handleExportXLSX = () => {
    exportExecutiveReportXLSX(
      `Laporan-Bisnis-Rahaya-${new Date().toISOString().slice(0, 10)}`,
      business?.name || 'RAHAYA COFFEE SHOP',
      `Periode ${period.toUpperCase()}`,
      filteredTransactions,
      summary
    );
  };

  const handleExportCSV = () => {
    exportExecutiveReportCSV(
      `Laporan-Bisnis-Rahaya-${new Date().toISOString().slice(0, 10)}`,
      business?.name || 'RAHAYA COFFEE SHOP',
      `Periode ${period.toUpperCase()}`,
      filteredTransactions,
      summary
    );
  };

  const handlePrint = () => {
    printFormattedReport(
      `Laporan Keuangan & Penjualan`,
      business?.name || 'RAHAYA COFFEE SHOP',
      `Periode: ${period.toUpperCase()} • Metode: ${paymentMethod} • Tipe: ${orderType}`,
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

  const handleConfigureSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) return;
    setIsConnectingSupabase(true);
    setSupabaseFeedback(null);
    try {
      const res = await api.database.configure({
        supabase_url: supabaseUrl.trim(),
        supabase_key: supabaseKey.trim(),
      });
      setSupabaseFeedback({
        type: 'success',
        message: `${res.message} ${res.test_result?.message || ''}`,
      });
      const updatedStatus = await api.database.getStatus();
      setSupabaseStatus(updatedStatus);
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: err.message || 'Gagal menyambungkan ke Supabase.',
      });
    } finally {
      setIsConnectingSupabase(false);
    }
  };

  const handleSyncAllSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseFeedback(null);
    try {
      const res = await api.database.syncAll();
      setSupabaseFeedback({
        type: 'success',
        message: res.message || 'Seluruh data berhasil disinkronisasi ke Supabase PostgreSQL online!',
      });
    } catch (err: any) {
      setSupabaseFeedback({
        type: 'error',
        message: err.message || 'Gagal sinkronisasi data ke Supabase.',
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Laporan Keuangan & Eksekutif Bisnis
            </h2>
            {/* Supabase status badge */}
            <button
              onClick={() => setShowSupabaseModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                supabaseStatus?.supabase_configured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>
                {supabaseStatus?.supabase_configured
                  ? 'Supabase PostgreSQL: Terhubung'
                  : 'Koneksikan ke Supabase'}
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis penjualan eksekutif, laba rugi, HPP, pengeluaran, dan ekspor multi-format (Excel & CSV)
          </p>
        </div>

        {/* Export & Print actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportXLSX}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Download file Excel (.xlsx) format eksekutif sesuai referensi"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (.XLSX)</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Download file CSV (.csv) format eksekutif"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh CSV (.CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            title="Cetak Laporan Penjualan"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* 3 Clear Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setViewMode('executive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'executive'
              ? 'bg-[#005f56] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <span>📊 Laporan Eksekutif (Format Foto Referensi)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'overview'
              ? 'bg-[#005f56] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <span>📈 Analisis Finansial & Operasional</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'transactions'
              ? 'bg-[#005f56] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <span>📋 Buku Transaksi Kasir & Struk</span>
        </button>
      </div>

      {/* VIEW 1: EXECUTIVE REPORT VIEW (Matching Photo 1.jpeg Exactly) */}
      {viewMode === 'executive' && (
        <ExecutiveReportView
          businessName={business?.name || 'RAHAYA COFFEE SHOP'}
          periodLabel={`Periode: ${period.toUpperCase()}${period === 'custom' ? ` (${startDate} s/d ${endDate})` : ''}`}
          transactions={filteredTransactions}
          summary={summary}
        />
      )}

      {/* VIEW 2: FINANCIAL & OPERATIONAL ANALYTICS */}
      {viewMode === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 4 Financial Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Omzet Kotor"
              value={`Rp ${(summary.total_revenue || 0).toLocaleString('id-ID')}`}
              subValue={`Dari ${summary.total_orders || 0} transaksi berhasil`}
              icon={DollarSign}
              variant="accent"
            />
            <StatCard
              title="Estimasi Laba Bersih"
              value={`Rp ${(summary.net_profit || 0).toLocaleString('id-ID')}`}
              subValue="Omzet - HPP - Biaya Operasional"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Total HPP (Modal Pokok)"
              value={`Rp ${(summary.total_hpp || 0).toLocaleString('id-ID')}`}
              subValue="Biaya modal bahan baku produk"
              icon={ShoppingBag}
              variant="default"
            />
            <StatCard
              title="Biaya Operasional"
              value={`Rp ${(summary.total_expenses || 0).toLocaleString('id-ID')}`}
              subValue="Total pengeluaran outlet tercatat"
              icon={Wallet}
              variant="warning"
            />
          </div>

          {/* Profit Breakdown Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Struktur Finansial Omzet vs HPP vs Laba Bersih</span>
              <span className="text-xs text-emerald-700 font-extrabold">
                Margin Bersih: {summary.total_revenue > 0 ? ((summary.net_profit / summary.total_revenue) * 100).toFixed(1) : 0}%
              </span>
            </h3>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${summary.total_revenue > 0 ? Math.min(100, (summary.total_hpp / summary.total_revenue) * 100) : 0}%`,
                }}
                className="bg-amber-500 h-full"
                title={`HPP: Rp ${(summary.total_hpp || 0).toLocaleString('id-ID')}`}
              />
              <div
                style={{
                  width: `${summary.total_revenue > 0 ? Math.min(100, (summary.total_expenses / summary.total_revenue) * 100) : 0}%`,
                }}
                className="bg-rose-500 h-full"
                title={`Pengeluaran: Rp ${(summary.total_expenses || 0).toLocaleString('id-ID')}`}
              />
              <div
                style={{
                  width: `${summary.total_revenue > 0 ? Math.min(100, Math.max(0, (summary.net_profit / summary.total_revenue) * 100)) : 0}%`,
                }}
                className="bg-emerald-600 h-full"
                title={`Laba Bersih: Rp ${(summary.net_profit || 0).toLocaleString('id-ID')}`}
              />
            </div>
            <div className="flex items-center gap-6 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-slate-600 font-medium">HPP Produk (Modal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 font-medium">Biaya Operasional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-900 font-bold">Laba Bersih Outlet</span>
              </div>
            </div>
          </div>

          {/* Middle Split: Payment Stats & Expense by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-800" />
                  <span>Distribusi Metode Pembayaran</span>
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                {Object.keys(payment_stats).length === 0 ? (
                  <p className="text-slate-400 py-3 text-center">Belum ada transaksi.</p>
                ) : (
                  Object.entries(payment_stats).map(([method, amount]: [string, any]) => {
                    const total = summary.total_revenue || 1;
                    const percentage = Math.round((amount / total) * 100);
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800">{method}</span>
                          <span className="font-bold text-slate-900">
                            Rp {amount.toLocaleString('id-ID')}{' '}
                            <span className="text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-800 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Expense by Category */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Alokasi Pengeluaran Outlet</span>
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                {Object.keys(expense_by_category).length === 0 ? (
                  <p className="text-slate-400 py-3 text-center">Belum ada pengeluaran dicatat.</p>
                ) : (
                  Object.entries(expense_by_category).map(([cat, amount]: [string, any]) => {
                    const totalExp = summary.total_expenses || 1;
                    const percentage = Math.round((amount / totalExp) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800">{cat}</span>
                          <span className="font-bold text-slate-900">
                            Rp {amount.toLocaleString('id-ID')}{' '}
                            <span className="text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TRANSACTIONS BOOK & FILTERS */}
      {viewMode === 'transactions' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar */}
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
                  <option value="TRANSFER">Transfer Bank</option>
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
                  placeholder="Cari invoice, pelanggan, kasir..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-800 focus:outline-hidden"
                />
              </div>
              <span className="text-xs text-slate-400">
                Ditemukan {filteredTransactions.length} transaksi
              </span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Invoice & Waktu</th>
                    <th className="py-3 px-4">Kasir</th>
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
                      <td colSpan={7} className="py-8 text-center text-slate-400">
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
                        <td className="py-3 px-4 text-slate-700 font-medium">{tx.cashier_name}</td>
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
                        <td className="py-3 px-4 font-black text-teal-950">
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
        </div>
      )}

      {/* Supabase Connection Quick Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Koneksi Database Supabase PostgreSQL</h3>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="p-1 rounded-lg hover:bg-teal-800 text-teal-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Saat Ini</span>
                  <span className="font-bold text-slate-900">
                    {supabaseStatus?.supabase_configured
                      ? '🟢 Terhubung ke Supabase PostgreSQL Online'
                      : '🟡 Belum Terhubung'}
                  </span>
                </div>
                {supabaseStatus?.supabase_configured && (
                  <button
                    type="button"
                    onClick={handleSyncAllSupabase}
                    disabled={isSyncingSupabase}
                    className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    {isSyncingSupabase ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Menyinkronkan...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Sinkronkan Sekarang</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {supabaseFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    supabaseFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {supabaseFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{supabaseFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleConfigureSupabase} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Supabase Anon / Public Key (Hanya Anon Key)
                  </label>
                  <input
                    type="password"
                    required
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    🔒 Keamanan terjamin: Hanya kunci Public/Anon yang digunakan. Kunci service_role tidak pernah diminta atau disimpan.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSupabaseModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isConnectingSupabase}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isConnectingSupabase ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyambungkan...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Simpan & Sambungkan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
