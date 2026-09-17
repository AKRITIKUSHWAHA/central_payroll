import React, { useState, useMemo, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../services/api';
import { GeneralLedgerEntry } from '../types';
import { exportToXLSX } from '../utils/excelExport';

export const GeneralLedgerView: React.FC = () => {
  const { showToast } = useToast();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const [dbEntries, setDbEntries] = useState<GeneralLedgerEntry[]>([]);

  useEffect(() => {
    apiFetch<{ success: boolean; count: number; ledgerEntries: GeneralLedgerEntry[] }>('/general-ledger').then(res => {
      if (res && res.success && res.ledgerEntries && res.ledgerEntries.length > 0) {
        setDbEntries(res.ledgerEntries);
      }
    });
  }, []);

  const allEntries = useMemo(() => {
    if (dbEntries.length > 0) return dbEntries;
    return accountingService.getAllGeneralLedger();
  }, [dbEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allEntries.filter(entry => {
      if (selectedYear && !String(entry.date).startsWith(selectedYear)) return false;
      if (selectedType && entry.type !== selectedType) return false;
      if (q) {
        const haystack = [
          entry.name, 
          entry.memo, 
          entry.account, 
          entry.number, 
          entry.type,
          entry.date
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allEntries, selectedYear, selectedType, searchQuery]);

  // Totals calculation
  const totalDebits = useMemo(() => {
    return filteredEntries.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }, [filteredEntries]);

  const totalCredits = useMemo(() => {
    return filteredEntries.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }, [filteredEntries]);

  // Currency Formatter: BMD 279,279.16
  const formatMoney = (val: number) => {
    const num = Number(val) || 0;
    return `BMD ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Slice up to 700 matching entries at once as per prototype
  const displayedEntries = useMemo(() => {
    return filteredEntries.slice(0, 700);
  }, [filteredEntries]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = ['Date', 'Type', 'Number', 'Name', 'Memo', 'Account', 'Debit', 'Credit', 'Source'];
    const rows = filteredEntries.map(e => [
      e.date,
      e.type,
      e.number || '',
      e.name,
      e.memo || '',
      e.account,
      e.debit ? Number(e.debit).toFixed(2) : '',
      e.credit ? Number(e.credit).toFixed(2) : '',
      e.source || 'Imported'
    ]);

    exportToXLSX({
      filename: `CDL-General-Ledger-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'General Ledger',
      headers,
      rows
    });
    showToast('General Ledger exported to Excel successfully.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            General Ledger
          </h1>
          <p className="text-sm font-semibold text-[#1d4ed8] mt-1">
            Complete imported ledger history plus invoices and payments created in this app.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl transition-all shadow-md self-start sm:self-auto hover:shadow-lg active:scale-95"
        >
          Export Ledger to Excel
        </button>
      </div>

      {/* 2. Filtered Debits & Filtered Credits KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        {/* Filtered Debits Card */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-5 shadow-sm">
          <span className="text-xs sm:text-sm font-bold text-[#64748b]">Filtered Debits</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight mt-1.5">
            {formatMoney(totalDebits)}
          </div>
        </div>

        {/* Filtered Credits Card */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-5 shadow-sm">
          <span className="text-xs sm:text-sm font-bold text-[#64748b]">Filtered Credits</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight mt-1.5">
            {formatMoney(totalCredits)}
          </div>
        </div>
      </div>

      {/* 3. Panel Container */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Accounting Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
            {/* Search ledger */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="glSearch" className="block text-xs font-bold text-[#334155] mb-1.5">
                Search ledger
              </label>
              <input
                id="glSearch"
                type="text"
                placeholder="Name, account, memo, or number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white placeholder-[#94a3b8]"
              />
            </div>

            {/* Year Dropdown */}
            <div className="w-full md:w-36">
              <label htmlFor="glYear" className="block text-xs font-bold text-[#334155] mb-1.5">
                Year
              </label>
              <select
                id="glYear"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value="">All years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            {/* Transaction type Dropdown */}
            <div className="w-full md:w-48">
              <label htmlFor="glType" className="block text-xs font-bold text-[#334155] mb-1.5">
                Transaction type
              </label>
              <select
                id="glType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value="">All types</option>
                <option value="Payment">Payment</option>
                <option value="Payroll Check">Payroll Check</option>
                <option value="Check">Check</option>
                <option value="Pledge">Pledge</option>
                <option value="Tax Payment">Tax Payment</option>
                <option value="Invoice">Invoice</option>
              </select>
            </div>
          </div>

          {/* Transaction Count */}
          <div className="text-xs font-semibold text-[#64748b] self-end md:self-center whitespace-nowrap bg-[#f1f5f9] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            {filteredEntries.length.toLocaleString()} transactions
          </div>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe table horizontally to view debit, credit &amp; source</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            Ledger
          </span>
        </div>

        {/* Table Wrap */}
        <div className="table-responsive-container overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold w-[100px]">Date</th>
                <th className="py-3.5 px-4 font-bold w-[120px]">Type</th>
                <th className="py-3.5 px-4 font-bold w-[100px]">Number</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Name</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Memo</th>
                <th className="py-3.5 px-4 font-bold min-w-[160px]">Account</th>
                <th className="py-3.5 px-4 font-bold text-right w-[110px]">Debit</th>
                <th className="py-3.5 px-4 font-bold text-right w-[110px]">Credit</th>
                <th className="py-3.5 px-4 font-bold text-center w-[100px]">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm font-bold text-[#64748b]">
                    No ledger entries match the filters.
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => (
                  <tr
                    key={entry.id || `${entry.date}_${entry.number}_${idx}`}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-xs font-semibold text-[#334155] whitespace-nowrap">
                      {entry.date || '—'}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 text-xs font-bold text-[#0f172a] whitespace-nowrap">
                      {entry.type || '—'}
                    </td>

                    {/* Number */}
                    <td className="py-3 px-4 text-xs font-semibold text-[#475569] whitespace-nowrap">
                      {entry.number || '—'}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 text-xs font-bold text-[#0f172a] max-w-[200px] truncate" title={entry.name}>
                      {entry.name || '—'}
                    </td>

                    {/* Memo */}
                    <td className="py-3 px-4 text-xs text-[#475569] max-w-[220px] truncate" title={entry.memo}>
                      {entry.memo || '—'}
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 text-xs font-semibold text-[#1e293b] max-w-[220px] truncate" title={entry.account}>
                      {entry.account || '—'}
                    </td>

                    {/* Debit */}
                    <td className="py-3 px-4 text-xs font-extrabold text-[#0f172a] text-right whitespace-nowrap">
                      {entry.debit ? formatMoney(entry.debit) : '—'}
                    </td>

                    {/* Credit */}
                    <td className="py-3 px-4 text-xs font-extrabold text-[#0f172a] text-right whitespace-nowrap">
                      {entry.credit ? formatMoney(entry.credit) : '—'}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f5f9] text-[#475569]">
                        {entry.source || 'Imported'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Accounting Note */}
        <div className="p-4 border-t border-[#edf2f7] bg-[#fcfdfe] text-xs font-semibold text-[#64748b]">
          Up to 700 matching entries display at once. Excel export includes the complete ledger.
        </div>
      </div>
    </div>
  );
};
