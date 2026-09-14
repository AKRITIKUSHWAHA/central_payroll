import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const PermissionsView: React.FC = () => {
  const [permissionsData, setPermissionsData] = useState<any>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: any }>('/permissions').then(res => {
      if (res && res.success && res.data) {
        setPermissionsData(res.data);
      }
    });
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
          Permissions
        </h1>
        <p className="text-sm font-semibold text-[#607286] mt-0.5">
          Control which workspace area an Admin Assistant can use.
        </p>
      </div>

      {/* Main Panel */}
      <section className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-6">
        {/* Permissions 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Super Administrator */}
          <div className="border border-[#12345b]/20 bg-[#f8fafc] rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-[#12345b] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Full Authority
              </span>
              <span className="text-xl">👑</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#12345b]">
                Super Administrator
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-0.5">
                Executive authority over payroll calculation, approvals, and user accounts.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#1e293b] pt-2 border-t border-[#e2e8f0]">
              <li className="flex items-center gap-2 text-[#0f766e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] flex-shrink-0" />
                <span>Payroll Calculation & Approval (Exclusive)</span>
              </li>
              <li className="flex items-center gap-2 text-[#0f766e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] flex-shrink-0" />
                <span>User Accounts & Permissions (Exclusive)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12345b] flex-shrink-0" />
                <span>Staff Management & Pay Rates</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12345b] flex-shrink-0" />
                <span>Weekly Schedules & Leave Calendars</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12345b] flex-shrink-0" />
                <span>Customer Invoices, Aging & General Ledger</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12345b] flex-shrink-0" />
                <span>Company Settings & System Backups</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Administrator */}
          <div className="border border-[#2f6fb3]/20 bg-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-[#2f6fb3] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Operations & Customers
              </span>
              <span className="text-xl">💼</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#12345b]">
                Administrator
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-0.5">
                Full control over staff roster, schedules, leave, invoicing, and ledgers.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#334155] pt-2 border-t border-[#e2e8f0]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>Staff Management & Pay Rates</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>Staff Contact Directory</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>Weekly Schedules & Staff Shift Matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>Leave Calendars (Sick & Holiday)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>Customer Accounts, Invoices & Payments</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2f6fb3] flex-shrink-0" />
                <span>General Ledger & A/R Aging Reports</span>
              </li>
              <li className="flex items-center gap-2 text-rose-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span>No Payroll Calculation or Approval</span>
              </li>
              <li className="flex items-center gap-2 text-rose-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span>No User Accounts / Permissions Admin</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Staff */}
          <div className="border border-[#e2e8f0] bg-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-[#64748b] text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Roster & Notes Only
              </span>
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#12345b]">
                Staff Member
              </h2>
              <p className="text-xs font-semibold text-[#607286] mt-0.5">
                Streamlined view for checking weekly shifts and writing shift notes.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#475569] pt-2 border-t border-[#e2e8f0]">
              <li className="flex items-center gap-2 text-[#0f766e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] flex-shrink-0" />
                <span>Shift Handover Notes & Remarks</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                <span>No Payroll or Salary Access</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                <span>No Customer Invoices or Ledgers</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                <span>No System Settings Access</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="pt-3 text-xs leading-relaxed text-[#607286] border-t border-[#edf2f7] flex items-center gap-2">
          <span>🔒</span>
          <span>
            <strong className="text-[#12345b] font-extrabold">Security Architecture:</strong> Role-based access controls are strictly enforced across UI navigation, client-side route guards, and MySQL REST API endpoints.
          </span>
        </div>
      </section>
    </div>
  );
};
