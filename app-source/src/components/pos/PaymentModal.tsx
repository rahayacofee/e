import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { PaymentMethod } from '../../types';
import {
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptData: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    items,
    orderType,
    customerName,
    discountAmount,
    totalAmount,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(totalAmount);
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const change = paymentMethod === 'CASH' ? Math.max(0, amountPaid - totalAmount) : 0;
  const isPaidEnough = amountPaid >= totalAmount;

  const quickCashPresets = [
    { label: 'Uang Pas', amount: totalAmount },
    { label: '50.000', amount: 50000 },
    { label: '100.000', amount: 100000 },
    { label: '150.000', amount: 150000 },
    { label: '200.000', amount: 200000 },
  ].filter((p) => p.amount >= totalAmount || p.label === 'Uang Pas');

  const handleProcessPayment = async () => {
    if (paymentMethod === 'CASH' && !isPaidEnough) {
      setError('Uang yang dibayarkan kurang dari total tagihan.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Prepare payload: strictly sending productId, quantity, and notes
      // The server resolves authentic prices and taxes from the database!
      const payload = {
        customer_name: customerName,
        order_type: orderType,
        table_number: null,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'CASH' ? amountPaid : totalAmount,
        discount_amount: discountAmount,
        notes,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || '',
        })),
      };

      const res = await api.pos.createTransaction(payload);

      // Play soft POS success chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // audio context optional
      }

      clearCart();
      onSuccess(res.receipt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Proses Pembayaran</h3>
            <p className="text-xs text-slate-500">
              {customerName} • {items.length} item
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Total display box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-950 text-white text-center shadow-xs">
            <span className="text-xs text-blue-200 uppercase tracking-widest font-semibold">
              Total yang Harus Dibayar
            </span>
            <h2 className="text-3xl font-black mt-1 tracking-tight">
              Rp {totalAmount.toLocaleString('id-ID')}
            </h2>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash (Tunai)', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'TRANSFER', label: 'Transfer Bank', icon: Building2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(id as PaymentMethod);
                    if (id !== 'CASH') setAmountPaid(totalAmount);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === id
                      ? 'border-blue-900 bg-blue-50/70 text-blue-900 ring-2 ring-blue-900/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CASH SECTION */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                {quickCashPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAmountPaid(preset.amount)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      amountPaid === preset.amount
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label === 'Uang Pas'
                      ? 'Uang Pas'
                      : `Rp ${preset.amount.toLocaleString('id-ID')}`}
                  </button>
                ))}
              </div>

              {/* Kembalian (Change) */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Kembalian:</span>
                <span
                  className={`text-lg font-black ${
                    amountPaid < totalAmount ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {amountPaid < totalAmount
                    ? `Kurang Rp ${(totalAmount - amountPaid).toLocaleString('id-ID')}`
                    : `Rp ${change.toLocaleString('id-ID')}`}
                </span>
              </div>
            </div>
          )}

          {/* QRIS SECTION */}
          {paymentMethod === 'QRIS' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">
                Pindai kode QRIS di bawah menggunakan GoPay, OVO, Dana, BCA, atau aplikasi perbankan lainnya:
              </p>
              {/* Stylized QRIS Box */}
              <div className="inline-block p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-48 h-48 mx-auto bg-slate-900 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                  {/* Generated QR pattern visual representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                    <rect x="5" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="5" />
                    <rect x="12" y="12" width="11" height="11" />
                    <rect x="70" y="5" width="25" height="25" fill="none" stroke="white" strokeWidth="5" />
                    <rect x="77" y="12" width="11" height="11" />
                    <rect x="5" y="70" width="25" height="25" fill="none" stroke="white" strokeWidth="5" />
                    <rect x="12" y="77" width="11" height="11" />
                    <rect x="35" y="10" width="5" height="15" />
                    <rect x="45" y="5" width="15" height="5" />
                    <rect x="55" y="20" width="10" height="10" />
                    <rect x="35" y="35" width="30" height="30" fill="white" />
                    <circle cx="50" cy="50" r="10" fill="#0F2B5C" />
                    <rect x="10" y="45" width="15" height="10" />
                    <rect x="75" y="45" width="15" height="15" />
                    <rect x="35" y="75" width="25" height="15" />
                    <rect x="75" y="75" width="15" height="15" />
                  </svg>
                </div>
                <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  NMID: ID1029384756281 • RAHAYA
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulasi QRIS Siap Menerima Pembayaran</span>
              </div>
            </div>
          )}

          {/* CARD OR TRANSFER SECTION */}
          {(paymentMethod === 'DEBIT' || paymentMethod === 'TRANSFER') && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="font-semibold text-slate-800">
                Instruksi {paymentMethod === 'DEBIT' ? 'EDC Terminal' : 'Transfer Bank'}:
              </p>
              <p className="text-slate-600">
                Gesek/masukkan kartu pada mesin EDC kasir atau periksa mutasi rekening penerimaan.
                Setelah dana masuk, tekan tombol konfirmasi di bawah.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pesanan untuk meeting VIP, bayar split"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing || (paymentMethod === 'CASH' && !isPaidEnough)}
            onClick={handleProcessPayment}
            className={`px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 transition-all active:scale-95 ${
              isProcessing || (paymentMethod === 'CASH' && !isPaidEnough)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Transaksi...</span>
              </>
            ) : (
              <span>Konfirmasi & Cetak Struk</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
