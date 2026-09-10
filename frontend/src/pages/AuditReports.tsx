import React, { useState } from 'react';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { ClipboardList, FileSpreadsheet, ShieldCheck, UserCheck } from 'lucide-react';

export const AuditReports: React.FC = () => {
  const auditLogs = reportService.getAuditLogs();
  const [auditMode, setAuditMode] = useState<'weekly' | 'yearend'>('weekly');
  const { showToast } = useToast();

  const handleExportCSV = () => {
    const headers = ['ID', 'Action', 'Module', 'User', 'Role', 'Timestamp', 'Details'];
    const rows = auditLogs.map(l => [l.id, l.action, l.module, l.user, l.role, l.timestamp, l.details]);
    reportService.exportToCSV('Payroll_Audit_Trail.csv', headers, rows);
    showToast('Exported audit trail CSV successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Audit Reports & Logs
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Weekly and year-end audit trails for compliance and administrative tracking
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setAuditMode('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            auditMode === 'weekly' ? 'bg-[#12345b] text-white shadow-sm' : 'bg-white text-[#607286] border border-[#dde7f0]'
          }`}
        >
          Weekly Audit Trail
        </button>
        <button
          onClick={() => setAuditMode('yearend')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            auditMode === 'yearend' ? 'bg-[#12345b] text-white shadow-sm' : 'bg-white text-[#607286] border border-[#dde7f0]'
          }`}
        >
          Year-End Audit Summary
        </button>
      </div>

      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee]">
          <h2 className="text-base font-extrabold text-[#12345b]">
            {auditMode === 'weekly' ? 'Weekly System Actions Audit Log' : 'Year-End Financial Audit Summary'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#12345b] text-white font-bold uppercase">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#f8fbfd]">
                  <td className="py-3 px-4 font-bold text-[#183a61]">{log.action}</td>
                  <td className="py-3 px-4 font-semibold text-[#607286]">{log.module}</td>
                  <td className="py-3 px-4 font-bold text-[#12345b]">
                    {log.user} <span className="text-[10px] text-[#607286]">({log.role})</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#607286]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-semibold text-[#1c2b3a]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
