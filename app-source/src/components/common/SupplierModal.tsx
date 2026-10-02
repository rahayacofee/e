import React, { useState } from 'react';
import { Truck, X, Plus, Phone, MapPin, Package, CheckCircle } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose }) => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 'sup-1',
      name: 'CV Roastery Nusantara Utama',
      category: 'Biji Kopi Arabica & Robusta',
      phone: '+62 812-4455-6677',
      address: 'Bandung, Jawa Barat',
      status: 'ACTIVE',
    },
    {
      id: 'sup-2',
      name: 'PT Susu Segar Pasteurisasi',
      category: 'Fresh Milk & Dairy',
      phone: '+62 821-3344-5566',
      address: 'Bogor, Jawa Barat',
      status: 'ACTIVE',
    },
    {
      id: 'sup-3',
      name: 'Artisan Bakery Supplies',
      category: 'Croissant, Pastry & Bahan Baku',
      phone: '+62 813-8899-0011',
      address: 'Jakarta Selatan',
      status: 'ACTIVE',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSup, setNewSup] = useState({ name: '', category: '', phone: '', address: '' });

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSup.name) return;
    setSuppliers([
      ...suppliers,
      {
        id: `sup-${Date.now()}`,
        name: newSup.name,
        category: newSup.category || 'Bahan Baku',
        phone: newSup.phone || '-',
        address: newSup.address || '-',
        status: 'ACTIVE',
      },
    ]);
    setNewSup({ name: '', category: '', phone: '', address: '' });
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center">
              <Truck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Daftar Supplier & Vendor</h3>
              <p className="text-[10px] text-teal-200">Manajemen pemasok biji kopi & bahan baku</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-teal-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">{suppliers.length} Supplier Terdaftar</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Supplier</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <input
                type="text"
                placeholder="Nama Supplier / Perusahaan"
                value={newSup.name}
                onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Kategori (Kopi/Susu/Pastry)"
                  value={newSup.category}
                  onChange={(e) => setNewSup({ ...newSup, category: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="No. Telepon / WhatsApp"
                  value={newSup.phone}
                  onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Alamat / Kota"
                value={newSup.address}
                onChange={(e) => setNewSup({ ...newSup, address: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-teal-800 text-white rounded-xl font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-teal-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{s.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold">
                    {s.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {s.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {s.address}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
