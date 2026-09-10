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

  public getWeeklySchedules(weekStartDate: string): EmployeeSchedule[] {
    // Sync with backend
    apiFetch<{ success: boolean; schedules: EmployeeSchedule[] }>(`/schedules?weekStartDate=${weekStartDate}`).then(res => {
      if (res && res.success && res.schedules) {
        const storage = this.getStorage();
        storage[weekStartDate] = res.schedules;
        this.saveStorage(storage);
      }
    });

    const storage = this.getStorage();
    return storage[weekStartDate] || [];
  }

  public saveWeeklySchedules(weekStartDate: string, schedules: EmployeeSchedule[]) {
    const storage = this.getStorage();
    storage[weekStartDate] = schedules;
    this.saveStorage(storage);

    // Sync each schedule to backend
    schedules.forEach(schedule => {
      apiFetch('/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule)
      });
    });
  }

  public getScheduleNotes(weekStartDate: string): string {
    const notes = localStorage.getItem(`${NOTES_KEY}_${weekStartDate}`);
    return notes || '';
  }

  public saveScheduleNotes(weekStartDate: string, notes: string) {
    localStorage.setItem(`${NOTES_KEY}_${weekStartDate}`, notes);
  }
}

export const scheduleService = new ScheduleService();
