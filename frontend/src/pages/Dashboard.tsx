import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { payrollService } from '../services/payrollService';
import { leaveService } from '../services/leaveService';
import { scheduleService } from '../services/scheduleService';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { Calendar, Users, Clock, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const employees = employeeService.getEmployees();
  const currentDraft = payrollService.getCurrentDraft();
  const leaves = leaveService.getLeaves();
  const currentSchedule = scheduleService.getWeeklySchedules('2026-09-07');

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

  return (
    <div className="space-y-6">
      {/* Workspace Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            Hello, {greetingName}
          </h1>
          <p className="text-sm font-extrabold text-[#2f6fb3] mt-1">
            It's Thursday, 10 Sept 2026.
          </p>
        </div>
        <div className="bg-white border border-[#d9e2ea] rounded-xl px-4 py-2 text-xs font-extrabold text-[#12345b] shadow-sm self-start sm:self-auto">
          Current pay period
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Primary Blue Filled Card */}
        <div className="bg-gradient-to-br from-[#3157d4] to-[#273f9c] text-white rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-white/90">
            Employees
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
            {employees.filter(e => e.status === 'Active').length}
          </div>
        </div>

        {/* Card 2: Total Hours */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#3157d4]">
            Total Hours
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            {currentDraft?.totalHours.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Card 3: Gross Payroll */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#5d9e14]">
            Gross Payroll
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            ${currentDraft?.totalGrossPayroll.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Card 4: Payroll To Pay */}
        <div className="bg-white border border-[#dce4eb] rounded-2xl p-5 shadow-cdCard flex flex-col justify-between min-h-[120px]">
          <div className="text-sm font-extrabold text-[#ef7217]">
            Payroll To Pay
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#12345b] tracking-tight mt-3 tabular-nums">
            ${currentDraft?.totalNetPayroll.toFixed(2) || '0.00'}
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

      {/* Bottom Section: Staff Schedule & Quick Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Staff Schedule Card */}
        <div className="lg:col-span-8 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Weekly Staff Schedule
            </h2>
            <button
              onClick={() => navigate('/schedules')}
              className="px-3.5 py-1.5 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Open Weekly Schedules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 text-center text-sm font-semibold text-[#607286]">
            {currentSchedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#12345b] text-white">
                      <th className="p-2.5 rounded-l-lg">Employee</th>
                      <th className="p-2.5 text-center">Mon</th>
                      <th className="p-2.5 text-center">Tue</th>
                      <th className="p-2.5 text-center">Wed</th>
                      <th className="p-2.5 text-center">Thu</th>
                      <th className="p-2.5 text-center">Fri</th>
                      <th className="p-2.5 text-center rounded-r-lg">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.slice(0, 4).map((emp, i) => (
                      <tr key={emp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fbfd]'}>
                        <td className="p-2.5 font-bold text-[#183a61]">{emp.displayName}</td>
                        <td className="p-2.5 text-center text-[#607286]">8-4</td>
                        <td className="p-2.5 text-center text-[#607286]">8-4</td>
                        <td className="p-2.5 text-center text-[#607286]">OFF</td>
                        <td className="p-2.5 text-center text-[#607286]">8-4</td>
                        <td className="p-2.5 text-center text-[#607286]">8-4</td>
                        <td className="p-2.5 text-center font-black text-[#12345b]">32.0 hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6">No weekly schedule has been set yet.</p>
            )}
          </div>
        </div>

        {/* Workspace Quick Summary */}
        <div className="lg:col-span-4 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee]">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Workspace
            </h2>
          </div>
          <div className="p-5 space-y-4 text-sm font-semibold text-[#456078]">
            <div className="flex items-center justify-between py-2 border-b border-[#e5ebf1]">
              <span>Payroll status</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eef6ff] text-[#244f78] font-bold text-xs border border-[#c9def6]">
                {currentDraft?.status || 'Draft'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#e5ebf1]">
              <span>Staff records</span>
              <strong className="text-[#12345b] font-extrabold">{employees.length} staff spaces</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#e5ebf1]">
              <span>Active pay periods</span>
              <strong className="text-[#12345b] font-extrabold">2 saved</strong>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Bermuda tax status</span>
              <strong className="text-[#0f766e] font-extrabold">Bermuda Rules</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
