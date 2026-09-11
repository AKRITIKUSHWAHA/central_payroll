import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { leaveService } from '../services/leaveService';
import { scheduleService } from '../services/scheduleService';
import { accountingService } from '../services/accountingService';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { 
  Users, 
  Receipt, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Phone, 
  ShieldCheck, 
  UserCog, 
  Save, 
  ArrowRight, 
  Search 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [customerSearch, setCustomerSearch] = useState('');

  const employees = employeeService.getEmployees();
  const currentDraft = payrollService.getCurrentDraft();
  const leaves = leaveService.getLeaves();
  const currentSchedule = scheduleService.getWeeklySchedules('2026-09-07');
  const allCustomers = accountingService.getCustomers();

  // Dynamic greeting date (e.g. "It's Friday, 11 Sept 2026.")
  const dynamicGreetingDate = (() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    return `It's ${weekday}, ${day} ${month} ${year}.`;
  })();

  // Filter customers on dashboard
  const filteredCustomers = allCustomers.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    const haystack = [c.name, c.customerName, c.phone, c.email, c.billingAddress, ...(c.aliases || [])].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BMD' }).format(val || 0);
  };

  // Chart data for Payroll by Employee
  const payrollChartData = currentDraft?.items.map(item => ({
    name: item.employeeName.split(' ')[0],
    gross: item.grossPay || 0,
    fullName: item.employeeName,
  })) || [
    { name: 'Ali', gross: 0 },
    { name: 'Alesia', gross: 0 },
    { name: 'Tyonika', gross: 0 },
    { name: 'Neli', gross: 0 },
    { name: 'SSH', gross: 0 },
  ];

  // Leave ring chart data
  const sickCount = leaves.filter(l => l.leaveType === 'Sick').reduce((acc, curr) => acc + curr.daysCount, 0);
  const holidayCount = leaves.filter(l => l.leaveType === 'Vacation' || l.leaveType === 'Holiday').reduce((acc, curr) => acc + curr.daysCount, 0);
  
  const leaveRingData = [
    { name: 'Sick', value: sickCount || 1, color: '#3157d4' },
    { name: 'Holiday', value: holidayCount || 1, color: '#7ba1f2' },
  ];

  const greetingName = currentUser?.displayName || 'Neli Outerbridge';

  const handleSelectCustomer = (id: string) => {
    accountingService.setSelectedCustomerId(id);
    navigate('/customers');
  };

  return (
    <div className="space-y-6">
      {/* Workspace Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            Hello, {greetingName}
          </h1>
          <p className="text-sm font-extrabold text-[#2f6fb3] mt-1">
            {dynamicGreetingDate}
          </p>
        </div>
        <div className="bg-white border border-[#d9e2ea] rounded-xl px-4 py-2 text-xs font-extrabold text-[#12345b] shadow-sm self-start sm:self-auto">
          Current pay period
        </div>
      </div>

      {/* TOP HOME LAUNCHER (4 Groups Grid matching target screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Big Column: Customers & Employees */}
        <div className="lg:col-span-8 space-y-5">
          {/* Group 1: Customers */}
          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-cdCard relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e5efff] text-[#12345b] text-xs font-black px-5 py-1 rounded-full shadow-xs border border-[#c9def6]">
              Customers
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  👥
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Customers &amp; Ledgers
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  View and edit customers
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  🧾
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Create Invoice
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Build and email invoices
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  💳
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Record Payment
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Apply received payments
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/aging')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  📅
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  A/R Aging
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Review overdue balances
                </small>
              </button>
            </div>
          </div>

          {/* Group 2: Employees & Payroll */}
          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-cdCard relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e5efff] text-[#12345b] text-xs font-black px-5 py-1 rounded-full shadow-xs border border-[#c9def6]">
              Employees &amp; Payroll
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/payroll')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  💰
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Weekly Payroll
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Enter hours and pay
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  🪪
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Employee Records
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Add or edit staff
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/schedules')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  🕒
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Weekly Schedules
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Plan employee shifts
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/leave')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  🏖️
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Leave Calendars
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Manage staff leave
                </small>
              </button>

              <button
                type="button"
                onClick={() => navigate('/payslips')}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[120px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f3f7] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform">
                  📄
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight block">
                  Payslips
                </strong>
                <small className="text-[10px] font-semibold text-[#64748b] mt-0.5">
                  Review &amp; print payslips
                </small>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Company & Administration */}
        <div className="lg:col-span-4 space-y-5">
          {/* Group 3: Company & Reports */}
          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-cdCard relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e5efff] text-[#12345b] text-xs font-black px-4 py-1 rounded-full shadow-xs border border-[#c9def6] whitespace-nowrap">
              Company &amp; Reports
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#e8f3f7] flex items-center justify-center text-lg mb-1.5 group-hover:scale-105 transition-transform">
                  📊
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight">
                  Accounts Overview
                </strong>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ledger')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#e8f3f7] flex items-center justify-center text-lg mb-1.5 group-hover:scale-105 transition-transform">
                  📚
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight">
                  General Ledger
                </strong>
              </button>

              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#e8f3f7] flex items-center justify-center text-lg mb-1.5 group-hover:scale-105 transition-transform">
                  📈
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight">
                  Payroll Reports
                </strong>
              </button>

              <button
                type="button"
                onClick={() => navigate('/contacts')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#e8f3f7] flex items-center justify-center text-lg mb-1.5 group-hover:scale-105 transition-transform">
                  ☎️
                </div>
                <strong className="text-xs font-black text-[#17324f] leading-tight">
                  Staff Contacts
                </strong>
              </button>
            </div>
          </div>

          {/* Group 4: Administration */}
          <div className="bg-white border border-[#d8e3ec] rounded-2xl p-5 shadow-cdCard relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#e5efff] text-[#12345b] text-xs font-black px-4 py-1 rounded-full shadow-xs border border-[#c9def6] whitespace-nowrap">
              Administration
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/permissions')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-9 h-9 rounded-full bg-[#e8f3f7] flex items-center justify-center text-base mb-1.5 group-hover:scale-105 transition-transform">
                  🔐
                </div>
                <strong className="text-[11px] font-black text-[#17324f] leading-tight">
                  Permissions
                </strong>
              </button>

              <button
                type="button"
                onClick={() => navigate('/users')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-9 h-9 rounded-full bg-[#e8f3f7] flex items-center justify-center text-base mb-1.5 group-hover:scale-105 transition-transform">
                  ⚙️
                </div>
                <strong className="text-[11px] font-black text-[#17324f] leading-tight">
                  User Accounts
                </strong>
              </button>

              <button
                type="button"
                onClick={() => navigate('/accounts')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[#d6e2eb] bg-[#f9fcff] hover:bg-white hover:border-[#2f70b7] hover:shadow-md transition-all text-center min-h-[105px] group"
              >
                <div className="w-9 h-9 rounded-full bg-[#e8f3f7] flex items-center justify-center text-base mb-1.5 group-hover:scale-105 transition-transform">
                  💾
                </div>
                <strong className="text-[11px] font-black text-[#17324f] leading-tight">
                  Backup &amp; Restore
                </strong>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Primary Blue Filled Card */}
        <div className="bg-gradient-to-br from-[#3157d4] to-[#273f9c] text-white rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-white/90">
            Employees
          </div>
          <div className="text-3xl font-black tracking-tight mt-3">
            {employees.filter(e => e.status === 'Active').length || 5}
          </div>
        </div>

        {/* Card 2: Total Hours */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#3157d4]">
            Total Hours
          </div>
          <div className="text-2xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            {currentDraft?.totalHours ? currentDraft.totalHours.toFixed(2) : '0.00'}
          </div>
        </div>

        {/* Card 3: Gross Payroll */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#5d9e14]">
            Gross Payroll
          </div>
          <div className="text-2xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            {currentDraft?.totalGrossPayroll ? formatMoney(currentDraft.totalGrossPayroll) : '$0.00'}
          </div>
        </div>

        {/* Card 4: Payroll To Pay */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#ef7217]">
            Payroll To Pay
          </div>
          <div className="text-2xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            {currentDraft?.totalNetPayroll ? formatMoney(currentDraft.totalNetPayroll) : '$0.00'}
          </div>
        </div>
      </div>

      {/* Middle Section: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Payroll by Employee */}
        <div className="lg:col-span-7 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Payroll by Employee
            </h2>
            <span className="text-xs font-bold text-[#607286]">
              Current draft
            </span>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#637487" fontSize={12} tickLine={false} />
                <YAxis stroke="#637487" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gross Pay']}
                  contentStyle={{ backgroundColor: '#12345b', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="gross" fill="#3157d4" radius={[6, 6, 0, 0]}>
                  {payrollChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3157d4' : '#7e99ec'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Ring Chart: Staff Leave */}
        <div className="lg:col-span-5 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Staff Leave
            </h2>
            <span className="text-xs font-bold text-[#607286]">
              Recorded days
            </span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveRingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leaveRingData.map((entry, index) => (
                      <Cell key={`leave-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-[#12345b]">
                  {sickCount + holidayCount} Days
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-xs font-bold text-[#536579]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3157d4]"></span>
                <span><b>{sickCount}</b> Sick</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7ba1f2]"></span>
                <span><b>{holidayCount}</b> Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Staff Schedule Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#12345b]">
            Weekly Staff Schedule
          </h2>
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="px-3.5 py-1.5 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Open Weekly Schedules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-8 text-center text-[#607286] font-bold text-sm">
          No weekly schedule has been set yet.
        </div>
      </div>

      {/* Bottom 2-Column Split: Recent Payroll Reports & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Payroll Reports */}
        <div className="lg:col-span-7 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Recent Payroll Reports
            </h2>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="px-3 py-1 bg-white border border-[#bdcbd9] hover:bg-[#edf5fb] text-[#12345b] text-xs font-bold rounded-lg"
            >
              View all reports
            </button>
          </div>
          <div className="p-6 text-center text-[#607286] font-semibold text-xs">
            No processed payroll reports yet.
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-5 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee]">
            <h2 className="text-base font-extrabold text-[#12345b]">Workspace</h2>
          </div>
          <div className="divide-y divide-[#e7edf2] p-2 bg-white">
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#456078]">Payroll status</span>
              <strong className="font-black text-[#12345b]">Draft</strong>
            </div>
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#456078]">Staff records</span>
              <strong className="font-black text-[#12345b]">8 staff spaces</strong>
            </div>
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#456078]">Reports saved</span>
              <strong className="font-black text-[#12345b]">0</strong>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH CUSTOMERS PANEL WITH REAL-TIME SEARCH (Matches Screenshot) */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
          <h2 className="text-lg font-black text-[#12345b]">Customers</h2>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>Open Customer Ledgers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-6 border-b border-[#d9e4ee] bg-white space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#38516b]">
              Search all customers
            </label>
            <span className="text-xs font-bold text-[#607286]">
              {filteredCustomers.length.toLocaleString()} customers
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Customer name, phone number, email, or address"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#12345b] text-white sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-black">Customer Name</th>
                <th className="py-3 px-4 font-black">Phone Number</th>
                <th className="py-3 px-4 font-black">Email Address</th>
                <th className="py-3 px-4 font-black">Billing Address</th>
                <th className="py-3 px-4 font-black">Status</th>
                <th className="py-3 px-4 font-black text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#607286] font-bold">
                    No customers match this search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.slice(0, 100).map(c => {
                  const bal = accountingService.getCustomerBalance(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-[#f8fbfd] transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(c.id)}
                          className="font-extrabold text-[#183a61] hover:underline text-left block"
                        >
                          {c.name}
                        </button>
                        {c.aliases && c.aliases.length > 0 && (
                          <div className="text-[11px] text-[#607286] mt-0.5">
                            {c.aliases.slice(0, 2).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#374151] font-semibold">{c.phone || '—'}</td>
                      <td className="py-3 px-4 text-[#374151] font-semibold">{c.email || '—'}</td>
                      <td className="py-3 px-4 text-[#456078] max-w-[240px] truncate" title={c.billingAddress}>
                        {c.billingAddress || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            c.status === 'Inactive'
                              ? 'bg-[#f1f5f9] text-[#64748b]'
                              : 'bg-[#dcfce7] text-[#166534]'
                          }`}
                        >
                          {c.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black tabular-nums text-[#12345b]">
                        {formatMoney(bal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#f8fbfd] border-t border-[#d9e4ee] text-xs font-semibold text-[#607286]">
          Duplicate customer names were consolidated. Alternate customer labels and available contact details were retained.
        </div>
      </div>
    </div>
  );
};
