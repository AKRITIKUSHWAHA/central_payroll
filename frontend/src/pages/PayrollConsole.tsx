import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PayrollPeriod, EmployeePayrollItem, PayrollStatus, Employee } from '../types';

export const PayrollConsole: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default base 8 employees from prototype & database
  const defaultBaseStaff = useMemo(() => [
    { id: 'ali', employeeId: 'CDL-001', displayName: 'Ali Hamza', position: 'Global Dispatch / Call Center', regularRate: 18, holidayRate: 27 },
    { id: 'alesia', employeeId: 'CDL-002', displayName: 'Alesia Brangman', position: 'Dispatch Supervisor', regularRate: 20, holidayRate: 30 },
    { id: 'ty', employeeId: 'CDL-003', displayName: 'Tyonika McGowan (Ty)', position: 'Dispatcher', regularRate: 16.5, holidayRate: 24.75 },
    { id: 'neli', employeeId: 'CDL-004', displayName: 'Neli Outerbridge', position: 'Owner / Manager / Director', regularRate: 35, holidayRate: 52.5 },
    { id: 'ssh', employeeId: 'CDL-005', displayName: 'SSH, SSH', position: 'SSH Dispatch / Call Center', regularRate: 16, holidayRate: 24 },
    { id: 'staff6', employeeId: 'CDL-006', displayName: 'Miss Shonee Simons', position: 'Dispatcher', regularRate: 16, holidayRate: 24 },
    { id: 'staff7', employeeId: 'CDL-007', displayName: 'Miss Tiffany Robinson', position: 'Dispatcher / Customer Service', regularRate: 16, holidayRate: 24 },
    { id: 'staff8', employeeId: 'CDL-008', displayName: 'Tanuvi Patel', position: 'Dispatcher / Operations', regularRate: 16.5, holidayRate: 24.75 },
  ], []);

  // Form setup state
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [payDate, setPayDate] = useState<string>('');
  const [status, setStatus] = useState<PayrollStatus>('Draft');

  // Employee payroll items state
  const [payrollItems, setPayrollItems] = useState<EmployeePayrollItem[]>([]);

  // Payroll History list
  const [history, setHistory] = useState<PayrollPeriod[]>([]);

  // Format money helper
  const money = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
  };

  // Helper to calculate single item
  const calculateItem = (item: EmployeePayrollItem): EmployeePayrollItem => {
    const regHours = Number(item.regularHours) || 0;
    const holHours = Number(item.holidayHours) || 0;
    const other = Number(item.otherPay) || 0;
    const deduct = Number(item.deductions) || 0;

    const regularPay = regHours * (item.regularRate || 0);
    const holidayPay = holHours * (item.holidayRate || 0);
    const totalHours = regHours + holHours;
    const grossPay = regularPay + holidayPay + other;
    const netPay = grossPay - deduct;

    return {
      ...item,
      regularPay,
      holidayPay,
      totalHours,
      grossPay,
      netPay
    };
  };

  // Initialize draft, DB sync, and history
  useEffect(() => {
    Promise.all([
      payrollService.fetchPayrollPeriods(),
      employeeService.fetchEmployees()
    ]).then(([periods, employees]) => {
      let currentItems: EmployeePayrollItem[] = [];

      if (periods && periods.length > 0) {
        setHistory(periods.filter(p => p.status === 'Paid' || p.status === 'Approved'));
        const draft = periods.find(p => p.status === 'Draft') || periods[0];
        if (draft) {
          setPeriodStart(draft.periodStart || '');
          setPeriodEnd(draft.periodEnd || '');
          setPayDate(draft.payDate || '');
          setStatus(draft.status || 'Draft');
          if (draft.items && draft.items.length > 0) {
            currentItems = draft.items.map(calculateItem);
          }
        }
      }

      // If empty draft, build from defaultBaseStaff
      if (currentItems.length === 0) {
        currentItems = defaultBaseStaff.map(s => calculateItem({
          employeeId: s.id,
          employeeName: s.displayName,
          position: s.position,
          department: 'Operations',
          regularRate: s.regularRate,
          regularHours: 0,
          regularPay: 0,
          holidayRate: s.holidayRate,
          holidayHours: 0,
          holidayPay: 0,
          otherPay: 0,
          deductions: 0,
          totalHours: 0,
          grossPay: 0,
          netPay: 0,
          status: 'Incomplete'
        }));
      }

      // Sync with any newly added employees from DB
      if (employees && employees.length > 0) {
        const existingIds = new Set(currentItems.map(i => (i.employeeId || '').toLowerCase()));
        employees.forEach(emp => {
          const empKey = (emp.id || emp.employeeId || '').toLowerCase();
          if (!existingIds.has(empKey)) {
            existingIds.add(empKey);
            currentItems.push(calculateItem({
              employeeId: emp.id || emp.employeeId,
              employeeName: emp.displayName || `${emp.firstName} ${emp.lastName}`.trim(),
              position: emp.position || 'Staff Member',
              department: emp.department || 'Operations',
              regularRate: Number(emp.payRate) || 16.00,
              regularHours: 0,
              regularPay: 0,
              holidayRate: Number(emp.holidayRate) || 24.00,
              holidayHours: 0,
              holidayPay: 0,
              otherPay: 0,
              deductions: 0,
              totalHours: 0,
              grossPay: 0,
              netPay: 0,
              status: 'Incomplete'
            }));
          }
        });
      }

      setPayrollItems(currentItems);
    });
  }, [defaultBaseStaff]);

  // Totals calculation
  const totals = useMemo(() => {
    return payrollItems.reduce(
      (acc, item) => {
        acc.hours += Number(item.totalHours) || 0;
        acc.gross += Number(item.grossPay) || 0;
        acc.net += Number(item.netPay) || 0;
        return acc;
      },
      { hours: 0, gross: 0, net: 0 }
    );
  }, [payrollItems]);

  // Handle cell entry
  const handleItemFieldChange = (employeeId: string, field: keyof EmployeePayrollItem, value: number) => {
    setPayrollItems(prev =>
      prev.map(item => {
        if (item.employeeId === employeeId) {
          const updated = {
            ...item,
            [field]: isNaN(value) ? 0 : value
          };
          return calculateItem(updated);
        }
        return item;
      })
    );
  };

  // Save Draft
  const handleSaveDraft = () => {
    const periodData: PayrollPeriod = {
      id: `pay-draft-${periodStart || 'current'}`,
      periodStart,
      periodEnd,
      payDate,
      status,
      items: payrollItems,
      totalHours: totals.hours,
      totalGrossPayroll: totals.gross,
      totalDeductions: 0,
      totalNetPayroll: totals.net,
      createdBy: currentUser?.displayName || 'Super Admin',
      createdAt: new Date().toISOString()
    };

    payrollService.savePayrollPeriod(periodData);
    showToast('Payroll draft saved successfully.');
  };

  // Process Pay
  const handleProcessPay = () => {
    if (!periodStart || !periodEnd || !payDate) {
      alert('Please select the pay-period dates and pay date first.');
      return;
    }
    if (!window.confirm('Process this payroll and add it to Payroll History?')) {
      return;
    }

    const processedPeriod: PayrollPeriod = {
      id: `pay-${Date.now()}`,
      periodStart,
      periodEnd,
      payDate,
      status: 'Paid',
      items: payrollItems,
      totalHours: totals.hours,
      totalGrossPayroll: totals.gross,
      totalDeductions: 0,
      totalNetPayroll: totals.net,
      createdBy: currentUser?.displayName || 'Super Admin',
      createdAt: new Date().toISOString()
    };

    setStatus('Paid');
    payrollService.savePayrollPeriod(processedPeriod);
    setHistory(prev => [processedPeriod, ...prev]);

    reportService.addAuditLog({
      action: 'PAYROLL_PROCESSED',
      module: 'Payroll',
      user: currentUser?.displayName || 'Super Admin',
      role: currentUser?.role || 'Super Admin',
      details: `Processed payroll for ${periodStart} to ${periodEnd} (${money(totals.net)})`
    });

    showToast('Payroll processed and saved to history.');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const title = `Central Dispatch Payroll (${periodStart || 'Draft'} to ${periodEnd || 'Draft'})`;
    const headers = [
      'Employee',
      'Regular Rate',
      'Regular Hours',
      'Regular Pay',
      'Holiday Rate',
      'Holiday Hours',
      'Holiday Pay',
      'Other Pay',
      'Deductions',
      'Total Hours',
      'Gross Pay',
      'Net Pay'
    ];

    const rows = payrollItems.map(i => [
      i.employeeName,
      money(i.regularRate),
      Number(i.regularHours).toFixed(2),
      money(i.regularPay),
      i.holidayRate ? money(i.holidayRate) : '—',
      Number(i.holidayHours).toFixed(2),
      money(i.holidayPay),
      money(i.otherPay),
      money(i.deductions),
      Number(i.totalHours).toFixed(2),
      money(i.grossPay),
      money(i.netPay)
    ]);

    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px}th{background:#12345b;color:white}.money{text-align:right}</style></head><body><h1>${title}</h1><p>Pay Date: ${payDate || '—'} | Status: ${status}</p><table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map((v, idx) => `<td class="${idx > 0 ? 'money' : ''}">${v}</td>`).join('')}</tr>`).join('')}<tr><th style="text-align:left">TOTALS</th><th></th><th></th><th class="money">${money(payrollItems.reduce((s, x) => s + x.regularPay, 0))}</th><th></th><th></th><th class="money">${money(payrollItems.reduce((s, x) => s + x.holidayPay, 0))}</th><th class="money">${money(payrollItems.reduce((s, x) => s + x.otherPay, 0))}</th><th class="money">${money(payrollItems.reduce((s, x) => s + x.deductions, 0))}</th><th class="money">${totals.hours.toFixed(2)}</th><th class="money">${money(totals.gross)}</th><th class="money">${money(totals.net)}</th></tr></table></body></html>`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }));
    a.download = `CDL-Payroll-${periodStart || 'report'}.xls`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('Excel report downloaded');
  };

  // Backup Payroll Data
  const handleBackup = () => {
    const backupData = {
      periodStart,
      periodEnd,
      payDate,
      status,
      items: payrollItems,
      history,
      backupDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Central-Dispatch-Payroll-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('Payroll backup downloaded successfully.');
  };

  // Restore Backup
  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.periodStart) setPeriodStart(parsed.periodStart);
        if (parsed.periodEnd) setPeriodEnd(parsed.periodEnd);
        if (parsed.payDate) setPayDate(parsed.payDate);
        if (parsed.status) setStatus(parsed.status);
        if (Array.isArray(parsed.items)) setPayrollItems(parsed.items.map(calculateItem));
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
        showToast('Payroll data restored successfully.');
      } catch {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  // Delete history item
  const handleDeleteHistory = (idx: number) => {
    if (!window.confirm('Delete this payroll history record?')) return;
    const updated = [...history];
    updated.splice(idx, 1);
    setHistory(updated);
    showToast('Payroll history record deleted.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Card (Dark Navy `#102a43`) */}
      <div className="bg-[#102a43] text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Central Dispatch Payroll
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#cbd5e1] mt-1">
            Weekly payroll • Thursday through Wednesday
          </p>
        </div>
        <div>
          <span className="px-4 py-1.5 bg-white/15 text-white border border-white/25 rounded-full text-xs font-extrabold uppercase tracking-wider inline-block">
            {status}
          </span>
        </div>
      </div>

      {/* 2. Setup Panel & KPI Stats Cards */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Setup Form Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="payrollStart" className="block text-xs font-bold text-[#334155] mb-1.5">
              Pay Period Start
            </label>
            <input
              id="payrollStart"
              type="date"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] bg-white focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="payrollEnd" className="block text-xs font-bold text-[#334155] mb-1.5">
              Pay Period End
            </label>
            <input
              id="payrollEnd"
              type="date"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] bg-white focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="payrollPayDate" className="block text-xs font-bold text-[#334155] mb-1.5">
              Pay Date
            </label>
            <input
              id="payrollPayDate"
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] bg-white focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="payrollStatus" className="block text-xs font-bold text-[#334155] mb-1.5">
              Payroll Status
            </label>
            <select
              id="payrollStatus"
              value={status}
              onChange={e => setStatus(e.target.value as PayrollStatus)}
              className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] bg-white focus:outline-none focus:border-[#1d4ed8]"
            >
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Paid">Paid</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-[#eef6ff] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#64748b]">Total Hours</span>
            <strong className="block text-2xl font-black text-[#102a43] mt-1 tabular-nums">
              {totals.hours.toFixed(2)}
            </strong>
          </div>

          <div className="p-4 bg-[#eef6ff] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#64748b]">Gross Payroll</span>
            <strong className="block text-2xl font-black text-[#102a43] mt-1 tabular-nums">
              {money(totals.gross)}
            </strong>
          </div>

          <div className="p-4 bg-[#eef6ff] border border-[#d6e7f4] rounded-xl">
            <span className="block text-xs font-bold text-[#64748b]">Total Payroll To Pay</span>
            <strong className="block text-2xl font-black text-[#102a43] mt-1 tabular-nums">
              {money(totals.net)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Main Employee Payroll Table Card */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Section Head */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-extrabold text-[#12345b]">
            Employee Payroll
          </h2>
          <span className="text-xs font-semibold text-[#64748b]">
            {periodStart && periodEnd ? `${periodStart} to ${periodEnd}` : 'Select a pay period'}
          </span>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe horizontally to enter hours &amp; pay</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            12 Columns
          </span>
        </div>

        {/* Payroll Table */}
        <div className="table-responsive-container">
          <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold min-w-[200px] sticky left-0 bg-[#102a43] z-10">
                  Employee
                </th>
                <th className="py-3 px-3 font-bold text-right">Regular Rate</th>
                <th className="py-3 px-3 font-bold text-right">Regular Hours</th>
                <th className="py-3 px-3 font-bold text-right">Regular Pay</th>
                <th className="py-3 px-3 font-bold text-right">Holiday Rate</th>
                <th className="py-3 px-3 font-bold text-right">Holiday Hours</th>
                <th className="py-3 px-3 font-bold text-right">Holiday Pay</th>
                <th className="py-3 px-3 font-bold text-right">Other Pay</th>
                <th className="py-3 px-3 font-bold text-right">Deductions</th>
                <th className="py-3 px-3 font-bold text-right">Total Hours</th>
                <th className="py-3 px-3 font-bold text-right">Gross Pay</th>
                <th className="py-3 px-4 font-bold text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {payrollItems.map((emp, idx) => (
                <tr
                  key={emp.employeeId}
                  className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-[#f8fafc]' : 'bg-[#fbfdff] hover:bg-[#f1f5f9]'}`}
                >
                  {/* Sticky Employee Name + Role */}
                  <td className={`py-3.5 px-4 font-bold text-sm whitespace-nowrap sticky left-0 z-10 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#fbfdff]'
                  }`}>
                    <div className="text-[#0f172a] font-bold">{emp.employeeName}</div>
                    <div className="text-xs font-normal text-[#64748b]">{emp.position}</div>
                  </td>

                  {/* Regular Rate */}
                  <td className="py-3 px-3 text-right font-semibold text-[#0f172a] tabular-nums whitespace-nowrap">
                    {money(emp.regularRate)}
                  </td>

                  {/* Regular Hours Input */}
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={emp.regularHours === 0 ? '' : emp.regularHours}
                      onChange={e => handleItemFieldChange(emp.employeeId, 'regularHours', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="w-20 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-xs text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] bg-white"
                    />
                  </td>

                  {/* Regular Pay */}
                  <td className="py-3 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {money(emp.regularPay)}
                  </td>

                  {/* Holiday Rate */}
                  <td className="py-3 px-3 text-right font-semibold text-[#0f172a] tabular-nums whitespace-nowrap">
                    {emp.holidayRate ? money(emp.holidayRate) : '—'}
                  </td>

                  {/* Holiday Hours Input */}
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      disabled={!emp.holidayRate}
                      value={emp.holidayHours === 0 ? '' : emp.holidayHours}
                      onChange={e => handleItemFieldChange(emp.employeeId, 'holidayHours', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className={`w-20 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-xs text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] ${
                        !emp.holidayRate ? 'bg-[#f1f5f9] cursor-not-allowed text-[#94a3b8]' : 'bg-white'
                      }`}
                    />
                  </td>

                  {/* Holiday Pay */}
                  <td className="py-3 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {money(emp.holidayPay)}
                  </td>

                  {/* Other Pay Input */}
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={emp.otherPay === 0 ? '' : emp.otherPay}
                      onChange={e => handleItemFieldChange(emp.employeeId, 'otherPay', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="w-20 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-xs text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] bg-white"
                    />
                  </td>

                  {/* Deductions Input */}
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={emp.deductions === 0 ? '' : emp.deductions}
                      onChange={e => handleItemFieldChange(emp.employeeId, 'deductions', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="w-20 px-2 py-1.5 text-right border border-[#cbd5e1] rounded-lg font-bold text-xs text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] bg-white"
                    />
                  </td>

                  {/* Total Hours */}
                  <td className="py-3 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {emp.totalHours.toFixed(2)}
                  </td>

                  {/* Gross Pay */}
                  <td className="py-3 px-3 text-right font-extrabold text-[#12345b] tabular-nums whitespace-nowrap">
                    {money(emp.grossPay)}
                  </td>

                  {/* Net Pay */}
                  <td className="py-3 px-4 text-right font-black text-[#176b55] tabular-nums whitespace-nowrap">
                    {money(emp.netPay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#e2e8f0] flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={handleBackup}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Backup Payroll Data
          </button>

          <button
            type="button"
            onClick={handleRestoreClick}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Restore Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Export to Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Print Report
          </button>

          <button
            type="button"
            onClick={() => navigate('/payslips')}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Payslips
          </button>

          <button
            type="button"
            onClick={handleProcessPay}
            className="px-5 py-2 bg-[#176b55] hover:bg-[#125543] text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Process Pay
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="px-4 sm:px-5 pb-5 text-xs font-semibold text-[#64748b] leading-relaxed">
          This app stores data in this browser only. Use Backup Payroll Data regularly and keep the downloaded backup file somewhere safe. It does not calculate Bermuda payroll tax, Social Insurance, pension, or statutory deductions automatically.
        </div>
      </div>

      {/* 4. Payroll History Card */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0]">
          <h2 className="text-base font-extrabold text-[#12345b]">
            Payroll History
          </h2>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Period</th>
                <th className="py-3 px-4 font-bold">Pay Date</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Hours</th>
                <th className="py-3 px-4 font-bold text-right">Gross</th>
                <th className="py-3 px-4 font-bold text-right">Net Payroll</th>
                <th className="py-3 px-4 font-bold text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {!history || history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-xs font-semibold text-[#64748b]">
                    No processed payrolls yet.
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr key={h.id || i} className="bg-white hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-xs text-[#0f172a] whitespace-nowrap">
                      {h.periodStart || '—'} to {h.periodEnd || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs text-[#334155] whitespace-nowrap">
                      {h.payDate || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[11px] font-extrabold rounded-md inline-block">
                        {h.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-xs text-[#0f172a] tabular-nums whitespace-nowrap">
                      {Number(h.totalHours || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-xs text-[#12345b] tabular-nums whitespace-nowrap">
                      {money(h.totalGrossPayroll || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-xs text-[#176b55] tabular-nums whitespace-nowrap">
                      {money(h.totalNetPayroll || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(i)}
                        className="px-3 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-extrabold rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
