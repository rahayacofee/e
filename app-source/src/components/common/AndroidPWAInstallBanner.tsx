import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Tablet, Check } from 'lucide-react';

export const AndroidPWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white text-xs px-4 py-2 flex items-center justify-between shadow-xs select-none border-b border-blue-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center text-white shrink-0">
            <Tablet className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-200 truncate">
            <strong className="text-white font-bold">Android Tablet POS Ready:</strong> Pasang Rahaya Coffee POS di Tablet/HP Android Anda.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-[11px] border border-white/20 transition-all active:scale-95"
          >
            <Download className="w-3 h-3" />
            <span>Install / APK Mode</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* APK & Android Installation Guide Drawer */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Panduan Pasang di Tablet & HP Android
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs leading-relaxed">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p>
                  <strong>Metode PWA (Instant Native App):</strong> Buka tautan POS ini di browser Google Chrome pada tablet Android kasir Anda.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p>
                  Ketuk menu titik tiga (⋮) di pojok kanan atas Chrome, lalu pilih{' '}
                  <span className="font-bold text-blue-950">"Tambahkan ke Layar Utama" (Install App / Add to Home screen)</span>.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p>
                  <strong>Metode Standalone APK:</strong> Proyek ini sudah dilengkapi struktur web client dan API backend yang siap dibundel menjadi APK Android mandiri menggunakan <code>Capacitor Android</code> atau <code>TWA (Trusted Web Activity)</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Dukungan Hardware Kasir:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
                  <li>Kompatibel dengan Tablet Sunmi, iMin, Advan, Samsung Tab</li>
                  <li>Dukungan Thermal Bluetooth/USB Printer 58mm & 80mm via Print Service</li>
                  <li>Dukungan Drawer Kasir & Barcode Scanner</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 bg-blue-900 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-blue-800"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
