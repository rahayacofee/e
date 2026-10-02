import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200/80 text-slate-900',
    accent: 'bg-gradient-to-br from-blue-900 to-blue-950 border-blue-800 text-white',
    success: 'bg-white border-slate-200/80 text-slate-900',
    warning: 'bg-white border-amber-200 text-slate-900',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-700',
    accent: 'bg-white/10 text-white',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <div
      className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-sm ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-wider ${
              variant === 'accent' ? 'text-blue-200' : 'text-slate-500'
            }`}
          >
            {title}
          </p>
          <h4
            className={`text-2xl font-bold tracking-tight mt-1 ${
              variant === 'accent' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {value}
          </h4>
        </div>
        <div className={`p-2.5 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subValue || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={trend.isPositive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
              {trend.value}
            </span>
          )}
          {subValue && (
            <span className={variant === 'accent' ? 'text-blue-200/80' : 'text-slate-500'}>
              {subValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
