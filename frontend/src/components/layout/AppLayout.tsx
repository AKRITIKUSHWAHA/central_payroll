import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout flex min-h-screen bg-[#f4f7fb] w-full relative">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`flex-1 flex flex-col min-w-0 w-full overflow-x-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[250px]'
      }`}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="main-content flex-1 p-3 sm:p-5 md:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
