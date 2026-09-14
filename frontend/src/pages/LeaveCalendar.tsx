import React, { useState, useEffect, useMemo } from 'react';
import { leaveService } from '../services/leaveService';
import { staffContactDetailsService } from '../services/staffContactDetailsService';
import { useToast } from '../context/ToastContext';
import { Employee, LeaveRecord } from '../types';

export const LeaveCalendar: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ali');
  const [calendarMonth, setCalendarMonth] = useState<string>('2026-09');

  // Leave dates for selected employee: maps employeeId -> { sick: string[], holiday: string[] }
  const [leaveState, setLeaveState] = useState<Record<string, { sick: string[]; holiday: string[] }>>({});

  // Leave Record Form
  const [recordType, setRecordType] = useState<'sick' | 'vacation' | 'note'>('sick');
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [recordNote, setRecordNote] = useState<string>('');

  const { showToast } = useToast();

  // Load employees and initial leaves from backend API
  useEffect(() => {
    leaveService.fetchLeaveData().then(data => {
      if (data.employees && data.employees.length > 0) {
        setEmployees(data.employees);
        if (!selectedEmployeeId) {
          setSelectedEmployeeId(data.employees[0].id || data.employees[0].employeeId);
        }
      }

      // Populate leaveState from database leave records
      const initialMap: Record<string, { sick: string[]; holiday: string[] }> = {};
      if (data.leaves && data.leaves.length > 0) {
        data.leaves.forEach(l => {
          const empId = l.employeeId;
          if (!initialMap[empId]) {
            initialMap[empId] = { sick: [], holiday: [] };
          }
          const isSick = l.leaveType === 'Sick';
          const targetArray = isSick ? initialMap[empId].sick : initialMap[empId].holiday;
          if (l.startDate && !targetArray.includes(l.startDate)) {
            targetArray.push(l.startDate);
          }
        });
      }
      setLeaveState(prev => ({ ...initialMap, ...prev }));
    });
  }, []);

  // Selected Employee object
  const selectedEmployee = useMemo(() => {
    return (
      employees.find(e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId) || {
        id: selectedEmployeeId || 'ali',
        employeeId: selectedEmployeeId || 'ali',
        displayName: 'Ali Hamza',
        firstName: 'Ali',
        lastName: 'Hamza',
        position: 'Global Dispatch / Call Center',
        department: 'Operations',
        status: 'Active',
        employmentType: 'Full-Time',
        payType: 'Hourly',
        payRate: 4,
        holidayRate: 0
      }
    );
  }, [employees, selectedEmployeeId]);

  // Current sick and holiday dates for selected employee
  const currentSickDates = useMemo(() => {
    return (leaveState[selectedEmployeeId] && leaveState[selectedEmployeeId].sick) || [];
  }, [leaveState, selectedEmployeeId]);

  const currentHolidayDates = useMemo(() => {
    return (leaveState[selectedEmployeeId] && leaveState[selectedEmployeeId].holiday) || [];
  }, [leaveState, selectedEmployeeId]);

  // Calendar math for the selected month
  const calendarData = useMemo(() => {
    const parts = calendarMonth.split('-').map(Number);
    const year = parts[0] || 2026;
    const month = parts[1] || 9; // 1-indexed

    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const leadingBlanks = firstDay.getUTCDay(); // 0 is Sun, 1 is Mon, etc.
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return {
        dayNum,
        dateStr
      };
    });

    return {
      year,
      month,
      leadingBlanks,
      days
    };
  }, [calendarMonth]);

  // Sync state to backend
  const syncEmployeeLeavesToBackend = (empId: string, sick: string[], holiday: string[]) => {
    const records: LeaveRecord[] = [];
    const empName = selectedEmployee.displayName || empId;

    sick.forEach(d => {
      records.push({
        id: `leave-sick-${empId}-${d}`,
        employeeId: empId,
        employeeName: empName,
        leaveType: 'Sick',
        startDate: d,
        endDate: d,
        daysCount: 1,
        status: 'Approved',
        notes: 'Sick date from leave calendar'
      });
    });

    holiday.forEach(d => {
      records.push({
        id: `leave-hol-${empId}-${d}`,
        employeeId: empId,
        employeeName: empName,
        leaveType: 'Vacation',
        startDate: d,
        endDate: d,
        daysCount: 1,
        status: 'Approved',
        notes: 'Holiday date from leave calendar'
      });
    });

    leaveService.syncEmployeeLeaves(empId, records);
  };

  // Toggle Leave Date (Sick or Holiday)
  const toggleLeave = (type: 'sick' | 'holiday', dateStr: string) => {
    const otherType = type === 'sick' ? 'holiday' : 'sick';
    const currentEmpLeave = leaveState[selectedEmployeeId] || { sick: [], holiday: [] };

    let updatedOther = currentEmpLeave[otherType].filter(d => d !== dateStr);
    let updatedTarget = [...currentEmpLeave[type]];

    if (updatedTarget.includes(dateStr)) {
      updatedTarget = updatedTarget.filter(d => d !== dateStr);
    } else {
      updatedTarget.push(dateStr);
      updatedTarget.sort();
    }

    const newEmpLeave = {
      [type]: updatedTarget,
      [otherType]: updatedOther
    } as { sick: string[]; holiday: string[] };

    setLeaveState(prev => ({
      ...prev,
      [selectedEmployeeId]: newEmpLeave
    }));

    // Update bottom form values matching prototype behavior
    setRecordType(type === 'sick' ? 'sick' : 'vacation');
    setRecordDate(dateStr);

    // Sync to backend DB
    const finalSick = type === 'sick' ? updatedTarget : updatedOther;
    const finalHol = type === 'holiday' ? updatedTarget : updatedOther;
    syncEmployeeLeavesToBackend(selectedEmployeeId, finalSick, finalHol);

    showToast(`${type === 'sick' ? 'Sick' : 'Holiday'} date updated`);
  };

  // Format date nicely (e.g. "Sep 12, 2026")
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Handle Save to Staff Record
  const handleSaveStaffRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordDate) {
      alert('Please select a date for this staff record.');
      return;
    }
    if (recordType === 'note' && !recordNote.trim()) {
      alert('Please enter a note.');
      return;
    }

    // If sick or vacation, also update leave calendar
    if (recordType === 'sick' || recordType === 'vacation') {
      const calendarType = recordType === 'sick' ? 'sick' : 'holiday';
      const otherType = calendarType === 'sick' ? 'holiday' : 'sick';
      const currentEmpLeave = leaveState[selectedEmployeeId] || { sick: [], holiday: [] };

      const updatedOther = currentEmpLeave[otherType].filter(d => d !== recordDate);
      const updatedTarget = currentEmpLeave[calendarType].includes(recordDate)
        ? currentEmpLeave[calendarType]
        : [...currentEmpLeave[calendarType], recordDate].sort();

      const newEmpLeave = {
        [calendarType]: updatedTarget,
        [otherType]: updatedOther
      } as { sick: string[]; holiday: string[] };

      setLeaveState(prev => ({
        ...prev,
        [selectedEmployeeId]: newEmpLeave
      }));

      const finalSick = calendarType === 'sick' ? updatedTarget : updatedOther;
      const finalHol = calendarType === 'holiday' ? updatedTarget : updatedOther;
      syncEmployeeLeavesToBackend(selectedEmployeeId, finalSick, finalHol);
    }

    // Save to staff records in DB
    await staffContactDetailsService.addStaffRecord(selectedEmployeeId, {
      type: recordType,
      date: recordDate,
      note: recordNote.trim()
    });

    setRecordNote('');
    const label = recordType === 'sick' ? 'Sick Time' : recordType === 'vacation' ? 'Vacation Time' : 'Note';
    showToast(`${label} record saved`);
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Main Leave Panel */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#12345b] tracking-tight">
            Employee Leave Calendars
          </h1>
          <span className="text-xs sm:text-sm font-semibold text-[#64748b]">
            Sick time and holidays are saved with each employee
          </span>
        </div>

        {/* Leave Tools: Employee & Month Selectors */}
        <div className="p-5 sm:p-6 border-b border-[#e2e8f0] grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="leaveEmployee" className="block text-xs font-bold text-[#334155] mb-1.5">
              Employee
            </label>
            <select
              id="leaveEmployee"
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
            >
              {employees.map(emp => {
                const id = emp.id || emp.employeeId;
                const name = emp.displayName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || id;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="leaveMonth" className="block text-xs font-bold text-[#334155] mb-1.5">
              Calendar Month
            </label>
            <input
              id="leaveMonth"
              type="month"
              value={calendarMonth}
              onChange={e => setCalendarMonth(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] cursor-pointer"
            />
          </div>
        </div>

        {/* Side-by-Side Calendars Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Sick Time Calendar Card */}
          <div className="border border-[#d7e3ed] rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="px-4 py-3 bg-[#a33b32] text-white font-extrabold text-sm tracking-wide">
              Sick Time Calendar
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#dce6ef] p-px text-center text-xs">
              {weekdays.map(d => (
                <div key={`sick-head-${d}`} className="py-2.5 bg-[#edf4fa] font-bold text-[#52687d]">
                  {d}
                </div>
              ))}
              {Array.from({ length: calendarData.leadingBlanks }).map((_, i) => (
                <div key={`sick-blank-${i}`} className="min-h-[44px] bg-[#f6f8fb]" />
              ))}
              {calendarData.days.map(d => {
                const isSelected = currentSickDates.includes(d.dateStr);
                return (
                  <button
                    key={`sick-day-${d.dateStr}`}
                    type="button"
                    onClick={() => toggleLeave('sick', d.dateStr)}
                    className={`min-h-[44px] border-0 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#f7d8d5] text-[#8d251d] font-black shadow-[inset_0_0_0_2px_#c95950]'
                        : 'bg-white text-[#25384b] hover:bg-[#eaf3fa]'
                    }`}
                  >
                    {d.dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Holiday Calendar Card */}
          <div className="border border-[#d7e3ed] rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="px-4 py-3 bg-[#24796f] text-white font-extrabold text-sm tracking-wide">
              Holiday Calendar
            </div>
            <div className="grid grid-cols-7 gap-px bg-[#dce6ef] p-px text-center text-xs">
              {weekdays.map(d => (
                <div key={`hol-head-${d}`} className="py-2.5 bg-[#edf4fa] font-bold text-[#52687d]">
                  {d}
                </div>
              ))}
              {Array.from({ length: calendarData.leadingBlanks }).map((_, i) => (
                <div key={`hol-blank-${i}`} className="min-h-[44px] bg-[#f6f8fb]" />
              ))}
              {calendarData.days.map(d => {
                const isSelected = currentHolidayDates.includes(d.dateStr);
                return (
                  <button
                    key={`hol-day-${d.dateStr}`}
                    type="button"
                    onClick={() => toggleLeave('holiday', d.dateStr)}
                    className={`min-h-[44px] border-0 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#d4eee9] text-[#145f57] font-black shadow-[inset_0_0_0_2px_#319488]'
                        : 'bg-white text-[#25384b] hover:bg-[#eaf3fa]'
                    }`}
                  >
                    {d.dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leave Summary Boxes */}
        <div className="px-5 sm:px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#f6f9fc] border border-[#dce6ef] rounded-xl p-3.5 sm:p-4">
            <strong className="block text-sm font-extrabold text-[#12345b]">
              Sick dates for selected employee
            </strong>
            <span className="block text-xs font-semibold text-[#64748b] mt-1 min-h-[22px]">
              {currentSickDates.length > 0
                ? currentSickDates.map(formatDate).join(', ')
                : 'No sick dates recorded.'}
            </span>
          </div>

          <div className="bg-[#f6f9fc] border border-[#dce6ef] rounded-xl p-3.5 sm:p-4">
            <strong className="block text-sm font-extrabold text-[#12345b]">
              Holiday dates for selected employee
            </strong>
            <span className="block text-xs font-semibold text-[#64748b] mt-1 min-h-[22px]">
              {currentHolidayDates.length > 0
                ? currentHolidayDates.map(formatDate).join(', ')
                : 'No holiday dates recorded.'}
            </span>
          </div>
        </div>

        {/* Leave Note / Staff Record Card (Inside Panel) */}
        <div className="mx-5 sm:mx-6 mb-5 p-4 sm:p-5 border border-[#d7e3ed] rounded-2xl bg-[#f8fbfd] shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#12345b]">
              Leave Note / Staff Record
            </h2>
            <p className="text-xs font-semibold text-[#64748b] mt-0.5">
              Select the employee above, choose the date and leave type, then add any information you want kept on that employee's record.
            </p>
          </div>

          <form onSubmit={handleSaveStaffRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-start">
              {/* Field 1: Record Type */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-[#456078] mb-1.5">
                  Record Type
                </label>
                <select
                  value={recordType}
                  onChange={e => setRecordType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] shadow-2xs cursor-pointer min-h-[42px]"
                >
                  <option value="sick">Sick Time</option>
                  <option value="vacation">Vacation Time</option>
                  <option value="note">Note Only</option>
                </select>
              </div>

              {/* Field 2: Date Picker */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-[#456078] mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] cursor-pointer shadow-2xs min-h-[42px]"
                />
              </div>

              {/* Field 3: Note / Details */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-[#456078] mb-1.5">
                  Note / Record Details
                </label>
                <input
                  type="text"
                  value={recordNote}
                  onChange={e => setRecordNote(e.target.value)}
                  placeholder="Enter details for this staff member..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdcbd9] rounded-xl text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#1d4ed8] placeholder-[#94a3b8] shadow-2xs min-h-[42px]"
                />
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-98 text-center cursor-pointer inline-flex items-center gap-2"
              >
                <span>Save to Staff Record</span>
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Hint */}
        <div className="p-4 sm:p-5 border-t border-[#e2e8f0] text-xs font-semibold text-[#64748b]">
          Select an employee and month, then click dates on either calendar to add or remove them. A date can be recorded as sick time or holiday, but not both.
        </div>
      </div>
    </div>
  );
};
