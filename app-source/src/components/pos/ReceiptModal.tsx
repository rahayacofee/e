import React, { useState } from 'react';
import {
  Printer,
  CheckCircle,
  Share2,
  X,
  PlusCircle,
  Bluetooth,
  RefreshCw,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { bluetoothPrinter } from '../../services/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';

interface ReceiptModalProps {
  isOpen: boolean;
  receiptData: any;
  onClose: () => void;
  onNewOrder: () => void;
  isReprint?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  receiptData,
  onClose,
  onNewOrder,
  isReprint = false,
}) => {
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState<boolean>(false);
  const [showBluetoothModal, setShowBluetoothModal] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !receiptData) return null;

  const { business, transaction } = receiptData;

  const handlePrintBrowser = () => {
    window.print();
  };

  const handlePrintBluetooth = async () => {
    setIsBluetoothPrinting(true);
    setFeedbackMsg(null);
    try {
      if (!bluetoothPrinter.isConnected()) {
        setShowBluetoothModal(true);
        setIsBluetoothPrinting(false);
        return;
      }
      await bluetoothPrinter.printReceipt({ business, transaction });
      setFeedbackMsg({
        type: 'success',
        text: 'Struk berhasil dicetak ke Printer Thermal Bluetooth!',
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Gagal mencetak ke printer Bluetooth. Coba hubungkan ulang.',
      });
      setShowBluetoothModal(true);
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handleSaveReceipt = () => {
    const textReceipt = `
========================================
             ${business.name?.toUpperCase()}
${business.address}
Telp: ${business.phone || '-'}
${business.header ? business.header + '\n' : ''}========================================
No. Inv : ${transaction.invoice_number}
Tanggal : ${new Date(transaction.date).toLocaleString('id-ID')}
Kasir   : ${transaction.cashier}
Customer: ${transaction.customer} (${transaction.order_type})
Meja    : ${transaction.table_number || '-'}
----------------------------------------
ITEM PESANAN:
${transaction.items
  ?.map(
    (item: any) =>
      `${item.product_name}\n  ${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')} = Rp ${item.subtotal.toLocaleString('id-ID')}${item.notes ? `\n  Catatan: ${item.notes}` : ''}`
  )
  .join('\n')}
----------------------------------------
Subtotal : Rp ${transaction.subtotal.toLocaleString('id-ID')}
Diskon   : Rp ${transaction.discount_amount.toLocaleString('id-ID')}
Pajak PB1: Rp ${transaction.tax_amount.toLocaleString('id-ID')}
TOTAL    : Rp ${transaction.total_amount.toLocaleString('id-ID')}
----------------------------------------
Metode   : ${transaction.payment_method}
Bayar    : Rp ${transaction.amount_paid.toLocaleString('id-ID')}
Kembali  : Rp ${transaction.change_amount.toLocaleString('id-ID')}
========================================
${business.footer || 'Terima kasih atas kunjungan Anda!'}
      `.trim();

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${transaction.invoice_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
          {/* Top Control Bar (Hidden in Print) */}
          <div className="print:hidden p-3 border-b border-slate-100 flex items-center justify-between bg-teal-900 text-white">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {isReprint ? (
                <>
                  <RotateCcw className="w-4 h-4 text-amber-300" />
                  <span>Reprint Struk Transaksi</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>Transaksi Berhasil Disimpan</span>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-teal-200 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {feedbackMsg && (
            <div
              className={`p-2.5 text-[11px] font-semibold flex items-center gap-1.5 border-b ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Printable Thermal Receipt Area */}
          <div
            id="printable-receipt"
            className="p-5 overflow-y-auto bg-white font-mono text-slate-900 text-xs leading-tight flex-1 print:p-0 print:m-0"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1">
                <img
                  src={`${import.meta.env.BASE_URL}icon.svg`}
                  alt="Rahaya Coffee"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain print:block"
                  loading="eager"
                  decoding="sync"
                />
              </div>
              <h4 className="font-extrabold text-sm tracking-tight text-slate-950 uppercase">
                {business.name}
              </h4>
              <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                {business.address}
              </p>
              {business.phone && (
                <p className="text-[10px] text-slate-600">Telp: {business.phone}</p>
              )}
              {business.header && (
                <p className="text-[10px] text-slate-500 italic mt-1 whitespace-pre-line">
                  {business.header}
                </p>
              )}
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Inv:</span>
                <span className="font-bold">{transaction.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>
                  {new Date(transaction.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  {new Date(transaction.date).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="truncate max-w-[130px] font-medium">
                  {transaction.customer} ({transaction.order_type})
                </span>
              </div>
              {transaction.table_number && (
                <div className="flex justify-between">
                  <span>Meja / Ref:</span>
                  <span className="font-bold">{transaction.table_number}</span>
                </div>
              )}
            </div>

            {/* Purchased Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items?.map((item: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-950">
                    <span className="truncate pr-2">{item.product_name}</span>
                    <span className="shrink-0">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {item.notes ? (
                    <p className="text-[9px] text-slate-500 italic">
                      *{item.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {transaction.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-Rp {transaction.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Pajak PB1 (10%):</span>
                  <span>Rp {transaction.tax_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {transaction.service_amount > 0 && (
                <div className="flex justify-between">
                  <span>Layanan:</span>
                  <span>Rp {transaction.service_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-200 text-slate-950">
                <span>TOTAL:</span>
                <span>Rp {transaction.total_amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Method & Change */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold">{transaction.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar:</span>
                <span>Rp {transaction.amount_paid.toLocaleString('id-ID')}</span>
              </div>
              {transaction.change_amount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Kembali:</span>
                  <span>Rp {transaction.change_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
              <p className="whitespace-pre-line">{business.footer}</p>
              <p className="font-mono text-[9px] pt-1 text-slate-400">
                === POWERED BY RAHAYA POS ===
              </p>
            </div>
          </div>

          {/* Action Controls (Hidden in Print) */}
          <div className="print:hidden p-3 border-t border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
            {/* Primary Print: Bluetooth Thermal direct */}
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isBluetoothPrinting}
              className="w-full py-2.5 px-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
            >
              {isBluetoothPrinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mencetak ke Bluetooth...</span>
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 text-teal-200" />
                  <span>{isReprint ? 'Reprint Bluetooth (ESC/POS)' : 'Cetak Thermal Bluetooth'}</span>
                </>
              )}
            </button>

            {/* Secondary Controls: Browser Print, Save File, New Order */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrintBrowser}
                className="flex-1 py-2 px-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
                title="Cetak via browser"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Thermal Browser</span>
              </button>
              <button
                type="button"
                onClick={handleSaveReceipt}
                className="flex-1 py-2 px-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 border border-slate-300 transition-all active:scale-95"
                title="Simpan file struk"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan .TXT</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onNewOrder();
                  onClose();
                }}
                className="flex-1 py-2 px-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Order Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBluetoothModal && (
        <BluetoothPrinterModal
          isOpen={true}
          onClose={() => setShowBluetoothModal(false)}
        />
      )}
    </>
  );
};
