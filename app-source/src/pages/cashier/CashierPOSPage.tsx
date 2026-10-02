import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Product, Category } from '../../types';
import { CategoryBar } from '../../components/pos/CategoryBar';
import { ProductCard } from '../../components/pos/ProductCard';
import { CartSidebar } from '../../components/pos/CartSidebar';
import { PaymentModal } from '../../components/pos/PaymentModal';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { OpenShiftModal } from '../../components/shift/OpenShiftModal';
import { LoadingState } from '../../components/common/LoadingState';
import { TableReservationModal } from '../../components/common/TableReservationModal';
import { CustomerModal } from '../../components/common/CustomerModal';
import { BluetoothPrinterModal } from '../../components/pos/BluetoothPrinterModal';
import {
  Search,
  Clock,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  X,
  Home,
  Users,
  Calendar,
  Printer,
} from 'lucide-react';

interface CashierPOSPageProps {
  onNavigateHome?: () => void;
}

export const CashierPOSPage: React.FC<CashierPOSPageProps> = ({ onNavigateHome }) => {
  const { user, activeShift, setActiveShift } = useAuth();
  const {
    addItem,
    items,
    itemCount,
    totalAmount,
    clearCart,
    setTableNumber,
    setCustomerName,
  } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showPrinterModal, setShowPrinterModal] = useState<boolean>(false);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await api.pos.getInitData();
      setCategories(res.categories || []);
      setProducts(res.products || []);
      if (res.active_shift && !activeShift) {
        setActiveShift(res.active_shift);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog menu POS');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleOpenPayment = () => {
    if (user?.role === 'CASHIER' && !activeShift) {
      setShowOpenShiftModal(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (receipt: any) => {
    setReceiptData(receipt);
    setShowReceiptModal(true);
    setShowMobileCart(false);
    // Refresh product stock
    fetchCatalog();
  };

  if (isLoading) return <LoadingState message="Memuat Menu POS Rahaya Coffee..." />;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden select-none relative bg-slate-100">
      {/* Left Area: Categories, Search, and Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-hidden">
        {/* Banner if Cashier has not opened shift */}
        {user?.role === 'CASHIER' && !activeShift && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-500 text-white text-xs flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Shift Belum Dibuka:</strong> Anda harus membuka shift dan modal kasir
                terlebih dahulu sebelum memproses transaksi.
              </span>
            </div>
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3 py-1 bg-white text-amber-900 rounded-xl font-bold text-xs shrink-0 hover:bg-amber-50"
            >
              Buka Shift Sekarang
            </button>
          </div>
        )}

        {/* Quick Sub-header Controls Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu kopi, pastry, atau SKU..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#005f56] focus:outline-hidden shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Shortcuts: Home, Meja, Pelanggan, Printer */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                title="Kembali ke Beranda 12 Fitur"
              >
                <Home className="w-3.5 h-3.5 text-teal-800" />
                <span className="hidden sm:inline">Beranda</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              title="Pilih Meja Dine-in"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Meja</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
              title="Pilih Pelanggan / Member"
            >
              <Users className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Member</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrinterModal(true)}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all active:scale-95"
              title="Printer Bluetooth"
            >
              <Printer className="w-4 h-4 text-teal-800" />
            </button>
          </div>
        </div>

        {/* Category Horizontal Bar */}
        <div className="shrink-0 mb-3">
          <CategoryBar
            categories={categories}
            selectedCategoryId={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-16 md:pb-2 scrollbar-thin">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <p className="text-xs font-semibold text-slate-600">Tidak ada menu yang cocok</p>
              <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci pencarian atau kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={(product) => addItem(product, 1)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Desktop/Tablet Cart Sidebar (340px - 400px) */}
      <div className="hidden md:flex w-80 lg:w-96 shrink-0 h-full">
        <CartSidebar onOpenPayment={handleOpenPayment} className="w-full shadow-lg" />
      </div>

      {/* Floating Bottom Bar for Mobile Smartphone Screen */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">
            {itemCount} item dipilih
          </span>
          <span className="text-sm font-black text-[#004d40]">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          onClick={() => setShowMobileCart(true)}
          className="px-4 py-2 bg-[#005f56] hover:bg-[#004d40] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Lihat Keranjang</span>
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in slide-in-from-bottom duration-200">
          <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
              <span className="text-xs font-bold text-slate-800">Keranjang Pesanan</span>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartSidebar
                onOpenPayment={() => {
                  setShowMobileCart(false);
                  handleOpenPayment();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={true}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <ReceiptModal
          isOpen={true}
          receiptData={receiptData}
          onClose={() => setShowReceiptModal(false)}
          onNewOrder={() => {
            clearCart();
            setShowReceiptModal(false);
          }}
        />
      )}

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <OpenShiftModal
          isOpen={true}
          onClose={() => setShowOpenShiftModal(false)}
          onSuccess={(shift) => {
            setActiveShift(shift);
            setShowOpenShiftModal(false);
          }}
        />
      )}

      {/* Table Reservation Modal */}
      {showTableModal && (
        <TableReservationModal
          isOpen={true}
          onClose={() => setShowTableModal(false)}
          onSelectTableForPOS={(tbl) => {
            setTableNumber(tbl);
            setShowTableModal(false);
          }}
        />
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <CustomerModal
          isOpen={true}
          onClose={() => setShowCustomerModal(false)}
          onSelectCustomerForPOS={(cust) => {
            setCustomerName(cust);
            setShowCustomerModal(false);
          }}
        />
      )}

      {/* Bluetooth Printer Modal */}
      {showPrinterModal && (
        <BluetoothPrinterModal
          isOpen={true}
          onClose={() => setShowPrinterModal(false)}
        />
      )}
    </div>
  );
};
