import React, { useState } from 'react';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { Trash2, CheckCircle2 } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { showToast } = useToast();
  const customers = accountingService.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(accountingService.getSelectedCustomerId());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const openInvoices = selectedCustomerId ? accountingService.getCustomerOpenInvoices(selectedCustomerId) : [];
  const payments = accountingService.getPayments();

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(val || 0);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    accountingService.savePayment({
      customerId: selectedCustomerId,
      invoiceId: selectedInvoiceId || undefined,
      amount: numAmount,
      date: paymentDate,
      method: paymentMethod,
      reference,
      note,
    });

    showToast(`Payment of ${formatMoney(numAmount)} recorded successfully!`);
    setAmount('');
    setReference('');
    setNote('');
    setSelectedInvoiceId('');
  };

  const handleDeletePayment = (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    accountingService.deletePayment(id);
    showToast('Payment record removed.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee]">
          <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
            Record a Customer Payment
          </h1>
          <p className="text-xs font-bold text-[#607286] mt-0.5">
            Record money already received and optionally apply it to an open invoice.
          </p>
        </div>

        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Customer *
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={e => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedInvoiceId('');
                }}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              >
                <option value="">Select customer</option>
                {customers.map(c => {
                  const bal = accountingService.getCustomerBalance(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {bal ? `(${formatMoney(bal)})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Apply to Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              >
                <option value="">Unapplied / Customer Credit</option>
                {openInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} • Due: {inv.dueDate} • Balance: {formatMoney(accountingService.getInvoiceBalance(inv))}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Amount Received (BMD) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-black text-[#12345b]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
                Reference / Receipt #
              </label>
              <input
                type="text"
                placeholder="e.g. Wire-8849, Check #402"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#456078] uppercase mb-1">
              Payment Note
            </label>
            <textarea
              rows={2}
              placeholder="Additional payment details or remarks..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-[#bdcbd9] rounded-xl text-xs font-bold"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f766e] hover:bg-[#0c5e58] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#12345b]">Recent Payments Received</h2>
          <span className="text-xs font-bold text-[#607286]">{payments.length} payments recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#12345b] text-white">
              <tr>
                <th className="py-3 px-4 font-black">Date</th>
                <th className="py-3 px-4 font-black">Customer</th>
                <th className="py-3 px-4 font-black">Method</th>
                <th className="py-3 px-4 font-black">Reference</th>
                <th className="py-3 px-4 font-black">Note</th>
                <th className="py-3 px-4 font-black text-right">Amount</th>
                <th className="py-3 px-4 font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#607286] font-bold">
                    No customer payments recorded in this app yet.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-[#f8fbfd]">
                    <td className="py-3 px-4 font-bold text-[#1c2b3a]">{p.date}</td>
                    <td className="py-3 px-4 font-extrabold text-[#12345b]">{p.customerName}</td>
                    <td className="py-3 px-4 font-semibold text-[#2f6fb3]">{p.method}</td>
                    <td className="py-3 px-4 text-[#607286]">{p.reference || '—'}</td>
                    <td className="py-3 px-4 text-[#607286]">{p.note || '—'}</td>
                    <td className="py-3 px-4 text-right font-black text-[#0f766e]">{formatMoney(p.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1 text-[#b42318] hover:bg-[#fee2e2] rounded-lg"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
