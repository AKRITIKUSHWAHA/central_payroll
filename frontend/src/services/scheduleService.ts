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
        if (res.schedules) {
          const storage = this.getStorage();
          storage[weekStartDate] = res.schedules;
          this.saveStorage(storage);
        }
        if (res.note !== undefined) {
          this.saveScheduleNotes(weekStartDate, res.note);
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
    apiFetch<{ success: boolean; schedules: EmployeeSchedule[] }>(`/weekly-schedules?weekStartDate=${weekStartDate}`).then(res => {
      if (res && res.success && res.schedules) {
        const storage = this.getStorage();
        storage[weekStartDate] = res.schedules;
        this.saveStorage(storage);
      }
    }).catch(() => {});

    const storage = this.getStorage();
    return storage[weekStartDate] || [];
  }

  public saveWeeklySchedules(weekStartDate: string, schedules: EmployeeSchedule[]) {
    const storage = this.getStorage();
    storage[weekStartDate] = schedules;
    this.saveStorage(storage);

    schedules.forEach(schedule => {
      apiFetch('/weekly-schedules', {
        method: 'POST',
        body: JSON.stringify(schedule)
      }).catch(() => {});
    });
  }

  public getScheduleNotes(weekStartDate: string): string {
    const notes = localStorage.getItem(`${NOTES_KEY}_${weekStartDate}`);
    return notes || '';
  }

  public saveScheduleNotes(weekStartDate: string, notes: string) {
    localStorage.setItem(`${NOTES_KEY}_${weekStartDate}`, notes);
    apiFetch('/weekly-schedules/notes', {
      method: 'POST',
      body: JSON.stringify({ note: notes })
    }).catch(() => {});
  }
}

export const scheduleService = new ScheduleService();
