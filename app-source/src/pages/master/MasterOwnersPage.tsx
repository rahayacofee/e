import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';

export const MasterOwnersPage: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  // Form states
  const [newOwnerForm, setNewOwnerForm] = useState({
    username: '',
    password: '',
    full_name: '',
    phone: '',
    business_id: '',
    business_name: '',
    business_code: '',
    business_address: '',
  });

  const [editOwnerForm, setEditOwnerForm] = useState({
    full_name: '',
    phone: '',
    business_name: '',
    business_address: '',
  });

  const [newPassword, setNewPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const res = await api.master.getOwners();
      setOwners(Array.isArray(res.owners) ? res.owners : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data owner');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await api.master.getBusinesses();
      setBusinesses(Array.isArray(res.businesses) ? res.businesses : []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar outlet');
    }
  };

  useEffect(() => {
    void fetchOwners();
    void fetchBusinesses();
  }, []);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.master.createOwner(newOwnerForm);
      setSuccessMsg(res.message);
      setShowCreateModal(false);
      setNewOwnerForm({
        username: '',
        password: '',
        full_name: '',
        phone: '',
        business_id: '',
        business_name: '',
        business_code: '',
        business_address: '',
      });
      await fetchOwners();
      await fetchBusinesses();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat owner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    setIsSubmitting(true);
    try {
      await api.master.updateOwner(selectedOwner.id, editOwnerForm);
      setSuccessMsg('Data Owner berhasil diperbarui!');
      setShowEditModal(false);
      fetchOwners();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui owner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (owner: any) => {
    const nextStatus = owner.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.master.toggleOwnerStatus(owner.id, nextStatus);
      fetchOwners();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    setIsSubmitting(true);
    try {
      await api.master.resetOwnerPassword(selectedOwner.id, newPassword);
      setSuccessMsg(`Password untuk "${selectedOwner.username}" berhasil direset.`);
      setShowResetModal(false);
      setNewPassword('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.full_name?.toLowerCase().includes(q) ||
      o.username?.toLowerCase().includes(q) ||
      o.business?.name?.toLowerCase().includes(q) ||
      o.business?.code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 select-none">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Akun Owner</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat, aktifkan, atau reset kata sandi untuk akun Owner Rahaya Coffee
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Owner Baru</span>
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
          placeholder="Cari nama, username, atau nama outlet..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
        />
      </div>

      {/* Owners Table */}
      {isLoading ? (
        <LoadingState message="Memuat daftar owner..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Owner & Username</th>
                  <th className="py-3 px-4">Nama Bisnis & Kode</th>
                <th className="py-3 px-4">Owner di Outlet</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOwners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data owner ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{owner.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{owner.username}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {owner.business?.name || 'Tanpa Outlet'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {owner.business?.code || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{owner.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold">
                          {owner.business?.owners_count ?? '-'} Owner
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(owner)}
                          className={`inline-flex items-center gap-1.5 font-semibold text-[11px] hover:underline ${
                            owner.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              owner.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {owner.status === 'ACTIVE' ? 'Aktif (Klik ubah)' : 'Nonaktif (Klik ubah)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(owner.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedOwner(owner);
                            setEditOwnerForm({
                              full_name: owner.full_name,
                              phone: owner.phone || '',
                              business_name: owner.business?.name || '',
                              business_address: owner.business?.address || '',
                            });
                            setShowEditModal(true);
                          }}
                          title="Edit Data Owner"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOwner(owner);
                            setNewPassword('');
                            setShowResetModal(true);
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
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

      {/* Modal Create Owner */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Buat Akun Owner & Bisnis Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Akun Owner akan langsung aktif. Anda bisa membuat outlet baru atau menambahkan Owner ke outlet yang sudah ada.
            </p>
            <form onSubmit={handleCreateOwner} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOwnerForm.username}
                    onChange={(e) =>
                      setNewOwnerForm({ ...newOwnerForm, username: e.target.value })
                    }
                    placeholder="misal: owner_bandung"
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
                    value={newOwnerForm.password}
                    onChange={(e) =>
                      setNewOwnerForm({ ...newOwnerForm, password: e.target.value })
                    }
                    placeholder="Min. 6 karakter"
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap Owner *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOwnerForm.full_name}
                    onChange={(e) =>
                      setNewOwnerForm({ ...newOwnerForm, full_name: e.target.value })
                    }
                    placeholder="Nama pemilik"
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. Handphone / WA
                  </label>
                  <input
                    type="text"
                    value={newOwnerForm.phone}
                    onChange={(e) =>
                      setNewOwnerForm({ ...newOwnerForm, phone: e.target.value })
                    }
                    placeholder="+62 812..."
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-blue-900 block mb-2">
                  Outlet / Tenant:
                </span>

                <div className="mb-3">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Pilih Outlet
                  </label>
                  <select
                    value={newOwnerForm.business_id}
                    onChange={(e) => {
                      const businessId = e.target.value;
                      const selected = businesses.find((b) => b.id === businessId);
                      setNewOwnerForm({
                        ...newOwnerForm,
                        business_id: businessId,
                        business_name: selected?.name || '',
                        business_code: selected?.code || '',
                        business_address: selected?.address || '',
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 bg-white"
                  >
                    <option value="">+ Buat outlet baru</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) — {b.owners_count || 0} Owner
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih outlet yang sudah ada agar beberapa akun Owner dapat memakai outlet yang sama.
                  </p>
                </div>

                {newOwnerForm.business_id ? (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-xs font-bold text-blue-900">{newOwnerForm.business_name}</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      {newOwnerForm.business_code} · {businesses.find((b) => b.id === newOwnerForm.business_id)?.owners_count || 0} Owner saat ini
                    </div>
                    <div className="text-[10px] text-blue-600 mt-1">{newOwnerForm.business_address || 'Alamat belum diisi'}</div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Nama Bisnis / Outlet *
                        </label>
                        <input
                          type="text"
                          required
                          value={newOwnerForm.business_name}
                          onChange={(e) =>
                            setNewOwnerForm({ ...newOwnerForm, business_name: e.target.value })
                          }
                          placeholder="Rahaya Coffee - Cabang Bandung"
                          className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Kode Outlet
                        </label>
                        <input
                          type="text"
                          value={newOwnerForm.business_code}
                          onChange={(e) =>
                            setNewOwnerForm({ ...newOwnerForm, business_code: e.target.value })
                          }
                          placeholder="RHY-BDG"
                          className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 uppercase"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Alamat Outlet
                      </label>
                      <textarea
                        rows={2}
                        value={newOwnerForm.business_address}
                        onChange={(e) =>
                          setNewOwnerForm({ ...newOwnerForm, business_address: e.target.value })
                        }
                        placeholder="Jl. Braga No. 12, Bandung"
                        className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                      />
                    </div>
                  </>
                )}
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
                  {isSubmitting ? 'Menyimpan...' : 'Buat Akun Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Owner */}
      {showEditModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Profil Owner: {selectedOwner.username}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditOwner} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editOwnerForm.full_name}
                  onChange={(e) =>
                    setEditOwnerForm({ ...editOwnerForm, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  No. Telepon
                </label>
                <input
                  type="text"
                  value={editOwnerForm.phone}
                  onChange={(e) => setEditOwnerForm({ ...editOwnerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Bisnis / Outlet
                </label>
                <input
                  type="text"
                  value={editOwnerForm.business_name}
                  onChange={(e) =>
                    setEditOwnerForm({ ...editOwnerForm, business_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Alamat Bisnis
                </label>
                <textarea
                  rows={2}
                  value={editOwnerForm.business_address}
                  onChange={(e) =>
                    setEditOwnerForm({ ...editOwnerForm, business_address: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Password Owner</h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur ulang password untuk akun <strong>{selectedOwner.username}</strong>
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
