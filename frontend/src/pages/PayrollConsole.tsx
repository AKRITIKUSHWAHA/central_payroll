import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { employeeService, isRealEmployee } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PayrollPeriod, EmployeePayrollItem, PayrollStatus, Employee } from '../types';
import { exportToXLSX } from '../utils/excelExport';

export const PayrollConsole: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayDate = new Date();
  const defaultStart = todayDate.toISOString().split('T')[0];
  const defaultEnd = new Date(todayDate.getTime() + 6 * 86400000).toISOString().split('T')[0];
  const defaultPay = new Date(todayDate.getTime() + 7 * 86400000).toISOString().split('T')[0];

  // Form setup state
  const [activePeriodId, setActivePeriodId] = useState<string>(`pay-${Date.now()}`);
  const [periodStart, setPeriodStart] = useState<string>(defaultStart);
  const [periodEnd, setPeriodEnd] = useState<string>(defaultEnd);
  const [payDate, setPayDate] = useState<string>(defaultPay);
  const [status, setStatus] = useState<PayrollStatus>('Draft');

  // Employee payroll items state
  const [payrollItems, setPayrollItems] = useState<EmployeePayrollItem[]>([]);

  // Payroll History list
  const [history, setHistory] = useState<PayrollPeriod[]>([]);

  // Sanitize date for HTML <input type="date" /> (must be YYYY-MM-DD)
  const toInputDate = (val?: any): string => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const str = String(val).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  // Format date helper (handles ISO strings, UTC dates, YYYY-MM-DD)
  const formatPeriodDate = (val?: string) => {
    if (!val) return '—';
    try {
      const clean = toInputDate(val);
      const parts = clean.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    return val;
  };

  // Format money helper
  const money = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
  };

  // Helper to calculate single item with exact 2-decimal mathematical rounding
  const calculateItem = (item: EmployeePayrollItem): EmployeePayrollItem => {
    const regHours = item.regularHours !== undefined ? Number(item.regularHours) : 40;
    const holHours = item.holidayHours !== undefined ? Number(item.holidayHours) : 0;
    const other = Number(item.otherPay) || 0;
    const deduct = Number(item.deductions) || 0;

    const regRate = Number(item.regularRate) || 0;
    const holRate = Number(item.holidayRate) || 0;

    const regularPay = Math.round(regHours * regRate * 100) / 100;
    const holidayPay = Math.round(holHours * holRate * 100) / 100;
    const totalHours = Number((regHours + holHours).toFixed(2));
    const grossPay = Math.round((regularPay + holidayPay + other) * 100) / 100;
    const netPay = Math.max(0, Math.round((grossPay - deduct) * 100) / 100);

    return {
      ...item,
      regularRate: regRate,
      regularHours: regHours,
      regularPay,
      holidayRate: holRate,
      holidayHours: holHours,
      holidayPay,
      otherPay: other,
      deductions: deduct,
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
    ]).then(([periods, fetchedEmployees]) => {
      const sourceEmps = (fetchedEmployees && fetchedEmployees.length > 0) ? fetchedEmployees : employeeService.getEmployees();
      const validEmployees = (sourceEmps || []).filter(e => isRealEmployee(e) && (e.status || 'Active') !== 'Inactive');

      const getEmployeeMasterRates = (empIdOrName: string) => {
        const idLower = empIdOrName.toLowerCase().trim();
        const found = validEmployees.find(e => 
          (e.id && e.id.toLowerCase() === idLower) ||
          (e.employeeId && e.employeeId.toLowerCase() === idLower) ||
          (e.displayName && e.displayName.toLowerCase().includes(idLower))
        );
        const defaultRate = idLower.includes('neli') ? 35 : idLower.includes('alesia') ? 20 : idLower.includes('global') || idLower.includes('hamza') ? 18 : idLower.includes('ssh') ? 16 : 16.5;
        const regRate = found && found.payRate !== undefined ? Number(found.payRate) : defaultRate;
        const holRate = found && found.holidayRate !== undefined ? Number(found.holidayRate) : Math.round(regRate * 1.5 * 100) / 100;
        return {
          regularRate: regRate,
          holidayRate: holRate,
          displayName: found?.displayName,
          position: found?.position,
          department: found?.department
        };
      };

      let currentItems: EmployeePayrollItem[] = [];
      let draftFound = false;

      if (periods && periods.length > 0) {
        setHistory(periods);
        const draft = periods.find(p => p.status === 'Draft');
        if (draft) {
          draftFound = true;
          setActivePeriodId(draft.id);
          setPeriodStart(toInputDate(draft.periodStart) || defaultStart);
          setPeriodEnd(toInputDate(draft.periodEnd) || defaultEnd);
          setPayDate(toInputDate(draft.payDate) || defaultPay);
          setStatus('Draft');

          if (draft.items && draft.items.length > 0) {
            // Keep only items for active, non-deleted employees in draft
            const validEmpIds = new Set(validEmployees.map(e => (e.id || '').toLowerCase()));
            const validEmpCodes = new Set(validEmployees.map(e => (e.employeeId || '').toLowerCase()));
            const validEmpNames = new Set(validEmployees.map(e => (e.displayName || '').toLowerCase()));

            const activeDraftItems = draft.items.filter(i => {
              const iId = (i.employeeId || '').toLowerCase();
              const iName = (i.employeeName || '').toLowerCase();
              return validEmpIds.has(iId) || validEmpCodes.has(iId) || validEmpNames.has(iName);
            });

            const allZeroHours = activeDraftItems.length > 0 && activeDraftItems.every(i => Number(i.regularHours) === 0 && Number(i.holidayHours) === 0);

            currentItems = activeDraftItems.map(i => {
              const rates = getEmployeeMasterRates(i.employeeId || i.employeeName);
              const regHours = allZeroHours ? 40 : (i.regularHours !== undefined ? Number(i.regularHours) : 40);
              return calculateItem({
                ...i,
                regularHours: regHours,
                regularRate: rates.regularRate,
                holidayRate: rates.holidayRate,
                employeeName: rates.displayName || i.employeeName
              });
            });
          }
        }
      }

      if (!draftFound) {
        setActivePeriodId(`pay-${Date.now()}`);
        setPeriodStart(defaultStart);
        setPeriodEnd(defaultEnd);
        setPayDate(defaultPay);
        setStatus('Draft');
      }

      // If empty draft, build from valid active employees
      if (currentItems.length === 0) {
        currentItems = validEmployees.map(s => {
          const regRate = Number(s.payRate) || 16.5;
          const holRate = Number(s.holidayRate) || Math.round(regRate * 1.5 * 100) / 100;
          return calculateItem({
            employeeId: s.id || s.employeeId,
            employeeName: s.displayName,
            position: s.position,
            department: s.department || 'Operations',
            regularRate: regRate,
            regularHours: 40,
            regularPay: Math.round(regRate * 40 * 100) / 100,
            holidayRate: holRate,
            holidayHours: 0,
            holidayPay: 0,
            otherPay: 0,
            deductions: 0,
            totalHours: 40,
            grossPay: Math.round(regRate * 40 * 100) / 100,
            netPay: Math.round(regRate * 40 * 100) / 100,
            status: 'Incomplete'
          });
        });
      }

      // Ensure every active valid employee is present in draft items
      const existingDraftIds = new Set(currentItems.map(i => (i.employeeId || '').toLowerCase()));
      validEmployees.forEach(emp => {
        const empKey = (emp.id || emp.employeeId || '').toLowerCase();
        if (!existingDraftIds.has(empKey)) {
          const regRate = Number(emp.payRate) || 16.5;
          const holRate = Number(emp.holidayRate) || Math.round(regRate * 1.5 * 100) / 100;
          currentItems.push(calculateItem({
            employeeId: emp.id || emp.employeeId,
            employeeName: emp.displayName,
            position: emp.position,
            department: emp.department || 'Operations',
            regularRate: regRate,
            regularHours: 40,
            regularPay: Math.round(regRate * 40 * 100) / 100,
            holidayRate: holRate,
            holidayHours: 0,
            holidayPay: 0,
            otherPay: 0,
            deductions: 0,
            totalHours: 40,
            grossPay: Math.round(regRate * 40 * 100) / 100,
            netPay: Math.round(regRate * 40 * 100) / 100,
            status: 'Ready'
          }));
        }
      });

      // Sort items alphabetically by employee name
      currentItems.sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));
      setPayrollItems(currentItems);
    });
  }, []);

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
          if (field === 'holidayHours' && value > 0 && (!updated.holidayRate || updated.holidayRate === 0)) {
            const regRate = Number(updated.regularRate) || 16.5;
            updated.holidayRate = Math.round(regRate * 1.5 * 100) / 100;
          }
          return calculateItem(updated);
        }
        return item;
      })
    );
  };

  // Create New Pay Period Draft
  const handleNewPeriod = async () => {
    const employees = await employeeService.fetchEmployees();
    const valid = employees.filter(e => isRealEmployee(e) && (e.status || 'Active') !== 'Inactive');
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    const endStr = new Date(today.getTime() + 6 * 86400000).toISOString().split('T')[0];
    const payStr = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];

    const newDraftItems = valid.map(emp => {
      const regRate = Number(emp.payRate) || 16.5;
      const holRate = Number(emp.holidayRate) || Math.round(regRate * 1.5 * 100) / 100;

      return calculateItem({
        employeeId: emp.id || emp.employeeId,
        employeeName: emp.displayName,
        position: emp.position,
        department: emp.department || 'Operations',
        regularRate: regRate,
        regularHours: 40,
        regularPay: Math.round(regRate * 40 * 100) / 100,
        holidayRate: holRate,
        holidayHours: 0,
        holidayPay: 0,
        otherPay: 0,
        deductions: 0,
        totalHours: 40,
        grossPay: Math.round(regRate * 40 * 100) / 100,
        netPay: Math.round(regRate * 40 * 100) / 100,
        status: 'Incomplete'
      });
    }).sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''));

    const newPeriodId = `pay-${Date.now()}`;
    const newDraftPeriod: PayrollPeriod = {
      id: newPeriodId,
      periodStart: startStr,
      periodEnd: endStr,
      payDate: payStr,
      status: 'Draft',
      items: newDraftItems,
      totalHours: newDraftItems.reduce((acc, i) => acc + (i.totalHours || 0), 0),
      totalGrossPayroll: newDraftItems.reduce((acc, i) => acc + (i.grossPay || 0), 0),
      totalDeductions: 0,
      totalNetPayroll: newDraftItems.reduce((acc, i) => acc + (i.netPay || 0), 0),
      createdBy: currentUser?.displayName || 'Super Admin',
      createdAt: new Date().toISOString()
    };

    setActivePeriodId(newPeriodId);
    setPeriodStart(startStr);
    setPeriodEnd(endStr);
    setPayDate(payStr);
    setStatus('Draft');
    setPayrollItems(newDraftItems);

    payrollService.savePayrollPeriod(newDraftPeriod);
    setHistory(prev => [newDraftPeriod, ...prev.filter(p => p.id !== newPeriodId)]);
    showToast('Created new payroll draft with latest employee pay rates and saved to history.', 'success');
  };

  // Load Historical Payroll Period
  const handleLoadHistoricalPeriod = (p: PayrollPeriod) => {
    setActivePeriodId(p.id);
    setPeriodStart(toInputDate(p.periodStart));
    setPeriodEnd(toInputDate(p.periodEnd));
    setPayDate(toInputDate(p.payDate));
    setStatus(p.status || 'Draft');
    setPayrollItems((p.items || []).map(calculateItem));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded ${p.status || 'Draft'} payroll (${formatPeriodDate(p.periodStart)} to ${formatPeriodDate(p.periodEnd)}).`, 'info');
  };

  // Save Draft
  const handleSaveDraft = () => {
    const periodData: PayrollPeriod = {
      id: activePeriodId || `pay-draft-${periodStart || 'current'}`,
      periodStart,
      periodEnd,
      payDate,
      status: status || 'Draft',
      items: payrollItems,
      totalHours: totals.hours,
      totalGrossPayroll: totals.gross,
      totalDeductions: 0,
      totalNetPayroll: totals.net,
      createdBy: currentUser?.displayName || 'Super Admin',
      createdAt: new Date().toISOString()
    };

    const saved = payrollService.savePayrollPeriod(periodData);
    setHistory(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    showToast('Payroll draft saved successfully and updated in history.', 'success');
  };

  // Process Pay
  const handleProcessPay = () => {
    if (!periodStart || !periodEnd || !payDate) {
      alert('Please select the pay-period dates and pay date first.');
      return;
    }
    if (!window.confirm('Process this payroll and mark it as Paid? (Historical rates will be locked)')) {
      return;
    }

    const processedPeriod: PayrollPeriod = {
      id: activePeriodId || `pay-${Date.now()}`,
      periodStart,
      periodEnd,
      payDate,
      status: 'Paid',
      items: payrollItems.map(i => ({ ...i, status: 'Paid' })),
      totalHours: totals.hours,
      totalGrossPayroll: totals.gross,
      totalDeductions: 0,
      totalNetPayroll: totals.net,
      createdBy: currentUser?.displayName || 'Super Admin',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };

    setStatus('Paid');
    payrollService.savePayrollPeriod(processedPeriod);
    setHistory(prev => [processedPeriod, ...prev.filter(p => p.id !== processedPeriod.id)]);

    reportService.addAuditLog({
      action: 'PAYROLL_PROCESSED',
      module: 'Payroll',
      user: currentUser?.displayName || 'Super Admin',
      role: currentUser?.role || 'Super Admin',
      details: `Processed payroll for ${periodStart} to ${periodEnd} (${money(totals.net)})`
    });

    showToast('Payroll processed and marked as Paid in history.', 'success');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const title = `Central Dispatch Payroll (${formatPeriodDate(periodStart) || 'Draft'} to ${formatPeriodDate(periodEnd) || 'Draft'})`;
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
      i.regularHours,
      money(i.regularPay),
      i.holidayRate ? money(i.holidayRate) : '—',
      i.holidayHours,
      money(i.holidayPay),
      money(i.otherPay),
      money(i.deductions),
      `${i.totalHours.toFixed(2)} hrs`,
      money(i.grossPay),
      money(i.netPay)
    ]);

    // Totals row
    rows.push([
      'TOTALS',
      '',
      '',
      '',
      '',
      '',
      '',
      money(payrollItems.reduce((s, x) => s + (x.otherPay || 0), 0)),
      money(payrollItems.reduce((s, x) => s + (x.deductions || 0), 0)),
      `${totals.hours.toFixed(2)} hrs`,
      money(totals.gross),
      money(totals.net)
    ]);

    exportToXLSX({
      filename: `CDL-Payroll-${periodStart || 'report'}.xlsx`,
      sheetName: 'Payroll',
      headers,
      rows
    });
    showToast('Excel report downloaded', 'success');
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
  const handleDeleteHistory = async (idx: number) => {
    if (!window.confirm('Delete this payroll history record?')) return;
    const itemToDelete = history[idx];
    if (itemToDelete && itemToDelete.id) {
      await payrollService.deletePayrollPeriod(itemToDelete.id);
    }
    const updated = [...history];
    updated.splice(idx, 1);
    setHistory(updated);
    showToast('Payroll history record deleted permanently.');
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewPeriod}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
          >
            + New Pay Period
          </button>
          <span className="px-4 py-1.5 bg-white/15 text-white border border-white/25 rounded-full text-xs font-extrabold uppercase tracking-wider inline-block">
            {status}
          </span>
        </div>
      </div>

      {/* 2. Setup Panel & KPI Stats Cards */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Active Period Toolbar Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-black text-[#1e293b] uppercase tracking-wider">
              Currently Editing:
            </span>
            <span className="text-sm font-extrabold text-[#1d4ed8]">
              {formatPeriodDate(periodStart)} to {formatPeriodDate(periodEnd)}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-black rounded-md uppercase ${
                status === 'Draft'
                  ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                  : status === 'Approved'
                  ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                  : 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleProcessPay}
              className="px-5 py-2 bg-[#176b55] hover:bg-[#125543] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>✓</span> Process Pay (Mark Paid)
            </button>
          </div>
        </div>

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
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#12345b]">
              Employee Payroll
            </h2>
            <p className="text-xs font-semibold text-[#64748b] mt-0.5">
              Review regular hours, holiday hours, additional pay, deductions, and gross-to-net calculations.
            </p>
          </div>
          <span className="text-xs font-bold text-[#102a43] bg-[#f1f5f9] px-3 py-1 rounded-lg border border-[#e2e8f0]">
            {periodStart && periodEnd ? `${formatPeriodDate(periodStart)} – ${formatPeriodDate(periodEnd)}` : 'Select a pay period'}
          </span>
        </div>

        {/* Payroll Table (All 11 columns in client exact required order) */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold min-w-[170px]">Employee</th>
                <th className="py-3 px-3 font-bold text-right min-w-[100px]">Regular Rate</th>
                <th className="py-3 px-3 font-bold text-right min-w-[95px]">Regular Hours</th>
                <th className="py-3 px-3 font-bold text-right min-w-[100px]">Regular Pay</th>
                <th className="py-3 px-3 font-bold text-right min-w-[100px]">Holiday Rate</th>
                <th className="py-3 px-3 font-bold text-right min-w-[95px]">Holiday Hours</th>
                <th className="py-3 px-3 font-bold text-right min-w-[100px]">Holiday Pay</th>
                <th className="py-3 px-3 font-bold text-right min-w-[95px]">Other Pay</th>
                <th className="py-3 px-3 font-bold text-right min-w-[95px]">Deductions</th>
                <th className="py-3 px-3 font-bold text-right min-w-[95px]">Total Hours</th>
                <th className="py-3 px-3 font-bold text-right min-w-[105px]">Gross Pay</th>
                <th className="py-3 px-4 font-bold text-right min-w-[110px]">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {payrollItems.map((emp, idx) => {
                const isPeriodLocked = status === 'Paid';
                const hasHolidayRate = Number(emp.holidayRate) > 0;
                return (
                  <tr
                    key={emp.employeeId}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-[#f8fafc]' : 'bg-[#fbfdff] hover:bg-[#f1f5f9]'}`}
                  >
                    {/* 1. Employee */}
                    <td className="py-3.5 px-4 font-bold text-sm whitespace-nowrap">
                      <div className="text-[#0f172a] font-bold">{emp.employeeName}</div>
                      <div className="text-xs font-normal text-[#64748b]">{emp.position}</div>
                    </td>

                    {/* 2. Regular Rate (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-xs font-bold text-[#64748b]">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          disabled={isPeriodLocked}
                          value={emp.regularRate === 0 ? '0' : emp.regularRate || ''}
                          onChange={e => handleItemFieldChange(emp.employeeId, 'regularRate', parseFloat(e.target.value) || 0)}
                          className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                            isPeriodLocked
                              ? 'border-[#e2e8f0] text-[#64748b] bg-[#f8fafc] cursor-not-allowed'
                              : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                          }`}
                        />
                      </div>
                    </td>

                    {/* 3. Regular Hours (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={isPeriodLocked}
                        value={emp.regularHours === 0 ? '0' : emp.regularHours || ''}
                        onChange={e => handleItemFieldChange(emp.employeeId, 'regularHours', parseFloat(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                          isPeriodLocked
                            ? 'border-[#e2e8f0] text-[#64748b] bg-[#f8fafc] cursor-not-allowed'
                            : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                        }`}
                      />
                    </td>

                    {/* 4. Regular Pay (Calculated, Display-only) */}
                    <td className="py-3 px-3 text-right font-bold text-xs text-[#12345b] tabular-nums whitespace-nowrap">
                      {money(emp.regularPay)}
                    </td>

                    {/* 5. Holiday Rate (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-xs font-bold text-[#64748b]">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          disabled={isPeriodLocked}
                          value={emp.holidayRate === 0 ? '0' : emp.holidayRate || ''}
                          onChange={e => handleItemFieldChange(emp.employeeId, 'holidayRate', parseFloat(e.target.value) || 0)}
                          className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                            isPeriodLocked
                              ? 'border-[#e2e8f0] text-[#64748b] bg-[#f8fafc] cursor-not-allowed'
                              : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                          }`}
                        />
                      </div>
                    </td>

                    {/* 6. Holiday Hours (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        disabled={isPeriodLocked}
                        value={emp.holidayHours === 0 ? '0' : emp.holidayHours || ''}
                        onChange={e => handleItemFieldChange(emp.employeeId, 'holidayHours', parseFloat(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                          isPeriodLocked
                            ? 'border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc] cursor-not-allowed'
                            : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                        }`}
                      />
                    </td>

                    {/* 7. Holiday Pay (Calculated, Display-only) */}
                    <td className="py-3 px-3 text-right font-bold text-xs text-[#12345b] tabular-nums whitespace-nowrap">
                      {money(emp.holidayPay)}
                    </td>

                    {/* 8. Other Pay (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isPeriodLocked}
                        value={emp.otherPay === 0 ? '' : emp.otherPay}
                        placeholder="0.00"
                        onChange={e => handleItemFieldChange(emp.employeeId, 'otherPay', parseFloat(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                          isPeriodLocked
                            ? 'border-[#e2e8f0] text-[#64748b] bg-[#f8fafc] cursor-not-allowed'
                            : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                        }`}
                      />
                    </td>

                    {/* 9. Deductions (Editable Input) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isPeriodLocked}
                        value={emp.deductions === 0 ? '' : emp.deductions}
                        placeholder="0.00"
                        onChange={e => handleItemFieldChange(emp.employeeId, 'deductions', parseFloat(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 text-right border rounded-lg font-bold text-xs shadow-2xs ${
                          isPeriodLocked
                            ? 'border-[#e2e8f0] text-[#64748b] bg-[#f8fafc] cursor-not-allowed'
                            : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white'
                        }`}
                      />
                    </td>

                    {/* 10. Total Hours (Calculated, Display-only) */}
                    <td className="py-3 px-3 text-right font-bold text-xs text-[#0f172a] tabular-nums whitespace-nowrap">
                      {emp.totalHours.toFixed(2)} hrs
                    </td>

                    {/* 11. Gross Pay (Calculated, Display-only) */}
                    <td className="py-3 px-3 text-right font-bold text-xs text-[#12345b] tabular-nums whitespace-nowrap">
                      {money(emp.grossPay)}
                    </td>

                    {/* 12. Net Pay (Calculated, Display-only) */}
                    <td className="py-3 px-4 text-right font-black text-[#176b55] tabular-nums whitespace-nowrap text-sm">
                      {money(emp.netPay)}
                    </td>
                  </tr>
                );
              })}
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
                    No payroll records saved yet.
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr key={h.id || i} className="bg-white hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-xs text-[#0f172a] whitespace-nowrap">
                      {formatPeriodDate(h.periodStart)} to {formatPeriodDate(h.periodEnd)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs text-[#334155] whitespace-nowrap">
                      {formatPeriodDate(h.payDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {h.status === 'Draft' ? (
                        <span className="px-2.5 py-1 bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-[11px] font-extrabold rounded-md inline-block">
                          Draft
                        </span>
                      ) : h.status === 'Approved' ? (
                        <span className="px-2.5 py-1 bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] text-[11px] font-extrabold rounded-md inline-block">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[11px] font-extrabold rounded-md inline-block">
                          {h.status || 'Paid'}
                        </span>
                      )}
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
                    <td className="py-3.5 px-4 text-center whitespace-nowrap flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadHistoricalPeriod(h)}
                        className={`px-3 py-1 ${h.status === 'Draft' ? 'bg-[#f59e0b] hover:bg-[#d97706]' : 'bg-[#1d4ed8] hover:bg-[#1e40af]'} text-white text-xs font-extrabold rounded-lg transition-all shadow-xs`}
                      >
                        {h.status === 'Draft' ? 'Load / Edit' : 'View / Load'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(i)}
                        className="px-2.5 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-extrabold rounded-lg transition-all"
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
