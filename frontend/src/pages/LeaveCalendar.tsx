import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import { leaveService } from '../services/leaveService';
import { useToast } from '../context/ToastContext';
import { Save, Calendar, CheckCircle2 } from 'lucide-react';
import { LeaveRecord } from '../types';

export const LeaveCalendar: React.FC = () => {
  const employees = employeeService.getEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || employees[0]?.employeeId || '');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-09');
  
  const [sickDates, setSickDates] = useState<string[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const { showToast } = useToast();

  const selectedEmployee = employees.find(e => (e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId)) || employees[0];

  // Load existing leave records for selected employee & month from service/DB
  useEffect(() => {
    if (!selectedEmployee) return;
    const empId = selectedEmployee.id || selectedEmployee.employeeId;
    const records = leaveService.getLeavesByEmployee(empId);
    
    const sick = records.filter(r => r.leaveType === 'Sick').map(r => r.startDate);
    const holiday = records.filter(r => r.leaveType === 'Vacation' || r.leaveType === 'Holiday').map(r => r.startDate);
    
    setSickDates(sick);
    setHolidayDates(holiday);
  }, [selectedEmployeeId, calendarMonth]);

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const leadingBlanks = 2; // Sept 1 2026 is Tuesday -> 2 blanks (Sun, Mon)

  const saveCurrentLeaves = (newSick: string[], newHoliday: string[], message?: string) => {
    if (!selectedEmployee) return;
    const empId = selectedEmployee.id || selectedEmployee.employeeId;

    // Clear existing leaves for this employee for this month to sync
    const allLeaves = leaveService.getLeaves();
    const otherLeaves = allLeaves.filter(l => l.employeeId !== empId);
    
    const updatedRecords: LeaveRecord[] = [...otherLeaves];

    newSick.forEach(date => {
      updatedRecords.push({
        id: `leave-sick-${empId}-${date}`,
        employeeId: empId,
        employeeName: selectedEmployee.displayName,
        leaveType: 'Sick',
        startDate: date,
        endDate: date,
        daysCount: 1,
        status: 'Approved',
        notes: 'Sick leave recorded from calendar'
      });
    });

    newHoliday.forEach(date => {
      updatedRecords.push({
        id: `leave-hol-${empId}-${date}`,
        employeeId: empId,
        employeeName: selectedEmployee.displayName,
        leaveType: 'Vacation',
        startDate: date,
        endDate: date,
        daysCount: 1,
        status: 'Approved',
        notes: 'Holiday leave recorded from calendar'
      });
    });

    localStorage.setItem('cdl_leave_records', JSON.stringify(updatedRecords));

    if (message) {
      showToast(message);
    }
  };

  const toggleSickDate = (day: number) => {
    if (!selectedEmployee) return;
    const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
    let updatedHoliday = [...holidayDates];
    let updatedSick = [...sickDates];

    if (updatedHoliday.includes(dateStr)) {
      updatedHoliday = updatedHoliday.filter(d => d !== dateStr);
    }

    if (updatedSick.includes(dateStr)) {
      updatedSick = updatedSick.filter(d => d !== dateStr);
      showToast(`Removed sick day for ${selectedEmployee.displayName}`, 'info');
    } else {
      updatedSick.push(dateStr);
      showToast(`Recorded sick day for ${selectedEmployee.displayName}`);
    }

    setSickDates(updatedSick);
    setHolidayDates(updatedHoliday);
    saveCurrentLeaves(updatedSick, updatedHoliday);
  };

  const toggleHolidayDate = (day: number) => {
    if (!selectedEmployee) return;
    const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
    let updatedSick = [...sickDates];
    let updatedHoliday = [...holidayDates];

    if (updatedSick.includes(dateStr)) {
      updatedSick = updatedSick.filter(d => d !== dateStr);
    }

    if (updatedHoliday.includes(dateStr)) {
      updatedHoliday = updatedHoliday.filter(d => d !== dateStr);
      showToast(`Removed holiday for ${selectedEmployee.displayName}`, 'info');
    } else {
      updatedHoliday.push(dateStr);
      showToast(`Recorded holiday for ${selectedEmployee.displayName}`);
    }

    setSickDates(updatedSick);
    setHolidayDates(updatedHoliday);
    saveCurrentLeaves(updatedSick, updatedHoliday);
  };

  const handleExplicitSave = () => {
    saveCurrentLeaves(sickDates, holidayDates, `Leave records saved successfully for ${selectedEmployee?.displayName || 'employee'}!`);
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        <div className="px-6 py-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-[#12345b]">
              Employee Leave Calendars
            </h1>
            <span className="text-xs font-bold text-[#607286]">
              Sick time and holidays are saved with each employee
            </span>
          </div>
          <button
            onClick={handleExplicitSave}
            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0c5e58] text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Leave Records</span>
          </button>
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
              {employees.length === 0 ? (
                <option value="">No employees found</option>
              ) : (
                employees.map(emp => (
                  <option key={emp.id || emp.employeeId} value={emp.id || emp.employeeId}>
                    {emp.displayName} ({emp.employeeId})
                  </option>
                ))
              )}
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

        {/* Side-by-Side Calendars Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sick Time Calendar */}
          <div className="border border-[#d7e3ed] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#a33b32] text-white font-extrabold text-sm tracking-wide flex items-center justify-between">
              <span>Sick Time Calendar</span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">{sickDates.length} Days</span>
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
                const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
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
            <div className="px-4 py-3 bg-[#24796f] text-white font-extrabold text-sm tracking-wide flex items-center justify-between">
              <span>Holiday Calendar</span>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md">{holidayDates.length} Days</span>
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
                const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
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
                ? sickDates.map(d => d.replace(`${calendarMonth}-`, 'Day ')).join(', ')
                : 'No sick dates recorded.'}
            </span>
          </div>

          <div className="bg-[#f6f9fc] border border-[#dce6ef] rounded-xl p-4">
            <strong className="block text-sm font-extrabold text-[#12345b]">
              Holiday dates for selected employee
            </strong>
            <span className="block text-xs font-semibold text-[#607286] mt-1.5 min-h-[24px]">
              {holidayDates.length > 0
                ? holidayDates.map(d => d.replace(`${calendarMonth}-`, 'Day ')).join(', ')
                : 'No holiday dates recorded.'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between border-t border-[#edf4fa] pt-4">
          <div className="text-xs font-semibold text-[#607286]">
            Select an employee and month, then click dates on either calendar to add or remove them. Click <strong>Save Leave Records</strong> to persist changes to the database.
          </div>
          <button
            onClick={handleExplicitSave}
            className="px-5 py-2 bg-[#0f766e] hover:bg-[#0c5e58] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Leave Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
