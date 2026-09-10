import React from 'react';
import { ShieldCheck, UserCheck, Lock } from 'lucide-react';

export const PermissionsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Role Permissions & Access Control
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Control which workspace areas Super Admin, Admin, and Staff members can access
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#d7e3ed] rounded-2xl p-6 shadow-cdCard space-y-4">
          <div className="flex items-center gap-3 text-[#12345b]">
            <ShieldCheck className="w-6 h-6 text-[#2f6fb3]" />
            <h2 className="text-lg font-black">Administrator</h2>
          </div>
          <p className="text-xs font-semibold text-[#607286] leading-relaxed">
            Full access to the Central Dispatch workspace including payroll calculations, approval, staff management, and reports.
          </p>
          <ul className="space-y-2 text-xs font-bold text-[#40566c] pt-2">
            <li className="flex items-center gap-2">✓ Dashboard KPI analytics</li>
            <li className="flex items-center gap-2">✓ Employee records & pay rates</li>
            <li className="flex items-center gap-2">✓ Payroll console, process pay, payslips</li>
            <li className="flex items-center gap-2">✓ Weekly schedules & leave calendars</li>
            <li className="flex items-center gap-2">✓ Financial & audit report exports</li>
          </ul>
        </div>

        <div className="bg-white border border-[#d7e3ed] rounded-2xl p-6 shadow-cdCard space-y-4">
          <div className="flex items-center gap-3 text-[#12345b]">
            <UserCheck className="w-6 h-6 text-[#0f766e]" />
            <h2 className="text-lg font-black">Staff Assistant</h2>
          </div>
          <p className="text-xs font-semibold text-[#607286] leading-relaxed">
            Restricted workspace access limited to viewing weekly schedules and personal payslips.
          </p>
          <ul className="space-y-2 text-xs font-bold text-[#40566c] pt-2">
            <li className="flex items-center gap-2">✓ View weekly staff rotas</li>
            <li className="flex items-center gap-2">✓ View personal leave days</li>
            <li className="flex items-center gap-2">✓ Print own payslip</li>
            <li className="flex items-center gap-2 text-[#a33b32]">✕ No payroll salary modification</li>
            <li className="flex items-center gap-2 text-[#a33b32]">✕ No user account administration</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-[#fff8c7] border border-[#eadc64] rounded-2xl text-xs font-semibold text-[#6e5a00]">
        <strong>Important:</strong> This local desktop version has role-based sign-in and screen restrictions. Because account data is stored locally in the browser profile, it is suitable for controlled use on one computer.
      </div>
    </div>
  );
};
