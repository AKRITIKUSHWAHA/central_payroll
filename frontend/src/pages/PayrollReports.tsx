import React, { useState, useEffect, useMemo } from 'react';
import { reportService } from '../services/reportService';
import { payrollService } from '../services/payrollService';
import { useToast } from '../context/ToastContext';
import { PayrollPeriod } from '../types';

export const PayrollReports: React.FC = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    reportService.fetchPayrollReports().then(data => {
      if (data && data.length > 0) {
        setPeriods(data);
      }
    });
  }, []);

  const allPeriods = useMemo(() => {
    if (periods.length > 0) return periods;
    return payrollService.getPayrollPeriods();
  }, [periods]);

  const currentTotals = useMemo(() => {
    if (allPeriods && allPeriods.length > 0) {
      const gross = allPeriods.reduce((sum: number, p: PayrollPeriod) => sum + Number(p.totalGrossPayroll || 0), 0);
      const net = allPeriods.reduce((sum: number, p: PayrollPeriod) => sum + Number(p.totalNetPayroll || 0), 0);
      return { gross, net };
    }
    return { gross: 0, net: 0 };
  }, [allPeriods]);

  const formatMoney = (val: number) => {
    return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPeriodDate = (val?: string) => {
    if (!val) return '—';
    try {
      const clean = val.includes('T') ? val.split('T')[0] : val;
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

  const handleExportExcel = () => {
    const period = allPeriods[0];
    if (!period || !period.items || period.items.length === 0) {
      showToast('No payroll reports available to export.', 'info');
      return;
    }
    const headers = ['Employee', 'Regular Hours', 'Holiday Hours', 'Gross Pay', 'Deductions', 'Net Pay'];
    const rows = period.items.map(i => [
      i.employeeName,
      Number(i.regularHours || 0).toFixed(2),
      Number(i.holidayHours || 0).toFixed(2),
      formatMoney(i.grossPay),
      formatMoney(i.deductions),
      formatMoney(i.netPay)
    ]);

    reportService.exportToCSV(`Central_Dispatch_Payroll_Report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('Current payroll report exported to Excel.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-12 w-full">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Payroll Reports
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#1d4ed8] mt-1">
            Review processed payroll and download the current payroll report.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-95 text-center cursor-pointer whitespace-nowrap"
          >
            Export Current to Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-xs text-center cursor-pointer whitespace-nowrap"
          >
            Print Current Report
          </button>
        </div>
      </div>

      {/* 2. 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full">
        {/* Processed Reports */}
        <div className="bg-[#edf4fa] border border-[#d2e2f0] rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col justify-between">
          <span className="text-xs sm:text-sm font-bold text-[#475569] truncate">Processed Reports</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#12345b] tracking-tight mt-1.5 tabular-nums truncate">
            {periods.length}
          </div>
        </div>

        {/* Current Gross */}
        <div className="bg-[#edf4fa] border border-[#d2e2f0] rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col justify-between">
          <span className="text-xs sm:text-sm font-bold text-[#475569] truncate">Current Gross</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#12345b] tracking-tight mt-1.5 tabular-nums truncate" title={formatMoney(currentTotals.gross)}>
            {formatMoney(currentTotals.gross)}
          </div>
        </div>

        {/* Current Net */}
        <div className="bg-[#edf4fa] border border-[#d2e2f0] rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col justify-between">
          <span className="text-xs sm:text-sm font-bold text-[#475569] truncate">Current Net</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#12345b] tracking-tight mt-1.5 tabular-nums truncate" title={formatMoney(currentTotals.net)}>
            {formatMoney(currentTotals.net)}
          </div>
        </div>
      </div>

      {/* 3. Payroll Report Archive Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0]">
          <h2 className="text-base font-extrabold text-[#12345b]">
            Payroll Report Archive
          </h2>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe archive table to view status, hours &amp; pay</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            Archive
          </span>
        </div>

        <div className="table-responsive-container">
          <table className="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Period</th>
                <th className="py-3.5 px-5 font-bold">Pay Date</th>
                <th className="py-3.5 px-5 font-bold">Status</th>
                <th className="py-3.5 px-5 font-bold text-right">Hours</th>
                <th className="py-3.5 px-5 font-bold text-right">Gross</th>
                <th className="py-3.5 px-5 font-bold text-right">Net Payroll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm font-bold text-[#64748b]">
                    No processed payroll reports yet.
                  </td>
                </tr>
              ) : (
                periods.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#0f172a] whitespace-nowrap">
                      {formatPeriodDate(p.periodStart)} to {formatPeriodDate(p.periodEnd)}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#334155] whitespace-nowrap">
                      {formatPeriodDate(p.payDate)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d]">
                        {p.status || 'Processed'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-extrabold text-[#0f172a] text-right whitespace-nowrap">
                      {Number(p.totalHours || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-extrabold text-[#0f172a] text-right whitespace-nowrap">
                      {formatMoney(p.totalGrossPayroll)}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-extrabold text-[#0f172a] text-right whitespace-nowrap">
                      {formatMoney(p.totalNetPayroll)}
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
