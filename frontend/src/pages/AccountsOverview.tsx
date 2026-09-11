import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { AccountingKPIs } from '../types';
import { Download, Upload } from 'lucide-react';

export const AccountsOverview: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<AccountingKPIs>(accountingService.getKPIs());

  const refreshData = () => {
    setKpis(accountingService.getKPIs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleExportBackup = () => {
    const jsonStr = accountingService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Central_Dispatch_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Complete organization data backup downloaded successfully!');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = accountingService.restoreBackupJSON(content);
        if (success) {
          refreshData();
          showToast('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
              Customer Accounts Overview
            </h1>
            <p className="text-xs font-bold text-[#607286] mt-0.5">
              Customers, invoices, received payments, aging, and general ledger in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Complete App Backup</span>
            </button>
            <label className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleRestoreFile}
              />
            </label>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="mx-6 mt-6 p-4 bg-[#fff8c7] border border-[#eadc64] rounded-xl text-xs font-extrabold text-[#6e5a00] flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            <strong>Payment Note:</strong> Record Payment logs money already received. It does not charge a card or transfer funds through a bank account automatically.
          </span>
        </div>

        {/* KPIs Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-sm">
            <span className="block text-xs font-extrabold text-[#607286] uppercase tracking-wider">
              Total Customers
            </span>
            <strong className="block text-2xl sm:text-3xl font-black text-[#12345b] mt-2">
              {kpis.customerCount.toLocaleString()}
            </strong>
          </div>

          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-sm">
            <span className="block text-xs font-extrabold text-[#2f6fb3] uppercase tracking-wider">
              Open Invoices
            </span>
            <strong className="block text-2xl sm:text-3xl font-black text-[#12345b] mt-2">
              {kpis.openInvoices.toLocaleString()}
            </strong>
          </div>

          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-sm">
            <span className="block text-xs font-extrabold text-[#0f766e] uppercase tracking-wider">
              Accounts Receivable
            </span>
            <strong className="block text-2xl sm:text-3xl font-black text-[#0f766e] mt-2">
              {formatMoney(kpis.accountsReceivable)}
            </strong>
          </div>

          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-sm">
            <span className="block text-xs font-extrabold text-[#b42318] uppercase tracking-wider">
              Overdue Balances
            </span>
            <strong className="block text-2xl sm:text-3xl font-black text-[#b42318] mt-2">
              {formatMoney(kpis.overdue)}
            </strong>
          </div>
        </div>

        {/* Combined Data Box */}
        <div className="px-6 pb-6">
          <div className="border border-[#d7e3ed] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#12345b]">
                Combined Data Summary
              </h2>
              <span className="text-xs font-bold text-[#607286]">
                {kpis.importSummary}
              </span>
            </div>
            <div className="divide-y divide-[#e7edf2] p-2 bg-white">
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#456078]">
                  Payments recorded in this application
                </span>
                <strong className="text-sm font-black text-[#0f766e]">
                  {formatMoney(kpis.paymentsReceived)}
                </strong>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#456078]">
                  Customer records
                </span>
                <span className="text-xs font-extrabold text-[#12345b]">
                  Alphabetical, deduplicated and consolidated
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-[#456078]">
                  General ledger history
                </span>
                <span className="text-xs font-extrabold text-[#12345b]">
                  Imported master records plus real-time app entries
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
