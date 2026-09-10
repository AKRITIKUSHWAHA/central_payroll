import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout flex min-h-screen bg-[#f4f7fb] overflow-x-hidden w-full">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="main-content flex-1 p-3 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
