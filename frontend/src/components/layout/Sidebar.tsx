import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CalendarDays,
  Contact,
  CalendarRange,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PieChart,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentUser, logout, permissions } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'staff': return 'Staff Assistant';
      default: return 'User';
    }
  };

  const workspaceNavItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: permissions.dashboard.view },
    { to: '/employees', label: 'Employees', icon: Users, visible: permissions.employees.view },
    { to: '/payroll', label: 'Payroll', icon: DollarSign, visible: permissions.payroll.view },
    { to: '/leave', label: 'Leave Calendars', icon: CalendarDays, visible: permissions.leave.view },
    { to: '/contacts', label: 'Staff Contact Details', icon: Contact, visible: permissions.contacts.view },
    { to: '/schedules', label: 'Weekly Schedules', icon: CalendarRange, visible: permissions.schedules.view },
    { to: '/reports', label: 'Payroll Reports', icon: FileText, visible: permissions.reports.view },
    { to: '/reports/audit', label: 'Audit Reports', icon: ClipboardList, visible: permissions.audit.view },
    { to: '/payslips', label: 'Payslips', icon: PieChart, visible: permissions.payslips.view },
  ];

  const adminNavItems = [
    { to: '/permissions', label: 'Permissions', icon: ShieldCheck, visible: permissions.permissions.view },
    { to: '/users', label: 'User Accounts', icon: UserCog, visible: permissions.userAccounts.view },
    { to: '/settings', label: 'Settings', icon: Settings, visible: permissions.settings.view },
  ];

  return (
    <aside
      className={`sidebar-container bg-white border-r border-[#dde6ee] flex flex-col justify-between transition-all duration-300 relative h-screen sticky top-0 z-30 ${
        collapsed ? 'w-[72px] p-3' : 'w-[250px] p-4'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 bg-white border border-[#c9d7e6] text-[#456078] hover:text-[#12345b] p-1 rounded-full shadow-sm z-40 transition-transform hover:scale-105"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div>
        {/* Brand Header */}
        <div className={`flex items-center gap-2.5 pb-4 mb-2 border-b border-[#f0f4f8] ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-7 h-7 rounded-full bg-[#0b7895] text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
            ▶
          </div>
          {!collapsed && (
            <span className="font-extrabold text-[#25384b] text-lg tracking-tight">
              Central Dispatch
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
          {/* WORKSPACE Category */}
          <div>
            {!collapsed && (
              <div className="text-[11px] font-extrabold tracking-wider text-[#8292a3] uppercase px-3 py-1.5 mb-1">
                WORKSPACE
              </div>
            )}
            <nav className="space-y-0.5">
              {workspaceNavItems.filter(item => item.visible).map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        isActive
                          ? 'bg-[#e6e8ea] text-[#20262d] font-bold shadow-sm'
                          : 'text-[#4b5563] hover:bg-[#f0f4f7] hover:text-[#12345b]'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 text-[#2f6fb3]" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* ADMINISTRATION Category */}
          {adminNavItems.some(i => i.visible) && (
            <div>
              {!collapsed && (
                <div className="text-[11px] font-extrabold tracking-wider text-[#8292a3] uppercase px-3 py-1.5 mb-1">
                  ADMINISTRATION
                </div>
              )}
              <nav className="space-y-0.5">
                {adminNavItems.filter(item => item.visible).map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isActive
                            ? 'bg-[#e6e8ea] text-[#20262d] font-bold shadow-sm'
                            : 'text-[#4b5563] hover:bg-[#f0f4f7] hover:text-[#12345b]'
                        } ${collapsed ? 'justify-center px-0' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-[#2f6fb3]" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* User Chip Section */}
      <div className={`border-t border-[#d7e2ec] pt-3 ${collapsed ? 'text-center' : 'px-1'}`}>
        {!collapsed ? (
          <div>
            <div className="font-extrabold text-[#12345b] text-sm truncate">
              {currentUser?.displayName || currentUser?.username || 'Not signed in'}
            </div>
            <div className="text-xs font-semibold text-[#607286] mb-3">
              {getRoleLabel(currentUser?.role)}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-[#d7e2ec] hover:bg-[#edf5fb] hover:border-[#2f6fb3] text-[#12345b] font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-2.5 bg-white border border-[#d7e2ec] hover:bg-[#edf5fb] text-[#12345b] rounded-xl flex items-center justify-center transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
