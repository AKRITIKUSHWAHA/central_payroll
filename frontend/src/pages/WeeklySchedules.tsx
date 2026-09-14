import React, { useState, useEffect, useMemo } from 'react';
import { scheduleService } from '../services/scheduleService';
import { employeeService } from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Employee } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Save, RotateCcw, Printer, FileSpreadsheet, Clock } from 'lucide-react';

export const WeeklySchedules: React.FC = () => {
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === 'staff';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [gridData, setGridData] = useState<Record<string, Record<string, string>>>({});

  // Helper to format Date to YYYY-MM-DD (UTC safe)
  const formatDateStr = (d: Date): string => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default staff members from prototype if empty
  const defaultStaff = useMemo(() => [
    { id: 'ali', name: 'Ali Hamza' },
    { id: 'alesia', name: 'Alesia Brangman' },
    { id: 'ty', name: 'Tyonika McGowan (Ty)' },
    { id: 'neli', name: 'Neli Outerbridge' },
    { id: 'ssh', name: 'SSH, SSH' },
    { id: 'staff6', name: 'Miss Shonee Simons' },
    { id: 'staff7', name: 'Miss Tiffany Robinson' },
    { id: 'staff8', name: 'Tanuvi Patel' },
  ], []);

  // Combined staff list: employees from DB merged with default staff
  const staffList = useMemo(() => {
    if (employees && employees.length > 0) {
      const dbStaff = employees.map(e => ({
        id: e.id || e.employeeId,
        name: e.displayName || `${e.firstName} ${e.lastName}`.trim()
      }));
      // Merge unique by name
      const existingNames = new Set(dbStaff.map(s => s.name.toLowerCase()));
      const extraDefaults = defaultStaff.filter(s => !existingNames.has(s.name.toLowerCase()));
      return [...dbStaff, ...extraDefaults];
    }
    return defaultStaff;
  }, [employees, defaultStaff]);

  // Handle Week Start change & auto-fill Week End (+6 days)
  const handleWeekStartChange = (val: string) => {
    setWeekStart(val);
    if (val) {
      const parts = val.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        d.setUTCDate(d.getUTCDate() + 6);
        setWeekEnd(formatDateStr(d));
      }
    } else {
      setWeekEnd('');
    }
  };

  // Initialize with current week's Sunday on initial mount if not set
  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const startStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
    handleWeekStartChange(startStr);
  }, []);

  const handlePrevWeek = () => {
    if (!weekStart) return;
    const parts = weekStart.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() - 7);
    handleWeekStartChange(formatDateStr(d));
  };

  const handleNextWeek = () => {
    if (!weekStart) return;
    const parts = weekStart.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + 7);
    handleWeekStartChange(formatDateStr(d));
  };

  const handleThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const startStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
    handleWeekStartChange(startStr);
  };

  useEffect(() => {
    employeeService.fetchEmployees().then(list => {
      if (list && list.length > 0) {
        setEmployees(list);
      }
    });
  }, []);

  useEffect(() => {
    if (weekStart) {
      scheduleService.fetchScheduleData(weekStart).then(data => {
        if (data.employees && data.employees.length > 0) {
          setEmployees(data.employees);
        }
        const initial: Record<string, Record<string, string>> = {};
        staffList.forEach(s => {
          initial[s.id] = {};
        });

        if (data.schedules && data.schedules.length > 0) {
          data.schedules.forEach(s => {
            if (s.employeeId && s.shifts) {
              initial[s.employeeId] = s.shifts;
            }
          });
        }
        setGridData(initial);

        if (data.note) {
          setNotes(data.note);
        } else {
          setNotes(scheduleService.getScheduleNotes(weekStart));
        }
      });
    }
  }, [weekStart, staffList]);

  // Shift & hours parser
  const parseShiftHours = (val: string): number => {
    if (!val) return 0;
    const clean = val.trim().toLowerCase();
    if (clean === 'off' || clean === 'vacation' || clean === 'sick' || clean === 'holiday' || clean === '—') {
      return 0;
    }
    const parsedNum = Number(clean);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      return parsedNum;
    }
    if (clean.includes('8-4') || clean.includes('8am-4pm') || clean.includes('8 - 4')) return 8;
    if (clean.includes('9-5') || clean.includes('9am-5pm') || clean.includes('9 - 5')) return 8;
    if (clean.includes('7-3') || clean.includes('7am-3pm') || clean.includes('7 - 3')) return 8;
    if (clean.includes('12-8') || clean.includes('12pm-8pm') || clean.includes('12 - 8')) return 8;
    if (clean.includes('10-6') || clean.includes('10am-6pm') || clean.includes('10 - 6')) return 8;
    if (clean.includes('8-12') || clean.includes('8am-12pm')) return 4;
    if (clean.includes('1-5') || clean.includes('1pm-5pm')) return 4;
    return 0;
  };

  const handleCellChange = (staffId: string, dateKey: string, val: string) => {
    setGridData(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateKey]: val,
      },
    }));
  };

  // 7 dates for the week
  const scheduleDates = useMemo(() => {
    if (!weekStart) return [];
    const parts = weekStart.split('-').map(Number);
    if (parts.length !== 3) return [];
    const start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getUTCDay()];
      const dayNum = d.getUTCDate();
      return {
        dateStr: ds,
        dayName,
        dayNum,
        label: `${dayName} ${dayNum}`
      };
    });
  }, [weekStart]);

  const weeklyHoursFor = (staffId: string): number => {
    const shifts = gridData[staffId] || {};
    return Object.values(shifts).reduce((sum, val) => sum + parseShiftHours(val), 0);
  };

  const grandWeeklyHours = useMemo(() => {
    return staffList.reduce((sum, s) => sum + weeklyHoursFor(s.id), 0);
  }, [staffList, gridData]);

  const handleSave = () => {
    if (!weekStart) {
      alert('Please set a Week Start date first.');
      return;
    }
    const schedulesToSave = staffList.map(s => {
      const shifts = gridData[s.id] || {};
      const hours = weeklyHoursFor(s.id);
      return {
        employeeId: s.id,
        weekStartDate: weekStart,
        shifts,
        totalHours: hours
      };
    });

    scheduleService.saveWeeklySchedules(weekStart, schedulesToSave);
    scheduleService.saveScheduleNotes(weekStart, notes);
    showToast('Weekly schedule and notes saved successfully.');
  };

  const handleClear = () => {
    const cleared: Record<string, Record<string, string>> = {};
    staffList.forEach(s => {
      cleared[s.id] = {};
    });
    setGridData(cleared);
    showToast('Schedule cleared for the current week.', 'info');
  };

  const handleSaveNote = () => {
    if (!weekStart) {
      alert('Please select a week start date first.');
      return;
    }
    scheduleService.saveScheduleNotes(weekStart, notes);
    showToast('Schedule note saved.');
  };

  const handleClearNote = () => {
    setNotes('');
    if (weekStart) {
      scheduleService.saveScheduleNotes(weekStart, '');
    }
    showToast('Schedule note cleared.');
  };

  const handleExportSchedule = () => {
    if (!weekStart) {
      alert('Please select a week start date first.');
      return;
    }
    const title = `Central Dispatch Weekly Schedule (${weekStart} to ${weekEnd})`;
    const headers = ['Names', ...scheduleDates.map(d => d.label), 'Weekly Hours'];
    const rows = staffList.map(s => {
      const shifts = gridData[s.id] || {};
      const rowData = scheduleDates.map(d => shifts[d.dateStr] || '');
      return [
        s.name,
        ...rowData,
        `${weeklyHoursFor(s.id).toFixed(2)} hrs`
      ];
    });

    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:8px}th{background:#12345b;color:white}.money{text-align:right}</style></head><body><h1>${title}</h1><table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</table>${notes ? `<p><strong>Weekly Schedule Notes:</strong> ${notes}</p>` : ''}</body></html>`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }));
    a.download = `Weekly-Schedule-${weekStart}.xls`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('Weekly schedule exported to Excel.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full px-1 sm:px-0">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Weekly Schedules
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#1d4ed8] mt-1 max-w-4xl leading-relaxed">
            Create and maintain the staff rota separately from payroll. Enter hours directly (e.g. 8, 10, 3, or 7.5), or use a shift such as 8am-4pm.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="px-3.5 py-1.5 bg-white border border-[#cbd5e1] text-[#1e293b] font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1d4ed8]" />
            {weekStart ? (weekEnd ? `${weekStart} – ${weekEnd}` : `Week of ${weekStart}`) : 'Weekly schedule'}
          </span>
          {scheduleDates.length > 0 && (
            <span className="px-3 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] font-black text-xs rounded-xl inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {grandWeeklyHours.toFixed(1)} hrs Total
            </span>
          )}
        </div>
      </div>

      {/* 2. Top Schedule Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Schedule Toolbar */}
        <div className="p-3.5 sm:p-5 border-b border-[#e2e8f0] flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 bg-[#fbfdff]">
          {/* Date Controls & Presets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1 flex-wrap">
            <div className="w-full sm:w-44">
              <label htmlFor="scheduleStart" className="block text-xs font-bold text-[#334155] mb-1">
                Week Start
              </label>
              <input
                id="scheduleStart"
                type="date"
                value={weekStart}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              />
            </div>

            <div className="w-full sm:w-44">
              <label htmlFor="scheduleEnd" className="block text-xs font-bold text-[#334155] mb-1">
                Week End
              </label>
              <input
                id="scheduleEnd"
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              />
            </div>

            {/* Quick Navigation Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handlePrevWeek}
                title="Previous Week"
                className="p-2 bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] rounded-xl font-bold text-xs shadow-2xs inline-flex items-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleThisWeek}
                className="px-3 py-2 bg-white hover:bg-[#f1f5f9] text-[#12345b] border border-[#cbd5e1] rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-colors"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                title="Next Week"
                className="p-2 bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] rounded-xl font-bold text-xs shadow-2xs inline-flex items-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-end flex-wrap">
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Schedule
            </button>
            <button
              onClick={handleClear}
              className="px-3.5 py-2 bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#b91c1c] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Mobile Scroll Hint */}
        <div className="mobile-scroll-hint">
          <span>👉 Swipe horizontally to view full Mon–Sun shift rota</span>
          <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold text-[#1d4ed8]">
            7 Days
          </span>
        </div>

        {/* Schedule Table Container */}
        <div className="table-responsive-container overflow-x-auto">
          {!scheduleDates.length ? (
            <div className="p-8 text-center bg-[#f8fafc]">
              <Calendar className="w-10 h-10 text-[#94a3b8] mx-auto mb-2" />
              <h3 className="text-sm font-extrabold text-[#12345b]">No Week Selected</h3>
              <p className="text-xs text-[#64748b] mt-1">Please select a week start date above or click "This Week" to load the schedule.</p>
              <button
                type="button"
                onClick={handleThisWeek}
                className="mt-3 px-4 py-2 bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Load This Week
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                  {/* Sticky Names column header */}
                  <th className="py-3 px-3.5 font-bold min-w-[170px] sticky left-0 bg-[#102a43] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                    Staff Name
                  </th>
                  {scheduleDates.map(d => (
                    <th key={d.dateStr} className="py-2.5 px-2 font-bold text-center min-w-[76px]">
                      <div>{d.dayName}</div>
                      <div className="text-[10px] font-medium opacity-80">{d.dayNum}</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 font-bold text-center min-w-[105px]">Weekly Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {staffList.map((s, idx) => {
                  const shifts = gridData[s.id] || {};
                  const hours = weeklyHoursFor(s.id);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={s.id}
                      className={`group transition-colors ${isEven ? 'bg-white hover:bg-[#f1f5f9]' : 'bg-[#f8fafc] hover:bg-[#eef2f6]'}`}
                    >
                      {/* Sticky Staff Name Column */}
                      <td className={`py-3 px-3.5 font-bold text-[#0f172a] whitespace-nowrap sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                        isEven ? 'bg-white group-hover:bg-[#f1f5f9]' : 'bg-[#f8fafc] group-hover:bg-[#eef2f6]'
                      }`}>
                        <span className="truncate max-w-[150px] inline-block align-middle font-extrabold text-[#12345b]">
                          {s.name}
                        </span>
                      </td>

                      {/* 7 Days shift inputs */}
                      {scheduleDates.map(d => (
                        <td key={d.dateStr} className="py-2 px-1.5 text-center">
                          <input
                            type="text"
                            value={shifts[d.dateStr] || ''}
                            placeholder={isStaff ? '—' : 'hours'}
                            readOnly={isStaff}
                            disabled={isStaff}
                            onChange={(e) => handleCellChange(s.id, d.dateStr, e.target.value)}
                            className={`w-full min-w-[65px] px-1.5 py-1.5 text-center border rounded-lg font-bold text-xs ${
                              isStaff 
                                ? 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155] cursor-default' 
                                : 'border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] bg-white hover:border-[#94a3b8]'
                            }`}
                          />
                        </td>
                      ))}

                      {/* Staff Weekly Total */}
                      <td className="py-3 px-3 text-center font-extrabold text-[#12345b] text-xs tabular-nums whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md ${hours > 0 ? 'bg-[#e0f2fe] text-[#0369a1]' : 'text-[#94a3b8]'}`}>
                          {hours.toFixed(1)} hrs
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Total Scheduled Hours Row */}
                <tr className="bg-[#eef6ff] border-t-2 border-[#cbd5e1] font-extrabold">
                  <td className="py-3 px-3.5 text-left font-black text-[#12345b] sticky left-0 bg-[#eef6ff] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] uppercase text-[11px]">
                    Total Rota Hours
                  </td>
                  <td colSpan={7} className="py-3 px-3 text-right text-xs font-bold text-[#475569] hidden sm:table-cell">
                    Combined Weekly Rota Total:
                  </td>
                  <td colSpan={7} className="py-3 px-3 text-right text-xs font-bold text-[#475569] sm:hidden">
                    Total:
                  </td>
                  <td className="py-3 px-3 text-center font-black text-[#1d4ed8] text-sm tabular-nums whitespace-nowrap">
                    {grandWeeklyHours.toFixed(1)} hrs
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Notice Bar */}
        <div className="mx-3.5 sm:mx-5 my-4 p-3 bg-[#fff8c7] border border-[#eadc64] rounded-xl text-xs font-bold text-[#6e5a00] leading-relaxed">
          ⚠️ <strong>Staff Notice:</strong> Please give your best effort to be on time. If you need to change your shift, advise your supervisor first.
        </div>

        {/* Schedule Bottom Actions */}
        <div className="px-3.5 sm:px-5 pb-5 flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#64748b]" />
            Print Weekly Schedule
          </button>
          <button
            onClick={handleExportSchedule}
            className="px-3.5 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
            Export Schedule to Excel
          </button>
        </div>
      </div>

      {/* 3. Weekly Schedule Notes Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-[#12345b]">
            Weekly Schedule Notes
          </h2>
          <label htmlFor="scheduleNotesArea" className="block text-xs font-bold text-[#334155] mt-2.5 mb-1.5">
            Notes for the Weekly Schedule
          </label>
          <textarea
            id="scheduleNotesArea"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type schedule notes, reminders, staff instructions, or changes here..."
            className="w-full p-3 border border-[#cbd5e1] rounded-xl text-xs sm:text-sm font-medium text-[#1e293b] focus:outline-none focus:border-[#1d4ed8] bg-white placeholder-[#94a3b8]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSaveNote}
            className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Note
          </button>
          <button
            onClick={handleClearNote}
            className="px-3.5 py-2 bg-white hover:bg-[#f8fafc] text-[#64748b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            Clear Note
          </button>
        </div>

        <p className="text-xs font-semibold text-[#64748b] pt-1">
          These notes are saved with the app on this computer and included with your payroll backup.
        </p>
      </div>
    </div>
  );
};
