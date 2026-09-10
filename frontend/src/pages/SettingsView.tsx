import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Settings, Building, Save, ShieldAlert, Mail } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('Central Dispatch Bermuda');
  const [address, setAddress] = useState('12 Church Street, Hamilton HM 11, Bermuda');
  const [phone, setPhone] = useState('(441) 292-1234');
  const [email, setEmail] = useState('payroll@centraldispatch.bm');
  const [overtimeThreshold, setOvertimeThreshold] = useState('40');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Company & Payroll settings updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            System Settings
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Configure Bermuda company information, payroll rules, and email parameters
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
            className="px-6 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
