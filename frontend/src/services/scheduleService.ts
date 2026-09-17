import { EmployeeSchedule } from '../types';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_weekly_schedules';
const NOTES_KEY = 'cdl_schedule_notes';

class ScheduleService {
  private getStorage(): Record<string, EmployeeSchedule[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveStorage(schedules: Record<string, EmployeeSchedule[]>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
  }

  public async fetchScheduleData(weekStartDate: string): Promise<{ schedules: EmployeeSchedule[]; employees: any[]; note?: string }> {
    try {
      const res = await apiFetch<{ success: boolean; schedules: EmployeeSchedule[]; employees: any[]; note?: string }>(
        `/weekly-schedules?weekStartDate=${weekStartDate}`
      );
      if (res && res.success) {
        const storage = this.getStorage();
        if (res.schedules && res.schedules.length > 0) {
          storage[weekStartDate] = res.schedules;
          this.saveStorage(storage);
        } else {
          // If backend returns empty schedules, preserve any local schedules
          const localSchedules = storage[weekStartDate];
          if (localSchedules && localSchedules.length > 0) {
            return {
              schedules: localSchedules,
              employees: res.employees || [],
              note: res.note !== undefined && res.note !== null ? res.note : this.getScheduleNotes(weekStartDate)
            };
          }
        }

        if (res.note !== undefined && res.note !== null) {
          localStorage.setItem(`${NOTES_KEY}_${weekStartDate}`, res.note);
        }
        return { schedules: res.schedules || [], employees: res.employees || [], note: res.note };
      }
    } catch (err) {
      console.warn('Failed to fetch from /weekly-schedules:', err);
    }
    const storage = this.getStorage();
    return { schedules: storage[weekStartDate] || [], employees: [], note: this.getScheduleNotes(weekStartDate) };
  }

  public getWeeklySchedules(weekStartDate: string): EmployeeSchedule[] {
    const storage = this.getStorage();
    return storage[weekStartDate] || [];
  }

  public async saveWeeklySchedules(weekStartDate: string, schedules: EmployeeSchedule[]): Promise<boolean> {
    const storage = this.getStorage();
    storage[weekStartDate] = schedules;
    this.saveStorage(storage);

    try {
      const res = await apiFetch<{ success: boolean; count?: number }>('/weekly-schedules', {
        method: 'POST',
        body: JSON.stringify({
          weekStartDate,
          schedules
        })
      });

      if (res && res.success) {
        return true;
      }
    } catch (err) {
      console.warn('Backend sync failed for saveWeeklySchedules, saved to local storage:', err);
    }
    return true;
  }

  public getScheduleNotes(weekStartDate: string): string {
    const notes = localStorage.getItem(`${NOTES_KEY}_${weekStartDate}`);
    return notes || '';
  }

  public async saveScheduleNotes(weekStartDate: string, notes: string): Promise<boolean> {
    localStorage.setItem(`${NOTES_KEY}_${weekStartDate}`, notes);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>('/weekly-schedules/notes', {
        method: 'POST',
        body: JSON.stringify({
          weekStartDate,
          note: notes
        })
      });

      if (res && res.success) {
        return true;
      }
    } catch (err) {
      console.warn('Backend sync failed for saveScheduleNotes, saved to local storage:', err);
    }
    return true;
  }

  public async fetchScheduleHistory(): Promise<Array<{ weekStartDate: string; totalHours: number; staffCount: number; note?: string }>> {
    const storage = this.getStorage();
    const localWeeks = Object.keys(storage).map(ws => {
      const schs = storage[ws] || [];
      const totalHours = schs.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0);
      return {
        weekStartDate: ws,
        totalHours,
        staffCount: schs.length,
        note: this.getScheduleNotes(ws)
      };
    });

    try {
      const res = await apiFetch<{ success: boolean; history: Array<{ weekStartDate: string; totalHours: number; staffCount: number; note?: string }> }>('/weekly-schedules/history');
      if (res && res.success && Array.isArray(res.history)) {
        const mergedMap = new Map<string, { weekStartDate: string; totalHours: number; staffCount: number; note?: string }>();
        res.history.forEach(h => mergedMap.set(h.weekStartDate, h));
        localWeeks.forEach(lw => {
          if (!mergedMap.has(lw.weekStartDate)) {
            mergedMap.set(lw.weekStartDate, lw);
          }
        });
        return Array.from(mergedMap.values()).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
      }
    } catch (err) {
      console.warn('Failed to fetch schedule history from backend:', err);
    }

    return localWeeks.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
  }

  public async deleteWeeklySchedule(weekStartDate: string): Promise<boolean> {
    const storage = this.getStorage();
    delete storage[weekStartDate];
    this.saveStorage(storage);
    localStorage.removeItem(`${NOTES_KEY}_${weekStartDate}`);

    try {
      await apiFetch(`/weekly-schedules/${weekStartDate}`, {
        method: 'DELETE'
      });
      return true;
    } catch (err) {
      console.warn('Failed to delete schedule on backend:', err);
      return false;
    }
  }
}

export const scheduleService = new ScheduleService();
