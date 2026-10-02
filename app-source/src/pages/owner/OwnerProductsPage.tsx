import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Layers,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Upload,
} from 'lucide-react';

export const OwnerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    sku: '',
    description: '',
    price: 25000,
    cost_price: 10000,
    track_inventory: true,
    initial_stock: 50,
    min_stock_alert: 10,
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'Coffee',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.owner.getProducts();
      setProducts(res.products || []);
      setCategories(res.categories || []);
      if (res.categories?.length > 0 && !productForm.category_id) {
        setProductForm((prev) => ({ ...prev, category_id: res.categories[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category_id: categories[0]?.id || '',
      sku: '',
      description: '',
      price: 25000,
      cost_price: 10000,
      track_inventory: true,
      initial_stock: 50,
      min_stock_alert: 10,
      image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80',
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category_id: p.category_id,
      sku: p.sku,
      description: p.description || '',
      price: p.price,
      cost_price: p.cost_price || 0,
      track_inventory: p.track_inventory,
      initial_stock: p.current_stock || 0,
      min_stock_alert: p.min_stock_alert || 10,
      image_url: p.image_url,
    });
    setShowProductModal(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5 MB.');
      return;
    }
    setIsUploadingImage(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
        reader.readAsDataURL(file);
      });
      const res = await api.owner.uploadProductImage(base64, file.name, file.type);
      setProductForm((prev) => ({ ...prev, image_url: res.url }));
      setSuccessMsg('Gambar produk berhasil diunggah.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingProduct) {
        await api.owner.updateProduct(editingProduct.id, productForm);
        setSuccessMsg(`Produk "${productForm.name}" berhasil diperbarui!`);
      } else {
        await api.owner.createProduct(productForm);
        setSuccessMsg(`Produk "${productForm.name}" berhasil ditambahkan!`);
      }
      setShowProductModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan produk "${p.name}"?`)) return;
    try {
      await api.owner.deleteProduct(p.id);
      setSuccessMsg(`Produk "${p.name}" dinonaktifkan.`);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menonaktifkan produk');
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    try {
      await api.owner.createCategory(categoryForm);
      setSuccessMsg(`Kategori "${categoryForm.name}" berhasil dibuat!`);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', icon: 'Coffee' });
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kategori');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Katalog Produk & Menu</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola menu kopi, harga jual, harga pokok (HPP), dan tautan kategori
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Kategori Baru</span>
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
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

      {/* Filter Category & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills/Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === c.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu atau SKU..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <LoadingState message="Memuat produk..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Menu / Produk</th>
                  <th className="py-3 px-4">Kategori & SKU</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">HPP (Modal)</th>
                  <th className="py-3 px-4">Stok Saat Ini</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                                {p.description || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{cat?.name || 'Umum'}</div>
                          <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>
                        </td>
                        <td className="py-3 px-4 font-black text-blue-950">
                          Rp {p.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          Rp {(p.cost_price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          {p.track_inventory ? (
                            <span
                              className={`font-bold ${
                                (p.current_stock ?? 0) <= (p.min_stock_alert ?? 10)
                                  ? 'text-rose-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {p.current_stock ?? 0} porsi
                            </span>
                          ) : (
                            <span className="text-slate-400">Tidak dilacak</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold text-[11px] ${
                              p.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Nonaktifkan Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Add / Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Produk Menu' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitProduct} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Menu / Produk *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="misal: Kopi Susu Rahaya Gula Aren"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Kategori Menu *
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">SKU Kode</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="RHY-01"
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Harga Jual Kasir (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    HPP / Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={productForm.cost_price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, cost_price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Foto Produk</label>
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                    {productForm.image_url ? <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">No Image</div>}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {isUploadingImage ? 'Mengunggah...' : 'Upload Gambar'}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploadingImage} onChange={(e) => { const file=e.target.files?.[0]; if(file) handleImageUpload(file); e.currentTarget.value=''; }} />
                    </label>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WebP • maksimal 5 MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="Rincian rasa, biji kopi, atau komposisi"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!productForm.track_inventory}
                    onChange={(e) => setProductForm({ ...productForm, track_inventory: !e.target.checked })}
                    className="rounded"
                  />
                  Stok Unlimited / Tidak terbatas
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Produk tetap bisa dijual tanpa mengurangi stok.</p>
              </div>

              {!editingProduct && productForm.track_inventory && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.initial_stock}
                      onChange={(e) =>
                        setProductForm({ ...productForm, initial_stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Batas Minimal Stok (Alert)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.min_stock_alert}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          min_stock_alert: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Kategori Menu</h3>
            <p className="text-xs text-slate-500 mb-3">Buat pengelompokan menu di POS kasir</p>
            <form onSubmit={handleSubmitCategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="misal: Cold Brew & Mocktail"
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Icon Kategori</label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-slate-200 bg-white"
                >
                  <option value="Coffee">Coffee (Kopi)</option>
                  <option value="Sparkles">Sparkles (Signature)</option>
                  <option value="Flame">Flame (Manual Brew / Hot)</option>
                  <option value="CupSoda">CupSoda (Dingin / Non-Coffee)</option>
                  <option value="Cake">Cake (Pastry / Roti)</option>
                  <option value="Cookie">Cookie (Camilan)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 rounded-xl shadow-xs"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
