import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Users,
  UserPlus,
  KeyRound,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';

export const OwnerCashiersPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedCashier, setSelectedCashier] = useState<any>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
  });

  const [newPassword, setNewPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCashiers = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getCashiers();
      setCashiers(res.cashiers || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kasir');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.owner.createCashier(createForm);
      setSuccessMsg(res.message);
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', full_name: '', phone: '' });
      fetchCashiers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCashier) return;
    setIsSubmitting(true);
    try {
      await api.owner.updateCashier(selectedCashier.id, editForm);
      setSuccessMsg('Data kasir berhasil diperbarui!');
      setShowEditModal(false);
      fetchCashiers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: any) => {
    const nextStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.owner.toggleCashierStatus(c.id, nextStatus);
      fetchCashiers();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status kasir');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCashier) return;
    setIsSubmitting(true);
    try {
      await api.owner.resetCashierPassword(selectedCashier.id, newPassword);
      setSuccessMsg(`Password kasir "${selectedCashier.username}" berhasil direset.`);
      setShowResetModal(false);
      setNewPassword('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = cashiers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.full_name?.toLowerCase().includes(q) || c.username?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Staf Kasir</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat akun kasir baru (langsung aktif) dan kelola hak akses kasir outlet Anda
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Kasir Baru</span>
        </button>
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

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kasir..."
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
        />
      </div>

      {/* Cashiers Table */}
      {isLoading ? (
        <LoadingState message="Memuat staf kasir..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kasir & Username</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Login Terakhir</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada staf kasir ditambahkan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">@{c.username}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 font-semibold text-[11px] hover:underline ${
                            c.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {c.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.last_login_at
                          ? new Date(c.last_login_at).toLocaleString('id-ID')
                          : 'Belum pernah'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedCashier(c);
                            setEditForm({ full_name: c.full_name, phone: c.phone || '' });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100"
                          title="Edit Kasir"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCashier(c);
                            setNewPassword('');
                            setShowResetModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
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

      {/* Modal Create Cashier */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Kasir Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Akun langsung aktif dan dapat digunakan kasir untuk buka shift di POS.
            </p>
            <form onSubmit={handleCreateCashier} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap Kasir *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Nama barista / kasir"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="kasir_02"
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password Awal *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min. 6 karakter"
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+62 8..."
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
                  {isSubmitting ? 'Menyimpan...' : 'Buat Kasir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Cashier */}
      {showEditModal && selectedCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Kasir: {selectedCashier.username}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditCashier} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  No. Telepon
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && selectedCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Password Kasir</h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur ulang password untuk kasir <strong>{selectedCashier.username}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Password Baru (min. 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Mereset...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
