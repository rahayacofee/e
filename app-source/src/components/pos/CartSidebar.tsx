import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { OrderType } from '../../types';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  Tag,
  Utensils,
  ShoppingBag as BagIcon,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface CartSidebarProps {
  onOpenPayment: () => void;
  className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ onOpenPayment, className = '' }) => {
  const {
    items,
    orderType,
    customerName,
    discountAmount,
    subtotal,
    taxAmount,
    serviceAmount,
    totalAmount,
    itemCount,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
    setOrderType,
    setCustomerName,
    setDiscountAmount,
  } = useCart();

  const [activeEditingItem, setActiveEditingItem] = useState<{ id: string; notes: string } | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempDiscount, setTempDiscount] = useState<number>(discountAmount);

  const orderTypes: { type: OrderType; label: string; icon: any }[] = [
    { type: 'DINE_IN', label: 'Dine-in', icon: Utensils },
    { type: 'TAKEAWAY', label: 'Takeaway', icon: BagIcon },
  ];

  return (
    <div className={`flex flex-col h-full bg-white border-l border-slate-200 select-none ${className}`}>
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pesanan Pelanggan</h3>
            <span className="text-[11px] text-slate-500">{itemCount} item dipilih</span>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            title="Kosongkan Keranjang"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Order Options: Order Type and Customer */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2.5 shrink-0 text-xs">
        {/* Order Type Tabs: Dine-in vs Takeaway */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 p-1 rounded-xl">
          {orderTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all ${
                orderType === type
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Customer input */}
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
            Nama Pelanggan
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Pelanggan Walk-In"
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
          />
        </div>

      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-xs font-medium text-slate-600">Keranjang masih kosong</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ketuk menu di samping untuk menambahkan ke pesanan</p>
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = item.product.price * item.quantity;
            return (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rp {item.product.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 shrink-0">
                    Rp {itemTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Notes display */}
                {item.notes ? (
                  <p className="mt-1 text-[11px] text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded-md inline-block font-medium">
                    💬 {item.notes}
                  </p>
                ) : null}

                {/* Stepper & Note Trigger */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setActiveEditingItem({
                        id: item.product.id,
                        notes: item.notes || '',
                      })
                    }
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-900 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{item.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Item Notes Modal */}
      {activeEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Catatan Tambahan Minuman/Makanan</h4>
            <p className="text-[11px] text-slate-500 mb-3">Tingkat manis, jenis susu, atau instruksi khusus</p>
            <input
              type="text"
              autoFocus
              value={activeEditingItem.notes}
              onChange={(e) =>
                setActiveEditingItem({ ...activeEditingItem, notes: e.target.value })
              }
              placeholder="Contoh: Less Sugar, Es Sedikit, Extra Shot"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {['Less Sugar', 'No Sugar', 'Less Ice', 'Oat Milk', 'Extra Shot'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setActiveEditingItem({
                      ...activeEditingItem,
                      notes: activeEditingItem.notes
                        ? `${activeEditingItem.notes}, ${preset}`
                        : preset,
                    })
                  }
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700"
                >
                  +{preset}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveEditingItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateNotes(activeEditingItem.id, activeEditingItem.notes);
                  setActiveEditingItem(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 rounded-lg shadow-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Calculation & Checkout Footer */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2 text-xs">
        <div className="space-y-1 text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">
              Rp {subtotal.toLocaleString('id-ID')}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-rose-600">
              <span>Diskon</span>
              <span className="font-semibold">
                -Rp {discountAmount.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-500">
            <span>Pajak (PB1 10%)</span>
            <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
          </div>
          {serviceAmount > 0 && (
            <div className="flex items-center justify-between text-slate-500">
              <span>Biaya Layanan</span>
              <span>Rp {serviceAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        {/* Total & Discount trigger */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
            <button
              type="button"
              onClick={() => {
                setTempDiscount(discountAmount);
                setShowDiscountModal(true);
              }}
              title="Tambah Diskon"
              className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
            >
              <Tag className="w-3 h-3" />
              <span>Diskon</span>
            </button>
          </div>
          <span className="text-lg font-black text-blue-950">
            Rp {totalAmount.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Primary Checkout Button */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onOpenPayment}
          className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between text-white font-bold shadow-md transition-all active:scale-98 ${
            items.length === 0
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-blue-900 hover:bg-blue-800'
          }`}
        >
          <span>Bayar Sekarang</span>
          <div className="flex items-center gap-1.5">
            <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-1">Diskon Pesanan (Rp)</h4>
            <p className="text-[11px] text-slate-500 mb-3">Masukkan nominal potongan harga</p>
            <input
              type="number"
              min={0}
              step={1000}
              value={tempDiscount}
              onChange={(e) => setTempDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountAmount(tempDiscount);
                  setShowDiscountModal(false);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 rounded-lg shadow-xs"
              >
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
