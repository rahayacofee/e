import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Memuat data...',
  subMessage = 'Sinkronisasi dengan backend server Rahaya Coffee',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 mb-4 animate-spin">
        <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{message}</h3>
      {subMessage && <p className="text-xs text-slate-500 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
};
