import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Play, 
  Square, 
  Download, 
  Calendar, 
  Timer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Search, 
  UserCheck,
  Shield,
  Users,
  Activity,
  Filter,
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeService } from '../services/timeService';
import { TimeRecord } from '../types';

export const MyTime: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isStaff = currentUser?.role === 'staff';

  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeRecord | null>(null);
  const [shiftStartTime, setShiftStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Load records and current clock-in status
  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [allRecords, statusRes] = await Promise.all([
        timeService.fetchTimeRecords(isStaff ? currentUser.id : undefined),
        timeService.getStatus(currentUser.id)
      ]);
      
      // If staff, filter specifically to their own records
      const userRecords = isStaff
        ? allRecords.filter(r => r.userId === currentUser.id || r.employeeId === currentUser.id)
        : allRecords;

      setRecords(userRecords);
      setIsClockedIn(statusRes.isClockedIn);
      setCurrentSession(statusRes.currentRecord);
    } catch (err) {
      console.error('Failed to load time records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Anchor shift start timestamp once when active session is present
  useEffect(() => {
    if (isClockedIn && currentSession) {
      let parsedTime = NaN;
      const rawDate = currentSession.clockIn || currentSession.createdAt;
      if (rawDate) {
        if (typeof rawDate === 'number') {
          parsedTime = rawDate;
        } else {
          const str = String(rawDate).trim();
          if (/^\d+$/.test(str)) {
            parsedTime = Number(str);
          } else {
            const cleanStr = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str) ? str.replace(' ', 'T') : str;
            const d = new Date(cleanStr);
            if (!isNaN(d.getTime())) {
              parsedTime = d.getTime();
            }
          }
        }
      }

      // If invalid or in future, anchor to current time
      if (isNaN(parsedTime) || parsedTime > Date.now()) {
        parsedTime = Date.now();
      }

      setShiftStartTime(parsedTime);
    } else {
      setShiftStartTime(null);
      setElapsedTime('00:00:00');
    }
  }, [isClockedIn, currentSession?.id, currentSession?.clockIn]);

  // Live timer interval that increments every second based on stable shiftStartTime
  useEffect(() => {
    if (!isClockedIn || !shiftStartTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateDisplay = () => {
      const diffMs = Math.max(0, Date.now() - shiftStartTime);
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, shiftStartTime]);

  const handleClockIn = async () => {
    if (!currentUser) return;
    try {
      setActionLoading(true);
      const startNow = Date.now();
      setShiftStartTime(startNow);
      setIsClockedIn(true);
      setElapsedTime('00:00:01');
      
      const record = await timeService.clockIn(
        currentUser.id,
        currentUser.displayName || currentUser.username,
        currentUser.id,
        notes
      );
      setCurrentSession(record);
      setNotes('');
      showToast('Shift started! You are now Clocked In.', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to clock in', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser) return;
    try {
      setActionLoading(true);
      const record = await timeService.clockOut(currentUser.id, notes);
      setIsClockedIn(false);
      setCurrentSession(null);
      setShiftStartTime(null);
      setElapsedTime('00:00:00');
      setNotes('');
      if (record) {
        showToast(`Shift ended! Logged ${record.totalHours.toFixed(2)} hours.`, 'success');
      } else {
        showToast('Clocked out successfully', 'success');
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to clock out', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) {
      showToast('No hours recorded to export yet', 'info');
      return;
    }
    timeService.exportToCSV(
      filteredRecords,
      `Shift_Records_${isStaff ? (currentUser?.username || 'Staff') : 'All_Staff'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast('Shift records exported successfully to CSV!', 'success');
  };

  // Unique staff list for filter dropdown
  const uniqueStaffList = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.employeeName) {
        map.set(r.userId || r.employeeId || r.employeeName, r.employeeName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  // Active on-duty staff
  const activeStaffList = useMemo(() => {
    return records.filter(r => r.status === 'ClockedIn' || !r.clockOut);
  }, [records]);

  // Calculations
  const totalLoggedHours = records.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  const totalCompletedShifts = records.filter(r => r.status === 'ClockedOut' && r.clockOut).length;

  const filteredRecords = records.filter(r => {
    if (selectedStaffFilter) {
      const match = r.userId === selectedStaffFilter || r.employeeId === selectedStaffFilter || r.employeeName === selectedStaffFilter;
      if (!match) return false;
    }
    if (statusFilter) {
      if (statusFilter === 'Active' && !(r.status === 'ClockedIn' || !r.clockOut)) return false;
      if (statusFilter === 'Completed' && (r.status === 'ClockedIn' || !r.clockOut)) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = (
        r.employeeName?.toLowerCase().includes(term) ||
        r.notes?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term) ||
        r.clockIn?.toLowerCase().includes(term)
      );
      if (!match) return false;
    }
    return true;
  });

  // Helpers for cleaner formatting
  const formatShiftId = (id: string) => {
    if (!id) return '—';
    const match = id.match(/\d+$/);
    if (match) {
      return `#SH-${match[0].slice(-5)}`;
    }
    return id.length > 10 ? `${id.slice(0, 8)}...` : id;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' };
    try {
      let str = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
        str = str.replace(' ', 'T');
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };
      const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full max-w-full min-w-0">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#102f52] to-[#1f5f98] text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Clock className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isStaff ? 'My Time & Attendance' : 'Staff Shift Records & Attendance'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/15 text-blue-100 border border-white/20">
                {isStaff ? 'Staff Portal' : 'Administrator Overview'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#d7e8f7] mt-1">
              {isStaff 
                ? 'Clock in and out to record your work shifts and download your verified hours.'
                : 'Monitor all staff clock-in/out activity, completed shifts, total hours worked, and live active duty sessions.'}
            </p>
          </div>
        </div>

        {/* Action Button: Export */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            disabled={records.length === 0}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-200" />
            <span>{isStaff ? 'Export My Hours (CSV)' : 'Export All Staff Hours (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Personal Punch Clock (For Staff and Admin, hidden for Super Admin) */}
      {!isSuperAdmin && (
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 shadow-cdCard ${
          isClockedIn 
            ? 'bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#f0fdfa] border-emerald-300 ring-2 ring-emerald-400/20' 
            : 'bg-white border-[#dde7f0]'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Status & Timer Column */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black tracking-wider uppercase ${
                  isClockedIn 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-[#edf4fa] text-[#12345b] border border-[#d2e2f0]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {isClockedIn ? 'CURRENTLY WORKING (CLOCKED IN)' : 'OFF DUTY (CLOCKED OUT)'}
                </span>

                {isClockedIn && currentSession?.clockIn && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Shift started at {formatDateTime(currentSession.clockIn).time || 'recent'}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <div className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-wider tabular-nums ${
                  isClockedIn ? 'text-emerald-700' : 'text-[#12345b]'
                }`}>
                  {elapsedTime}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md self-start ${
                  isClockedIn ? 'bg-emerald-100/90 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isClockedIn ? 'Shift In Progress' : 'Session Ready'}
                </span>
              </div>

              <div className="text-xs font-semibold text-[#607286] flex items-center gap-1.5 flex-wrap">
                <span>Signed in as</span>
                <strong className="text-[#12345b] font-bold bg-[#edf4fa] px-2 py-0.5 rounded-md border border-[#dce7f0]">
                  {currentUser?.displayName || currentUser?.username}
                </strong>
                {currentUser?.email && (
                  <span className="text-[#64748b]">({currentUser.email})</span>
                )}
              </div>
            </div>

            {/* Clock In / Out Action Controls */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-[#456078] mb-1">
                  {isClockedIn ? 'Shift Notes (Optional before clock-out)' : 'Shift Note / Duty Description'}
                </label>
                <input
                  type="text"
                  placeholder={isClockedIn ? "Add notes before ending shift..." : "e.g. Morning Dispatch Shift, Airport Shuttle..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold text-[#1c2b3a] bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3] transition-all"
                />
              </div>
              
              <div className="flex items-end">
                {isClockedIn ? (
                  <button
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>{actionLoading ? 'Stopping...' : 'Clock Out (End Shift)'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={actionLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-[#0f766e] hover:bg-[#0c5e58] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{actionLoading ? 'Starting...' : 'Clock In (Start Shift)'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Logged Hours */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dde7f0] shadow-cdCard hover:shadow-md transition-shadow flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2f6fb3] flex items-center justify-center shrink-0 shadow-inner">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#607286] uppercase tracking-wider">
              {isStaff ? 'My Total Logged Hours' : 'Total Hours (All Staff)'}
            </div>
            <div className="text-lg font-bold text-[#12345b] mt-0.5 tabular-nums">
              {totalLoggedHours.toFixed(2)} <span className="text-xs font-semibold text-[#64748b]">hrs</span>
            </div>
            <div className="text-[10px] font-medium text-[#8292a2]">
              Accumulated shift duration
            </div>
          </div>
        </div>

        {/* Card 2: Completed Shifts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dde7f0] shadow-cdCard hover:shadow-md transition-shadow flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0f766e] flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#607286] uppercase tracking-wider">
              {isStaff ? 'My Completed Shifts' : 'Total Closed Shifts'}
            </div>
            <div className="text-lg font-bold text-[#0f766e] mt-0.5 tabular-nums">
              {totalCompletedShifts}
            </div>
            <div className="text-[10px] font-medium text-[#8292a2]">
              Successfully closed sessions
            </div>
          </div>
        </div>

        {/* Card 3: Active On Duty or Assigned Role */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dde7f0] shadow-cdCard hover:shadow-md transition-shadow flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
            {isStaff ? <UserCheck className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#607286] uppercase tracking-wider">
              {isStaff ? 'Assigned Role' : 'Currently On Duty'}
            </div>
            <div className="text-base font-bold text-[#12345b] mt-0.5 capitalize">
              {isStaff ? (currentUser?.role || 'Staff') : `${activeStaffList.length} Active Staff`}
            </div>
            <div className="text-[10px] font-medium text-[#8292a2]">
              {isStaff ? 'Staff attendance portal' : 'Live clocked-in sessions'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Shift Logs Table Card */}
      <div className="bg-white rounded-2xl border border-[#dde7f0] shadow-cdCard overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#edf4fa] border-b border-[#d9e4ee] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-black text-[#12345b]">
                {isStaff ? 'My Shift Records' : 'All Staff Shift Records & Attendance Logs'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white border border-[#c9def6] text-[#2f6fb3] shadow-2xs">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Shift' : 'Shifts'}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#607286]">
              {isStaff 
                ? 'Detailed list of your clock-in sessions, total duration, and recorded notes.'
                : 'Complete registry of all employee clock-ins, duration, duty notes, and shift statuses.'}
            </p>
          </div>

          {/* Right Controls: Filters & Search cleanly aligned */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full xl:w-auto">
            {/* Staff Filter (For Admin & Super Admin) */}
            {!isStaff && uniqueStaffList.length > 0 && (
              <div className="w-full sm:w-44 flex-shrink-0">
                <select
                  value={selectedStaffFilter}
                  onChange={e => setSelectedStaffFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[#1e293b] bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3] shadow-2xs cursor-pointer"
                >
                  <option value="">All Staff Members</option>
                  {uniqueStaffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="w-full sm:w-36 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold text-[#1e293b] bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3] shadow-2xs cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active / On Duty</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#607286]" />
              <input
                type="text"
                placeholder="Search shift or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-bold text-[#1e293b] bg-white border border-[#cbd5e1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20 focus:border-[#2f6fb3] shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="mobile-scroll-hint px-4 py-1.5 bg-[#f0f6fa] border-b border-[#dde7f0] text-[11px] font-bold text-[#2f6fb3] flex items-center justify-between sm:hidden">
          <span>⇄ Swipe horizontally to view full shift details</span>
          <span className="text-[10px] text-[#607286] font-semibold">{filteredRecords.length} records</span>
        </div>

        <div className="overflow-x-auto w-full min-w-0 table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-[#12345b] text-white border-b border-[#0e2744]">
                <th className="py-3 px-4 font-black w-24">Shift ID</th>
                <th className="py-3 px-4 font-black">Staff Member</th>
                <th className="py-3 px-4 font-black">Clock In</th>
                <th className="py-3 px-4 font-black">Clock Out</th>
                <th className="py-3 px-4 font-black text-right w-24">Total Hours</th>
                <th className="py-3 px-4 font-black text-center w-28">Status</th>
                <th className="py-3 px-4 font-black">Shift Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#607286]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#2f6fb3] border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold text-xs">Loading shift records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748b]">
                    <div className="max-w-md mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                      <p className="text-sm font-black text-[#12345b]">No shift records found</p>
                      <p className="text-xs text-[#64748b]">
                        {searchTerm || selectedStaffFilter || statusFilter 
                          ? 'No shifts match your search criteria or filters.' 
                          : 'Staff clock-in sessions will appear here automatically when recorded.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const clockInInfo = formatDateTime(r.clockIn);
                  const clockOutInfo = formatDateTime(r.clockOut);
                  const isActive = r.status === 'ClockedIn' || !r.clockOut;

                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-[#f8fbfd] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfe]'}`}
                    >
                      {/* Shift ID Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-0.5 bg-[#edf4fa] border border-[#d2e2f0] text-[#12345b] font-mono text-[11px] font-bold rounded-md inline-block"
                          title={r.id}
                        >
                          {formatShiftId(r.id)}
                        </span>
                      </td>

                      {/* Staff Member */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#12345b] text-xs">
                          {r.employeeName}
                        </div>
                        <div className="text-[10px] text-[#607286]">
                          User ID: {r.userId || r.employeeId}
                        </div>
                      </td>

                      {/* Clock In */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#1c2b3a]">
                          {clockInInfo.date}
                        </div>
                        <div className="text-[11px] font-semibold text-[#2f6fb3]">
                          {clockInInfo.time}
                        </div>
                      </td>

                      {/* Clock Out */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.clockOut ? (
                          <>
                            <div className="font-medium text-[#1c2b3a]">
                              {clockOutInfo.date}
                            </div>
                            <div className="text-[11px] font-semibold text-[#607286]">
                              {clockOutInfo.time}
                            </div>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            On Duty Now
                          </span>
                        )}
                      </td>

                      {/* Total Hours */}
                      <td className="py-3 px-4 text-right font-bold text-[#12345b] tabular-nums text-xs whitespace-nowrap">
                        {r.totalHours ? (
                          <span className="px-2 py-0.5 bg-[#eaf4fb] text-[#12345b] rounded-md border border-[#c9def6]">
                            {r.totalHours.toFixed(2)} hrs
                          </span>
                        ) : (
                          <span className="text-[#94a3b8] font-normal">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-[#edf4fa] text-[#12345b] border border-[#d2e2f0]'
                        }`}>
                          {isActive ? <Play className="w-2.5 h-2.5 fill-emerald-700 text-emerald-700" /> : <CheckCircle2 className="w-2.5 h-2.5 text-[#0f766e]" />}
                          {isActive ? 'Active' : 'Completed'}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-xs font-normal text-[#475569] max-w-xs">
                        {r.notes ? (
                          <span className="truncate block" title={r.notes}>
                            {r.notes}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
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
