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

// Guard for Super Admin only routes (Payroll, Reports, Payslips, User Accounts, Permissions)
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser?.role !== 'superadmin') {
    return <Navigate to={currentUser?.role === 'staff' ? '/schedules' : '/dashboard'} replace />;
  }
  return <>{children}</>;
};

// Guard for Management/Workspace & Accounting routes (Super Admin and Admin, NOT Staff)
const ManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser?.role === 'staff') {
    return <Navigate to="/schedules" replace />;
  }
  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser?.role === 'staff') {
    return <Navigate to="/schedules" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
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
              {/* Default redirect based on user role */}
              <Route index element={<DefaultRedirect />} />

              {/* Weekly Schedules (Accessible by Staff, Admin, Super Admin) */}
              <Route path="schedules" element={<WeeklySchedules />} />

              {/* Workspace Routes (Super Admin & Admin) */}
              <Route path="dashboard" element={<ManagementRoute><Dashboard /></ManagementRoute>} />
              <Route path="employees" element={<ManagementRoute><Employees /></ManagementRoute>} />
              <Route path="employees/:id" element={<ManagementRoute><EmployeeProfile /></ManagementRoute>} />
              <Route path="contacts" element={<ManagementRoute><StaffContacts /></ManagementRoute>} />
              <Route path="leave" element={<ManagementRoute><LeaveCalendar /></ManagementRoute>} />
              <Route path="reports/audit" element={<ManagementRoute><AuditReports /></ManagementRoute>} />
              
              {/* Payroll & Financial Approval Routes (Super Admin Exclusive) */}
              <Route path="payroll" element={<SuperAdminRoute><PayrollConsole /></SuperAdminRoute>} />
              <Route path="payroll/:period" element={<SuperAdminRoute><PayrollConsole /></SuperAdminRoute>} />
              <Route path="payslips" element={<SuperAdminRoute><PayslipsView /></SuperAdminRoute>} />
              <Route path="reports" element={<SuperAdminRoute><PayrollReports /></SuperAdminRoute>} />

              {/* Customers & Accounting Routes (Super Admin & Admin) */}
              <Route path="accounts" element={<ManagementRoute><AccountsOverview /></ManagementRoute>} />
              <Route path="customers" element={<ManagementRoute><CustomersView /></ManagementRoute>} />
              <Route path="invoices" element={<ManagementRoute><InvoicesView /></ManagementRoute>} />
              <Route path="payments" element={<ManagementRoute><PaymentsView /></ManagementRoute>} />
              <Route path="aging" element={<ManagementRoute><AgingView /></ManagementRoute>} />
              <Route path="ledger" element={<ManagementRoute><GeneralLedgerView /></ManagementRoute>} />

              {/* Administration Routes */}
              <Route path="permissions" element={<SuperAdminRoute><PermissionsView /></SuperAdminRoute>} />
              <Route path="users" element={<SuperAdminRoute><UserAccounts /></SuperAdminRoute>} />
              <Route path="settings" element={<ManagementRoute><SettingsView /></ManagementRoute>} />
            </Route>

            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
