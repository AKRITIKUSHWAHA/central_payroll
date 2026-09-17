import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Settings, Building, Save, ShieldAlert, Mail, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { companyService } from '../services/companyService';
import { apiFetch } from '../services/api';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('Central Dispatch Limited');
  const [address, setAddress] = useState('3 Laffan Street, Pembroke HM09');
  const [phone, setPhone] = useState('(441) 295-4141');
  const [email, setEmail] = useState('info@bermudaislandtaxi.com');
  const [overtimeThreshold, setOvertimeThreshold] = useState('40');
  const [paymentLink, setPaymentLink] = useState('https://ridebermuda-prod.web.app/paylink');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    companyService.fetchCompanyProfile().then(data => {
      if (data) {
        if (data.organizationName) setCompanyName(data.organizationName);
        if (data.address) setAddress(data.address);
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        if (data.overtimeThreshold) setOvertimeThreshold(String(data.overtimeThreshold));
        if (data.paymentLink) setPaymentLink(data.paymentLink);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await companyService.updateCompanyProfile({
        organizationName: companyName,
        address,
        phone,
        email,
        overtimeThreshold,
        paymentLink
      });
      showToast('Company details & settings saved permanently in MySQL database.');
    } catch (err: any) {
      showToast('Error saving settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            System Settings
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Configure Bermuda company information, payment links, and payroll parameters
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-6">
        <h2 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#2f6fb3]" />
          <span>Company Profile (Bermuda Operations)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Bermuda Telephone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Office Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Payroll Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>
        </div>

        {/* Payment Link Configuration */}
        <h2 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2 pt-2 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-emerald-600" />
          <span>RideBermuda Payment Link Integration</span>
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#38516b]">
            Default Customer Payment Link (Used across Invoices &amp; Payments)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={paymentLink}
              onChange={e => setPaymentLink(e.target.value)}
              placeholder="https://ridebermuda-prod.web.app/paylink"
              className="flex-1 px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>Test Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-[#607286]">
            Customers can use this link to pay invoices directly online.
          </p>
        </div>

        <h2 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2 pt-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#0f766e]" />
          <span>Payroll Configuration</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Weekly Overtime Hours Threshold</label>
            <input
              type="number"
              value={overtimeThreshold}
              onChange={e => setOvertimeThreshold(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">Tax Calculation Engine</label>
            <input
              type="text"
              disabled
              value="Bermuda Custom (Non-US)"
              className="w-full px-3.5 py-2 bg-[#f4f7fb] border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#0f766e]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings to MySQL'}</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore Utility */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-4">
        <h2 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          <span>System Backup &amp; Data Recovery</span>
        </h2>
        <p className="text-xs text-[#607286]">
          Download a complete snapshot of the Central Dispatch system (all employee profiles, payroll archives, customers, invoices, and general ledger transactions) in JSON format.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await apiFetch('/settings/backup');
                const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Central_Dispatch_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Full system backup downloaded successfully!', 'success');
              } catch (err: any) {
                showToast('Failed to generate system backup', 'error');
              }
            }}
            className="px-4 py-2.5 bg-[#12345b] hover:bg-[#1a4474] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Download System Backup (JSON)</span>
          </button>

          <label className="px-4 py-2.5 bg-white border border-[#bdcbd9] hover:bg-[#f1f5f9] text-[#12345b] text-xs font-black rounded-xl shadow-sm flex items-center gap-2 cursor-pointer">
            <span>Restore Backup File</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const parsed = JSON.parse(text);
                  if (!window.confirm('Restore this complete backup? This will update the database state.')) return;
                  await apiFetch('/settings/restore', {
                    method: 'POST',
                    body: JSON.stringify(parsed)
                  });
                  showToast('Backup restored successfully!', 'success');
                } catch (err: any) {
                  showToast('Invalid backup file format.', 'error');
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

