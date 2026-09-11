import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { 
  Download, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const AgingView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { summaries, total } = useMemo(() => {
    return accountingService.getAgingReport(asOfDate);
  }, [asOfDate]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(amount || 0);
  };

  const handleExportExcel = () => {
    const rows = [
      ['Customer Name', 'Current (BMD)', '1-30 Days (BMD)', '31-60 Days (BMD)', '61-90 Days (BMD)', '90+ Days (BMD)', 'Total Balance (BMD)'],
      ...summaries.map(s => [
        s.customerName,
        s.current.toFixed(2),
        s.d1_30.toFixed(2),
        s.d31_60.toFixed(2),
        s.d61_90.toFixed(2),
        s.d90_plus.toFixed(2),
        s.total.toFixed(2),
      ]),
      [
        'TOTAL SUMMARY',
        total.current.toFixed(2),
        total.d1_30.toFixed(2),
        total.d31_60.toFixed(2),
        total.d61_90.toFixed(2),
        total.d90_plus.toFixed(2),
        total.total.toFixed(2),
      ],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Central_Dispatch_AR_Aging_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('A/R Aging report exported successfully!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#12345b] to-[#1e528d] flex items-center justify-center text-white shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
                Accounts Receivable Aging
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#edf4fa] text-[#2f6fb3] border border-[#d2e2f0]">
                As of {asOfDate}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#607286] mt-1">
              Outstanding receivables categorized by aging intervals (Current, 1–30, 31–60, 61–90, and 90+ days past due).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#f8fbfd] border border-[#cbd5e1] px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-[#607286]" />
            <input
              type="date"
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1e293b] focus:outline-none"
            />
          </div>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#235891] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Current */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-extrabold uppercase text-[#0f766e]">Current (Not Due)</span>
          <strong className="block text-xl font-black text-[#0f766e] mt-1">
            {formatMoney(total.current)}
          </strong>
          <span className="text-[10px] font-semibold text-[#64748b]">On time terms</span>
        </div>

        {/* 1 - 30 Days */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-extrabold uppercase text-[#d97706]">1 – 30 Days</span>
          <strong className="block text-xl font-black text-[#d97706] mt-1">
            {formatMoney(total.d1_30)}
          </strong>
          <span className="text-[10px] font-semibold text-[#64748b]">Past due 1 mo</span>
        </div>

        {/* 31 - 60 Days */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-extrabold uppercase text-[#ea580c]">31 – 60 Days</span>
          <strong className="block text-xl font-black text-[#ea580c] mt-1">
            {formatMoney(total.d31_60)}
          </strong>
          <span className="text-[10px] font-semibold text-[#64748b]">Past due 2 mo</span>
        </div>

        {/* 61 - 90 Days */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-extrabold uppercase text-[#dc2626]">61 – 90 Days</span>
          <strong className="block text-xl font-black text-[#dc2626] mt-1">
            {formatMoney(total.d61_90)}
          </strong>
          <span className="text-[10px] font-semibold text-[#64748b]">Past due 3 mo</span>
        </div>

        {/* 90+ Days */}
        <div className="bg-white border border-[#dde7f0] rounded-2xl p-4 shadow-sm">
          <span className="block text-[11px] font-extrabold uppercase text-[#991b1b]">90+ Days</span>
          <strong className="block text-xl font-black text-[#991b1b] mt-1">
            {formatMoney(total.d90_plus)}
          </strong>
          <span className="text-[10px] font-semibold text-[#64748b]">Critical overdue</span>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-sm font-black text-[#12345b]">
            Detailed Aging by Customer
          </h2>
          <span className="text-xs font-bold text-[#607286]">
            {summaries.length} Customer Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#12345b] text-white border-b border-[#0e2744]">
                <th className="py-3 px-4 font-black min-w-[240px]">Customer Name</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">Current</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">1–30 Days</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">31–60 Days</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">61–90 Days</th>
                <th className="py-3 px-4 font-black text-right w-28 whitespace-nowrap">90+ Days</th>
                <th className="py-3 px-4 font-black text-right w-32 whitespace-nowrap">Total Balance</th>
                <th className="py-3 px-4 font-black text-center w-24 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#607286]">
                    <div className="max-w-md mx-auto space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-black text-[#12345b]">No outstanding customer invoices</p>
                      <p className="text-xs text-[#64748b]">All customer accounts are fully settled as of {asOfDate}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                summaries.map(s => (
                  <tr key={s.customerId} className="hover:bg-[#f8fbfd] transition-colors">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          accountingService.setSelectedCustomerId(s.customerId);
                          navigate('/customers');
                        }}
                        className="font-extrabold text-[#12345b] hover:text-[#2f6fb3] hover:underline text-left block"
                      >
                        {s.customerName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#0f766e]">
                      {s.current ? formatMoney(s.current) : <span className="text-[#94a3b8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#d97706]">
                      {s.d1_30 ? formatMoney(s.d1_30) : <span className="text-[#94a3b8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#ea580c]">
                      {s.d31_60 ? formatMoney(s.d31_60) : <span className="text-[#94a3b8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#dc2626]">
                      {s.d61_90 ? formatMoney(s.d61_90) : <span className="text-[#94a3b8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#991b1b]">
                      {s.d90_plus ? formatMoney(s.d90_plus) : <span className="text-[#94a3b8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#12345b]">
                      {formatMoney(s.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          accountingService.setSelectedCustomerId(s.customerId);
                          navigate('/customers');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#edf4fa] hover:bg-[#d8e6f3] text-[#2f6fb3] rounded-lg text-[11px] font-bold transition-colors"
                      >
                        <span>Ledger</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* Total Summary Footer Row */}
              {summaries.length > 0 && (
                <tr className="bg-[#edf4fa] font-black border-t-2 border-[#12345b]">
                  <td className="py-3.5 px-4 text-[#12345b] uppercase tracking-wider">TOTAL AR BALANCE</td>
                  <td className="py-3.5 px-4 text-right text-[#0f766e]">{formatMoney(total.current)}</td>
                  <td className="py-3.5 px-4 text-right text-[#d97706]">{formatMoney(total.d1_30)}</td>
                  <td className="py-3.5 px-4 text-right text-[#ea580c]">{formatMoney(total.d31_60)}</td>
                  <td className="py-3.5 px-4 text-right text-[#dc2626]">{formatMoney(total.d61_90)}</td>
                  <td className="py-3.5 px-4 text-right text-[#991b1b]">{formatMoney(total.d90_plus)}</td>
                  <td className="py-3.5 px-4 text-right text-[#12345b] text-sm">{formatMoney(total.total)}</td>
                  <td className="py-3.5 px-4"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
