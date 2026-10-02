import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import { bluetoothPrinter, PaperWidth, PrinterDevice } from '../../services/bluetoothPrinter';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ isOpen, onClose }) => {
  const [device, setDevice] = useState<PrinterDevice | null>(null);
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(bluetoothPrinter.getPaperWidth());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    isIframeBlocked?: boolean;
  } | null>(null);

  const isInIframe = bluetoothPrinter.isInIframe();

  useEffect(() => {
    if (isOpen) {
      setDevice(bluetoothPrinter.getConnectedDevice());
      setPaperWidth(bluetoothPrinter.getPaperWidth());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsScanning(true);
    setStatusMessage(null);
    try {
      const connected = await bluetoothPrinter.connect();
      setDevice(connected);
      setStatusMessage({
        type: 'success',
        text: `Berhasil terhubung ke ${connected.name}! Printer siap digunakan.`,
      });
    } catch (err: any) {
      const isBlocked =
        err.isIframeBlocked ||
        err.message?.toLowerCase().includes('permissions policy') ||
        err.message?.toLowerCase().includes('disallowed');

      setStatusMessage({
        type: 'error',
        text: isBlocked
          ? 'Browser Chrome memblokir Bluetooth karena aplikasi berjalan di dalam frame preview AI Studio (Permissions Policy). Buka aplikasi di Tab Mandiri agar HP Android dapat langsung mendeteksi printer Bluetooth.'
          : err.message || 'Gagal memindai atau menghubungkan printer Bluetooth.',
        isIframeBlocked: isBlocked,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinter.disconnect();
    setDevice(null);
    setStatusMessage({
      type: 'info',
      text: 'Printer Bluetooth telah diputus.',
    });
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      if (device && bluetoothPrinter.isConnected()) {
        await bluetoothPrinter.testPrint();
        setStatusMessage({
          type: 'success',
          text: 'Test print berhasil dikirim ke printer thermal Bluetooth!',
        });
      } else {
        // Fallback: system print thermal receipt preview
        window.print();
        setStatusMessage({
          type: 'info',
          text: 'Membuka dialog cetak thermal browser. Hubungkan Bluetooth di Tab Mandiri untuk cetak langsung ke hardware.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengirim test print.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleWidthChange = (w: PaperWidth) => {
    setPaperWidth(w);
    bluetoothPrinter.setPaperWidth(w);
  };

  const handleOpenStandalone = () => {
    // Open direct app URL outside of AI Studio iframe
    const targetUrl = window.location.origin || window.location.href;
    window.open(targetUrl, '_blank');
  };

  const handleCopyLink = () => {
    const targetUrl = window.location.origin || window.location.href;
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#005f56] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Printer Bluetooth ESC/POS</h3>
              <p className="text-[10px] text-teal-100">Thermal Struk 58mm / 80mm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
          {/* Iframe Notice Banner if opened in AI Studio editor frame */}
          {(isInIframe || statusMessage?.isIframeBlocked) && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-snug">
                  <strong className="font-bold text-amber-900 block mb-0.5">
                    Mode Iframe AI Studio Terdeteksi:
                  </strong>
                  Browser Android memblokir pemindaian Bluetooth hardware jika berada di dalam iframe preview editor.
                </div>
              </div>
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleOpenStandalone}
                  className="flex-1 py-2 px-3 bg-[#005f56] hover:bg-[#004d40] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Mandiri</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Link Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-800">
                💡 Di Tab Mandiri, Chrome Android akan langsung memunculkan jendela pop-up pairing Bluetooth Android untuk memilih printer thermal Anda.
              </p>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${
                  device ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Bluetooth className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">
                  {device ? device.name : 'Belum Ada Printer Terhubung'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      device ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    {device ? 'Terhubung & Siap Mencetak' : 'Offline / Terputus'}
                  </span>
                </div>
              </div>
            </div>

            {device ? (
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-[10px] font-bold hover:bg-rose-100 transition-colors shrink-0 ml-2"
              >
                Putuskan
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isScanning}
                className="px-3 py-2 rounded-xl bg-[#005f56] hover:bg-[#004d40] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all active:scale-95 shrink-0 ml-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memindai...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Scan & Pasangkan</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Paper Width Selection: 58mm vs 80mm */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ukuran Kertas Thermal:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleWidthChange('58mm')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paperWidth === '58mm'
                    ? 'border-[#005f56] bg-teal-50 text-[#004d40] font-bold ring-2 ring-[#005f56]/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-black">58 mm (Standar)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">32 Kolom Karakter</div>
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('80mm')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paperWidth === '80mm'
                    ? 'border-[#005f56] bg-teal-50 text-[#004d40] font-bold ring-2 ring-[#005f56]/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-black">80 mm (Lebar)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">48 Kolom Karakter</div>
              </button>
            </div>
          </div>

          {/* Status Message feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
              {statusMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
              <div className="flex-1 leading-relaxed">
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* Action Buttons: Test Print & Close */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleTestPrint}
              disabled={isTesting}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Test Print...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Uji Cetak (Test Print)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>

          {/* Android Bluetooth tips */}
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Panduan Koneksi Printer Thermal:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>Nyalakan Bluetooth & Lokasi pada HP/Tablet Android.</li>
              <li>Nyalakan printer thermal (lampu power/status biru atau hijau).</li>
              <li>Buka di Tab Mandiri atau install PWA agar Chrome memberikan izin Bluetooth langsung.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
