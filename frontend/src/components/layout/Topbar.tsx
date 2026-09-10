import React from 'react';
import { Calendar, ShieldAlert, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Topbar: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Format current Bermuda date (Thursday, 10 Sept 2026 style)
  const todayStr = 'Thursday, 10 Sept 2026';

  return (
    <header className="no-print bg-white/80 backdrop-blur-md border-b border-[#dde6ee] px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#f4f7fb] border border-[#d9e2ea] rounded-xl text-xs font-extrabold text-[#12345b]">
          <Calendar className="w-3.5 h-3.5 text-[#2f6fb3]" />
          <span>{todayStr}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#eaf4fb] border border-[#c9def6] rounded-xl text-xs font-bold text-[#102f52]">
          <Clock className="w-3.5 h-3.5 text-[#2f6fb3]" />
          <span>Pay Period: Sept 3 - Sept 9, 2026</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-[#edf4fa] border border-[#d6e7f4] rounded-lg text-xs font-extrabold text-[#0f766e]">
          <span className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse"></span>
          Bermuda System Active
        </span>

        {currentUser?.role === 'staff' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#fff8c7] border border-[#eadc64] rounded-lg text-xs font-bold text-[#6e5a00]">
            <ShieldAlert className="w-3.5 h-3.5" />
            Staff Assistant Mode
          </span>
        )}
      </div>
    </header>
  );
};
