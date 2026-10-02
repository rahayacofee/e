import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Expense } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Wallet,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';

export const OwnerExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Bahan Baku',
    amount: 50000,
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getExpenses();
      setExpenses(res.expenses || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.owner.createExpense(form);
      setSuccessMsg(`Pengeluaran "${form.title}" berhasil dicatat!`);
      setShowCreateModal(false);
      setForm({
        title: '',
        category: 'Bahan Baku',
        amount: 50000,
        notes: '',
        date: new Date().toISOString().slice(0, 10),
      });
      fetchExpenses();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`Hapus catatan pengeluaran "${exp.title}"?`)) return;
    try {
      await api.owner.deleteExpense(exp.id);
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus');
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filtered = expenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Pengeluaran & Biaya Operasional</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat pembelian bahan baku darurat, es batu, susu, listrik, dan biaya harian outlet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500">Total Pengeluaran:</span>{' '}
            <strong className="text-rose-600 font-black">
              Rp {totalExpense.toLocaleString('id-ID')}
            </strong>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Biaya Baru</span>
          </button>
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
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Expenses Table */}
      {isLoading ? (
        <LoadingState message="Memuat pengeluaran..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal & Deskripsi</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada catatan pengeluaran.
                    </td>
                  </tr>
                ) : (
                  filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{exp.title}</div>
                        <div className="text-[10px] text-slate-400">{exp.date}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600">
                        Rp {exp.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {exp.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Add Expense */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Catat Pengeluaran Outlet</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama / Keperluan Biaya *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="misal: Beli Es Batu Kristal 5 Kantong"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 bg-white"
                  >
                    <option value="Bahan Baku">Bahan Baku & Susu</option>
                    <option value="Operasional">Operasional & Es Batu</option>
                    <option value="Kemasan">Kemasan Cup & Sedotan</option>
                    <option value="Listrik & Air">Listrik & Utilitas</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nominal Biaya (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan kwitansi atau alasan pembelian darurat"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
