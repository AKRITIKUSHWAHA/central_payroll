import React, { useState, useMemo } from 'react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { 
  Download, 
  Search, 
  Filter, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

export const GeneralLedgerView: React.FC = () => {
  const { showToast } = useToast();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const allEntries = useMemo(() => {
    return accountingService.getAllGeneralLedger();
  }, []);

  // Extract unique filter options
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allEntries.forEach(e => {
      if (e.date && e.date.length >= 4) {
        years.add(e.date.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [allEntries]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    allEntries.forEach(e => {
      if (e.type) types.add(e.type);
    });
    return Array.from(types).sort();
  }, [allEntries]);

  const availableAccounts = useMemo(() => {
    const accounts = new Set<string>();
    allEntries.forEach(e => {
      if (e.account) accounts.add(e.account);
    });
    return Array.from(accounts).sort();
  }, [allEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (selectedYear && !String(entry.date).startsWith(selectedYear)) return false;
      if (selectedType && entry.type !== selectedType) return false;
      if (selectedAccount && entry.account !== selectedAccount) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
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
  }, [allEntries, selectedYear, selectedType, selectedAccount, searchQuery]);

  // Totals calculation
  const totalDebits = useMemo(() => {
    return filteredEntries.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }, [filteredEntries]);

  const totalCredits = useMemo(() => {
    return filteredEntries.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }, [filteredEntries]);

  const netBalance = totalDebits - totalCredits;

  // Pagination calculation
  const totalPages = Math.ceil(filteredEntries.length / (pageSize === -1 ? filteredEntries.length || 1 : pageSize)) || 1;
  const paginatedEntries = useMemo(() => {
    if (pageSize === -1) return filteredEntries;
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedAccount('');
    setCurrentPage(1);
    showToast('Filters reset to default view.');
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(val || 0);
  };

  const handleExportExcel = () => {
    const rows = [
      ['Date', 'Type', 'Number', 'Name', 'Memo', 'Account', 'Debit (BMD)', 'Credit (BMD)', 'Source'],
      ...filteredEntries.map(e => [
        e.date,
        e.type,
        e.number || '',
        e.name,
        e.memo || '',
        e.account,
        e.debit ? e.debit.toFixed(2) : '0.00',
        e.credit ? e.credit.toFixed(2) : '0.00',
        e.source || 'Imported',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Central_Dispatch_General_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('General Ledger exported to Excel/CSV successfully!');
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'Payment':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Payroll Check':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Invoice':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Tax Payment':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pledge':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Check':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#12345b] to-[#1e528d] flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
                General Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#edf4fa] text-[#2f6fb3] border border-[#d2e2f0]">
                {allEntries.length.toLocaleString()} Total Records
              </span>
            </div>
            <p className="text-xs font-semibold text-[#607286] mt-1">
              Consolidated financial journal, payroll disbursements, customer settlements, and imported ledger transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-2 bg-white hover:bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            title="Reset all search queries and dropdown filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Filtered Count */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Filtered Entries</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#12345b]">
              {filteredEntries.length.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-[#607286]">
              of {allEntries.length.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Active in current filter view
          </div>
        </div>

        {/* Total Debits */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Debits</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#12345b]">
              {formatMoney(totalDebits)}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Cash disbursements & AR debits
          </div>
        </div>

        {/* Total Credits */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Credits</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#0f766e]">
              {formatMoney(totalCredits)}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Revenue, income & fee credits
          </div>
        </div>

        {/* Net Differential */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Net Differential</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black ${netBalance >= 0 ? 'text-[#12345b]' : 'text-rose-600'}`}>
              {formatMoney(netBalance)}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Debits minus Credits
          </div>
        </div>
      </div>

      {/* 3. Main Data Card */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fbfdff]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#607286] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by customer name, account, check #, memo..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
              />
            </div>

            {/* Dropdowns Group */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Year Filter */}
              <div className="w-full sm:w-32">
                <select
                  value={selectedYear}
                  onChange={e => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value="">All Years</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={selectedType}
                  onChange={e => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value="">All Types ({availableTypes.length})</option>
                  {availableTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Account Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={selectedAccount}
                  onChange={e => {
                    setSelectedAccount(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value="">All Accounts ({availableAccounts.length})</option>
                  {availableAccounts.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="w-full sm:w-28">
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value={250}>250 / page</option>
                  <option value={-1}>Show All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#12345b] text-white border-b border-[#0e2744]">
                <th className="py-3 px-4 font-black w-28 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 font-black w-32 whitespace-nowrap">Type</th>
                <th className="py-3 px-4 font-black w-24 whitespace-nowrap">Number</th>
                <th className="py-3 px-4 font-black min-w-[200px]">Entity / Name</th>
                <th className="py-3 px-4 font-black min-w-[220px]">Memo / Description</th>
                <th className="py-3 px-4 font-black min-w-[220px]">Account</th>
                <th className="py-3 px-4 font-black text-right w-32 whitespace-nowrap">Debit</th>
                <th className="py-3 px-4 font-black text-right w-32 whitespace-nowrap">Credit</th>
                <th className="py-3 px-4 font-black text-center w-28 whitespace-nowrap">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#607286]">
                    <div className="max-w-md mx-auto space-y-2">
                      <Filter className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                      <p className="text-sm font-black text-[#12345b]">No matching transactions found</p>
                      <p className="text-xs text-[#64748b]">Try clearing or adjusting your search filters above.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 bg-[#edf4fa] hover:bg-[#d8e6f3] text-[#2f6fb3] text-xs font-bold rounded-lg transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((g, idx) => (
                  <tr 
                    key={g.id || `${g.date}-${g.number}-${idx}`} 
                    className="hover:bg-[#f8fbfd] transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-bold text-[#334155] whitespace-nowrap">
                      {g.date}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black border ${getTypeBadgeStyle(g.type)}`}>
                        {g.type}
                      </span>
                    </td>

                    {/* Number */}
                    <td className="py-3 px-4 font-semibold text-[#64748b] whitespace-nowrap">
                      {g.number ? `#${g.number}` : '—'}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-extrabold text-[#12345b] max-w-[240px]">
                      <div className="truncate" title={g.name}>
                        {g.name || '—'}
                      </div>
                    </td>

                    {/* Memo */}
                    <td className="py-3 px-4 text-[#475569] max-w-[260px]">
                      <div className="truncate text-[11px]" title={g.memo || ''}>
                        {g.memo || '—'}
                      </div>
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 font-medium text-[#1e293b] max-w-[240px]">
                      <div className="truncate" title={g.account}>
                        {g.account}
                      </div>
                    </td>

                    {/* Debit */}
                    <td className="py-3 px-4 text-right font-black text-[#12345b] whitespace-nowrap">
                      {g.debit ? (
                        <span>{formatMoney(g.debit)}</span>
                      ) : (
                        <span className="text-[#94a3b8] font-normal">—</span>
                      )}
                    </td>

                    {/* Credit */}
                    <td className="py-3 px-4 text-right font-black text-[#0f766e] whitespace-nowrap">
                      {g.credit ? (
                        <span>{formatMoney(g.credit)}</span>
                      ) : (
                        <span className="text-[#94a3b8] font-normal">—</span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
                        {g.source || 'Imported'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Footer */}
        <div className="p-4 bg-[#f8fbfd] border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-[#64748b]">
            {filteredEntries.length > 0 ? (
              <>
                Showing <span className="text-[#12345b] font-black">{pageSize === -1 ? 1 : ((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="text-[#12345b] font-black">{pageSize === -1 ? filteredEntries.length : Math.min(currentPage * pageSize, filteredEntries.length)}</span> of{' '}
                <span className="text-[#12345b] font-black">{filteredEntries.length.toLocaleString()}</span> entries
              </>
            ) : (
              'No entries to display'
            )}
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 text-xs font-bold text-[#1e293b]">
                <span>Page</span>
                <span className="px-2 py-0.5 bg-white border border-[#cbd5e1] rounded font-black text-[#12345b]">
                  {currentPage}
                </span>
                <span>of {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
