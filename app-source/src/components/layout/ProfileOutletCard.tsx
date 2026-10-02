import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Edit2, MapPin, User, Store, Shield } from 'lucide-react';
import { RahayaLogo } from './RahayaLogo';

interface ProfileOutletCardProps {
  onEditProfile?: () => void;
  onEditOutlet?: () => void;
}

export const ProfileOutletCard: React.FC<ProfileOutletCardProps> = ({
  onEditProfile,
  onEditOutlet,
}) => {
  const { user, business, logout } = useAuth();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'MASTER':
        return 'Master Admin';
      case 'OWNER':
        return 'Owner';
      case 'CASHIER':
        return 'Kasir';
      default:
        return 'User';
    }
  };

  return (
    <div className="space-y-2.5 select-none">
      {/* 1. User Role Pill & Quick Actions */}
      <div className="bg-white rounded-2xl px-3.5 py-2 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
            {user?.role === 'MASTER' ? (
              <Shield className="w-4 h-4 text-purple-700" />
            ) : user?.role === 'OWNER' ? (
              <User className="w-4 h-4 text-teal-700" />
            ) : (
              <User className="w-4 h-4 text-emerald-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800 tracking-tight">
                {getRoleLabel()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({user?.username})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Edit Profil"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Business / Outlet Card */}
      {business && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Circular Store Emblem */}
            <div className="w-11 h-11 rounded-full bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
              <RahayaLogo size="sm" showText={false} />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                {business.name}
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{business.address || 'Alamat outlet belum diset'}</span>
              </div>
            </div>
          </div>

          {onEditOutlet && user?.role === 'OWNER' && (
            <button
              onClick={onEditOutlet}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-2"
              title="Edit Data Outlet"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
