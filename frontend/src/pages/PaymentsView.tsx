import React, { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import { companyService } from '../services/companyService';
import { useToast } from '../context/ToastContext';
import { Customer } from '../types';
import { Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>(() => accountingService.getCustomers());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => accountingService.getSelectedCustomerId());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>('https://ridebermuda-prod.web.app/paylink');

  useEffect(() => {
    companyService.fetchCompanyProfile().then(p => {
      if (p && p.paymentLink) {
        setPaymentLink(p.paymentLink);
      }
    });

    accountingService.fetchCustomers().then(list => {
      if (list && list.length > 0) {
        setCustomers(list);
        if (!selectedCustomerId) {
          setSelectedCustomerId(list[0].id);
        }
      }
    });
  }, []);

  const openInvoices = selectedCustomerId ? accountingService.getCustomerOpenInvoices(selectedCustomerId) : [];

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a payment amount greater than zero.');
      return;
    }

    // Check if payment exceeds invoice balance
    if (selectedInvoiceId) {
      const inv = openInvoices.find(i => i.id === selectedInvoiceId);
      if (inv) {
        const bal = accountingService.getInvoiceBalance(inv);
        if (numAmount > bal + 0.005) {
          if (!confirm('This payment is greater than the selected invoice balance. Record it anyway?')) {
            return;
          }
        }
      }
    }

    try {
      setSaving(true);
      await accountingService.savePaymentAsync({
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amount: numAmount,
        date: paymentDate,
        method: paymentMethod,
        reference: reference.trim(),
        note: note.trim(),
      });

      showToast('Payment recorded and posted to the ledger.', 'success');
      setAmount('');
      setReference('');
      setNote('');
      setSelectedInvoiceId('');
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Record a Customer Payment
          </h1>
          <p className="text-sm font-semibold text-[#1d4ed8] mt-1">
            Record money already received and optionally apply it to an open invoice.
          </p>
        </div>
      </div>

      {/* 2. Default Customer Payment Link Integration */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#12345b] flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Default Customer Payment Link (Used across Invoices & Payments)</span>
          </label>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Active Integration
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="url"
            readOnly
            value={paymentLink}
            className="flex-1 px-3.5 py-2 border border-[#cbd5e1] bg-slate-50 text-[#1e293b] rounded-xl text-xs sm:text-sm font-semibold focus:outline-none select-all"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(paymentLink);
                showToast('Payment link copied to clipboard!');
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#12345b] border border-[#cbd5e1] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Test Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-[#607286]">
          Customers can use this link to pay invoices directly online.
        </p>
      </div>

      {/* 3. Form Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleRecordPayment} className="space-y-5">
          {/* Row 1: Customer & Apply to Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="paymentCustomer" className="block text-xs font-bold text-[#334155] mb-1.5">
                Customer
              </label>
              <select
                id="paymentCustomer"
                required
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedInvoiceId('');
                }}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status === 'Inactive' ? '[Inactive]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="paymentInvoice" className="block text-xs font-bold text-[#334155] mb-1.5">
                Apply to Invoice
              </label>
              <select
                id="paymentInvoice"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option value="">Unapplied / customer credit</option>
                {openInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} • {inv.dueDate} • BMD {accountingService.getInvoiceBalance(inv).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Payment Date & Amount Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="paymentDate" className="block text-xs font-bold text-[#334155] mb-1.5">
                Payment Date
              </label>
              <input
                id="paymentDate"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="paymentAmount" className="block text-xs font-bold text-[#334155] mb-1.5">
                Amount Received (BMD)
              </label>
              <input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
              />
            </div>
          </div>

          {/* Row 3: Payment Method & Reference / Receipt Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="paymentMethod" className="block text-xs font-bold text-[#334155] mb-1.5">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              >
                <option>Bank Transfer</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentReference" className="block text-xs font-bold text-[#334155] mb-1.5">
                Reference / Receipt Number
              </label>
              <input
                id="paymentReference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
              />
            </div>
          </div>

          {/* Row 4: Payment Note */}
          <div>
            <label htmlFor="paymentNote" className="block text-xs font-bold text-[#334155] mb-1.5">
              Payment Note
            </label>
            <textarea
              id="paymentNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
