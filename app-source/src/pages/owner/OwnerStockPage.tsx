import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Package,
  PlusCircle,
  MinusCircle,
  SlidersHorizontal,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowUpDown,
} from 'lucide-react';

export const OwnerStockPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchStock = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getStock();
      setInventory(res.inventory || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat inventaris');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleOpenAdjust = (item: any, type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustAmount(type === 'ADJUSTMENT' ? item.current_stock : 10);
    setNotes('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await api.owner.adjustStock({
        product_id: selectedItem.product_id,
        type: adjustType,
        amount: Number(adjustAmount),
        notes,
      });
      setSuccessMsg(
        `Penyesuaian stok "${selectedItem.product_name}" berhasil diperbarui!`
      );
      setShowAdjustModal(false);
      fetchStock();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyesuaikan stok');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = inventory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Stok & Inventaris</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau ketersediaan bahan, catat stok masuk, barang rusak, dan penyesuaian opname
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk inventaris..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stock Table */}
      {isLoading ? (
        <LoadingState message="Memuat inventaris..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Produk & SKU</th>
                  <th className="py-3 px-4">Stok Saat Ini</th>
                  <th className="py-3 px-4">Batas Minimal</th>
                  <th className="py-3 px-4">Status Ketersediaan</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat Penyesuaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada data inventaris ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.current_stock <= item.min_stock_alert;
                    const isZero = item.current_stock <= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.product_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-black text-sm text-slate-900">
                          {item.current_stock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {item.min_stock_alert} {item.unit}
                        </td>
                        <td className="py-3 px-4">
                          {isZero ? (
                            <span className="font-bold text-[11px] text-rose-600">Stok Habis</span>
                          ) : isLow ? (
                            <span className="font-bold text-[11px] text-amber-600">Mendekati Batas</span>
                          ) : (
                            <span className="font-semibold text-[11px] text-emerald-700">Aman</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenAdjust(item, 'IN')}
                            title="Stok Masuk (Restock)"
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all"
                          >
                            + Masuk
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item, 'OUT')}
                            title="Stok Keluar (Rusak/Buang)"
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-all"
                          >
                            - Keluar
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item, 'ADJUSTMENT')}
                            title="Koreksi Fisik (Stock Opname)"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                          >
                            Opname
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {adjustType === 'IN'
                  ? 'Catat Stok Masuk'
                  : adjustType === 'OUT'
                  ? 'Catat Stok Keluar / Rusak'
                  : 'Koreksi Fisik (Stock Opname)'}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Produk: <strong>{selectedItem.product_name}</strong> (Stok saat ini: {selectedItem.current_stock})
            </div>
            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {adjustType === 'ADJUSTMENT' ? 'Jumlah Stok Fisik Sebenarnya' : 'Jumlah Perubahan (Porsi)'}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold border-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    adjustType === 'IN'
                      ? 'Restock belanja supplier'
                      : adjustType === 'OUT'
                      ? 'Kemasan rusak / tumpah'
                      : 'Hasil hitung fisik berkala'
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
