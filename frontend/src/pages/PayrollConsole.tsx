import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PayrollPeriod, EmployeePayrollItem, PayrollStatus } from '../types';
import { Save, Download, Printer, PieChart, CheckCircle2, FileSpreadsheet, ShieldAlert, History } from 'lucide-react';

export const PayrollConsole: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod>(() => payrollService.getCurrentDraft());
  const [periods, setPeriods] = useState<PayrollPeriod[]>(() => payrollService.getPayrollPeriods());
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  const handleItemChange = (employeeId: string, field: keyof EmployeePayrollItem, value: number) => {
    const updatedItems = currentPeriod.items.map(item => {
      if (item.employeeId === employeeId) {
        return { ...item, [field]: value };
      }
      return item;
    });

    const updatedPeriod = { ...currentPeriod, items: updatedItems };
    const saved = payrollService.savePayrollPeriod(updatedPeriod);
    setCurrentPeriod(saved);
  };

  const handleSaveDraft = () => {
    const saved = payrollService.savePayrollPeriod(currentPeriod);
    setCurrentPeriod(saved);
    showToast('Payroll draft saved successfully.');
  };

  const handleProcessPay = () => {
    setShowConfirmApprove(true);
  };

  const confirmProcessPay = () => {
    const user = currentUser?.displayName || 'Neli Outerbridge';
    const updated = payrollService.updatePayrollStatus(currentPeriod.id, 'Paid', user);
    if (updated) {
      setCurrentPeriod(updated);
      setPeriods(payrollService.getPayrollPeriods());
      showToast('Payroll processed and marked as Paid successfully!');
      reportService.addAuditLog({
        action: 'PAYROLL_PROCESSED',
        module: 'Payroll',
        user,
        role: currentUser?.role || 'Admin',
        details: `Processed payroll for period ${currentPeriod.periodStart} - ${currentPeriod.periodEnd} ($${currentPeriod.totalNetPayroll.toFixed(2)})`,
      });
    }
    setShowConfirmApprove(false);
  };

  const handleExportCSV = () => {
    const headers = ['Employee', 'Position', 'Regular Rate', 'Regular Hours', 'Regular Pay', 'Holiday Hours', 'Holiday Pay', 'Other Pay', 'Deductions', 'Total Hours', 'Gross Pay', 'Net Pay'];
    const rows = currentPeriod.items.map(i => [
      i.employeeName,
      i.position,
      i.regularRate,
      i.regularHours,
      i.regularPay,
      i.holidayHours,
      i.holidayPay,
      i.otherPay,
      i.deductions,
      i.totalHours,
      i.grossPay,
      i.netPay,
    ]);
    reportService.exportToCSV(`Payroll_${currentPeriod.periodStart}_${currentPeriod.periodEnd}.csv`, headers, rows);
    showToast('Exported payroll to Excel/CSV successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Matching Screenshot 2) */}
      <div className="bg-gradient-to-r from-[#102f52] to-[#1f5f98] text-white rounded-2xl p-6 sm:p-8 shadow-cdModal flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Central Dispatch Payroll
          </h1>
          <p className="text-sm font-semibold text-[#d7e8f7] mt-1">
            Weekly payroll • Thursday through Wednesday
          </p>
        </div>
        <div className="bg-white/20 border border-white/40 rounded-full px-4 py-1.5 font-bold text-xs shadow-sm uppercase tracking-wide">
          {currentPeriod.status}
        </div>
      </div>

      {/* Setup Inputs Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Period Start
            </label>
            <input
              type="date"
              value={currentPeriod.periodStart}
              onChange={e => setCurrentPeriod({ ...currentPeriod, periodStart: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Period End
            </label>
            <input
              type="date"
              value={currentPeriod.periodEnd}
              onChange={e => setCurrentPeriod({ ...currentPeriod, periodEnd: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Date
            </label>
            <input
              type="date"
              value={currentPeriod.payDate}
              onChange={e => setCurrentPeriod({ ...currentPeriod, payDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase tracking-wider mb-1.5">
              Payroll Status
            </label>
            <select
              value={currentPeriod.status}
              onChange={e => setCurrentPeriod({ ...currentPeriod, status: e.target.value as PayrollStatus })}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            >
              <option value="Draft">Draft</option>
              <option value="Calculated">Calculated</option>
              <option value="Approved">Ready / Approved</option>
              <option value="Paid">Paid</option>
              <option value="Archived">On Hold / Archived</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#607286] uppercase">Total Hours</span>
            <strong className="block text-2xl font-black text-[#12345b] mt-1 tabular-nums">
              {currentPeriod.totalHours.toFixed(2)}
            </strong>
          </div>

          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#607286] uppercase">Gross Payroll</span>
            <strong className="block text-2xl font-black text-[#12345b] mt-1 tabular-nums">
              ${currentPeriod.totalGrossPayroll.toFixed(2)}
            </strong>
          </div>

          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#607286] uppercase">Total Payroll To Pay</span>
            <strong className="block text-2xl font-black text-[#12345b] mt-1 tabular-nums">
              ${currentPeriod.totalNetPayroll.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Payroll Table Panel (Matching Screenshot 2) */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#12345b]">
            Employee Payroll
          </h2>
          <span className="text-xs font-bold text-[#607286]">
            {currentPeriod.periodStart} through {currentPeriod.periodEnd}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#12345b] text-white font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 text-right">Regular Rate</th>
                <th className="py-3 px-3 text-right">Regular Hours</th>
                <th className="py-3 px-3 text-right">Regular Pay</th>
                <th className="py-3 px-3 text-right">Holiday Rate</th>
                <th className="py-3 px-3 text-right">Holiday Hours</th>
                <th className="py-3 px-3 text-right">Holiday Pay</th>
                <th className="py-3 px-3 text-right">Other Pay</th>
                <th className="py-3 px-3 text-right">Deductions</th>
                <th className="py-3 px-3 text-right">Total Hours</th>
                <th className="py-3 px-3 text-right">Gross Pay</th>
                <th className="py-3 px-3 text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {currentPeriod.items.map((item, idx) => (
                <tr key={item.employeeId} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fbfd]'}>
                  <td className="py-2.5 px-3">
                    <div className="font-extrabold text-[#183a61]">{item.employeeName}</div>
                    <div className="text-[11px] font-semibold text-[#607286]">{item.position}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.regularRate === 0 ? '' : item.regularRate}
                      onChange={e => handleItemChange(item.employeeId, 'regularRate', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.regularHours === 0 ? '' : item.regularHours}
                      onChange={e => handleItemChange(item.employeeId, 'regularHours', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#234d74] tabular-nums">
                    ${item.regularPay.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.holidayRate === 0 ? '' : item.holidayRate}
                      onChange={e => handleItemChange(item.employeeId, 'holidayRate', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.holidayHours === 0 ? '' : item.holidayHours}
                      onChange={e => handleItemChange(item.employeeId, 'holidayHours', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#234d74] tabular-nums">
                    ${item.holidayPay.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.otherPay === 0 ? '' : item.otherPay}
                      onChange={e => handleItemChange(item.employeeId, 'otherPay', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.deductions === 0 ? '' : item.deductions}
                      onChange={e => handleItemChange(item.employeeId, 'deductions', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 text-right border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none placeholder-gray-400"
                      placeholder="Tax / Ded"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#12345b] tabular-nums">
                    {item.totalHours.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#12345b] tabular-nums">
                    ${item.grossPay.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-[#0f766e] tabular-nums">
                    ${item.netPay.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions bar (Matching Screenshot 2) */}
        <div className="p-4 bg-white border-t border-[#d9e4ee] flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0f766e]" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => navigate('/payslips')}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5 text-[#2f6fb3]" />
            <span>Payslips</span>
          </button>

          <button
            onClick={handleProcessPay}
            className="px-5 py-2 bg-[#0f766e] hover:bg-[#0c5e58] text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 ml-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Process Pay</span>
          </button>
        </div>

        <div className="p-4 bg-[#f8fbfd] text-xs font-semibold text-[#607286] border-t border-[#e1e9f0]">
          This app stores data in this browser only. Use Backup Payroll Data regularly and keep the downloaded backup file somewhere safe. It does not calculate Bermuda payroll tax, Social Insurance, pension, or statutory deductions automatically.
        </div>
      </div>

      {/* Payroll History Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center gap-2">
          <History className="w-4 h-4 text-[#2f6fb3]" />
          <h2 className="text-base font-extrabold text-[#12345b]">
            Payroll History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#12345b] text-white font-bold uppercase">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Pay Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Hours</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Net Payroll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {periods.map(p => (
                <tr key={p.id} className="hover:bg-[#f8fbfd]">
                  <td className="py-3 px-4 font-bold text-[#183a61]">
                    {p.periodStart} to {p.periodEnd}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#607286]">{p.payDate}</td>
                  <td className="py-3 px-4 font-extrabold text-[#0f766e]">{p.status}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#12345b] tabular-nums">{p.totalHours.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#12345b] tabular-nums">${p.totalGrossPayroll.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-black text-[#0f766e] tabular-nums">${p.totalNetPayroll.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Confirmation Dialog */}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-md w-full p-6 shadow-cdModal space-y-4">
            <h3 className="text-lg font-black text-[#12345b]">
              Confirm Payroll Process & Approval
            </h3>
            <p className="text-sm text-[#607286] font-medium leading-relaxed">
              Are you sure you want to approve and mark this weekly payroll period as <strong>PAID</strong>? Total net payroll amount to pay is <strong>${currentPeriod.totalNetPayroll.toFixed(2)}</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmApprove(false)}
                className="px-4 py-2 border border-[#aebfd1] text-[#173a60] font-bold text-xs rounded-xl hover:bg-[#edf5fb]"
              >
                Cancel
              </button>
              <button
                onClick={confirmProcessPay}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0c5e58] text-white font-extrabold text-xs rounded-xl"
              >
                Confirm & Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
