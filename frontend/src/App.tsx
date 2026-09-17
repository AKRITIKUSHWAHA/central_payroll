import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { SetPassword } from './pages/SetPassword';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { EmployeeProfile } from './pages/EmployeeProfile';
import { StaffContacts } from './pages/StaffContacts';
import { WeeklySchedules } from './pages/WeeklySchedules';
import { LeaveCalendar } from './pages/LeaveCalendar';
import { PayrollConsole } from './pages/PayrollConsole';
import { PayslipsView } from './pages/PayslipsView';
import { PayrollReports } from './pages/PayrollReports';
import { AuditReports } from './pages/AuditReports';
import { PermissionsView } from './pages/PermissionsView';
import { UserAccounts } from './pages/UserAccounts';
import { SettingsView } from './pages/SettingsView';
import { AccountsOverview } from './pages/AccountsOverview';
import { CustomersView } from './pages/CustomersView';
import { InvoicesView } from './pages/InvoicesView';
import { PaymentsView } from './pages/PaymentsView';
import { AgingView } from './pages/AgingView';
import { GeneralLedgerView } from './pages/GeneralLedgerView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Guard based on dynamic permission check
const DynamicRoute: React.FC<{ isAllowed: boolean; redirect?: string; children: React.ReactNode }> = ({
  isAllowed,
  redirect = '/schedules',
  children
}) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAllowed) {
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { currentUser, isAuthenticated, permissions } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser?.role === 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (currentUser?.role === 'admin') {
    if (permissions.accounts?.view) return <Navigate to="/accounts" replace />;
    if (permissions.schedules?.view) return <Navigate to="/schedules" replace />;
    if (permissions.contacts?.view) return <Navigate to="/contacts" replace />;
    if (permissions.leave?.view) return <Navigate to="/leave" replace />;
    if (permissions.employees?.view) return <Navigate to="/employees" replace />;
    if (permissions.settings?.view) return <Navigate to="/settings" replace />;
  }
  if (permissions.schedules?.view) {
    return <Navigate to="/schedules" replace />;
  }
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { currentUser, permissions } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isStaff = currentUser?.role === 'staff';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect based on user role & permissions */}
        <Route index element={<DefaultRedirect />} />

        {/* Weekly Schedules */}
        <Route path="schedules" element={<DynamicRoute isAllowed={isSuperAdmin || !!permissions.schedules?.view}><WeeklySchedules /></DynamicRoute>} />

        {/* Super Admin Exclusive Dashboard */}
        <Route path="dashboard" element={<DynamicRoute isAllowed={isSuperAdmin && !!permissions.dashboard?.view}><Dashboard /></DynamicRoute>} />

        {/* Employee Records (Pay Rates) - Superadmin or Admin if granted */}
        <Route path="employees" element={<DynamicRoute isAllowed={isSuperAdmin || !!permissions.employees?.view}><Employees /></DynamicRoute>} />
        <Route path="employees/:id" element={<DynamicRoute isAllowed={isSuperAdmin || !!permissions.employees?.view}><EmployeeProfile /></DynamicRoute>} />

        {/* Operations & Workspace Routes */}
        <Route path="contacts" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.contacts?.view)}><StaffContacts /></DynamicRoute>} />
        <Route path="leave" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.leave?.view)}><LeaveCalendar /></DynamicRoute>} />
        <Route path="reports/audit" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.audit?.view)}><AuditReports /></DynamicRoute>} />
        
        {/* Payroll & Financial Approval Routes */}
        <Route path="payroll" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.payroll?.view)}><PayrollConsole /></DynamicRoute>} />
        <Route path="payroll/:period" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.payroll?.view)}><PayrollConsole /></DynamicRoute>} />
        <Route path="payslips" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.payslips?.view)}><PayslipsView /></DynamicRoute>} />
        <Route path="reports" element={<DynamicRoute isAllowed={isSuperAdmin && !!permissions.reports?.view}><PayrollReports /></DynamicRoute>} />

        {/* Customers & Accounting Routes */}
        <Route path="accounts" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.accounts?.view)}><AccountsOverview /></DynamicRoute>} />
        <Route path="customers" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.accounts?.view)}><CustomersView /></DynamicRoute>} />
        <Route path="invoices" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.accounts?.view)}><InvoicesView /></DynamicRoute>} />
        <Route path="payments" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.accounts?.view)}><PaymentsView /></DynamicRoute>} />
        <Route path="aging" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.audit?.view && !!permissions.accounts?.view)}><AgingView /></DynamicRoute>} />
        <Route path="ledger" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.audit?.view && !!permissions.accounts?.view)}><GeneralLedgerView /></DynamicRoute>} />

        {/* Administration Routes */}
        <Route path="permissions" element={<DynamicRoute isAllowed={isSuperAdmin && !!permissions.permissions?.view}><PermissionsView /></DynamicRoute>} />
        <Route path="users" element={<DynamicRoute isAllowed={isSuperAdmin || !!permissions.userAccounts?.view}><UserAccounts /></DynamicRoute>} />
        <Route path="settings" element={<DynamicRoute isAllowed={isSuperAdmin || (!isStaff && !!permissions.settings?.view)}><SettingsView /></DynamicRoute>} />
      </Route>

      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
};

export default App;
