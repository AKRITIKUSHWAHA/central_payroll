import React, { useState, useEffect, useMemo } from 'react';
import { scheduleService } from '../services/scheduleService';
import { employeeService, isRealEmployee } from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Employee } from '../types';
import { exportToXLSX } from '../utils/excelExport';

export const WeeklySchedules: React.FC = () => {
  const { currentUser } = useAuth();
  const isStaff = currentUser?.role === 'staff';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [gridData, setGridData] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [scheduleHistory, setScheduleHistory] = useState<Array<{ weekStartDate: string; totalHours: number; staffCount: number; note?: string }>>([]);

  // Format date helper (handles YYYY-MM-DD)
  const formatScheduleDate = (val?: string) => {
    if (!val) return '—';
    try {
      const parts = String(val).trim().split('T')[0].split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
    } catch (_) {}
    return val;
  };

  const getWeekEndDateStr = (startStr: string): string => {
    if (!startStr) return '';
    try {
      const parts = startStr.split('T')[0].split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        d.setUTCDate(d.getUTCDate() + 6);
        return d.toISOString().slice(0, 10);
      }
    } catch (_) {}
    return '';
  };

  // Load schedule history summary
  const loadScheduleHistory = async () => {
    try {
      const history = await scheduleService.fetchScheduleHistory();
      if (history && Array.isArray(history)) {
        setScheduleHistory(history);
      }
    } catch (err) {
      console.warn('Failed to load schedule history:', err);
    }
  };

  // Combined staff list: active employees from DB sorted alphabetically
  const staffList = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    return employees
      .filter(e => (e.status || 'Active') === 'Active' && isRealEmployee(e))
      .map(e => ({
        id: e.id || e.employeeId,
        employeeId: e.employeeId || e.id,
        name: e.displayName || `${e.firstName || ''} ${e.lastName || ''}`.trim()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  // Handle Week Start change & auto-fill Week End (+6 days)
  const handleWeekStartChange = (val: string) => {
    setWeekStart(val);
    if (val) {
      localStorage.setItem('cdl_selected_week_start', val);
      const parts = val.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        d.setUTCDate(d.getUTCDate() + 6);
        setWeekEnd(d.toISOString().slice(0, 10));
      }
    } else {
      setWeekEnd('');
    }
  };

  // Auto-initialize to saved week or current week's Monday if not set
  useEffect(() => {
    loadScheduleHistory();
    if (!weekStart) {
      const savedDate = localStorage.getItem('cdl_selected_week_start');
      if (savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
        handleWeekStartChange(savedDate);
      } else {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        const mStr = monday.toISOString().slice(0, 10);
        handleWeekStartChange(mStr);
      }
    }
  }, []);

  // Initial fetch for employees
  useEffect(() => {
    employeeService.fetchEmployees().then(list => {
      if (list && list.length > 0) {
        setEmployees(list.filter(isRealEmployee));
      }
    });
  }, []);

  // Fetch schedule data strictly when weekStart changes (never reset on every keystroke)
  useEffect(() => {
    if (!weekStart) return;

    let isMounted = true;
    scheduleService.fetchScheduleData(weekStart).then(data => {
      if (!isMounted) return;

      const loadedEmployees = (data.employees && data.employees.length > 0) ? data.employees.filter(isRealEmployee) : employees;
      if (data.employees && data.employees.length > 0) {
        setEmployees(loadedEmployees);
      }

      const initial: Record<string, Record<string, string>> = {};
      const allSchedules = [...(data.schedules || [])];

      // Also merge with local storage backup for this week
      const localBackup = scheduleService.getWeeklySchedules(weekStart);
      if (localBackup && localBackup.length > 0) {
        localBackup.forEach(lb => {
          if (!allSchedules.find(s => s.employeeId === lb.employeeId)) {
            allSchedules.push(lb);
          }
        });
      }

      allSchedules.forEach(s => {
        if (!s || !s.employeeId) return;
        const shifts = s.shifts || {};
        initial[s.employeeId] = { ...shifts };

        // Match against employees to sync both id ('alesia') and employeeId ('CDL-001')
        const matched = loadedEmployees.find(
          e => e.id === s.employeeId || e.employeeId === s.employeeId ||
               (e.displayName && e.displayName.toLowerCase() === s.employeeId.toLowerCase())
        );
        if (matched) {
          if (matched.id) initial[matched.id] = { ...shifts };
          if (matched.employeeId) initial[matched.employeeId] = { ...shifts };
        }
      });

      setGridData(initial);

      if (data.note !== undefined && data.note !== null) {
        setNotes(data.note);
      } else {
        setNotes(scheduleService.getScheduleNotes(weekStart));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [weekStart]);

  // Enhanced shift & hours parser: parses plain numbers, OFF/Sick, and shift ranges (e.g. 8am-4pm, 8-4, 7:30-3:30)
  const parseShiftHours = (val: string): number => {
    if (!val) return 0;
    const clean = val.trim();
    if (!clean) return 0;

    const lower = clean.toLowerCase();

    // Non-working keywords
    if (
      lower === 'off' ||
      lower === 'sick' ||
      lower === 'vacation' ||
      lower === 'holiday' ||
      lower === 'leave' ||
      lower === '—' ||
      lower === '-'
    ) {
      return 0;
    }

    // Direct plain number (e.g. "6.5", "10", "8", "3.75")
    const directNum = parseFloat(clean);
    if (!isNaN(directNum) && /^[-+]?\d*(\.\d+)?$/.test(clean)) {
      return Math.max(0, directNum);
    }

    // Shift range pattern: e.g. "8am-4pm", "8am - 4pm", "8-4", "7-3", "07:00 - 15:00", "08:00-16:00", "8:30am-4:30pm"
    const rangeMatch = clean.match(/^(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–to]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)$/i);
    if (rangeMatch) {
      const t1Str = rangeMatch[1].trim();
      const t2Str = rangeMatch[2].trim();

      const parseTimeComponent = (tStr: string, isEnd: boolean): number | null => {
        const match = tStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
        if (!match) return null;
        let hour = parseInt(match[1], 10);
        const min = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3]?.toLowerCase();

        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        // If no am/pm specified: infer 1-7 as afternoon for standard dispatch shifts (e.g. 8-4 -> 8am to 4pm)
        if (!ampm && isEnd && hour >= 1 && hour <= 7) {
          hour += 12;
        }

        return hour + min / 60;
      };

      const start = parseTimeComponent(t1Str, false);
      const end = parseTimeComponent(t2Str, true);

      if (start !== null && end !== null) {
        let diff = end - start;
        if (diff < 0) diff += 24; // overnight shift
        if (diff > 0 && diff <= 24) return Math.round(diff * 100) / 100;
      }
    }

    // Common taxi dispatch shorthand presets
    if (lower.includes('8-4') || lower.includes('8am-4pm') || lower.includes('8 - 4')) return 8;
    if (lower.includes('9-5') || lower.includes('9am-5pm') || lower.includes('9 - 5')) return 8;
    if (lower.includes('7-3') || lower.includes('7am-3pm') || lower.includes('7 - 3')) return 8;
    if (lower.includes('12-8') || lower.includes('12pm-8pm') || lower.includes('12 - 8')) return 8;
    if (lower.includes('10-6') || lower.includes('10am-6pm') || lower.includes('10 - 6')) return 8;
    if (lower.includes('8-12') || lower.includes('8am-12pm')) return 4;
    if (lower.includes('1-5') || lower.includes('1pm-5pm')) return 4;

    return 0;
  };

  const handleCellChange = (staffId: string, employeeId: string | undefined, dateKey: string, val: string) => {
    setGridData(prev => {
      const existing = prev[staffId] || (employeeId ? prev[employeeId] : {}) || {};
      const updatedShifts = {
        ...existing,
        [dateKey]: val,
      };
      const next = {
        ...prev,
        [staffId]: updatedShifts,
      };
      if (employeeId && employeeId !== staffId) {
        next[employeeId] = updatedShifts;
      }
      return next;
    });
  };

  // 7 dates for the week (Monday through Sunday)
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

  const weeklyHoursFor = (staffId: string, employeeId?: string): number => {
    const shifts = (staffId ? gridData[staffId] : undefined) || (employeeId ? gridData[employeeId] : undefined) || {};
    return Object.values(shifts).reduce((sum, val) => sum + parseShiftHours(val), 0);
  };

  const grandWeeklyHours = useMemo(() => {
    return staffList.reduce((sum, s) => sum + weeklyHoursFor(s.id, s.employeeId), 0);
  }, [staffList, gridData]);

  const handleSave = async () => {
    if (!weekStart) {
      showToast('Please set a Week Start date first.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const schedulesToSave = staffList.map(s => {
        const empId = s.employeeId || s.id;
        const shifts = (s.id ? gridData[s.id] : undefined) || (empId ? gridData[empId] : undefined) || {};
        const hours = weeklyHoursFor(s.id, s.employeeId);
        return {
          employeeId: empId,
          weekStartDate: weekStart,
          shifts,
          totalHours: hours
        };
      });

      await scheduleService.saveWeeklySchedules(weekStart, schedulesToSave);
      if (notes !== undefined) {
        await scheduleService.saveScheduleNotes(weekStart, notes);
      }
      await loadScheduleHistory();
      showToast('Weekly schedule and notes saved successfully to history.', 'success');
    } catch (err: any) {
      console.error('Failed to save weekly schedule:', err);
      showToast(`Failed to save schedule: ${err.message || 'Server connection error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!weekStart) return;
    const cleared: Record<string, Record<string, string>> = {};
    staffList.forEach(s => {
      cleared[s.id] = {};
    });
    setGridData(cleared);
    
    try {
      const clearedSchedules = staffList.map(s => ({
        employeeId: s.id,
        weekStartDate: weekStart,
        shifts: {},
        totalHours: 0
      }));
      await scheduleService.saveWeeklySchedules(weekStart, clearedSchedules);
      await loadScheduleHistory();
      showToast('Schedule cleared and saved for the current week.', 'info');
    } catch (err: any) {
      showToast(`Schedule cleared locally: ${err.message || 'Error syncing with server'}`, 'error');
    }
  };

  const handleDeleteScheduleHistory = async (targetWeekStart: string) => {
    if (!window.confirm(`Are you sure you want to delete the schedule history for the week of ${formatScheduleDate(targetWeekStart)}?`)) {
      return;
    }
    const success = await scheduleService.deleteWeeklySchedule(targetWeekStart);
    if (success) {
      setScheduleHistory(prev => prev.filter(h => h.weekStartDate !== targetWeekStart));
      if (weekStart === targetWeekStart) {
        setGridData({});
        setNotes('');
      }
      showToast(`Schedule for week of ${formatScheduleDate(targetWeekStart)} deleted.`, 'success');
    } else {
      showToast('Failed to delete schedule record.', 'error');
    }
  };

  const handleSaveNote = async () => {
    if (!weekStart) {
      showToast('Please select a week start date first.', 'error');
      return;
    }
    setIsSavingNote(true);
    try {
      await scheduleService.saveScheduleNotes(weekStart, notes);
      showToast('Schedule note saved successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to save schedule note:', err);
      showToast(`Failed to save note: ${err.message || 'Server connection error'}`, 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleClearNote = async () => {
    setNotes('');
    if (weekStart) {
      try {
        await scheduleService.saveScheduleNotes(weekStart, '');
        showToast('Schedule note cleared.', 'info');
      } catch (err: any) {
        showToast(`Error clearing note on server: ${err.message}`, 'error');
      }
    }
  };

  const handleExportSchedule = () => {
    if (!weekStart) {
      alert('Please select a week start date first.');
      return;
    }
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

    if (notes) {
      rows.push(['']);
      rows.push(['Weekly Schedule Notes:', notes]);
    }

    exportToXLSX({
      filename: `Weekly-Schedule-${weekStart}.xlsx`,
      sheetName: 'Weekly Schedule',
      headers,
      rows
    });
    showToast('Weekly schedule exported to Excel.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full max-w-full overflow-hidden">
      {/* 1. Workspace Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12345b] tracking-tight">
            Weekly Schedules
          </h1>
          <p className="text-sm font-semibold text-[#1d4ed8] mt-1 max-w-4xl leading-relaxed">
            Create and maintain the staff rota separately from payroll. Enter hours directly (for example 8, 10, 3, or 7.5), or use a shift such as 8am-4pm. Weekly hours calculate automatically.
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="px-4 py-2 bg-white border border-[#cbd5e1] text-[#1e293b] font-bold text-xs rounded-xl shadow-xs inline-block">
            {weekStart ? (weekEnd ? `${weekStart} – ${weekEnd}` : `Week of ${weekStart}`) : 'Weekly schedule'}
          </span>
        </div>
      </div>

      {/* 2. Top Schedule Panel */}
      <div id="schedule-print-area" className="schedule-print-area bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden w-full max-w-full">
        {/* Print-Only Schedule Header */}
        <div className="hidden print:block p-4 border-b border-[#cbd5e1] text-center">
          <h2 className="text-xl font-black text-[#12345b] tracking-tight">CENTRAL DISPATCH LIMITED</h2>
          <h3 className="text-sm font-extrabold text-[#1e293b] mt-0.5">WEEKLY STAFF SCHEDULE</h3>
          <p className="text-xs font-bold text-[#64748b] mt-1">
            {weekStart ? (weekEnd ? `Period: ${formatScheduleDate(weekStart)} – ${formatScheduleDate(weekEnd)}` : `Week of ${formatScheduleDate(weekStart)}`) : 'All Staff Rota'}
          </p>
        </div>

        {/* Schedule Toolbar */}
        <div className="no-print p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
            <div className="w-full sm:w-64">
              <label htmlFor="scheduleStart" className="block text-xs font-bold text-[#334155] mb-1.5">
                Week Start
              </label>
              <input
                id="scheduleStart"
                type="date"
                value={weekStart}
                onChange={(e) => handleWeekStartChange(e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              />
            </div>

            <div className="w-full sm:w-64">
              <label htmlFor="scheduleEnd" className="block text-xs font-bold text-[#334155] mb-1.5">
                Week End
              </label>
              <input
                id="scheduleEnd"
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full px-3.5 py-2 border border-[#cbd5e1] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#1d4ed8] bg-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:bg-[#93c5fd] disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                'Save Schedule'
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-sm font-extrabold rounded-xl transition-all shadow-xs"
            >
              Clear Week
            </button>
          </div>
        </div>

        {/* Mobile Scroll Hint */}
        {scheduleDates.length > 0 && (
          <div className="mobile-scroll-hint">
            <span>👉 Swipe schedule to view Mon–Sun shift hours</span>
            <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-extrabold">
              7 Days
            </span>
          </div>
        )}

        {/* Schedule Table */}
        <div className="table-responsive-container overflow-x-auto p-2 sm:p-5 w-full">
          <table className={`w-full text-left text-sm border-collapse ${scheduleDates.length > 0 ? 'min-w-[760px]' : 'w-full'}`}>
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className={`py-3 px-4 font-bold ${scheduleDates.length > 0 ? 'min-w-[180px]' : 'w-1/3 sm:w-1/4'}`}>Names</th>
                {!scheduleDates.length ? (
                  <th colSpan={8} className="py-3 px-4 font-bold text-left w-2/3 sm:w-3/4">Choose a week start date</th>
                ) : (
                  <>
                    {scheduleDates.map(d => (
                      <th key={d.dateStr} className="py-3 px-2 font-bold text-center min-w-[95px]">
                        {d.dayName}
                        <br />
                        <span className="text-[11px] font-normal opacity-90">{d.dayNum}</span>
                      </th>
                    ))}
                    <th className="py-3 px-4 font-bold text-center w-32 min-w-[120px]">Weekly Hours</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {staffList.map((s, idx) => {
                const shifts = gridData[s.id] || (s.employeeId ? gridData[s.employeeId] : {}) || {};
                const hours = weeklyHoursFor(s.id, s.employeeId);

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-[#f8fafc]' : 'bg-[#fbfdff] hover:bg-[#f1f5f9]'}`}
                  >
                    {/* Staff Name */}
                    <td className="py-4 px-4 font-bold text-[#0f172a] whitespace-nowrap">
                      {s.name}
                    </td>

                    {!scheduleDates.length ? (
                      <td colSpan={8} className="py-4 px-4 text-xs font-semibold text-[#64748b]">
                        Set the week start date above.
                      </td>
                    ) : (
                      <>
                        {scheduleDates.map(d => {
                          const shiftVal = shifts[d.dateStr] || '';
                          const cleanLower = shiftVal.trim().toLowerCase();

                          return (
                            <td key={d.dateStr} className="py-2.5 px-1.5 text-center">
                              {isStaff ? (
                                cleanLower.includes('sick') ? (
                                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-black bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5] shadow-2xs whitespace-nowrap">
                                    Sick
                                  </span>
                                ) : cleanLower.includes('off') || cleanLower.includes('vacation') ? (
                                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-black bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] shadow-2xs whitespace-nowrap">
                                    Off
                                  </span>
                                ) : shiftVal ? (
                                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-extrabold bg-[#dcfce7] text-[#15803d] border border-[#86efac] shadow-2xs whitespace-nowrap">
                                    {shiftVal}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-[#94a3b8]">—</span>
                                )
                              ) : (
                                <input
                                  type="text"
                                  value={shiftVal}
                                  placeholder=""
                                  autoComplete="off"
                                  onChange={(e) => handleCellChange(s.id, s.employeeId, d.dateStr, e.target.value)}
                                  className="w-full min-w-[80px] px-2 py-1.5 text-center border border-[#cbd5e1] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] bg-white rounded-lg font-bold text-xs shadow-2xs transition-all"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="py-4 px-4 text-center font-extrabold text-[#12345b] text-sm tabular-nums whitespace-nowrap">
                          {hours.toFixed(2)} hrs
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Total Scheduled Hours Row when dates are active */}
              {scheduleDates.length > 0 && (
                <tr className="bg-[#eef6ff] border-t-2 border-[#cbd5e1] font-extrabold">
                  <td colSpan={8} className="py-3 px-4 text-right font-extrabold text-[#12345b]">
                    TOTAL SCHEDULED HOURS
                  </td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#12345b] text-sm tabular-nums">
                    {grandWeeklyHours.toFixed(2)} hrs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Yellow Notice Bar */}
        <div className="no-print mx-4 sm:mx-5 mb-4 p-3 bg-[#fff8c7] border border-[#eadc64] rounded-xl text-xs sm:text-sm font-bold text-[#6e5a00]">
          Please give your best effort to be on time. If you need to change your shift, advise your supervisor first.
        </div>

        {/* Schedule Bottom Actions */}
        <div className="no-print px-4 sm:px-5 pb-5 flex items-center flex-wrap gap-2.5 sm:gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Print Weekly Schedule
          </button>
          <button
            onClick={handleExportSchedule}
            className="px-4 py-2 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Export Schedule to Excel
          </button>
        </div>
      </div>

      {/* 3. Weekly Schedule Notes Panel */}
      <div className="no-print bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 space-y-4 w-full max-w-full">
        <div>
          <h2 className="text-base font-extrabold text-[#12345b]">
            Weekly Schedule Notes
          </h2>
          <label htmlFor="scheduleNotesArea" className="block text-xs font-bold text-[#334155] mt-3 mb-1.5">
            Notes for the Weekly Schedule
          </label>
          <textarea
            id="scheduleNotesArea"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type schedule notes, reminders, staff instructions, or changes here..."
            className="w-full p-3.5 border border-[#cbd5e1] rounded-xl text-sm font-medium text-[#1e293b] focus:outline-none focus:border-[#1d4ed8] bg-white placeholder-[#94a3b8]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveNote}
            disabled={isSavingNote}
            className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:bg-[#93c5fd] disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            {isSavingNote ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving Note...
              </>
            ) : (
              'Save Note'
            )}
          </button>
          <button
            onClick={handleClearNote}
            className="px-4 py-2.5 bg-white hover:bg-[#f8fafc] text-[#1e293b] border border-[#cbd5e1] text-xs font-extrabold rounded-xl transition-all shadow-xs"
          >
            Clear Note
          </button>
        </div>

        <p className="text-xs font-semibold text-[#64748b] pt-1">
          These notes are saved with the app on this computer and included with your payroll backup.
        </p>
      </div>

      {/* 4. Schedule History Card */}
      <div className="no-print bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden w-full max-w-full">
        <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#12345b]">
              Schedule History
            </h2>
            <p className="text-xs font-semibold text-[#64748b] mt-0.5">
              Saved weekly staff rotas, shift rosters, and historical schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={loadScheduleHistory}
            className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#1e293b] border border-[#cbd5e1] text-xs font-bold rounded-lg transition-all"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#102a43] text-white font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Week Period</th>
                <th className="py-3 px-4 font-bold">Week Start</th>
                <th className="py-3 px-4 font-bold text-center">Staff Scheduled</th>
                <th className="py-3 px-4 font-bold text-right">Total Hours</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {!scheduleHistory || scheduleHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-xs font-semibold text-[#64748b]">
                    No weekly schedules saved yet. Enter shifts and click "Save Schedule" above.
                  </td>
                </tr>
              ) : (
                scheduleHistory.map((h, i) => {
                  const endStr = getWeekEndDateStr(h.weekStartDate);
                  const isCurrent = h.weekStartDate === weekStart;
                  return (
                    <tr
                      key={h.weekStartDate || i}
                      className={`transition-colors ${isCurrent ? 'bg-[#eff6ff]' : 'bg-white hover:bg-[#f8fafc]'}`}
                    >
                      <td className="py-3.5 px-4 font-bold text-xs text-[#0f172a] whitespace-nowrap">
                        {formatScheduleDate(h.weekStartDate)} to {formatScheduleDate(endStr)}
                        {isCurrent && (
                          <span className="ml-2 px-2 py-0.5 bg-[#dbeafe] text-[#1e40af] text-[10px] font-extrabold rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-xs text-[#334155] whitespace-nowrap">
                        {h.weekStartDate}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-xs text-[#1e293b] whitespace-nowrap">
                        {h.staffCount} staff
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-xs text-[#12345b] tabular-nums whitespace-nowrap">
                        {Number(h.totalHours || 0).toFixed(2)} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[11px] font-extrabold rounded-md inline-block">
                          Saved / Rota
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleWeekStartChange(h.weekStartDate);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            showToast(`Loaded schedule for week of ${formatScheduleDate(h.weekStartDate)}`, 'info');
                          }}
                          className="px-3 py-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-lg transition-all shadow-xs"
                        >
                          Load / View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleHistory(h.weekStartDate)}
                          className="px-2.5 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-xs font-extrabold rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


