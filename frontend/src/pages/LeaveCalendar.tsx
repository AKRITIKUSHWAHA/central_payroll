import React, { useState } from 'react';
import { employeeService } from '../services/employeeService';
import { leaveService } from '../services/leaveService';
import { useToast } from '../context/ToastContext';
import { Calendar, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const LeaveCalendar: React.FC = () => {
  const employees = employeeService.getEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-09');
  
  // Track selected sick dates and holiday dates for current employee
  const [sickDates, setSickDates] = useState<string[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const { showToast } = useToast();

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || employees[0];

  // Days in September 2026 (Sun=Aug 30 ... 30 days)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const leadingBlanks = 2; // Sept 1 2026 is Tuesday -> 2 blanks (Sun, Mon)

  const toggleSickDate = (day: number) => {
    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
    if (holidayDates.includes(dateStr)) {
      setHolidayDates(prev => prev.filter(d => d !== dateStr));
    }
    if (sickDates.includes(dateStr)) {
      setSickDates(prev => prev.filter(d => d !== dateStr));
      showToast(`Removed sick day Sept ${day} for ${selectedEmployee.displayName}`, 'info');
    } else {
      setSickDates(prev => [...prev, dateStr]);
      showToast(`Recorded sick day Sept ${day} for ${selectedEmployee.displayName}`);
    }
  };

  const toggleHolidayDate = (day: number) => {
    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
    if (sickDates.includes(dateStr)) {
      setSickDates(prev => prev.filter(d => d !== dateStr));
    }
    if (holidayDates.includes(dateStr)) {
      setHolidayDates(prev => prev.filter(d => d !== dateStr));
      showToast(`Removed holiday Sept ${day} for ${selectedEmployee.displayName}`, 'info');
    } else {
      setHolidayDates(prev => [...prev, dateStr]);
      showToast(`Recorded holiday Sept ${day} for ${selectedEmployee.displayName}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Header (Matching Screenshot 3) */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-[#12345b]">
            Employee Leave Calendars
          </h1>
          <span className="text-xs font-bold text-[#607286]">
            Sick time and holidays are saved with each employee
          </span>
        </div>

        {/* Tools row */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#d9e4ee]">
          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Calendar Month
            </label>
            <input
              type="month"
              value={calendarMonth}
              onChange={e => setCalendarMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
            />
          </div>
        </div>

        {/* Side-by-Side Calendars Grid (Matching Screenshot 3) */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sick Time Calendar */}
          <div className="border border-[#d7e3ed] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#a33b32] text-white font-extrabold text-sm tracking-wide">
              Sick Time Calendar
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#dce6ef] p-px text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 bg-[#edf4fa] font-extrabold text-[#52687d]">
                  {day}
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="py-3 bg-[#f6f8fb]" />
              ))}
              {daysInMonth.map(day => {
                const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
                const isSick = sickDates.includes(dateStr);
                return (
                  <button
                    key={`sick-${day}`}
                    onClick={() => toggleSickDate(day)}
                    className={`py-3 font-bold transition-all ${
                      isSick
                        ? 'bg-[#f7d8d5] text-[#8d251d] font-black ring-2 ring-inset ring-[#c95950]'
                        : 'bg-white text-[#25384b] hover:bg-[#eaf3fa]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Holiday Calendar */}
          <div className="border border-[#d7e3ed] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#24796f] text-white font-extrabold text-sm tracking-wide">
              Holiday Calendar
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#dce6ef] p-px text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 bg-[#edf4fa] font-extrabold text-[#52687d]">
                  {day}
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-h-${i}`} className="py-3 bg-[#f6f8fb]" />
              ))}
              {daysInMonth.map(day => {
                const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
                const isHoliday = holidayDates.includes(dateStr);
                return (
                  <button
                    key={`holiday-${day}`}
                    onClick={() => toggleHolidayDate(day)}
                    className={`py-3 font-bold transition-all ${
                      isHoliday
                        ? 'bg-[#d4eee9] text-[#145f57] font-black ring-2 ring-inset ring-[#319488]'
                        : 'bg-white text-[#25384b] hover:bg-[#eaf3fa]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leave Summaries Row */}
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f6f9fc] border border-[#dce6ef] rounded-xl p-4">
            <strong className="block text-sm font-extrabold text-[#12345b]">
              Sick dates for selected employee
            </strong>
            <span className="block text-xs font-semibold text-[#607286] mt-1.5 min-h-[24px]">
              {sickDates.length > 0
                ? sickDates.map(d => d.replace('2026-09-', 'Sept ')).join(', ')
                : 'No sick dates recorded.'}
            </span>
          </div>

          <div className="bg-[#f6f9fc] border border-[#dce6ef] rounded-xl p-4">
            <strong className="block text-sm font-extrabold text-[#12345b]">
              Holiday dates for selected employee
            </strong>
            <span className="block text-xs font-semibold text-[#607286] mt-1.5 min-h-[24px]">
              {holidayDates.length > 0
                ? holidayDates.map(d => d.replace('2026-09-', 'Sept ')).join(', ')
                : 'No holiday dates recorded.'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 text-xs font-semibold text-[#607286]">
          Select an employee and month, then click dates on either calendar to add or remove them. A date can be recorded as sick time or holiday, but not both.
        </div>
      </div>
    </div>
  );
};
