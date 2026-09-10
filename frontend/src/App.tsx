import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/:id" element={<EmployeeProfile />} />
              <Route path="contacts" element={<StaffContacts />} />
              <Route path="schedules" element={<WeeklySchedules />} />
              <Route path="leave" element={<LeaveCalendar />} />
              <Route path="payroll" element={<PayrollConsole />} />
              <Route path="payroll/:period" element={<PayrollConsole />} />
              <Route path="payslips" element={<PayslipsView />} />
              <Route path="reports" element={<PayrollReports />} />
              <Route path="reports/audit" element={<AuditReports />} />
              <Route path="permissions" element={<PermissionsView />} />
              <Route path="users" element={<UserAccounts />} />
              <Route path="settings" element={<SettingsView />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
