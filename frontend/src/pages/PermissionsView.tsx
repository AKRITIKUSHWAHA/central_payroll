import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { PermissionMatrix } from '../types';
import {
  ShieldCheck,
  Crown,
  Briefcase,
  Calendar,
  Lock,
  Save,
  RotateCcw,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export const PermissionsView: React.FC = () => {
  const { currentUser, refreshPermissions } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable permission states for Admin and Staff
  const [adminState, setAdminState] = useState({
    staffManagement: true,
    staffContacts: true,
    weeklySchedules: true,
    leaveCalendars: true,
    customerAccounts: true,
    generalLedger: true,
    payrollAccess: false,
    userAccountsAdmin: false,
  });

  const [staffState, setStaffState] = useState({
    shiftNotes: true,
    weeklySchedules: true,
    payrollAccess: false,
    customerInvoices: false,
    systemSettings: false,
  });

  // Load from backend / userService
  useEffect(() => {
    userService.fetchRolePermissions().then(data => {
      if (data) {
        // Map admin permissions
        const a = data.admin || {};
        setAdminState({
          staffManagement: a.employees?.view !== false,
          staffContacts: a.contacts?.view !== false,
          weeklySchedules: a.schedules?.view !== false,
          leaveCalendars: a.leave?.view !== false,
          customerAccounts: a.accounts?.view !== false,
          generalLedger: a.audit?.view !== false,
          payrollAccess: !!a.payroll?.view,
          userAccountsAdmin: !!a.userAccounts?.view,
        });

        // Map staff permissions
        const s = data.staff || {};
        setStaffState({
          shiftNotes: s.schedules?.addNotes !== false,
          weeklySchedules: s.schedules?.view !== false,
          payrollAccess: !!s.payroll?.view,
          customerInvoices: !!s.accounts?.view,
          systemSettings: !!s.settings?.view,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleToggleAdmin = (key: keyof typeof adminState) => {
    setAdminState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleStaff = (key: keyof typeof staffState) => {
    setStaffState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Build structured backend PermissionMatrix objects
      const adminPermissionsPayload: PermissionMatrix = {
        dashboard: { view: true },
        employees: {
          view: adminState.staffManagement,
          create: adminState.staffManagement,
          edit: adminState.staffManagement,
          delete: adminState.staffManagement
        },
        contacts: { view: adminState.staffContacts, edit: adminState.staffContacts },
        schedules: {
          view: adminState.weeklySchedules,
          edit: adminState.weeklySchedules,
          print: adminState.weeklySchedules,
          addNotes: true
        },
        leave: { view: adminState.leaveCalendars, manage: adminState.leaveCalendars },
        accounts: { view: adminState.customerAccounts, edit: adminState.customerAccounts },
        settings: { view: true, edit: true },
        audit: { view: adminState.generalLedger, export: adminState.generalLedger },
        reports: { view: adminState.generalLedger, export: adminState.generalLedger },
        payslips: { view: adminState.payrollAccess, print: adminState.payrollAccess, email: adminState.payrollAccess },
        payroll: {
          view: adminState.payrollAccess,
          edit: adminState.payrollAccess,
          approve: adminState.payrollAccess,
          export: adminState.payrollAccess
        },
        permissions: { view: adminState.userAccountsAdmin, edit: adminState.userAccountsAdmin },
        userAccounts: { view: adminState.userAccountsAdmin, manage: adminState.userAccountsAdmin },
      };

      const staffPermissionsPayload: PermissionMatrix = {
        dashboard: { view: false },
        employees: { view: false, create: false, edit: false, delete: false },
        payroll: {
          view: staffState.payrollAccess,
          edit: staffState.payrollAccess,
          approve: false,
          export: false
        },
        schedules: {
          view: staffState.weeklySchedules,
          edit: false,
          print: false,
          addNotes: staffState.shiftNotes
        },
        leave: { view: false, manage: false },
        contacts: { view: false, edit: false },
        reports: { view: false, export: false },
        payslips: { view: staffState.payrollAccess, print: false, email: false },
        audit: { view: false, export: false },
        permissions: { view: false, edit: false },
        userAccounts: { view: false, manage: false },
        settings: { view: staffState.systemSettings, edit: staffState.systemSettings },
        accounts: { view: staffState.customerInvoices }
      };

      await userService.saveRolePermissions({
        admin: adminPermissionsPayload,
        staff: staffPermissionsPayload,
      });

      refreshPermissions();
      showToast('Permissions saved and applied across the system.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset Administrator and Staff Member permissions back to factory defaults?')) {
      return;
    }
    await userService.resetRolePermissions();
    setAdminState({
      staffManagement: true,
      staffContacts: true,
      weeklySchedules: true,
      leaveCalendars: true,
      customerAccounts: true,
      generalLedger: true,
      payrollAccess: false,
      userAccountsAdmin: false,
    });
    setStaffState({
      shiftNotes: true,
      weeklySchedules: true,
      payrollAccess: false,
      customerInvoices: false,
      systemSettings: false,
    });
    refreshPermissions();
    showToast('Role permissions reset to system defaults.', 'info');
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Super Administrator Access Required</h2>
        <p className="text-sm font-semibold text-slate-600">
          Only the Super Administrator has permission to view and modify role access controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight flex items-center gap-2.5">
            <span>Permissions</span>
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-0.5">
            Control which workspace area an Admin Assistant can use.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="px-4 py-2.5 bg-white hover:bg-[#f8fafc] text-[#334155] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. Three Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* CARD 1: Super Administrator (Full Authority - Locked)        */}
        {/* ============================================================ */}
        <div className="border border-[#12345b]/20 bg-[#f8fafc] rounded-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#12345b] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Full Authority
              </span>
              <span className="text-2xl">👑</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#12345b]">
                Super Administrator
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-1 leading-relaxed">
                Executive authority over payroll calculation, approvals, and user accounts.
              </p>
            </div>

            <div className="pt-2 border-t border-[#e2e8f0]">
              <span className="text-[11px] font-extrabold text-[#0f766e] uppercase tracking-wider block mb-3">
                Included Permissions (All Active)
              </span>
              <ul className="space-y-3 text-xs font-bold text-[#1e293b]">
                <li className="flex items-center justify-between p-2 rounded-xl bg-teal-50/70 border border-teal-100 text-[#0f766e]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                      ✓
                    </span>
                    <span>Payroll Calculation & Approval</span>
                  </div>
                  <span className="text-[10px] font-black bg-teal-200/60 px-1.5 py-0.5 rounded text-teal-800">
                    Exclusive
                  </span>
                </li>

                <li className="flex items-center justify-between p-2 rounded-xl bg-teal-50/70 border border-teal-100 text-[#0f766e]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0f766e] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                      ✓
                    </span>
                    <span>User Accounts & Permissions</span>
                  </div>
                  <span className="text-[10px] font-black bg-teal-200/60 px-1.5 py-0.5 rounded text-teal-800">
                    Exclusive
                  </span>
                </li>

                <li className="flex items-center gap-2 p-2">
                  <span className="w-5 h-5 rounded-full bg-[#12345b] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✓
                  </span>
                  <span>Staff Management & Pay Rates</span>
                </li>

                <li className="flex items-center gap-2 p-2">
                  <span className="w-5 h-5 rounded-full bg-[#12345b] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✓
                  </span>
                  <span>Weekly Schedules & Leave Calendars</span>
                </li>

                <li className="flex items-center gap-2 p-2">
                  <span className="w-5 h-5 rounded-full bg-[#12345b] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✓
                  </span>
                  <span>Customer Invoices, Aging & General Ledger</span>
                </li>

                <li className="flex items-center gap-2 p-2">
                  <span className="w-5 h-5 rounded-full bg-[#12345b] text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✓
                  </span>
                  <span>Company Settings & System Backups</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] flex items-center gap-2 text-xs font-bold text-[#64748b]">
            <Lock className="w-3.5 h-3.5 text-[#12345b]" />
            <span>Fixed Authority • Always has full access by design</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: Administrator (Operations & Customers - Editable)     */}
        {/* ============================================================ */}
        <div className="border border-[#2f6fb3]/30 bg-white rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm flex flex-col justify-between hover:border-[#2f6fb3] transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#2f6fb3] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Operations & Customers
              </span>
              <span className="text-2xl">💼</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#12345b]">
                Administrator
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-1 leading-relaxed">
                Full control over staff roster, schedules, leave, invoicing, and ledgers.
              </p>
            </div>

            <div className="pt-2 border-t border-[#e2e8f0]">
              <span className="text-[11px] font-extrabold text-[#2f6fb3] uppercase tracking-wider block mb-3">
                Customizable Access Settings
              </span>
              <ul className="space-y-2.5 text-xs font-bold">
                {/* 1. Staff Management */}
                <li
                  onClick={() => handleToggleAdmin('staffManagement')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.staffManagement ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.staffManagement ? '✓' : ''}
                    </span>
                    <span className={adminState.staffManagement ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Staff Management & Pay Rates
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.staffManagement}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 2. Staff Contact Directory */}
                <li
                  onClick={() => handleToggleAdmin('staffContacts')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.staffContacts ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.staffContacts ? '✓' : ''}
                    </span>
                    <span className={adminState.staffContacts ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Staff Contact Directory
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.staffContacts}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 3. Weekly Schedules */}
                <li
                  onClick={() => handleToggleAdmin('weeklySchedules')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.weeklySchedules ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.weeklySchedules ? '✓' : ''}
                    </span>
                    <span className={adminState.weeklySchedules ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Weekly Schedules & Staff Shift Matrix
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.weeklySchedules}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 4. Leave Calendars */}
                <li
                  onClick={() => handleToggleAdmin('leaveCalendars')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.leaveCalendars ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.leaveCalendars ? '✓' : ''}
                    </span>
                    <span className={adminState.leaveCalendars ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Leave Calendars (Sick & Holiday)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.leaveCalendars}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 5. Customer Accounts, Invoices & Payments */}
                <li
                  onClick={() => handleToggleAdmin('customerAccounts')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.customerAccounts ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.customerAccounts ? '✓' : ''}
                    </span>
                    <span className={adminState.customerAccounts ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Customer Accounts, Invoices & Payments
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.customerAccounts}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 6. General Ledger & A/R Aging Reports */}
                <li
                  onClick={() => handleToggleAdmin('generalLedger')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.generalLedger ? 'bg-[#2f6fb3]' : 'bg-slate-300'}`}>
                      {adminState.generalLedger ? '✓' : ''}
                    </span>
                    <span className={adminState.generalLedger ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      General Ledger & A/R Aging Reports
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.generalLedger}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#2f6fb3] focus:ring-[#2f6fb3] cursor-pointer"
                  />
                </li>

                {/* 7. Payroll Access (Explicitly negative / red when disabled) */}
                <li
                  onClick={() => handleToggleAdmin('payrollAccess')}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                    adminState.payrollAccess
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50/50 border-rose-100 text-rose-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.payrollAccess ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                      {adminState.payrollAccess ? '✓' : '✕'}
                    </span>
                    <span className="font-extrabold">
                      {adminState.payrollAccess ? 'Payroll Calculation & Approval (Granted)' : 'No Payroll Calculation or Approval'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.payrollAccess}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </li>

                {/* 8. User Accounts & Permissions Admin (Explicitly negative / red when disabled) */}
                <li
                  onClick={() => handleToggleAdmin('userAccountsAdmin')}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                    adminState.userAccountsAdmin
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50/50 border-rose-100 text-rose-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${adminState.userAccountsAdmin ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                      {adminState.userAccountsAdmin ? '✓' : '✕'}
                    </span>
                    <span className="font-extrabold">
                      {adminState.userAccountsAdmin ? 'User Accounts & Permissions Admin (Granted)' : 'No User Accounts / Permissions Admin'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adminState.userAccountsAdmin}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] text-[11px] font-semibold text-[#64748b]">
            💡 Toggle checkboxes above and click <strong>Save Changes</strong> to apply immediately.
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 3: Staff Member (Roster & Notes Only - Editable)        */}
        {/* ============================================================ */}
        <div className="border border-[#e2e8f0] bg-white rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs flex flex-col justify-between hover:border-[#cbd5e1] transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#64748b] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Roster & Notes Only
              </span>
              <span className="text-2xl">📅</span>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#12345b]">
                Staff Member
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-1 leading-relaxed">
                Streamlined view for checking weekly shifts and writing shift notes.
              </p>
            </div>

            <div className="pt-2 border-t border-[#e2e8f0]">
              <span className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider block mb-3">
                Staff Permission Toggles
              </span>
              <ul className="space-y-2.5 text-xs font-bold">
                {/* 1. Shift Handover Notes */}
                <li
                  onClick={() => handleToggleStaff('shiftNotes')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${staffState.shiftNotes ? 'bg-[#0f766e]' : 'bg-slate-300'}`}>
                      {staffState.shiftNotes ? '✓' : ''}
                    </span>
                    <span className={staffState.shiftNotes ? 'text-[#0f766e] font-extrabold' : 'text-[#94a3b8] line-through'}>
                      Shift Handover Notes & Remarks
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffState.shiftNotes}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#0f766e] focus:ring-[#0f766e] cursor-pointer"
                  />
                </li>

                {/* 2. Weekly Schedules Roster */}
                <li
                  onClick={() => handleToggleStaff('weeklySchedules')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#e2e8f0]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${staffState.weeklySchedules ? 'bg-[#0f766e]' : 'bg-slate-300'}`}>
                      {staffState.weeklySchedules ? '✓' : ''}
                    </span>
                    <span className={staffState.weeklySchedules ? 'text-[#1e293b]' : 'text-[#94a3b8] line-through'}>
                      Weekly Schedules Roster View
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffState.weeklySchedules}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#0f766e] focus:ring-[#0f766e] cursor-pointer"
                  />
                </li>

                {/* 3. Payroll Access (Explicitly negative by default) */}
                <li
                  onClick={() => handleToggleStaff('payrollAccess')}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                    staffState.payrollAccess
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${staffState.payrollAccess ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      {staffState.payrollAccess ? '✓' : '✕'}
                    </span>
                    <span>
                      {staffState.payrollAccess ? 'Payroll & Salary Access (Granted)' : 'No Payroll or Salary Access'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffState.payrollAccess}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </li>

                {/* 4. Customer Invoices & Ledgers (Explicitly negative by default) */}
                <li
                  onClick={() => handleToggleStaff('customerInvoices')}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                    staffState.customerInvoices
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${staffState.customerInvoices ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      {staffState.customerInvoices ? '✓' : '✕'}
                    </span>
                    <span>
                      {staffState.customerInvoices ? 'Customer Invoices & Ledgers (Granted)' : 'No Customer Invoices or Ledgers'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffState.customerInvoices}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </li>

                {/* 5. System Settings Access (Explicitly negative by default) */}
                <li
                  onClick={() => handleToggleStaff('systemSettings')}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                    staffState.systemSettings
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${staffState.systemSettings ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      {staffState.systemSettings ? '✓' : '✕'}
                    </span>
                    <span>
                      {staffState.systemSettings ? 'System Settings Access (Granted)' : 'No System Settings Access'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffState.systemSettings}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] text-[11px] font-semibold text-[#64748b]">
            💡 Staff access is restricted by default to keep sensitive financials private.
          </div>
        </div>
      </div>

      {/* 3. Bottom Security Architecture Notice */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-3 text-xs leading-relaxed text-[#607286]">
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 text-base">
          🔒
        </div>
        <div>
          <strong className="text-[#12345b] font-black">Security Architecture:</strong> Role-based access controls are strictly enforced across UI navigation, client-side route guards, and MySQL REST API endpoints. Changes take effect across user sessions immediately.
        </div>
      </div>
    </div>
  );
};
