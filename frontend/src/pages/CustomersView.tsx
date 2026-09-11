import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { Customer } from '../types';
import { 
  Search, 
  Plus, 
  Download, 
  Edit3, 
  Trash2, 
  Mail, 
  FileText, 
  DollarSign, 
  X, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  RotateCcw,
  Phone,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => accountingService.getSelectedCustomerId() || '');
  
  // Modal States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const ledgerRef = useRef<HTMLDivElement | null>(null);

  // Raw list & filtered list
  const allCustomers = useMemo(() => {
    return accountingService.getCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return accountingService.searchCustomers(searchQuery, statusFilter);
  }, [searchQuery, statusFilter, allCustomers]);

  // Selected Customer & Ledgers
  const selectedCustomer = useMemo(() => {
    return accountingService.getCustomerById(selectedCustomerId) || filteredCustomers[0] || allCustomers[0];
  }, [selectedCustomerId, filteredCustomers, allCustomers]);

  const ledgerEntries = useMemo(() => {
    return selectedCustomer ? accountingService.getCustomerLedgerEntries(selectedCustomer.id) : [];
  }, [selectedCustomer]);

  // Modal Ledger Entries
  const modalLedgerEntries = useMemo(() => {
    return statementCustomer ? accountingService.getCustomerLedgerEntries(statementCustomer.id) : [];
  }, [statementCustomer]);

  // KPI Calculations
  const activeCount = useMemo(() => allCustomers.filter(c => c.status === 'Active').length, [allCustomers]);
  const inactiveCount = useMemo(() => allCustomers.filter(c => c.status === 'Inactive').length, [allCustomers]);
  const totalReceivables = useMemo(() => {
    return allCustomers.reduce((sum, c) => sum + accountingService.getCustomerBalance(c.id), 0);
  }, [allCustomers]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / (pageSize === -1 ? filteredCustomers.length || 1 : pageSize)) || 1;
  const paginatedCustomers = useMemo(() => {
    if (pageSize === -1) return filteredCustomers;
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(amount || 0);
  };

  const handleSelectCustomer = (id: string, openModal = false) => {
    setSelectedCustomerId(id);
    accountingService.setSelectedCustomerId(id);
    const c = accountingService.getCustomerById(id);
    if (openModal && c) {
      setStatementCustomer(c);
      setIsStatementModalOpen(true);
    } else {
      setTimeout(() => {
        if (ledgerRef.current) {
          ledgerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCustomer({
      id: '',
      name: '',
      customerName: '',
      phone: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      status: 'Active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer({ ...c });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    const saved = accountingService.saveCustomer(editingCustomer);
    setIsModalOpen(false);
    showToast(editingCustomer.id ? `Customer "${saved.name}" updated successfully!` : `New customer "${saved.name}" created!`);
    setSelectedCustomerId(saved.id);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    const res = accountingService.deleteCustomer(id);
    if (!res.success) {
      alert(res.message || 'Cannot delete customer.');
      return;
    }
    showToast(`Customer "${name}" deleted.`);
    setSelectedCustomerId(accountingService.getSelectedCustomerId());
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCurrentPage(1);
    showToast('Filters reset.');
  };

  const handleEmailLedger = (c: Customer, entries: any[]) => {
    if (!c.email || !c.email.includes('@')) {
      alert('This customer does not have a valid email address. Please edit the customer profile first to add an email.');
      return;
    }
    let running = 0;
    const lines = entries
      .map(r => {
        running += (r.charge || 0) - (r.payment || 0);
        return `${r.date} | ${r.type} ${r.number ? '#' + r.number : ''} | Charge: ${formatMoney(r.charge || 0)} | Payment: ${formatMoney(r.payment || 0)} | Balance: ${formatMoney(running)}`;
      })
      .join('\n') || 'No transactions recorded.';

    const balance = accountingService.getCustomerBalance(c.id);
    const subject = `Central Dispatch Customer Statement — ${c.name}`;
    const body = `Good day ${c.name},\n\nPlease find your account statement summary below.\n\n${lines}\n\nCurrent Balance: ${formatMoney(balance)}\n\nKind regards,\nCentral Dispatch Limited / Bermuda Island Taxi\ninfo@bermudaislandtaxi.com\n+1 (441) 295-4141`;
    window.location.href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleExportExcel = () => {
    const rows = [
      ['Customer Name', 'Aliases', 'Phone', 'Email', 'Billing Address', 'Status', 'Balance (BMD)', 'Notes'],
      ...filteredCustomers.map(c => [
        c.name,
        (c.aliases || []).join('; '),
        c.phone || '',
        c.email || '',
        c.billingAddress || '',
        c.status || 'Active',
        accountingService.getCustomerBalance(c.id).toFixed(2),
        c.notes || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Central_Dispatch_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory exported to CSV successfully!');
  };

  let runningBalance = 0;
  let modalRunningBalance = 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#12345b] to-[#1e528d] flex items-center justify-center text-white shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
                Customers &amp; Account Ledgers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#edf4fa] text-[#2f6fb3] border border-[#d2e2f0]">
                {allCustomers.length.toLocaleString()} Master Accounts
              </span>
            </div>
            <p className="text-xs font-semibold text-[#607286] mt-1">
              Search customer master profiles, review running balances, view statements, and record account transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#12345b] border border-[#cbd5e1] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-[#2f6fb3]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#12345b]">
              {allCustomers.length.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-[#607286]">Customers</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Consolidated customer directory
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Active Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0f766e]">
              {activeCount.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-[#0f766e]">
              ({((activeCount / (allCustomers.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Ready for invoicing & dispatches
          </div>
        </div>

        {/* Inactive Customers */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Inactive Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#64748b]">
              {inactiveCount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Archived or closed accounts
          </div>
        </div>

        {/* Total Accounts Receivable */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#607286]">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#12345b]">
              {formatMoney(totalReceivables)}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8292a2]">
            Total customer balance owing
          </div>
        </div>
      </div>

      {/* 3. Customers Master Directory Table Card */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] bg-[#fbfdff]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#607286] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by customer name, aliases, phone, email, address, or notes..."
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
              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active ({activeCount})</option>
                  <option value="Inactive">Inactive ({inactiveCount})</option>
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="w-full sm:w-32">
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

              {/* Reset button */}
              {(searchQuery || statusFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-white hover:bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition-all"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table with Sticky Left Customer Column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#12345b] text-white border-b border-[#0e2744]">
                <th className="py-3 px-4 font-black min-w-[220px] sticky left-0 bg-[#12345b] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  Customer / Entity
                </th>
                <th className="py-3 px-4 font-black w-32 whitespace-nowrap">Phone</th>
                <th className="py-3 px-4 font-black min-w-[170px]">Email</th>
                <th className="py-3 px-4 font-black min-w-[200px]">Billing Address</th>
                <th className="py-3 px-4 font-black min-w-[140px]">Notes</th>
                <th className="py-3 px-4 font-black w-24 text-center">Status</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">Balance</th>
                <th className="py-3 px-4 font-black text-center w-28 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#607286]">
                    <div className="max-w-md mx-auto space-y-2">
                      <Users className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                      <p className="text-sm font-black text-[#12345b]">No customers found</p>
                      <p className="text-xs text-[#64748b]">Try adjusting your search criteria or clearing filters.</p>
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
                paginatedCustomers.map(c => {
                  const balance = accountingService.getCustomerBalance(c.id);
                  const isSelected = c.id === selectedCustomer?.id;
                  const initials = c.name
                    .split(' ')
                    .map(n => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'CU';

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#f8fbfd] transition-colors group ${
                        isSelected ? 'bg-[#f0f6fc]' : ''
                      }`}
                    >
                      {/* Sticky Customer Name & Avatar */}
                      <td className={`py-3 px-4 sticky left-0 z-10 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                        isSelected ? 'bg-[#f0f6fc]' : 'bg-white group-hover:bg-[#f8fbfd]'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                            isSelected 
                              ? 'bg-[#12345b] text-white' 
                              : 'bg-[#edf4fa] text-[#2f6fb3] border border-[#d2e2f0]'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(c.id, false)}
                              className="font-extrabold text-[#12345b] hover:text-[#2f6fb3] hover:underline text-left block truncate max-w-[200px]"
                              title={c.name}
                            >
                              {c.name}
                            </button>
                            {c.aliases && c.aliases.length > 0 && (
                              <div className="text-[10px] font-semibold text-[#64748b] truncate max-w-[200px]" title={c.aliases.join(', ')}>
                                {c.aliases.slice(0, 2).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-[#334155] font-semibold whitespace-nowrap">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#94a3b8]" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-[#334155] font-medium max-w-[170px]">
                        {c.email ? (
                          <a 
                            href={`mailto:${c.email}`}
                            className="text-[#2f6fb3] hover:underline truncate block text-[11px]"
                            title={c.email}
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>

                      {/* Billing Address */}
                      <td className="py-3 px-4 text-[#475569] max-w-[200px]">
                        <div className="truncate text-[11px]" title={c.billingAddress}>
                          {c.billingAddress || <span className="text-[#94a3b8]">—</span>}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-[#64748b] max-w-[140px]">
                        <div className="truncate text-[11px]" title={c.notes}>
                          {c.notes || <span className="text-[#94a3b8]">—</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            c.status === 'Inactive'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {c.status || 'Active'}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-4 text-right font-black tabular-nums whitespace-nowrap">
                        <span className={balance > 0 ? 'text-[#12345b]' : 'text-[#64748b]'}>
                          {formatMoney(balance)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectCustomer(c.id, true)}
                            className="p-1.5 bg-[#edf4fa] hover:bg-[#d9e8f5] text-[#2f6fb3] rounded-lg transition-all active:scale-95"
                            title="View Statement & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#334155] rounded-lg transition-all active:scale-95"
                            title="Edit Customer Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-95"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#f8fbfd] border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-[#64748b]">
            {filteredCustomers.length > 0 ? (
              <>
                Showing <span className="text-[#12345b] font-black">{pageSize === -1 ? 1 : ((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="text-[#12345b] font-black">{pageSize === -1 ? filteredCustomers.length : Math.min(currentPage * pageSize, filteredCustomers.length)}</span> of{' '}
                <span className="text-[#12345b] font-black">{filteredCustomers.length.toLocaleString()}</span> customers
              </>
            ) : (
              'No customers to display'
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

      {/* 4. Selected Customer Ledger Section */}
      {selectedCustomer && (
        <div ref={ledgerRef} className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
          <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-[#12345b]">
                  {selectedCustomer.name} — Customer Ledger &amp; Activity
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    selectedCustomer.status === 'Inactive'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedCustomer.status || 'Active'}
                </span>
                <span className="px-2 py-0.5 bg-[#e0effe] text-[#1e40af] text-[10px] font-black rounded-full">
                  {ledgerEntries.length} Transactions
                </span>
              </div>
              <p className="text-xs font-semibold text-[#607286] mt-1">
                {selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}` : 'No phone'} • {selectedCustomer.email ? `Email: ${selectedCustomer.email}` : 'No email'} • Billing: {selectedCustomer.billingAddress || 'No address'}
              </p>
            </div>
            <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#d2e2f0]">
              <span className="block text-[11px] font-extrabold uppercase text-[#607286]">Current Balance</span>
              <strong className="text-2xl font-black text-[#12345b]">
                {formatMoney(accountingService.getCustomerBalance(selectedCustomer.id))}
              </strong>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-b border-[#d9e4ee] flex flex-wrap items-center gap-2.5 bg-[#fbfdff]">
            <button
              onClick={() => {
                accountingService.setSelectedCustomerId(selectedCustomer.id);
                navigate('/invoices');
              }}
              className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => {
                accountingService.setSelectedCustomerId(selectedCustomer.id);
                navigate('/payments');
              }}
              className="px-4 py-2 bg-[#0f766e] hover:bg-[#0c5e58] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={() => handleEmailLedger(selectedCustomer, ledgerEntries)}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Mail className="w-4 h-4 text-[#2f6fb3]" />
              <span>Email Statement</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(selectedCustomer)}
              className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-4 h-4 text-[#64748b]" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#12345b] text-white border-b border-[#0e2744]">
                <tr>
                  <th className="py-3 px-4 font-black w-28 whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 font-black w-32 whitespace-nowrap">Type</th>
                  <th className="py-3 px-4 font-black w-28 whitespace-nowrap">Number</th>
                  <th className="py-3 px-4 font-black min-w-[240px]">Description</th>
                  <th className="py-3 px-4 font-black text-right w-32 whitespace-nowrap">Charge</th>
                  <th className="py-3 px-4 font-black text-right w-32 whitespace-nowrap">Payment</th>
                  <th className="py-3 px-4 font-black text-right w-36 whitespace-nowrap">Running Balance</th>
                  <th className="py-3 px-4 font-black text-center w-28 whitespace-nowrap">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e9f0]">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#607286]">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Receipt className="w-8 h-8 text-[#94a3b8] mx-auto mb-1" />
                        <p className="text-sm font-black text-[#12345b]">No recorded transactions</p>
                        <p className="text-xs text-[#64748b]">No invoices, payments, or ledger records on file for this customer yet.</p>
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              accountingService.setSelectedCustomerId(selectedCustomer.id);
                              navigate('/invoices');
                            }}
                            className="px-3 py-1.5 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            + Create Invoice
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map(entry => {
                    runningBalance += (entry.charge || 0) - (entry.payment || 0);
                    return (
                      <tr key={entry.id} className="hover:bg-[#f8fbfd] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#334155] whitespace-nowrap">{entry.date}</td>
                        <td className="py-3 px-4 font-black text-[#2f6fb3] whitespace-nowrap">{entry.type}</td>
                        <td className="py-3 px-4 font-semibold text-[#64748b] whitespace-nowrap">{entry.number ? `#${entry.number}` : '—'}</td>
                        <td className="py-3 px-4 text-[#334155]">{entry.memo}</td>
                        <td className="py-3 px-4 text-right font-black text-[#12345b] whitespace-nowrap">
                          {entry.charge ? formatMoney(entry.charge) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#0f766e] whitespace-nowrap">
                          {entry.payment ? formatMoney(entry.payment) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#12345b] whitespace-nowrap">
                          {formatMoney(runningBalance)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#f1f5f9] text-[#475569] rounded-md">
                            {entry.source || 'General'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Statement Details Modal (when clicking View Eye Icon) */}
      {isStatementModalOpen && statementCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#d7e2ec] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#12345b] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                    <span>{statementCustomer.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      statementCustomer.status === 'Inactive' ? 'bg-slate-500/30 text-slate-200' : 'bg-emerald-500/30 text-emerald-200'
                    }`}>
                      {statementCustomer.status || 'Active'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-blue-200/80">
                    Account Statement &amp; Transaction History
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Bar */}
            <div className="p-4 bg-[#edf4fa] border-b border-[#d2e2f0] flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-[#607286]">Phone</span>
                  <strong className="font-bold text-[#12345b]">{statementCustomer.phone || '—'}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-[#607286]">Email</span>
                  <strong className="font-bold text-[#12345b]">{statementCustomer.email || '—'}</strong>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-[#607286]">Address</span>
                  <strong className="font-bold text-[#12345b] max-w-[200px] truncate block" title={statementCustomer.billingAddress}>
                    {statementCustomer.billingAddress || '—'}
                  </strong>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-[10px] font-extrabold uppercase text-[#607286]">Current Balance</span>
                <strong className="text-xl font-black text-[#12345b]">
                  {formatMoney(accountingService.getCustomerBalance(statementCustomer.id))}
                </strong>
              </div>
            </div>

            {/* Modal Transactions Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#12345b] text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-black w-24">Date</th>
                    <th className="py-2.5 px-3 font-black w-28">Type</th>
                    <th className="py-2.5 px-3 font-black w-24">Ref #</th>
                    <th className="py-2.5 px-3 font-black">Description</th>
                    <th className="py-2.5 px-3 font-black text-right w-28">Charge</th>
                    <th className="py-2.5 px-3 font-black text-right w-28">Payment</th>
                    <th className="py-2.5 px-3 font-black text-right w-32">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {modalLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748b]">
                        <p className="font-bold text-sm text-[#12345b]">No recorded transactions found</p>
                        <p className="text-xs text-[#94a3b8] mt-1">This customer has 0 open invoices or historical payments on file.</p>
                      </td>
                    </tr>
                  ) : (
                    modalLedgerEntries.map(entry => {
                      modalRunningBalance += (entry.charge || 0) - (entry.payment || 0);
                      return (
                        <tr key={entry.id} className="hover:bg-[#f8fbfd]">
                          <td className="py-2.5 px-3 font-bold text-[#334155] whitespace-nowrap">{entry.date}</td>
                          <td className="py-2.5 px-3 font-black text-[#2f6fb3] whitespace-nowrap">{entry.type}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#64748b] whitespace-nowrap">{entry.number ? `#${entry.number}` : '—'}</td>
                          <td className="py-2.5 px-3 text-[#334155]">{entry.memo}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#12345b] whitespace-nowrap">
                            {entry.charge ? formatMoney(entry.charge) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-[#0f766e] whitespace-nowrap">
                            {entry.payment ? formatMoney(entry.payment) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-[#12345b] whitespace-nowrap">
                            {formatMoney(modalRunningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#f8fbfd] border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsStatementModalOpen(false);
                    accountingService.setSelectedCustomerId(statementCustomer.id);
                    navigate('/invoices');
                  }}
                  className="px-3.5 py-1.5 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>New Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setIsStatementModalOpen(false);
                    accountingService.setSelectedCustomerId(statementCustomer.id);
                    navigate('/payments');
                  }}
                  className="px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#0c5e58] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
                <button
                  onClick={() => handleEmailLedger(statementCustomer, modalLedgerEntries)}
                  className="px-3.5 py-1.5 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#2f6fb3]" />
                  <span>Email Statement</span>
                </button>
              </div>

              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="px-4 py-1.5 bg-[#cbd5e1] hover:bg-[#94a3b8] text-[#1e293b] text-xs font-black rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add / Edit Customer Modal */}
      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#d7e2ec] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#12345b] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-300" />
                <h2 className="text-base font-black tracking-tight">
                  {editingCustomer.id ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer Profile'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                    placeholder="e.g. John Doe / Ace Transport"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                    Company / Alternate Name
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.customerName || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                    placeholder="e.g. Ace Services Ltd"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                    placeholder="+1 (441) 295-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                    placeholder="accounts@example.bm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={editingCustomer.billingAddress || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, billingAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                  placeholder="Street address, City, Bermuda"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                  Status
                </label>
                <select
                  value={editingCustomer.status || 'Active'}
                  onChange={e => setEditingCustomer({ ...editingCustomer, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                  Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3]"
                  placeholder="Special instructions, preferences, or billing notes..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e5ebf1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#cbd5e1] rounded-xl text-xs font-extrabold text-[#475569] hover:bg-[#f4f7fb] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
