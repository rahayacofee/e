import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RahayaLogo } from './RahayaLogo';
import {
  LogOut,
  Clock,
  Store,
  Shield,
  UserCheck,
  Maximize2,
  ChevronDown,
  Lock,
  Printer,
  Home,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { BluetoothPrinterModal } from '../pos/BluetoothPrinterModal';
import { bluetoothPrinter } from '../../services/bluetoothPrinter';

interface TopHeaderProps {
  onOpenShiftModal?: () => void;
  onCloseShiftModal?: () => void;
  onNavigateHome?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenShiftModal,
  onCloseShiftModal,
  onNavigateHome,
}) => {
  const { user, business, activeShift, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const isPrinterConnected = bluetoothPrinter.isConnected();

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    setIsChangingPass(true);
    try {
      await api.changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordStatus('Sukses: Password Anda berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPasswordStatus(`Gagal: ${err.message}`);
    } finally {
      setIsChangingPass(false);
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'MASTER':
        return {
          label: 'Master Admin',
          color: 'bg-purple-950 text-purple-200 border-purple-800',
          icon: Shield,
        };
      case 'OWNER':
        return {
          label: 'Owner',
          color: 'bg-[#004d40] text-teal-200 border-teal-700',
          icon: Store,
        };
      case 'CASHIER':
        return {
          label: 'Kasir POS',
          color: 'bg-emerald-950 text-emerald-200 border-emerald-800',
          icon: UserCheck,
        };
      default:
        return {
          label: 'User',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: UserCheck,
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      <header className="h-16 bg-[#005f56] border-b border-[#004d40] px-3 sm:px-6 flex items-center justify-between text-white shrink-0 shadow-md z-30 select-none">
        {/* Brand & Outlet Name */}
        <div className="flex items-center gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Kembali ke Beranda"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Beranda</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <RahayaLogo size="sm" showText={false} theme="dark" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm md:text-base tracking-wide uppercase text-white">
                  RAHAYA COFFEE
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#00897b] text-white border border-white/20 shadow-2xs">
                  F&B
                </span>
              </div>
              {business ? (
                <span className="text-[11px] text-teal-100 truncate max-w-[160px] sm:max-w-xs font-medium">
                  {business.name}
                </span>
              ) : (
                <span className="text-[11px] text-teal-200 font-medium">
                  {user?.role === 'MASTER' ? 'Master Control System' : 'Portal Manajemen'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Shift Status, Bluetooth Printer, Fullscreen, User Info */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Bluetooth Printer Shortcut */}
          <button
            onClick={() => setShowPrinterModal(true)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isPrinterConnected
                ? 'bg-emerald-800/60 border-emerald-400 text-emerald-200'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-teal-100'
            }`}
            title="Pengaturan Printer Bluetooth ESC/POS"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden lg:inline text-[11px]">
              {isPrinterConnected ? 'Printer Siap' : 'Printer'}
            </span>
          </button>

          {/* Shift status for Cashier */}
          {user?.role === 'CASHIER' && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {activeShift ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-[11px]">Shift Aktif</span>
                  <button
                    onClick={onCloseShiftModal}
                    className="ml-1 text-[11px] underline hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenShiftModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/30 border border-amber-400/50 text-amber-200 hover:bg-amber-500/40 font-semibold text-[11px]"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Buka Shift</span>
                </button>
              )}
            </div>
          )}

          {/* Android Tablet Fullscreen helper */}
          <button
            onClick={toggleFullScreen}
            title="Layar Penuh (Tablet Mode)"
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* User profile dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#004d40] flex items-center justify-center text-teal-200 shrink-0">
                <RoleIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {user?.full_name || user?.username}
                </span>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  {roleInfo.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-teal-200" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs text-slate-500">Masuk sebagai</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || user?.username}
                  </p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase bg-teal-50 text-teal-900">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(false);
                    setShowPrinterModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <Printer className="w-4 h-4 text-teal-700" />
                  <span>Printer Bluetooth ESC/POS</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Ubah Password</span>
                </button>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left mt-1"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Ganti Password Akun</h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui kata sandi untuk akun {user?.username} ({user?.role})
            </p>

            {passwordStatus && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 ${
                  passwordStatus.startsWith('Sukses')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordStatus}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Lama
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  placeholder="Masukkan password saat ini"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Baru (min 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  placeholder="Masukkan password baru"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs"
                >
                  {isChangingPass ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bluetooth Printer Modal */}
      {showPrinterModal && (
        <BluetoothPrinterModal
          isOpen={true}
          onClose={() => setShowPrinterModal(false)}
        />
      )}
    </>
  );
};
