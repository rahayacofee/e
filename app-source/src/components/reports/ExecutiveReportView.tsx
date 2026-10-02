import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  Download,
  Award,
  Clock,
  ShoppingBag,
  Store,
  Tag,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ExecutiveReportData,
  computeExecutiveAnalytics,
  exportExecutiveReportXLSX,
  exportExecutiveReportCSV,
  printFormattedReport,
} from '../../utils/exportReport';

interface ExecutiveReportViewProps {
  businessName: string;
  periodLabel: string;
  transactions: any[];
  summary: any;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  businessName,
  periodLabel,
  transactions,
  summary,
}) => {
  const data: ExecutiveReportData = computeExecutiveAnalytics(
    businessName,
    periodLabel,
    transactions,
    summary
  );

  const [activeTab, setActiveTab] = useState<'visual' | 'table'>('visual');

  const handleExportXLSX = () => {
    exportExecutiveReportXLSX(
      `Laporan-Penjualan-${businessName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}`,
      businessName,
      periodLabel,
      transactions,
      summary
    );
  };

  const handleExportCSV = () => {
    exportExecutiveReportCSV(
      `Laporan-Penjualan-${businessName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}`,
      businessName,
      periodLabel,
      transactions,
      summary
    );
  };

  const handlePrint = () => {
    printFormattedReport(
      'LAPORAN PENJUALAN EKSEKUTIF',
      businessName,
      periodLabel,
      transactions,
      summary
    );
  };

  return (
    <div className="space-y-4 select-none">
      {/* Action Header: Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <div>
          <span className="text-xs font-black text-slate-800 tracking-tight block">
            Format Laporan Penjualan (Sesuai Foto Referensi)
          </span>
          <span className="text-[11px] text-slate-500">
            Ekspor langsung ke Excel (.XLSX) dan CSV (.CSV) dengan struktur multi-sheet & klasifikasi shares
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            title="Download Excel sesuai format foto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (.XLSX)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            title="Download CSV sesuai format foto"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh CSV (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Cetak format ini"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container Styled Matching Photo Exactly */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-7 shadow-md overflow-hidden max-w-5xl mx-auto">
        {/* Brand Banner */}
        <div className="text-center pb-3">
          <h1 className="text-2xl sm:text-3xl font-black text-[#78350f] tracking-wide uppercase">
            {data.businessName || 'RAHAYA COFFEE SHOP'}
          </h1>
        </div>

        {/* Black Subheader Bar */}
        <div className="bg-slate-950 text-white px-4 py-2 rounded-sm flex items-center justify-between font-bold text-xs sm:text-sm tracking-wider uppercase mb-3">
          <span>LAPORAN PENJUALAN</span>
          <span className="font-mono text-xs">{data.periodLabel.toUpperCase()}</span>
        </div>

        {/* Top 3 KPI Financial Blocks */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="flex flex-col text-center rounded-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-800 text-white font-bold text-[10px] sm:text-xs py-1.5 uppercase">
              PENDAPATAN
            </div>
            <div className="bg-[#86efac] text-slate-950 font-black text-xs sm:text-base py-3 px-1 truncate">
              {data.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex flex-col text-center rounded-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-800 text-white font-bold text-[10px] sm:text-xs py-1.5 uppercase">
              HPP
            </div>
            <div className="bg-white text-slate-900 font-black text-xs sm:text-base py-3 px-1 truncate">
              {data.hpp.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex flex-col text-center rounded-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-800 text-white font-bold text-[10px] sm:text-xs py-1.5 uppercase">
              LABA/RUGI
            </div>
            <div className="bg-[#86efac] text-slate-950 font-black text-xs sm:text-base py-3 px-1 truncate">
              {data.netProfit.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: PENJUALAN TERTINGGI (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Header: Penjualan Tertinggi */}
            <div className="bg-[#4d6b2c] text-white text-center font-bold text-xs py-1.5 rounded-xs tracking-wider uppercase">
              PENJUALAN TERTINGGI
            </div>

            {/* 1. PRODUK */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>PRODUK</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.topProducts.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px]">{p.name}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {p.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. KATEGORI */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>KATEGORI</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.topCategories.slice(0, 3).map((c, idx) => (
                  <div
                    key={c.name}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px] uppercase">{c.name}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {c.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. KISARAN HARGA */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>KISARAN HARGA</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.priceRanges.slice(0, 3).map((pr, idx) => (
                  <div
                    key={pr.range}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px]">{pr.range}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {pr.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. OUTLET */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>OUTLET</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.outlets.slice(0, 3).map((o, idx) => (
                  <div
                    key={o.name}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px] uppercase">{o.name}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {o.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. RENTANG WAKTU (Peak Hours) */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>RENTANG WAKTU</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.timeRanges.slice(0, 3).map((tr, idx) => (
                  <div
                    key={tr.time}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px] font-mono">{tr.time}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {tr.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. JALUR PEMASARAN */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <div className="bg-slate-100 px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-700 border-b border-slate-200">
                <span>JALUR PEMASARAN</span>
                <span>SHARES</span>
              </div>
              <div className="p-1 space-y-1 text-xs">
                {data.salesChannels.slice(0, 3).map((sc, idx) => (
                  <div
                    key={sc.channel}
                    className={`flex items-center justify-between px-2 py-1 rounded-xs ${
                      idx === 0
                        ? 'bg-[#84a953] text-white font-bold'
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {idx === 0 ? (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          1
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 w-3 text-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate text-[11px] uppercase">{sc.channel}</span>
                    </div>
                    <span className="font-bold text-[11px] shrink-0">
                      {sc.share.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Trend Chart & Monthly Performance Table (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            {/* Visual Trend Chart Canvas / Representation */}
            <div className="border border-slate-300 rounded-xs p-3 bg-white">
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800">
                  Tren Penjualan Bulanan (Juta Rp)
                </span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-[#ffedd5] border border-amber-300 inline-block" />
                    Target
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-[#4d6b2c] inline-block" />
                    Tahun Ini
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-[#b91c1c] inline-block" />
                    Tahun Lalu
                  </span>
                </div>
              </div>

              {/* Bar / Column Trend simulation */}
              <div className="h-44 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-slate-300">
                {data.monthlyPerformance.map((m) => {
                  const maxTarget = 300000000;
                  const curHeight = Math.min(100, Math.round((m.currentYear / maxTarget) * 100));
                  const lastHeight = Math.min(100, Math.round((m.lastYear / maxTarget) * 100));

                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full bg-[#fed7aa]/40 h-32 relative flex items-end justify-center rounded-t-xs">
                        {/* Last year bar */}
                        <div
                          style={{ height: `${lastHeight}%` }}
                          className="w-1.5 bg-rose-400 rounded-t-xs mr-0.5"
                          title={`Tahun Lalu: Rp ${m.lastYear.toLocaleString('id-ID')}`}
                        />
                        {/* Current year bar */}
                        <div
                          style={{ height: `${curHeight}%` }}
                          className="w-2.5 bg-[#4d6b2c] rounded-t-xs"
                          title={`Tahun Ini: Rp ${m.currentYear.toLocaleString('id-ID')}`}
                        />
                      </div>
                      <span className="text-[9px] text-slate-600 font-mono mt-1">
                        {m.month.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Target & Comparison Table */}
            <div className="border border-slate-300 rounded-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px] sm:text-[11px]">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold uppercase text-[9px] sm:text-[10px]">
                    <th className="py-2 px-2 border-r border-slate-800">BULAN</th>
                    <th className="py-2 px-2 text-right border-r border-slate-800">TAHUN INI</th>
                    <th className="py-2 px-1 text-center border-r border-slate-800">
                      % THDP<br />THN LALU
                    </th>
                    <th className="py-2 px-2 text-right border-r border-slate-800">TAHUN LALU</th>
                    <th className="py-2 px-1 text-center border-r border-slate-800">
                      % THDP<br />TARGET
                    </th>
                    <th className="py-2 px-2 text-right">TARGET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {data.monthlyPerformance.map((m, idx) => (
                    <tr
                      key={m.month}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <td className="py-1.5 px-2 font-bold text-slate-800 font-sans border-r border-slate-200">
                        {m.month}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-slate-900 border-r border-slate-200 bg-[#dcfce7]/40">
                        {m.currentYear > 0
                          ? m.currentYear.toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td
                        className={`py-1.5 px-1 text-center font-bold border-r border-slate-200 ${
                          m.pctVsLastYear >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {m.pctVsLastYear}%
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-700 border-r border-slate-200">
                        {m.lastYear.toLocaleString('id-ID')}
                      </td>
                      <td
                        className={`py-1.5 px-1 text-center font-bold border-r border-slate-200 ${
                          m.pctVsTarget >= 100
                            ? 'text-emerald-700'
                            : m.pctVsTarget > 0
                            ? 'text-amber-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {m.pctVsTarget}%
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-800 font-bold bg-[#ffedd5]/50">
                        {m.target.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
