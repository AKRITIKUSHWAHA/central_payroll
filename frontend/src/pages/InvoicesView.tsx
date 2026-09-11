import React, { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Trash2, Printer, Mail, X } from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { showToast } = useToast();
  const customers = accountingService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(accountingService.getSelectedCustomerId());
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [terms, setTerms] = useState<string>('Net 30');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { service: 'Island Taxi', description: 'Passenger trip / Dispatch service', quantity: 1, rate: 0, amount: 0 },
    { service: 'Island Taxi', description: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const invoices = accountingService.getInvoices();

  const selectedCustomer = accountingService.getCustomerById(selectedCustomerId);

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
    if (items.length === 1) {
      setItems([{ service: 'Island Taxi', description: '', quantity: 1, rate: 0, amount: 0 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    const qty = Number(updated[index].quantity || 0);
    const rate = Number(updated[index].rate || 0);
    updated[index].amount = qty * rate;
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(amount || 0);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }

    const validItems = items.filter(item => item.rate > 0 || item.description.trim());
    if (validItems.length === 0) {
      alert('Please add at least one line item with a rate.');
      return;
    }

    const created = accountingService.saveInvoice({
      customerId: selectedCustomerId,
      number: invoiceNumber,
      terms,
      date: invoiceDate,
      dueDate,
      items: validItems,
      memo,
      amount: calculateTotal(),
    });

    showToast(`Invoice ${created.number} saved successfully!`);
    setPreviewInvoice(created);

    setInvoiceNumber('');
    setMemo('');
    setItems([
      { service: 'Island Taxi', description: 'Passenger trip / Dispatch service', quantity: 1, rate: 0, amount: 0 },
      { service: 'Island Taxi', description: '', quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const handleDeleteInvoice = (id: string) => {
    const res = accountingService.deleteInvoice(id);
    if (!res.success) {
      alert(res.message);
      return;
    }
    showToast('Invoice deleted.');
  };

  const handleEmailInvoice = (inv: Invoice) => {
    const cust = accountingService.getCustomerById(inv.customerId);
    if (!cust?.email || !cust.email.includes('@')) {
      alert('Customer does not have a valid email address. Edit customer to add email.');
      return;
    }

    const lines = inv.items.map((it, idx) => `${idx + 1}. ${it.service} - ${it.description} | Qty ${it.quantity} @ ${formatMoney(it.rate)} = ${formatMoney(it.amount)}`).join('\n');
    const isPaid = inv.status === 'Paid';
    const subject = `Central Dispatch Invoice ${inv.number} — ${isPaid ? 'Paid in Full' : 'Amount Due'}`;
    const body = `Good day ${cust.name},\n\n${isPaid ? 'Thank you for your payment. This invoice is paid in full.' : 'Please find your invoice details below.'}\n\nInvoice Number: ${inv.number}\nDate: ${inv.date}\nDue Date: ${inv.dueDate}\nTerms: ${inv.terms}\nStatus: ${inv.status}\n\n${lines}\n\nTotal Amount: ${formatMoney(inv.amount)}\nBalance Due: ${formatMoney(inv.balance || inv.amount)}\n\n${inv.memo || 'Thank you for choosing Central Dispatch / Bermuda Island Taxi.'}\n\nKind regards,\nCentral Dispatch Limited\ninfo@bermudaislandtaxi.com\n+1 (441) 295-4141`;

    window.location.href = `mailto:${encodeURIComponent(cust.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

        <form onSubmit={handleSaveInvoice} className="p-6 space-y-6">
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
                <span>+ Add Line</span>
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
                {formatMoney(calculateTotal())}
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
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#12345b]">Saved Invoices</h2>
          <span className="text-xs font-bold text-[#607286]">{invoices.length} invoices recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#12345b] text-white">
              <tr>
                <th className="py-3 px-4 font-black">Date</th>
                <th className="py-3 px-4 font-black">Invoice #</th>
                <th className="py-3 px-4 font-black">Customer</th>
                <th className="py-3 px-4 font-black">Status</th>
                <th className="py-3 px-4 font-black text-right">Total</th>
                <th className="py-3 px-4 font-black text-right">Balance Due</th>
                <th className="py-3 px-4 font-black text-center">Actions</th>
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
                  <tr key={inv.id} className="hover:bg-[#f8fbfd]">
                    <td className="py-3 px-4 font-bold text-[#1c2b3a]">{inv.date}</td>
                    <td className="py-3 px-4 font-black text-[#2f6fb3]">{inv.number}</td>
                    <td className="py-3 px-4 font-extrabold text-[#12345b]">{inv.customerName}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right font-black text-[#12345b]">{formatMoney(inv.amount)}</td>
                    <td className="py-3 px-4 text-right font-black text-[#b42318]">{formatMoney(inv.balance || inv.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-2.5 py-1 bg-white border border-[#bdcbd9] hover:bg-[#edf5fb] text-[#12345b] font-bold text-[11px] rounded-lg"
                        >
                          Preview / Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEmailInvoice(inv)}
                          className="px-2.5 py-1 bg-[#2f6fb3] hover:bg-[#235891] text-white font-bold text-[11px] rounded-lg"
                        >
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 text-[#b42318] hover:bg-[#fee2e2] rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                  onClick={() => handleEmailInvoice(previewInvoice)}
                  className="px-3 py-1.5 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-lg flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white text-[#12345b] hover:bg-[#edf5fb] text-xs font-black rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="p-1 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Document Design */}
            <div className="p-8 space-y-6 text-[#172235] font-sans">
              <div className="flex items-start justify-between border-b-2 border-[#86b51b] pb-4">
                <div>
                  <h1 className="text-3xl font-black text-[#86b51b]">INVOICE</h1>
                  <strong className="block text-sm font-black text-[#12345b] mt-1">
                    Central Dispatch Limited / Bermuda Island Taxi
                  </strong>
                  <div className="text-xs text-[#607286] mt-0.5">
                    18 Boulden Circle<br />New Castle, DE 19720-3494
                  </div>
                </div>
                <div className="text-right text-xs">
                  <strong className="text-[#12345b]">info@bermudaislandtaxi.com</strong>
                  <div className="text-[#607286] mt-0.5">+1 (441) 295-4141</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#f3f8e9] p-4 rounded-xl text-xs">
                <div>
                  <strong className="text-[#456078] uppercase block text-[10px]">Bill To:</strong>
                  <div className="font-black text-[#12345b] text-sm mt-0.5">{previewInvoice.customerName}</div>
                  <div className="text-[#607286]">{previewInvoice.customerEmail}</div>
                </div>
                <div>
                  <strong className="text-[#456078] uppercase block text-[10px]">Ship / Service Customer:</strong>
                  <div className="font-bold text-[#12345b] mt-0.5">{previewInvoice.customerName}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-[#f4f7fa] p-3 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Invoice No.</span>
                  <strong className="text-[#12345b] font-black">{previewInvoice.number}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#607286] block">Terms</span>
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
              <table className="w-full text-left text-xs border-collapse">
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

              {/* Totals */}
              <div className="ml-auto w-72 space-y-1.5 border-t-2 border-[#12345b] pt-3 text-xs">
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

              {previewInvoice.memo && (
                <div className="p-3 bg-[#f8fbfd] border border-[#dce6ef] rounded-xl text-xs text-[#607286]">
                  <strong>Message / Memo:</strong> {previewInvoice.memo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
