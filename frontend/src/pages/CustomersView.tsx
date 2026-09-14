import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../services/accountingService';
import { companyService } from '../services/companyService';
import { useToast } from '../context/ToastContext';
import { Customer } from '../types';
import { X, AlertCircle, ChevronLeft, ChevronRight, MoreVertical, Eye, Edit3, Trash2 } from 'lucide-react';

const cleanPhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/^(phone:\s*)+/i, '').trim();
};

export const CustomersView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => accountingService.getSelectedCustomerId() || '');
  const [customers, setCustomers] = useState<Customer[]>(() => accountingService.getCustomers());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Pagination State
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const ledgerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.customer-action-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load customers from backend
  const loadCustomers = async () => {
    const list = await accountingService.fetchCustomers();
    if (list && list.length > 0) {
      setCustomers(list);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Lock body background scroll whenever modal is open
  useEffect(() => {
    if (isModalOpen || deleteTarget) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen, deleteTarget]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Filtered & A-to-Z Sorted list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = customers.filter(c => {
      const matchesStatus = !statusFilter || (c.status || 'Active') === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [
        c.name,
        c.customerName,
        c.phone,
        c.email,
        c.billingAddress,
        c.shippingAddress,
        c.notes,
        ...(c.aliases || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [searchQuery, statusFilter, customers]);

  // Paginated list
  const paginatedCustomers = useMemo(() => {
    if (pageSize === 0) return filteredCustomers; // All
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredCustomers.length / pageSize);

  // Selected Customer & Ledgers
  const selectedCustomer = useMemo(() => {
    return accountingService.getCustomerById(selectedCustomerId) || filteredCustomers[0] || customers[0];
  }, [selectedCustomerId, filteredCustomers, customers]);

  const ledgerEntries = useMemo(() => {
    return selectedCustomer ? accountingService.getCustomerLedgerEntries(selectedCustomer.id) : [];
  }, [selectedCustomer]);

  const formatMoney = (amount: number) => {
    const num = Number(amount) || 0;
    return `BMD ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    accountingService.setSelectedCustomerId(id);
    setTimeout(() => {
      if (ledgerRef.current) {
        ledgerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name.trim()) return;

    const cleanedData = {
      ...editingCustomer,
      phone: cleanPhone(editingCustomer.phone),
    };

    const saved = accountingService.saveCustomer(cleanedData);
    setIsModalOpen(false);
    showToast(editingCustomer.id ? `Customer "${saved.name}" updated successfully!` : `New customer "${saved.name}" created!`);
    setSelectedCustomerId(saved.id);
    await loadCustomers();
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    const res = accountingService.deleteCustomer(deleteTarget.id);
    if (!res.success) {
      alert(res.message || 'Cannot delete customer.');
      setDeleteTarget(null);
      return;
    }
    showToast(`Customer "${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
    setSelectedCustomerId(accountingService.getSelectedCustomerId());
    await loadCustomers();
  };

  const handleExportExcel = () => {
    const title = 'Central Dispatch Customers';
    const headers = ['Customer', 'Phone', 'Email', 'Billing Address', 'Customer Note', 'Status', 'Balance'];
    const rows = filteredCustomers.map(c => [
      c.name,
      cleanPhone(c.phone),
      c.email || '',
      c.billingAddress || '',
      c.notes || '',
      c.status || 'Active',
      formatMoney(accountingService.getCustomerBalance(c.id)),
    ]);

    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px}th{background:#12345b;color:white}.money{text-align:right}</style></head><body><h1>${title}</h1><table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${i === 6 ? 'money' : ''}">${v}</td>`).join('')}</tr>`).join('')}</table></body></html>`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }));
    a.download = `CDL-Customers-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('Customers exported to Excel successfully.');
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
    const company = companyService.getCompanyProfile();
    const body = `Good day ${c.name},\n\nPlease find your account statement summary below.\n\n${lines}\n\nCurrent Balance: ${formatMoney(balance)}\n\nKind regards,\n${company.organizationName || 'Central Dispatch Limited / Bermuda Island Taxi'}\n${company.email || 'info@bermudaislandtaxi.com'}\n${company.phone || '+1 (441) 295-4141'}`;
    window.location.href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  let runningBalance = 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Customers &amp; Account Ledgers
          </h1>
          <p className="text-sm font-semibold text-[#1d4ed8] mt-1">
            Search, add, update, or select a customer to review account activity. (Sorted A-to-Z)
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            + Add Customer
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-sm font-extrabold rounded-xl transition-all shadow-xs"
          >
            Export Customers to Excel
          </button>
        </div>
      </div>

      {/* 2. Main Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Accounting Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
            {/* Search customers */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="customerSearch" className="block text-xs font-bold text-[#334155] mb-1.5">
                Search customers
              </label>
              <input
                id="customerSearch"
                type="text"
                placeholder="Search name, phone, email, address, note, or customer code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white placeholder-[#94a3b8]"
              />
            </div>

            {/* Status Dropdown */}
            <div className="w-full md:w-44">
              <label htmlFor="customerStatusFilter" className="block text-xs font-bold text-[#334155] mb-1.5">
                Status
              </label>
              <select
                id="customerStatusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Per Page Dropdown */}
            <div className="w-full md:w-36">
              <label htmlFor="pageSizeFilter" className="block text-xs font-bold text-[#334155] mb-1.5">
                Per Page
              </label>
              <select
                id="pageSizeFilter"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={0}>All customers</option>
              </select>
            </div>
          </div>

          {/* Count label */}
          <div className="text-xs font-bold text-[#475569] self-end md:self-center whitespace-nowrap bg-[#f1f5f9] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            {filteredCustomers.length.toLocaleString()} total customers
          </div>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe table to view phone, email, address, balance &amp; actions</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            Customers
          </span>
        </div>

        {/* Table Wrap */}
        {/* Table Wrap - Responsive Container */}
        <div className="table-responsive-container overflow-x-auto rounded-b-2xl border-b border-[#e2e8f0]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3.5 font-bold min-w-[190px]">Customer</th>
                <th className="py-3 px-3 font-bold min-w-[120px]">Phone</th>
                <th className="py-3 px-3 font-bold min-w-[170px]">Email</th>
                <th className="py-3 px-3 font-bold min-w-[180px]">Billing Address</th>
                <th className="py-3 px-3 font-bold min-w-[140px]">Customer Note</th>
                <th className="py-3 px-2.5 font-bold text-center min-w-[90px]">Status</th>
                <th className="py-3 px-3.5 font-bold text-right min-w-[110px]">Balance</th>
                <th className="py-3 px-2.5 font-bold text-center min-w-[70px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm font-bold text-[#64748b]">
                    No customers match this search.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const bal = accountingService.getCustomerBalance(c.id);
                  const phoneNum = cleanPhone(c.phone);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        selectedCustomerId === c.id ? 'bg-[#f0f7ff]' : ''
                      }`}
                    >
                      {/* Customer Name & Sub-code */}
                      <td className="py-3 px-3.5">
                        <button
                          onClick={() => handleSelectCustomer(c.id)}
                          className="font-extrabold text-[#0f172a] text-left hover:text-[#1d4ed8] hover:underline block"
                          title={c.name}
                        >
                          {c.name}
                        </button>
                        {(c.customerName && c.customerName !== c.name) && (
                          <div className="text-[11px] text-[#64748b] mt-0.5">
                            {c.customerName}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-xs font-semibold text-[#334155] whitespace-nowrap">
                        {phoneNum ? (
                          <a href={`tel:${phoneNum}`} className="hover:text-[#1d4ed8]">
                            {phoneNum}
                          </a>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-xs font-semibold text-[#334155]">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-[#0284c7] hover:underline break-all">
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>

                      {/* Billing Address */}
                      <td className="py-3 px-3 text-xs text-[#334155]" title={c.billingAddress || ''}>
                        {c.billingAddress || <span className="text-[#94a3b8]">—</span>}
                      </td>

                      {/* Customer Note */}
                      <td className="py-3 px-3 text-xs text-[#334155]" title={c.notes || ''}>
                        {c.notes || <span className="text-[#94a3b8]">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            c.status === 'Active'
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {c.status || 'Active'}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="py-3 px-3.5 text-right text-xs font-extrabold text-[#0f172a] whitespace-nowrap tabular-nums">
                        {formatMoney(bal)}
                      </td>

                      {/* 3-Dot Actions Menu */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap relative customer-action-menu" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                          className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#1e293b] hover:text-[#1d4ed8] transition-all shadow-2xs inline-flex items-center justify-center cursor-pointer"
                          title="Customer Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === c.id && (
                          <div className="absolute right-2 top-10 w-44 bg-white border border-[#d7e2ec] rounded-xl shadow-xl py-1.5 z-30 animate-fadeIn text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleSelectCustomer(c.id);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f1f5f9] hover:text-[#12345b] flex items-center gap-2.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#64748b]" />
                              <span>View Ledger</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenEditModal(c);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-bold text-[#1d4ed8] hover:bg-[#eff6ff] flex items-center gap-2.5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#1d4ed8]" />
                              <span>Edit / Note</span>
                            </button>

                            <div className="my-1 border-t border-[#edf2f7]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteTarget(c);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-bold text-[#dc2626] hover:bg-[#fef2f2] flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                              <span>Delete Customer</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="p-4 border-t border-[#edf2f7] bg-[#fcfdfe] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-[#64748b]">
          <div>
            Showing{' '}
            <span className="font-bold text-[#0f172a]">
              {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#0f172a]">
              {pageSize === 0 ? filteredCustomers.length : Math.min(currentPage * pageSize, filteredCustomers.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-[#0f172a]">{filteredCustomers.length.toLocaleString()}</span> customers
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#334155]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-[#0f172a] px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#334155]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Customer Ledger Detail Panel */}
      {selectedCustomer && (
        <div ref={ledgerRef} className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-[#12345b]">
                {selectedCustomer.name} — Customer Ledger
              </h2>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  selectedCustomer.status === 'Active'
                    ? 'bg-[#dcfce7] text-[#15803d]'
                    : 'bg-[#dbeafe] text-[#1e40af]'
                }`}
              >
                {selectedCustomer.status || 'Active'}
              </span>
            </div>
            <div className="text-xl font-black text-[#12345b]">
              {formatMoney(accountingService.getCustomerBalance(selectedCustomer.id))}
            </div>
          </div>

          {/* Ledger Actions */}
          <div className="p-4 bg-[#fbfdff] border-b border-[#e2e8f0] flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                accountingService.setSelectedCustomerId(selectedCustomer.id);
                navigate('/invoices');
              }}
              className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm"
            >
              Create Invoice
            </button>
            <button
              onClick={() => {
                accountingService.setSelectedCustomerId(selectedCustomer.id);
                navigate('/payments');
              }}
              className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
            >
              Record Payment
            </button>
            <button
              onClick={() => handleEmailLedger(selectedCustomer, ledgerEntries)}
              className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
            >
              Email Ledger
            </button>
            <button
              onClick={() => handleOpenEditModal(selectedCustomer)}
              className="px-4 py-2 bg-white hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
            >
              Edit Customer
            </button>
          </div>

          {/* Contact & Historical Info */}
          <div className="px-5 py-3 bg-[#f8fafc] text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">
            {cleanPhone(selectedCustomer.phone) ? `Phone: ${cleanPhone(selectedCustomer.phone)}` : 'No phone'}
            {selectedCustomer.email ? ` • Email: ${selectedCustomer.email}` : ' • No email'}
            {selectedCustomer.billingAddress ? ` • Address: ${selectedCustomer.billingAddress}` : ''}
          </div>

          {/* Mobile Scroll Hint */}
          <div className="mobile-scroll-hint">
            <span>👉 Swipe ledger table to view type, amount &amp; balance</span>
            <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
              Ledger
            </span>
          </div>

          {/* Customer Ledger Table */}
          <div className="table-responsive-container overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Number</th>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold text-right">Charge</th>
                  <th className="py-3 px-4 font-bold text-right">Payment</th>
                  <th className="py-3 px-4 font-bold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f7]">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm font-bold text-[#64748b]">
                      No invoices or payments recorded in this app yet.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((r, idx) => {
                    if (idx === 0) runningBalance = 0;
                    runningBalance += (r.charge || 0) - (r.payment || 0);
                    return (
                      <tr key={r.id || idx} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3 px-4 text-xs font-semibold text-[#334155]">{r.date}</td>
                        <td className="py-3 px-4 text-xs font-bold text-[#0f172a]">{r.type}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-[#475569]">{r.number || '—'}</td>
                        <td className="py-3 px-4 text-xs text-[#334155]">{r.memo || '—'}</td>
                        <td className="py-3 px-4 text-xs font-extrabold text-[#0f172a] text-right">
                          {r.charge ? formatMoney(r.charge) : '—'}
                        </td>
                        <td className="py-3 px-4 text-xs font-extrabold text-[#15803d] text-right">
                          {r.payment ? formatMoney(r.payment) : '—'}
                        </td>
                        <td className="py-3 px-4 text-xs font-extrabold text-[#0f172a] text-right">
                          {formatMoney(runningBalance)}
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-lg font-black text-[#12345b]">
                {editingCustomer.id ? 'Edit Customer' : 'Add Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748b] hover:text-[#12345b] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Air Canada"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Air Canada Corporate"
                  value={editingCustomer.customerName || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, customerName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 236-1539"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. its@link.bm"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 22 Sun Valley Road Warwick WK 02"
                  value={editingCustomer.billingAddress || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, billingAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Shipping / Service Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Service address if different"
                  value={editingCustomer.shippingAddress || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, shippingAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Status</label>
                <select
                  value={editingCustomer.status || 'Active'}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Internal customer notes or billing memo"
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#cbd5e1] text-[#475569] font-bold text-sm rounded-xl hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm rounded-xl shadow-md active:scale-95"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-[#0b1d31]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7e2ec] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-[#dc2626]">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#12345b]">
                  Delete Customer?
                </h3>
                <p className="text-xs text-[#64748b]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#334155]">
              Are you sure you want to delete{' '}
              <span className="font-extrabold text-[#0f172a]">{deleteTarget.name}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#cbd5e1] text-[#475569] font-bold text-sm rounded-xl hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                className="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm rounded-xl shadow-md active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
