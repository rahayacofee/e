import React from 'react';
import { Menu, Info, ShoppingCart, TrendingUp, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface KasminiHeaderProps {
  onToggleSidebar?: () => void;
  onOpenPrinterModal?: () => void;
  dailySales?: number;
  dailyProfit?: number;
}

export const KasminiHeader: React.FC<KasminiHeaderProps> = ({
  onToggleSidebar,
  onOpenPrinterModal,
  dailySales = 0,
  dailyProfit = 0,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-[#005f56] text-white pt-3 pb-4 px-4 shadow-md select-none rounded-b-3xl">
      {/* Top Bar: Hamburger, Title with F&B pill, Version */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white"
          title="Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center Title + F&B Pill Badge */}
        <div className="flex items-center gap-1.5">
          <span className="font-black text-sm tracking-wider uppercase text-white">
            RAHAYA COFFEE
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00897b] text-white border border-white/20 shadow-xs">
            F&B
          </span>
        </div>

        {/* Right action: Bluetooth Printer button + Version */}
        <div className="flex items-center gap-2">
          {onOpenPrinterModal && (
            <button
              onClick={onOpenPrinterModal}
              className="p-1 rounded-lg hover:bg-white/10 text-teal-200 hover:text-white"
              title="Pengaturan Printer Bluetooth"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] text-teal-200/90 font-medium">
            <span>Versi 1.0.0</span>
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Embedded Summary Panel: Laporan Hari Ini, Penjualan & Profit */}
      <div className="bg-[#004d40]/70 border border-white/15 rounded-2xl p-3 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-100 mb-1.5">
          <span className="text-sm">📊</span>
          <span>Laporan Hari Ini</span>
        </div>
        <div className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center justify-between text-teal-50">
            <span className="flex items-center gap-1.5 text-[11px] font-sans text-teal-200">
              <ShoppingCart className="w-3.5 h-3.5 text-teal-300" />
              <span>Penjualan</span>
            </span>
            <span className="font-bold">: Rp. {dailySales.toLocaleString('id-ID')},-</span>
          </div>
          <div className="flex items-center justify-between text-teal-50">
            <span className="flex items-center gap-1.5 text-[11px] font-sans text-teal-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Profit</span>
            </span>
            <span className="font-bold">: Rp. {dailyProfit.toLocaleString('id-ID')},-</span>
          </div>
        </div>
      </div>
    </header>
  );
};
