import React, { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import { companyService, CompanyProfile } from '../services/companyService';
import { useToast } from '../context/ToastContext';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, Printer, Mail, X, ExternalLink, Copy, Check, Send, MoreVertical, Eye } from 'lucide-react';
import { apiFetch } from '../services/api';

export const InvoicesView: React.FC = () => {
  const { showToast } = useToast();
  const customers = accountingService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(accountingService.getSelectedCustomerId());
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [terms, setTerms] = useState<string>('Net 30');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [company, setCompany] = useState<CompanyProfile>(() => companyService.getCompanyProfile());
  const [items, setItems] = useState<InvoiceItem[]>([
    { service: 'Island Taxi', description: 'Passenger trip / Dispatch service', quantity: 1, rate: 0, amount: 0 },
    { service: 'Island Taxi', description: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [emailModalInvoice, setEmailModalInvoice] = useState<Invoice | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailPayLink, setEmailPayLink] = useState<string>('https://ridebermuda-prod.web.app/paylink');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close 3-dots action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.invoice-action-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const invoices = accountingService.getInvoices();

  const selectedCustomer = accountingService.getCustomerById(selectedCustomerId);

  useEffect(() => {
    companyService.fetchCompanyProfile().then(p => {
      setCompany(p);
      if (p.paymentLink) setEmailPayLink(p.paymentLink);
    });
  }, []);

  useEffect(() => {
    const daysMap: Record<string, number> = {
      'Due on receipt': 0,
      'Net 7': 7,
      'Net 15': 15,
      'Net 30': 30,
      'Net 60': 60,
    };
    const days = daysMap[terms] ?? 30;
    const d = new Date(invoiceDate || new Date().toISOString().slice(0, 10));
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  }, [terms, invoiceDate]);

  const handleAddItem = () => {
    setItems([...items, { service: 'Island Taxi', description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'rate') {
      item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  const totalAmount = items.reduce((acc, it) => acc + (it.amount || 0), 0);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(Number(val) || 0);
  };

  const handleSaveInvoice = (status: 'Owing' | 'Paid' = 'Owing') => {
    if (typeof status === 'object' && status !== null && 'preventDefault' in status) {
      (status as any).preventDefault();
      status = 'Owing';
    }
    if (!selectedCustomerId) {
      alert('Please select a customer first.');
      return;
    }
    const invNum = invoiceNumber.trim() || `INV-${Date.now().toString().slice(-5)}`;
    const cust = accountingService.getCustomerById(selectedCustomerId);

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customerId: selectedCustomerId,
      customerName: cust?.name || 'Customer',
      customerEmail: cust?.email || '',
      number: invNum,
      terms,
      date: invoiceDate,
      dueDate,
      items: items.filter(it => it.amount > 0 || it.description.trim() !== ''),
      memo: memo || 'Thank you for choosing Central Dispatch / Bermuda Island Taxi.',
      amount: totalAmount,
      paidAmount: status === 'Paid' ? totalAmount : 0,
      balance: status === 'Paid' ? 0 : totalAmount,
      status,
      createdAt: new Date().toISOString(),
    };

    accountingService.saveInvoice(invoice);
    showToast(`Invoice ${invNum} saved successfully.`);
    setPreviewInvoice(invoice);
  };

  const handleDeleteInvoice = (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    accountingService.deleteInvoice(id);
    showToast('Invoice deleted.');
  };

  const handleOpenEmailModal = (inv: Invoice) => {
    const cust = accountingService.getCustomerById(inv.customerId);
    const targetEmail = cust?.email || inv.customerEmail || '';
    const payUrl = company.paymentLink || 'https://ridebermuda-prod.web.app/paylink';
    const isPaid = inv.status === 'Paid';
    const lines = inv.items.map((it, idx) => `${idx + 1}. ${it.service} - ${it.description} | Qty ${it.quantity} @ ${formatMoney(it.rate)} = ${formatMoney(it.amount)}`).join('\n');
    const subject = `Central Dispatch Invoice ${inv.number} — ${isPaid ? 'Paid in Full' : 'Amount Due'}`;
    const body = `Good day ${cust?.name || inv.customerName},\n\n${isPaid ? 'Thank you for your payment. This invoice is paid in full.' : 'Please find your invoice details below.'}\n\nInvoice Number: ${inv.number}\nDate: ${inv.date}\nDue Date: ${inv.dueDate}\nTerms: ${inv.terms}\nStatus: ${inv.status}\n\n${lines}\n\nTotal Amount: ${formatMoney(inv.amount)}\nBalance Due: ${formatMoney(inv.balance || inv.amount)}\n\nOnline Payment Link:\n${payUrl}\n\n${inv.memo || 'Thank you for choosing Central Dispatch / Bermuda Island Taxi.'}\n\nKind regards,\n${company.organizationName || 'Central Dispatch Limited'}\n${company.email || 'info@bermudaislandtaxi.com'}\n${company.phone || '+1 (441) 295-4141'}`;

    setEmailModalInvoice(inv);
    setEmailRecipient(targetEmail);
    setEmailSubject(subject);
    setEmailBody(body);
    setEmailPayLink(payUrl);
  };

  const handleSendServerEmail = async () => {
    if (!emailRecipient || !emailRecipient.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }
    if (!emailModalInvoice) return;

    try {
      setIsSendingEmail(true);
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/email/send-invoice', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: emailRecipient.trim(),
          customerName: emailModalInvoice.customerName,
          invoiceNumber: emailModalInvoice.number,
          amount: emailModalInvoice.amount,
          balance: emailModalInvoice.balance,
          paymentLink: emailPayLink.trim(),
          customMessage: emailBody,
        })
      });

      if (res && res.success) {
        showToast(`Invoice ${emailModalInvoice.number} emailed successfully to ${emailRecipient}!`);
        setEmailModalInvoice(null);
      } else {
        alert(res?.error || 'Failed to dispatch email.');
      }
    } catch (err: any) {
      alert('Email dispatch error: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleOpenMailto = () => {
    if (!emailRecipient) {
      alert('Please enter a recipient email.');
      return;
    }
    window.location.href = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee]">
          <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
            Create Customer Invoice
          </h1>
          <p className="text-xs font-bold text-[#607286] mt-0.5">
            Add charges to a customer account with automatic ledger and accounts receivable posting.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSaveInvoice('Owing'); }} className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Customer *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              >
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status === 'Inactive' ? '[Inactive]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Customer Email
              </label>
              <input
                type="text"
                readOnly
                placeholder="Email from customer record"
                value={selectedCustomer?.email || ''}
                className="w-full px-3 py-2.5 bg-[#f4f7fa] border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#607286]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Terms
              </label>
              <select
                value={terms}
                onChange={e => setTerms(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#d7e3ed] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#12345b]">Invoice Lines</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#12345b] text-xs font-black rounded-lg shadow-sm flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfd] text-[#456078] border-b border-[#e1e9f0]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                    <th className="py-2.5 px-3 font-bold w-44">Product or Service</th>
                    <th className="py-2.5 px-3 font-bold">Description</th>
                    <th className="py-2.5 px-3 font-bold w-24 text-right">Quantity</th>
                    <th className="py-2.5 px-3 font-bold w-28 text-right">Rate ($)</th>
                    <th className="py-2.5 px-3 font-bold w-28 text-right">Amount</th>
                    <th className="py-2.5 px-3 font-bold w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e9f0]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fbfdff]">
                      <td className="py-2.5 px-3 text-center font-bold text-[#607286]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.service}
                          onChange={e => handleItemChange(idx, 'service', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#bdcbd9] rounded-lg text-xs font-bold"
                          placeholder="Island Taxi"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#bdcbd9] rounded-lg text-xs font-semibold"
                          placeholder="Trip details, passenger name, pickup and destination..."
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-[#bdcbd9] rounded-lg text-xs font-black text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate || ''}
                          onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-[#bdcbd9] rounded-lg text-xs font-black text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#12345b] tabular-nums">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-[#b42318] hover:bg-[#fee2e2] rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
              Invoice Note / Message
            </label>
            <textarea
              rows={2}
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-xs font-bold"
              placeholder="Thank you for your business, payment instructions, or other details..."
            />
          </div>

          {/* Footer Save & Total */}
          <div className="p-4 bg-[#eef6ff] border border-[#c9def6] rounded-xl flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="block text-xs font-extrabold text-[#456078]">Invoice Total</span>
              <strong className="text-2xl font-black text-[#12345b]">
                {formatMoney(totalAmount)}
              </strong>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              Save &amp; Preview Invoice
            </button>
          </div>
        </form>
      </div>

      {/* Invoice History */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden w-full max-w-full">
        <div className="p-4 sm:px-6 sm:py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[#12345b]">Saved Invoices</h2>
          <span className="text-xs font-bold text-[#607286] bg-white px-3 py-1 rounded-lg border border-[#cbd5e1] self-start xs:self-auto">
            {invoices.length} invoices recorded
          </span>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe table to view customer, balance &amp; actions</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            Invoices
          </span>
        </div>

        <div className="table-responsive-container overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[680px] md:min-w-0 md:table-fixed">
            <thead className="bg-[#12345b] text-white">
              <tr>
                <th className="py-3 px-3.5 font-black md:w-[13%]">Date</th>
                <th className="py-3 px-3 font-black md:w-[14%]">Invoice #</th>
                <th className="py-3 px-3.5 font-black md:w-[28%]">Customer</th>
                <th className="py-3 px-2.5 font-black text-center md:w-[9%]">Status</th>
                <th className="py-3 px-3.5 font-black text-right md:w-[14%]">Total</th>
                <th className="py-3 px-3.5 font-black text-right md:w-[14%]">Balance Due</th>
                <th className="py-3 px-2.5 font-black text-center md:w-[8%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#607286] font-bold">
                    No invoices saved in the application yet.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#f8fbfd] transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#1c2b3a] whitespace-nowrap">{inv.date}</td>
                    <td className="py-3 px-3 font-black text-[#2f6fb3] whitespace-nowrap">{inv.number}</td>
                    <td className="py-3 px-3.5 font-extrabold text-[#12345b] truncate" title={inv.customerName}>
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          inv.status === 'Paid'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : 'bg-[#fee2e2] text-[#991b1b]'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-[#12345b] whitespace-nowrap tabular-nums">
                      {formatMoney(inv.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-[#b42318] whitespace-nowrap tabular-nums">
                      {formatMoney(inv.balance || inv.amount)}
                    </td>

                    {/* 3-Dot Actions Menu */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap relative invoice-action-menu" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}
                        className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#1e293b] hover:text-[#1d4ed8] transition-all shadow-2xs inline-flex items-center justify-center cursor-pointer"
                        title="Invoice Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === inv.id && (
                        <div className="absolute right-2 top-10 w-44 bg-white border border-[#d7e2ec] rounded-xl shadow-xl py-1.5 z-30 animate-fadeIn text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setPreviewInvoice(inv);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#f1f5f9] hover:text-[#12345b] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#64748b]" />
                            <span>Preview / Print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenEmailModal(inv);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-[#0284c7] hover:bg-blue-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email Invoice</span>
                          </button>

                          <div className="border-t border-[#edf2f7] my-1"></div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeleteInvoice(inv.id);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Invoice</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#d7e2ec]">
            <div className="px-6 py-4 bg-[#12345b] text-white flex items-center justify-between no-print">
              <h2 className="text-lg font-black tracking-tight">Customer Invoice Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEmailModal(previewInvoice)}
                  className="px-3 py-1.5 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-lg flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#e1e9f0] pb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#12345b] tracking-tight">
                    {company.organizationName || 'Central Dispatch Limited'}
                  </h3>
                  <p className="text-xs text-[#607286] mt-1">{company.address || '3 Laffan Street, Pembroke HM09'}</p>
                  <p className="text-xs text-[#607286]">Phone: {company.phone || '(441) 295-4141'} • Email: {company.email || 'info@bermudaislandtaxi.com'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-[#2f6fb3]">INVOICE</div>
                  <div className="text-xl font-black text-[#12345b]">{previewInvoice.number}</div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black mt-1 ${
                      previewInvoice.status === 'Paid'
                        ? 'bg-[#dcfce7] text-[#166534]'
                        : 'bg-[#fee2e2] text-[#991b1b]'
                    }`}
                  >
                    {previewInvoice.status}
                  </span>
                </div>
              </div>

              {/* Billed To & Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#f8fbfd] p-4 rounded-xl border border-[#e1e9f0] text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Billed To</span>
                  <strong className="text-[#12345b] font-black">{previewInvoice.customerName}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Payment Terms</span>
                  <strong className="text-[#12345b] font-black">{previewInvoice.terms}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Invoice Date</span>
                  <strong className="text-[#12345b] font-black">{previewInvoice.date}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Due Date</span>
                  <strong className="text-[#12345b] font-black">{previewInvoice.dueDate}</strong>
                </div>
              </div>

              {/* Items */}
              <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#bdcbd9] text-[#456078]">
                      <th className="py-2">#</th>
                      <th className="py-2">Product or Service</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ebf1]">
                    {previewInvoice.items.map((item, n) => (
                      <tr key={n}>
                        <td className="py-2.5 font-bold">{n + 1}</td>
                        <td className="py-2.5 font-extrabold text-[#12345b]">{item.service}</td>
                        <td className="py-2.5 text-[#607286]">{item.description}</td>
                        <td className="py-2.5 text-right font-semibold">{item.quantity}</td>
                        <td className="py-2.5 text-right font-semibold">{formatMoney(item.rate)}</td>
                        <td className="py-2.5 text-right font-black text-[#12345b]">{formatMoney(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="w-full sm:w-72 sm:ml-auto space-y-1.5 border-t-2 border-[#12345b] pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-[#607286]">Invoice Total:</span>
                  <strong className="font-black text-[#12345b]">{formatMoney(previewInvoice.amount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#607286]">Payments Received:</span>
                  <strong className="font-black text-[#0f766e]">{formatMoney(previewInvoice.paidAmount || 0)}</strong>
                </div>
                <div className="flex justify-between text-sm border-t border-[#bdcbd9] pt-1.5">
                  <span className="font-black text-[#12345b]">Balance Due:</span>
                  <strong className="font-black text-[#b42318]">{formatMoney(previewInvoice.balance || previewInvoice.amount)}</strong>
                </div>
              </div>

              {/* Payment Link Card */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">Online Payment Link</span>
                  <a
                    href={emailPayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>{emailPayLink}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailPayLink);
                    showToast('Payment link copied to clipboard!');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pay Link</span>
                </button>
              </div>

              {previewInvoice.memo && (
                <div className="p-3 bg-[#f8fbfd] border border-[#dce6ef] rounded-xl text-xs text-[#607286]">
                  <strong>Message / Memo:</strong> {previewInvoice.memo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Invoice Email Modal */}
      {emailModalInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#d7e2ec] animate-fadeIn">
            <div className="px-6 py-4 bg-[#12345b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#3b82f6]" />
                <h2 className="text-lg font-black tracking-tight">Email Invoice to Customer</h2>
              </div>
              <button
                onClick={() => setEmailModalInvoice(null)}
                className="p-1 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#38516b] uppercase mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={emailModalInvoice.customerName}
                    className="w-full px-3 py-2 bg-[#f4f7fa] border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#38516b] uppercase mb-1">
                    Recipient Customer Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={e => setEmailRecipient(e.target.value)}
                    placeholder="Enter customer email (e.g. its@link.bm)"
                    className="w-full px-3 py-2 bg-white border border-[#2f6fb3] rounded-xl text-xs font-bold text-[#1c2b3a] focus:ring-2 focus:ring-[#2f6fb3]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#38516b] uppercase mb-1">
                  Online Payment Link URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={emailPayLink}
                    onChange={e => setEmailPayLink(e.target.value)}
                    placeholder="https://ridebermuda-prod.web.app/paylink"
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-semibold text-[#1c2b3a]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(emailPayLink);
                      showToast('Payment link copied!');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-[#cbd5e1] text-xs font-bold rounded-xl text-[#12345b] flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#64748b] mt-1">
                  Default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ridebermuda-prod.web.app/paylink</code> (or configure custom link in Settings)
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#38516b] uppercase mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#38516b] uppercase mb-1">
                  Email Message Body
                </label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full p-3 bg-white border border-[#bdcbd9] rounded-xl text-xs font-mono text-[#1c2b3a] focus:ring-2 focus:ring-[#2f6fb3]/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#edf2f7] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#12345b] border border-[#cbd5e1] text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 text-[#2f6fb3]" />
                  <span>Open in Mail App (mailto)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalInvoice(null)}
                    className="px-4 py-2 bg-white text-[#64748b] hover:text-[#12345b] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSendingEmail}
                    onClick={handleSendServerEmail}
                    className="px-5 py-2.5 bg-[#2f6fb3] hover:bg-[#235891] disabled:opacity-70 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingEmail ? 'Dispatching...' : 'Send Invoice Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
