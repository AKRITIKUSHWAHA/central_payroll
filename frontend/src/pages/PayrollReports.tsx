import React, { useState } from 'react';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { FileText, Printer, FileSpreadsheet, Filter } from 'lucide-react';

export const PayrollReports: React.FC = () => {
  const periods = payrollService.getPayrollPeriods();
  const [selectedReportType, setSelectedReportType] = useState('1');
  const { showToast } = useToast();

  const reportTypes = [
    { id: '1', name: 'Weekly Payroll Summary' },
    { id: '2', name: 'Employee Payroll Report' },
    { id: '3', name: 'Payroll by Department' },
    { id: '4', name: 'Hours Worked Report' },
    { id: '5', name: 'Overtime & Holiday Report' },
    { id: '6', name: 'Gross vs Net Payroll' },
    { id: '7', name: 'Payroll Payment Report' },
    { id: '8', name: 'Leave Impact Report' },
  ];

  const handleExportCSV = () => {
    const period = periods[0];
    if (!period || !period.items) {
      showToast('No payroll items available to export.', 'info');
      return;
    }
    const headers = ['Employee', 'Regular Hours', 'Holiday Hours', 'Gross Pay', 'Deductions', 'Net Pay'];
    const rows = period.items.map(i => [i.employeeName, i.regularHours, i.holidayHours, i.grossPay, i.deductions, i.netPay]);
    reportService.exportToCSV('Payroll_Report.csv', headers, rows);
    showToast('Exported report to CSV successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Payroll Reports
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Review processed payroll reports and download audit statements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Current to Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-cdCard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] uppercase mb-1">Select Report Type</label>
            <select
              value={selectedReportType}
              onChange={e => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#1c2b3a]"
            >
              {reportTypes.map(r => (
                <option key={r.id} value={r.id}>{r.id}. {r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee]">
          <h2 className="text-base font-extrabold text-[#12345b]">
            Payroll Report Archive
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
                  <td className="py-3 px-4 font-bold text-[#183a61]">{p.periodStart} to {p.periodEnd}</td>
                  <td className="py-3 px-4 text-[#607286] font-semibold">{p.payDate}</td>
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
    </div>
  );
};
