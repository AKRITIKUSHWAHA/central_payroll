import { TimeRecord } from '../types';
import { apiFetch } from './api';

const TIME_STORAGE_KEY = 'cdl_time_records';

class TimeService {
  private getStorage(): TimeRecord[] {
    const data = localStorage.getItem(TIME_STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveStorage(records: TimeRecord[]) {
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(records));
  }

  public async fetchTimeRecords(userId?: string): Promise<TimeRecord[]> {
    try {
      const url = userId ? `/my-time?userId=${encodeURIComponent(userId)}` : '/my-time';
      const res = await apiFetch<{ success: boolean; records: TimeRecord[] }>(url);
      if (res && res.success && res.records) {
        this.saveStorage(res.records);
        return res.records;
      }
    } catch (err) {
      console.warn('Failed to fetch time records from API, using storage:', err);
    }

    const local = this.getStorage();
    if (userId) {
      return local.filter(r => r.userId === userId || r.employeeId === userId);
    }
    return local;
  }

  public async getStatus(userId: string): Promise<{ isClockedIn: boolean; currentRecord: TimeRecord | null }> {
    try {
      const res = await apiFetch<{ success: boolean; isClockedIn: boolean; currentRecord: TimeRecord | null }>(
        `/my-time/status?userId=${encodeURIComponent(userId)}`
      );
      if (res && res.success) {
        return {
          isClockedIn: Boolean(res.isClockedIn),
          currentRecord: res.isClockedIn ? res.currentRecord : null
        };
      }
    } catch (err) {
      console.warn('Failed to get status from API:', err);
    }

    const records = this.getStorage().filter(r => r.userId === userId || r.employeeId === userId);
    const active = records.find(r => r.status === 'ClockedIn') || null;
    return {
      isClockedIn: Boolean(active),
      currentRecord: active
    };
  }

  public async clockIn(userId: string, employeeName: string, employeeId?: string, notes?: string): Promise<TimeRecord> {
    try {
      const res = await apiFetch<{ success: boolean; record: TimeRecord }>('/my-time/clock-in', {
        method: 'POST',
        body: JSON.stringify({ userId, employeeName, employeeId, notes })
      });
      if (res && res.success && res.record) {
        const records = this.getStorage().map(r => ((r.userId === userId || r.employeeId === userId) && r.status === 'ClockedIn') ? { ...r, status: 'ClockedOut' as const } : r);
        records.unshift(res.record);
        this.saveStorage(records);
        return res.record;
      }
    } catch (err) {
      console.warn('API clockIn failed, saving locally:', err);
    }

    const newRecord: TimeRecord = {
      id: `time-${Date.now()}`,
      userId,
      employeeId: employeeId || userId,
      employeeName,
      clockIn: new Date().toISOString(),
      totalHours: 0,
      status: 'ClockedIn',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    const records = this.getStorage().map(r => ((r.userId === userId || r.employeeId === userId) && r.status === 'ClockedIn') ? { ...r, status: 'ClockedOut' as const } : r);
    records.unshift(newRecord);
    this.saveStorage(records);
    return newRecord;
  }

  public async clockOut(userId: string, notes?: string): Promise<TimeRecord | null> {
    try {
      const res = await apiFetch<{ success: boolean; record: TimeRecord }>('/my-time/clock-out', {
        method: 'POST',
        body: JSON.stringify({ userId, notes })
      });
      if (res && res.success && res.record) {
        const records = this.getStorage().map(r => ((r.userId === userId || r.employeeId === userId) && r.status === 'ClockedIn') ? { ...r, status: 'ClockedOut' as const, clockOut: res.record.clockOut, totalHours: res.record.totalHours } : r);
        this.saveStorage(records);
        return res.record;
      }
    } catch (err) {
      console.warn('API clockOut failed, processing locally:', err);
    }

    const records = this.getStorage();
    const activeIdx = records.findIndex(r => (r.userId === userId || r.employeeId === userId) && r.status === 'ClockedIn');
    if (activeIdx >= 0) {
      const active = records[activeIdx];
      const now = new Date().toISOString();
      const diffMs = Math.max(0, new Date(now).getTime() - new Date(active.clockIn).getTime());
      const hours = Math.max(0.01, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));

      const updated: TimeRecord = {
        ...active,
        clockOut: now,
        totalHours: hours,
        status: 'ClockedOut',
        notes: notes ? (active.notes ? `${active.notes} | ${notes}` : notes) : active.notes
      };

      records[activeIdx] = updated;
      this.saveStorage(records);
      return updated;
    }

    return null;
  }

  public exportToCSV(records: TimeRecord[], filename = 'my_work_hours.csv') {
    const headers = ['Record ID', 'Employee Name', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Notes'];
    const rows = records.map(r => [
      r.id,
      `"${r.employeeName}"`,
      r.clockIn ? new Date(r.clockIn).toLocaleString() : '',
      r.clockOut ? new Date(r.clockOut).toLocaleString() : 'In Progress',
      r.totalHours?.toFixed(2) || '0.00',
      r.status,
      `"${r.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const timeService = new TimeService();
