import React, { useState } from 'react';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { EmailPayslipModal } from '../components/EmailPayslipModal';
import { Printer, Mail, Download, PieChart, Building, User } from 'lucide-react';

export const PayslipsView: React.FC = () => {
  const employees = employeeService.getEmployees();
  const currentPeriod = payrollService.getCurrentDraft();
  
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const selectedEmp = employees.find(e => e.id === selectedEmpId) || employees[0];
  const item = currentPeriod.items.find(i => i.employeeId === selectedEmp.employeeId || i.employeeName === selectedEmp.displayName) || currentPeriod.items[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Payslips Generator
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Preview, print, and email individual Bermuda staff payslips
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1.5">
              Select Employee
            </label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.displayName} ({emp.position})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2 justify-end">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Payslip</span>
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              className="px-4 py-2.5 bg-[#0f766e] hover:bg-[#0c5e58] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Email Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Central Dispatch Payslip Preview Card */}
      <div className="bg-white border border-[#c8d7e5] rounded-2xl p-8 shadow-cdModal max-w-3xl mx-auto space-y-6 border-t-8 border-t-[#12345b]">
        {/* Payslip Header */}
        <div className="flex items-center justify-between border-b border-[#dde7f0] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0b7895] text-white flex items-center justify-center font-black text-base shadow-sm">
              ▶
            </div>
            <div>
              <h2 className="text-xl font-black text-[#12345b] tracking-tight">
                CENTRAL DISPATCH
              </h2>
              <p className="text-xs font-bold text-[#607286]">
                Hamilton, Bermuda • Tel: (441) 292-1234
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-[#edf4fa] border border-[#c9def6] rounded-lg text-xs font-black text-[#12345b]">
              STATEMENT OF EARNINGS
            </span>
            <div className="text-xs font-extrabold text-[#607286] mt-2">
              Pay Period: {currentPeriod.periodStart} to {currentPeriod.periodEnd}
            </div>
            <div className="text-xs font-semibold text-[#8292a3]">
              Pay Date: {currentPeriod.payDate}
            </div>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-[#f8fbfd] border border-[#dde7f0] rounded-xl text-xs font-semibold">
          <div>
            <span className="text-[#607286] block font-bold">Employee Name:</span>
            <strong className="text-sm font-black text-[#12345b]">{selectedEmp.displayName}</strong>
          </div>
          <div>
            <span className="text-[#607286] block font-bold">Employee ID:</span>
            <strong className="text-sm font-extrabold text-[#12345b]">{selectedEmp.employeeId}</strong>
          </div>
          <div>
            <span className="text-[#607286] block font-bold">Position:</span>
            <strong className="text-[#1c2b3a]">{selectedEmp.position}</strong>
          </div>
          <div>
            <span className="text-[#607286] block font-bold">Department:</span>
            <strong className="text-[#1c2b3a]">{selectedEmp.department}</strong>
          </div>
        </div>

        {/* Earnings & Deductions Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#12345b] uppercase tracking-wider border-b border-[#dde7f0] pb-1">
            Earnings & Rates Breakdown
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Regular Hours</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">{item?.regularHours || 40} hrs</span>
            </div>
            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Regular Rate</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">${item?.regularRate.toFixed(2) || selectedEmp.payRate.toFixed(2)}/hr</span>
            </div>
            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Regular Pay</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">${item?.regularPay.toFixed(2) || (selectedEmp.payRate * 40).toFixed(2)}</span>
            </div>

            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Holiday Hours</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">{item?.holidayHours || 0} hrs</span>
            </div>
            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Holiday Rate</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">${selectedEmp.holidayRate.toFixed(2)}/hr</span>
            </div>
            <div className="p-3 bg-[#f1f6fa] rounded-lg">
              <strong className="block text-[11px] text-[#607286] uppercase">Holiday Pay</strong>
              <span className="text-sm font-bold text-[#12345b] tabular-nums">${item?.holidayPay.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Deductions & Summary */}
        <div className="border-t border-[#dde7f0] pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-extrabold text-[#607286]">Gross Pay:</span>
            <span className="font-black text-[#12345b] tabular-nums">${item?.grossPay.toFixed(2) || (selectedEmp.payRate * 40).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-extrabold text-[#607286]">Total Deductions:</span>
            <span className="font-black text-[#a33b32] tabular-nums">-${item?.deductions.toFixed(2) || '0.00'}</span>
          </div>

          <div className="flex justify-between text-lg font-black pt-3 border-t-2 border-[#12345b]">
            <span className="text-[#12345b]">NET PAY:</span>
            <span className="text-[#0f766e] tabular-nums">${item?.netPay.toFixed(2) || (selectedEmp.payRate * 40).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailPayslipModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        employeeName={selectedEmp.displayName}
        employeeEmail={selectedEmp.email}
        periodLabel={`${currentPeriod.periodStart} - ${currentPeriod.periodEnd}`}
      />
    </div>
  );
};
