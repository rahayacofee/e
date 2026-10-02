import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Transaction } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const OwnerTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getTransactions();
      const settings = await api.owner.getSettings();
      setTransactions(res.transactions || []);
      setBusinessInfo(settings.business || {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleViewReceipt = (tx: Transaction) => {
    setSelectedReceipt({
      business: {
        name: businessInfo?.name || 'Rahaya Coffee',
        address: businessInfo?.address || '',
        phone: businessInfo?.phone || '',
        header: businessInfo?.receipt_header || '',
        footer: businessInfo?.receipt_footer || '',
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

  const filtered = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tx.invoice_number.toLowerCase().includes(q) ||
      tx.customer_name.toLowerCase().includes(q) ||
      tx.cashier_name.toLowerCase().includes(q);

    const matchesMethod = selectedMethod === 'ALL' || tx.payment_method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const totalFilteredSales = filtered.reduce((sum, tx) => sum + tx.total_amount, 0);

  return (
    <div className="space-y-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Transaksi Penjualan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap transaksi POS, cetak ulang struk, dan rekonsiliasi pembayaran
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Total Filter:</span>{' '}
          <strong className="text-blue-950 font-black">
            Rp {totalFilteredSales.toLocaleString('id-ID')}
          </strong>{' '}
          <span className="text-slate-400">({filtered.length} invoice)</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'CASH', 'QRIS', 'DEBIT', 'TRANSFER'].map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedMethod === method
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {method === 'ALL' ? 'Semua Metode' : method}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice, pelanggan, kasir..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <LoadingState message="Memuat transaksi..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Invoice & Waktu</th>
                  <th className="py-3 px-4">Pelanggan & Meja</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Rincian Item</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Total Tagihan</th>
                  <th className="py-3 px-4 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
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
                      <td className="py-3 px-4 text-slate-700">{tx.cashier_name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.items?.length || 0} item (
                        {tx.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ').slice(0, 30)}
                        ...)
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[11px] text-slate-800 px-2 py-0.5 rounded-md bg-slate-100">
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-blue-950">
                        Rp {tx.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewReceipt(tx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
