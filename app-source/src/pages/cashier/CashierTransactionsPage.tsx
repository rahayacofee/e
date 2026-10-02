import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Transaction } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { Receipt, Search, Eye, Calendar } from 'lucide-react';

export const CashierTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.cashier.getMyTransactions();
      const prof = await api.cashier.getProfile();
      setTransactions(res.transactions || []);
      setBusinessInfo(prof.business || {});
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
    return (
      tx.invoice_number.toLowerCase().includes(q) ||
      tx.customer_name.toLowerCase().includes(q)
    );
  });

  const totalMySales = filtered.reduce((sum, tx) => sum + tx.total_amount, 0);

  return (
    <div className="space-y-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Transaksi Saya</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pesanan yang Anda layani secara personal selama bertugas
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500">Penjualan Saya:</span>{' '}
          <strong className="text-blue-950 font-black">
            Rp {totalMySales.toLocaleString('id-ID')}
          </strong>{' '}
          <span className="text-slate-400">({filtered.length} pesanan)</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari no invoice atau nama pelanggan..."
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Memuat riwayat transaksi..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Invoice & Waktu</th>
                  <th className="py-3 px-4">Pelanggan & Meja</th>
                  <th className="py-3 px-4">Item Pesanan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada transaksi yang diproses.
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
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{tx.customer_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {tx.table_number || tx.order_type}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ').slice(0, 35)}
                        ...
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
                          <span>Cetak / Lihat</span>
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
