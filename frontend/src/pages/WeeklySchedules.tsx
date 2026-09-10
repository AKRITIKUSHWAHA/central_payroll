import React, { useState } from 'react';
import { employeeService } from '../services/employeeService';
import { scheduleService } from '../services/scheduleService';
import { useToast } from '../context/ToastContext';
import { CalendarRange, Save, Trash2, Printer, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export const WeeklySchedules: React.FC = () => {
  const employees = employeeService.getEmployees();
  const [weekStart, setWeekStart] = useState('2026-09-07');
  const [weekEnd, setWeekEnd] = useState('2026-09-13');
  const { showToast } = useToast();

  const [notes, setNotes] = useState(() => scheduleService.getScheduleNotes(weekStart));

  // Shift grid state: employeeId -> { Mon: '8-4', Tue: '8-4', ... }
  const [gridData, setGridData] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    employees.forEach(emp => {
      initial[emp.id] = {
        Mon: '8-4',
        Tue: '8-4',
        Wed: 'OFF',
        Thu: '8-4',
        Fri: '8-4',
        Sat: 'OFF',
        Sun: 'OFF',
      };
    });
    return initial;
  });

  const handleCellChange = (empId: string, day: string, val: string) => {
    setGridData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: val,
      },
    }));
  };

  const calculateRowHours = (shifts: Record<string, string>): number => {
    let total = 0;
    Object.values(shifts).forEach(val => {
      if (val === '8-4' || val === '8') total += 8;
      else if (val === '10') total += 10;
      else if (val === '7.5') total += 7.5;
      else if (!isNaN(Number(val))) total += Number(val);
    });
    return total;
  };

  const handleSave = () => {
    scheduleService.saveScheduleNotes(weekStart, notes);
    showToast('Weekly staff schedule and notes saved successfully.');
  };

  const handleClear = () => {
    const cleared: Record<string, Record<string, string>> = {};
    employees.forEach(emp => {
      cleared[emp.id] = { Mon: 'OFF', Tue: 'OFF', Wed: 'OFF', Thu: 'OFF', Fri: 'OFF', Sat: 'OFF', Sun: 'OFF' };
    });
    setGridData(cleared);
    showToast('Schedule matrix cleared for current week.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Weekly Staff Schedule
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Create and maintain staff rotas separately from payroll. Shifts calculate hours automatically.
          </p>
        </div>
        <div className="bg-white border border-[#d9e2ea] rounded-xl px-4 py-2 text-xs font-extrabold text-[#12345b] shadow-sm flex items-center gap-3 self-start sm:self-auto">
          <button className="hover:text-[#2f6fb3]"><ChevronLeft className="w-4 h-4" /></button>
          <span>Sept 7 - Sept 13, 2026</span>
          <button className="hover:text-[#2f6fb3]"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Main Schedule Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Week End</label>
              <input
                type="date"
                value={weekEnd}
                onChange={e => setWeekEnd(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Week</span>
            </button>
          </div>
        </div>

        {/* Schedule Matrix Table */}
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#12345b] text-white">
                <th className="p-3 font-extrabold text-sm rounded-l-lg">Employee</th>
                <th className="p-3 text-center font-bold">Mon</th>
                <th className="p-3 text-center font-bold">Tue</th>
                <th className="p-3 text-center font-bold">Wed</th>
                <th className="p-3 text-center font-bold">Thu</th>
                <th className="p-3 text-center font-bold">Fri</th>
                <th className="p-3 text-center font-bold">Sat</th>
                <th className="p-3 text-center font-bold">Sun</th>
                <th className="p-3 text-center font-extrabold rounded-r-lg">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9f0]">
              {employees.map((emp, idx) => {
                const empShifts = gridData[emp.id] || {};
                const hours = calculateRowHours(empShifts);

                return (
                  <tr key={emp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fbfd]'}>
                    <td className="p-3 font-extrabold text-[#183a61]">
                      {emp.displayName}
                      <span className="block text-[11px] font-normal text-[#607286]">{emp.position}</span>
                    </td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <td key={day} className="p-2 text-center">
                        <input
                          type="text"
                          value={empShifts[day] || 'OFF'}
                          onChange={e => handleCellChange(emp.id, day, e.target.value)}
                          className="w-16 p-1.5 text-center border border-[#bdcbd9] rounded-lg font-bold text-[#1c2b3a] bg-white focus:border-[#2f6fb3] focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center font-black text-[#12345b] text-sm tabular-nums">
                      {hours.toFixed(1)} hrs
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Schedule Footer Actions & Instructions */}
        <div className="p-4 bg-[#edf4fa] border-t border-[#d9e4ee] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="p-3 bg-[#fff8c7] border border-[#eadc64] rounded-xl text-xs font-bold text-[#6e5a00] flex-1">
            Please give your best effort to be on time. If you need to change your shift, advise your supervisor first.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white border border-[#aebfd1] hover:bg-[#edf5fb] text-[#173a60] text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Notes Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[#12345b]">
          Weekly Schedule Notes
        </h2>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Type schedule notes, reminders, staff instructions, or shift changes here..."
          className="w-full p-4 border border-[#bdcbd9] rounded-xl text-sm font-medium text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white text-xs font-extrabold rounded-xl shadow-sm"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};
