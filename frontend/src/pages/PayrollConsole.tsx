import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PayrollPeriod, EmployeePayrollItem, PayrollStatus } from '../types';
import { 
  Save, 
  Download, 
  Printer, 
  PieChart, 
  CheckCircle2, 
  FileSpreadsheet, 
  DollarSign, 
  Calendar, 
  Clock, 
  AlertTriangle,
  History,
  ShieldAlert
} from 'lucide-react';

export const PayrollConsole: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPeriod, setCurrentPeriod] = useState<PayrollPeriod>(() => payrollService.getCurrentDraft());
  const [periods, setPeriods] = useState<PayrollPeriod[]>(() => payrollService.getPayrollPeriods());
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  // Helper to format date strings for input fields (YYYY-MM-DD)
  const toDateInput = (val: any): string => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const s = String(val);
    return s.includes('T') ? s.split('T')[0] : s;
  };

  // Helper to format dates for readable display (e.g. Sept 10, 2026)
  const toDisplayDate = (val: any): string => {
    const clean = toDateInput(val);
    if (!clean) return '—';
    try {
      const [year, month, day] = clean.split('-').map(Number);
      if (!year || !month || !day) return clean;
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return clean;
    }
  };

  const handleItemChange = (employeeId: string, field: keyof EmployeePayrollItem, value: number) => {
    const updatedItems = currentPeriod.items.map(item => {
      if (item.employeeId === employeeId) {
        return { ...item, [field]: Number(value) || 0 };
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
    const user = currentUser?.displayName || 'Super Admin';
    const updated = payrollService.updatePayrollStatus(currentPeriod.id, 'Paid', user);
    if (updated) {
      setCurrentPeriod(updated);
      setPeriods(payrollService.getPayrollPeriods());
      showToast('Payroll processed and marked as Paid successfully!');
      reportService.addAuditLog({
        action: 'PAYROLL_PROCESSED',
        module: 'Payroll',
        user,
        role: currentUser?.role || 'Super Admin',
        details: `Processed payroll for period ${toDateInput(currentPeriod.periodStart)} - ${toDateInput(currentPeriod.periodEnd)} ($${currentPeriod.totalNetPayroll.toFixed(2)})`,
      });
    }
    setShowConfirmApprove(false);
  };

  const handleExportCSV = () => {
    const headers = ['Employee', 'Position', 'Regular Rate', 'Regular Hours', 'Regular Pay', 'Holiday Hours', 'Holiday Pay', 'Other Pay', 'Deductions', 'Total Hours', 'Gross Pay', 'Net Pay'];
    const rows = currentPeriod.items.map(i => [
      i.employeeName,
      i.position,
      Number(i.regularRate || 0).toFixed(2),
      Number(i.regularHours || 0).toFixed(2),
      Number(i.regularPay || 0).toFixed(2),
      Number(i.holidayHours || 0).toFixed(2),
      Number(i.holidayPay || 0).toFixed(2),
      Number(i.otherPay || 0).toFixed(2),
      Number(i.deductions || 0).toFixed(2),
      Number(i.totalHours || 0).toFixed(2),
      Number(i.grossPay || 0).toFixed(2),
      Number(i.netPay || 0).toFixed(2),
    ]);
    reportService.exportToCSV(`Payroll_${toDateInput(currentPeriod.periodStart)}_${toDateInput(currentPeriod.periodEnd)}.csv`, headers, rows);
    showToast('Exported payroll to Excel/CSV successfully.');
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full min-w-0">
      {/* 1. Top Banner */}
      <div className="bg-gradient-to-r from-[#102f52] to-[#1f5f98] text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Central Dispatch Payroll
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              currentPeriod.status === 'Paid' 
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                : 'bg-white/20 text-white border border-white/30'
            }`}>
              {currentPeriod.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#d7e8f7] mt-1">
            Weekly payroll workspace • Thursday through Wednesday cycle (Bermuda labor system)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/payslips')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <PieChart className="w-4 h-4 text-blue-200" />
            <span>View Payslips</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-blue-200" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Setup Inputs & KPI Stats Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-sm space-y-6">
        {/* Date & Status Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Period Start
            </label>
            <input
              type="date"
              value={toDateInput(currentPeriod.periodStart)}
              onChange={e => setCurrentPeriod({ ...currentPeriod, periodStart: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#b9c9d9] rounded-xl text-xs font-bold text-[#1c2b3a] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Period End
            </label>
            <input
              type="date"
              value={toDateInput(currentPeriod.periodEnd)}
              onChange={e => setCurrentPeriod({ ...currentPeriod, periodEnd: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#b9c9d9] rounded-xl text-xs font-bold text-[#1c2b3a] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Pay Date
            </label>
            <input
              type="date"
              value={toDateInput(currentPeriod.payDate)}
              onChange={e => setCurrentPeriod({ ...currentPeriod, payDate: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-[#b9c9d9] rounded-xl text-xs font-bold text-[#1c2b3a] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Payroll Status
            </label>
            <select
              value={currentPeriod.status}
              onChange={e => setCurrentPeriod({ ...currentPeriod, status: e.target.value as PayrollStatus })}
              className="w-full px-3.5 py-2 bg-white border border-[#b9c9d9] rounded-xl text-xs font-bold text-[#1c2b3a] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
            >
              <option value="Draft">Draft</option>
              <option value="Calculated">Calculated</option>
              <option value="Approved">Ready / Approved</option>
              <option value="Paid">Paid</option>
              <option value="Archived">On Hold / Archived</option>
            </select>
          </div>
        </div>

        {/* Real-time KPI Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-extrabold text-[#607286] uppercase tracking-wider">Total Hours</span>
            <strong className="block text-2xl font-black text-[#12345b] mt-1 tabular-nums">
              {Number(currentPeriod.totalHours || 0).toFixed(2)}
            </strong>
          </div>

          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-extrabold text-[#607286] uppercase tracking-wider">Gross Payroll</span>
            <strong className="block text-2xl font-black text-[#12345b] mt-1 tabular-nums">
              {formatMoney(currentPeriod.totalGrossPayroll || 0)}
            </strong>
          </div>

          <div className="p-4 bg-[#eaf4fb] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-extrabold text-[#607286] uppercase tracking-wider">Total Payroll To Pay</span>
            <strong className="block text-2xl font-black text-[#0f766e] mt-1 tabular-nums">
              {formatMoney(currentPeriod.totalNetPayroll || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Main Payroll Calculation Table */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#12345b]">
              Employee Payroll
            </h2>
            <span className="text-xs font-bold text-[#607286]">
              ({currentPeriod.items.length} Active Staff)
            </span>
          </div>
          <span className="text-xs font-bold text-[#2f6fb3]">
            {toDisplayDate(currentPeriod.periodStart)} through {toDisplayDate(currentPeriod.periodEnd)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#12345b] text-white font-black uppercase tracking-wider border-b border-[#0e2744]">
                <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-[#12345b] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  Employee
                </th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Regular Rate</th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Regular Hours</th>
                <th className="py-3 px-3 text-right w-28 whitespace-nowrap">Regular Pay</th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Holiday Rate</th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Holiday Hours</th>
                <th className="py-3 px-3 text-right w-28 whitespace-nowrap">Holiday Pay</th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Other Pay</th>
                <th className="py-3 px-3 text-right w-28 whitespace-nowrap">Deductions</th>
                <th className="py-3 px-3 text-right w-24 whitespace-nowrap">Total Hours</th>
                <th className="py-3 px-3 text-right w-28 whitespace-nowrap">Gross Pay</th>
                <th className="py-3 px-4 text-right w-28 whitespace-nowrap">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {currentPeriod.items.map((item, idx) => (
                <tr key={item.employeeId} className={`hover:bg-[#f8fbfd] transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfe]'}`}>
                  {/* Sticky Employee Name Column */}
                  <td className={`py-3 px-4 sticky left-0 z-10 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                    idx % 2 === 0 ? 'bg-white group-hover:bg-[#f8fbfd]' : 'bg-[#fcfdfe] group-hover:bg-[#f8fbfd]'
                  }`}>
                    <div className="font-extrabold text-[#12345b] truncate max-w-[180px]" title={item.employeeName}>
                      {item.employeeName}
                    </div>
                    <div className="text-[11px] font-semibold text-[#607286] truncate max-w-[180px]">
                      {item.position || 'Staff'}
                    </div>
                  </td>

                  {/* Regular Rate */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.regularRate === 0 ? '' : item.regularRate}
                      onChange={e => handleItemChange(item.employeeId, 'regularRate', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3]"
                    />
                  </td>

                  {/* Regular Hours */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.regularHours === 0 ? '' : item.regularHours}
                      onChange={e => handleItemChange(item.employeeId, 'regularHours', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3]"
                    />
                  </td>

                  {/* Regular Pay */}
                  <td className="py-2.5 px-3 text-right font-bold text-[#1e40af] tabular-nums whitespace-nowrap">
                    {formatMoney(item.regularPay || 0)}
                  </td>

                  {/* Holiday Rate */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.holidayRate === 0 ? '' : item.holidayRate}
                      onChange={e => handleItemChange(item.employeeId, 'holidayRate', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3]"
                    />
                  </td>

                  {/* Holiday Hours */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.holidayHours === 0 ? '' : item.holidayHours}
                      onChange={e => handleItemChange(item.employeeId, 'holidayHours', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3]"
                    />
                  </td>

                  {/* Holiday Pay */}
                  <td className="py-2.5 px-3 text-right font-bold text-[#1e40af] tabular-nums whitespace-nowrap">
                    {formatMoney(item.holidayPay || 0)}
                  </td>

                  {/* Other Pay */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.otherPay === 0 ? '' : item.otherPay}
                      onChange={e => handleItemChange(item.employeeId, 'otherPay', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3]"
                    />
                  </td>

                  {/* Deductions */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.deductions === 0 ? '' : item.deductions}
                      onChange={e => handleItemChange(item.employeeId, 'deductions', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-[#1e293b] bg-white focus:border-[#2f6fb3] focus:outline-none focus:ring-1 focus:ring-[#2f6fb3] placeholder-gray-400"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Total Hours */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {Number(item.totalHours || 0).toFixed(2)}
                  </td>

                  {/* Gross Pay */}
                  <td className="py-2.5 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {formatMoney(item.grossPay || 0)}
                  </td>

                  {/* Net Pay */}
                  <td className="py-2.5 px-4 text-right font-black text-[#0f766e] tabular-nums whitespace-nowrap">
                    {formatMoney(item.netPay || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="p-4 bg-white border-t border-[#d9e4ee] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-[#2f6fb3]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4 text-[#64748b]" />
              <span>Print Payroll</span>
            </button>

            <button
              onClick={() => navigate('/payslips')}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PieChart className="w-4 h-4 text-[#0f766e]" />
              <span>View Payslips</span>
            </button>
          </div>

          <button
            onClick={handleProcessPay}
            disabled={currentPeriod.status === 'Paid'}
            className={`px-5 py-2 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
              currentPeriod.status === 'Paid'
                ? 'bg-emerald-600/60 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{currentPeriod.status === 'Paid' ? 'Paid & Finalized' : 'Process Pay (Mark as Paid)'}</span>
          </button>
        </div>
      </div>

      {/* Process Pay Confirmation Modal */}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d7e2ec] space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-[#12345b]">
                Process and Finalize Payroll?
              </h3>
              <p className="text-xs text-[#607286] mt-2">
                This will mark payroll period <strong className="text-[#12345b]">{toDisplayDate(currentPeriod.periodStart)} – {toDisplayDate(currentPeriod.periodEnd)}</strong> as <strong>Paid</strong> and record an entry in the system audit logs.
              </p>
            </div>

            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 text-center">
              <span className="block text-[11px] font-extrabold uppercase text-[#166534]">Total Net Disbursement</span>
              <strong className="text-2xl font-black text-[#166534]">
                {formatMoney(currentPeriod.totalNetPayroll)}
              </strong>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmApprove(false)}
                className="px-4 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmProcessPay}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95"
              >
                Confirm &amp; Process Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
