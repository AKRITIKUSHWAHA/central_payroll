import React from 'react';
import { Calendar, ShieldAlert, Clock, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onOpenMobile?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobile }) => {
  const { currentUser } = useAuth();
  
  // Format current Bermuda date (Thursday, 10 Sept 2026 style)
  const todayStr = 'Thursday, 10 Sept 2026';

  return (
    <header className="no-print bg-white/90 backdrop-blur-md border-b border-[#dde6ee] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm w-full">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Drawer Trigger Button */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-xl bg-[#f4f7fb] border border-[#d9e2ea] text-[#12345b] hover:bg-[#e6f0fa] transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden xs:flex items-center gap-2 px-3 sm:px-3.5 py-1.5 bg-[#f4f7fb] border border-[#d9e2ea] rounded-xl text-xs font-extrabold text-[#12345b]">
          <Calendar className="w-3.5 h-3.5 text-[#2f6fb3]" />
          <span>{todayStr}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#eaf4fb] border border-[#c9def6] rounded-xl text-xs font-bold text-[#102f52]">
          <Clock className="w-3.5 h-3.5 text-[#2f6fb3]" />
          <span>Pay Period: Sept 3 - Sept 9, 2026</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-[#edf4fa] border border-[#d6e7f4] rounded-lg text-xs font-extrabold text-[#0f766e]">
          <span className="w-2 h-2 rounded-full bg-[#0f766e] animate-pulse"></span>
          Bermuda System Active
        </span>

        {currentUser?.role === 'staff' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#fff8c7] border border-[#eadc64] rounded-lg text-[11px] sm:text-xs font-bold text-[#6e5a00]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Staff Assistant Mode</span>
            <span className="sm:hidden">Staff Mode</span>
          </span>
        )}
      </div>
    </header>
  );
};
