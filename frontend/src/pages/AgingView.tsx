import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../services/api';
import { AgingSummary } from '../types';

import { exportToXLSX } from '../utils/excelExport';

export const AgingView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: any }>(`/ar-aging?asOf=${asOfDate}`).then(res => {
      if (res && res.success && res.data) {
        setApiData(res.data);
      }
    });
  }, [asOfDate]);

  const { summaries, total }: { summaries: AgingSummary[]; total: AgingSummary } = useMemo(() => {
    if (apiData && apiData.summaries) {
      return { summaries: apiData.summaries, total: apiData.total };
    }
    return accountingService.getAgingReport(asOfDate);
  }, [asOfDate, apiData]);

  // Formatter for currency: BMD 0.00
  const formatMoney = (amount: number) => {
    const num = Number(amount) || 0;
    return `BMD ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportExcel = () => {
    const title = `Accounts Receivable Aging as of ${asOfDate}`;
    const headers = ['Customer', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total'];
    const rows = [
      ...summaries.map(s => [
        s.customerName,
        s.current ? Number(s.current).toFixed(2) : '0.00',
        s.d1_30 ? Number(s.d1_30).toFixed(2) : '0.00',
        s.d31_60 ? Number(s.d31_60).toFixed(2) : '0.00',
        s.d61_90 ? Number(s.d61_90).toFixed(2) : '0.00',
        s.d90_plus ? Number(s.d90_plus).toFixed(2) : '0.00',
        s.total ? Number(s.total).toFixed(2) : '0.00',
      ]),
      [
        'TOTAL',
        total.current ? Number(total.current).toFixed(2) : '0.00',
        total.d1_30 ? Number(total.d1_30).toFixed(2) : '0.00',
        total.d31_60 ? Number(total.d31_60).toFixed(2) : '0.00',
        total.d61_90 ? Number(total.d61_90).toFixed(2) : '0.00',
        total.d90_plus ? Number(total.d90_plus).toFixed(2) : '0.00',
        total.total ? Number(total.total).toFixed(2) : '0.00',
      ]
    ];

    exportToXLSX({
      filename: `CDL-Accounts-Receivable-Aging-${asOfDate}.xlsx`,
      sheetName: 'A_R Aging',
      headers,
      rows
    });
    showToast('A/R Aging report exported to Excel successfully.');
  };

  const handleCustomerClick = (customerId?: string) => {
    if (customerId) {
      accountingService.setSelectedCustomerId(customerId);
      navigate('/customers');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Accounts Receivable Aging
          </h1>
          <p className="text-sm font-semibold text-[#1d4ed8] mt-1">
            Outstanding invoices grouped by the number of days past due.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-extrabold rounded-xl transition-all shadow-md self-start sm:self-auto hover:shadow-lg active:scale-95"
        >
          Export Aging to Excel
        </button>
      </div>

      {/* 2. Main Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Accounting Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0]">
          <div className="max-w-xs">
            <label htmlFor="agingAsOf" className="block text-xs font-bold text-[#334155] mb-1.5">
              Aging as of
            </label>
            <input
              id="agingAsOf"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
            />
          </div>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe horizontally to view 1–30, 31–60, 61–90 &amp; 90+ Days</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
            8 Columns
          </span>
        </div>

        {/* Table Wrap */}
        <div className="table-responsive-container">
          <table className="w-full text-left text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">Customer</th>
                <th className="py-3.5 px-5 font-bold text-right">Current</th>
                <th className="py-3.5 px-5 font-bold text-right">1–30 Days</th>
                <th className="py-3.5 px-5 font-bold text-right">31–60 Days</th>
                <th className="py-3.5 px-5 font-bold text-right">61–90 Days</th>
                <th className="py-3.5 px-5 font-bold text-right">90+ Days</th>
                <th className="py-3.5 px-5 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {summaries.length === 0 ? (
                /* Empty / No aging row, showing summary row directly as in prototype */
                <tr className="bg-[#fbfdff] font-extrabold text-[#0f172a]">
                  <td className="py-4 px-5 font-extrabold tracking-wide">TOTAL</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.current)}</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d1_30)}</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d31_60)}</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d61_90)}</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d90_plus)}</td>
                  <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.total)}</td>
                </tr>
              ) : (
                <>
                  {summaries.map((s) => (
                    <tr
                      key={s.customerId}
                      className="hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-bold text-[#0f172a]">
                        <button
                          onClick={() => handleCustomerClick(s.customerId)}
                          className="text-[#1d4ed8] hover:underline font-bold text-left"
                        >
                          {s.customerName}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-semibold text-[#334155]">
                        {s.current ? formatMoney(s.current) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-semibold text-[#d97706]">
                        {s.d1_30 ? formatMoney(s.d1_30) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-semibold text-[#d97706]">
                        {s.d31_60 ? formatMoney(s.d31_60) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-semibold text-[#dc2626]">
                        {s.d61_90 ? formatMoney(s.d61_90) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-semibold text-[#dc2626]">
                        {s.d90_plus ? formatMoney(s.d90_plus) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-extrabold text-[#0f172a]">
                        {formatMoney(s.total)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Summary Row */}
                  <tr className="bg-[#fbfdff] font-extrabold text-[#0f172a] border-t-2 border-[#cbd5e1]">
                    <td className="py-4 px-5 font-extrabold tracking-wide">TOTAL</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.current)}</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d1_30)}</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d31_60)}</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d61_90)}</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.d90_plus)}</td>
                    <td className="py-4 px-5 text-right font-extrabold">{formatMoney(total.total)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Accounting Note */}
        <div className="p-4 border-t border-[#edf2f7] bg-[#fcfdfe] text-xs font-semibold text-[#64748b]">
          The imported customer and general-ledger files did not contain open-invoice due dates. Aging starts with invoices created in this app.
        </div>
      </div>
    </div>
  );
};
