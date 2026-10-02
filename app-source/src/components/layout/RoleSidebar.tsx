import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Database,
  Coffee,
  ShoppingBag,
  Package,
  Receipt,
  BarChart3,
  Clock,
  Wallet,
  Settings,
  User,
} from 'lucide-react';

interface RoleSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const RoleSidebar: React.FC<RoleSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();

  // Navigation definition strictly tailored to the 3 roles
  const getNavItems = () => {
    switch (user?.role) {
      case 'MASTER':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'owners', label: 'Mitra Owner', icon: Users },
          { id: 'settings', label: 'Settings & DB', icon: Database },
        ];
      case 'OWNER':
        return [
          { id: 'dashboard', label: 'Beranda Hub', icon: LayoutDashboard },
          { id: 'pos', label: 'POS Kasir', icon: Coffee },
          { id: 'products', label: 'Produk', icon: ShoppingBag },
          { id: 'stock', label: 'Stok', icon: Package },
          { id: 'transactions', label: 'Transaksi', icon: Receipt },
          { id: 'reports', label: 'Laporan', icon: BarChart3 },
          { id: 'cashiers', label: 'Staf Kasir', icon: Users },
          { id: 'shifts', label: 'Shift Kasir', icon: Clock },
          { id: 'expenses', label: 'Pengeluaran', icon: Wallet },
          { id: 'settings', label: 'Pengaturan', icon: Settings },
        ];
      case 'CASHIER':
        return [
          { id: 'dashboard', label: 'Beranda Hub', icon: LayoutDashboard },
          { id: 'pos', label: 'POS Kasir', icon: Coffee },
          { id: 'shift', label: 'Shift Kasir', icon: Clock },
          { id: 'transactions', label: 'Transaksi Saya', icon: Receipt },
          { id: 'reports', label: 'Laporan Saya', icon: BarChart3 },
          { id: 'profile', label: 'Profil Saya', icon: User },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop & Tablet Vertical Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-56 bg-white border-r border-slate-200 shrink-0 select-none py-4 px-2 lg:px-3 justify-between">
        <div className="space-y-1">
          <div className="hidden lg:block px-3 py-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu {user?.role}
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#005f56] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-teal-50/60'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="hidden lg:inline-block truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom helper info */}
        <div className="hidden lg:block p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-800 text-center">
          <p className="font-extrabold text-[#004d40]">Rahaya Coffee POS</p>
          <p className="text-[10px] text-teal-600 mt-0.5">Android Ready • v1.0</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar for smartphones / narrow screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
                isActive ? 'text-[#005f56]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
