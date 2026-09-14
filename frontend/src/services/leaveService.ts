import { LeaveRecord } from '../types';
import { initialLeaves } from '../mock/mockData';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_leave_records';

class LeaveService {
  private getStorage(): LeaveRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveStorage(leaves: LeaveRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
  }

  public async fetchLeaveData(): Promise<{ leaves: LeaveRecord[]; employees: any[] }> {
    try {
      const res = await apiFetch<{ success: boolean; leaves: LeaveRecord[]; employees: any[] }>('/leave-calendars');
      if (res && res.success) {
        if (res.leaves) this.saveStorage(res.leaves);
        return { leaves: res.leaves || [], employees: res.employees || [] };
      }
    } catch (err) {
      console.warn('Failed to fetch from /leave-calendars:', err);
    }
    return { leaves: this.getStorage(), employees: [] };
  }

  public getLeaves(): LeaveRecord[] {
    // Sync with backend API
    apiFetch<{ success: boolean; leaves: LeaveRecord[] }>('/leave-calendars').then(res => {
      if (res && res.success && res.leaves) {
        this.saveStorage(res.leaves);
      }
    });

    return this.getStorage();
  }

  public getLeavesByEmployee(employeeId: string): LeaveRecord[] {
    return this.getStorage().filter(l => l.employeeId === employeeId);
  }

  public addLeave(leave: Omit<LeaveRecord, 'id'>): LeaveRecord {
    const leaves = this.getStorage();
    const newLeave: LeaveRecord = {
      ...leave,
      id: `leave-${Date.now()}`
    };
    leaves.push(newLeave);
    this.saveStorage(leaves);

    // Sync POST to backend
    apiFetch('/leave-calendars', {
      method: 'POST',
      body: JSON.stringify(newLeave)
    });

    return newLeave;
  }

  public updateLeaveStatus(leaveId: string, status: LeaveRecord['status']): LeaveRecord | undefined {
    const leaves = this.getStorage();
    const leave = leaves.find(l => l.id === leaveId);
    if (leave) {
      leave.status = status;
      this.saveStorage(leaves);

      // Sync PATCH to backend
      apiFetch(`/leave-calendars/${leaveId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return leave;
    }
    return undefined;
  }

  public syncEmployeeLeaves(employeeId: string, leavesForEmployee: LeaveRecord[]) {
    const allLeaves = this.getStorage();
    const otherLeaves = allLeaves.filter(l => l.employeeId !== employeeId);
    const updated = [...otherLeaves, ...leavesForEmployee];
    this.saveStorage(updated);

    // Sync PUT to backend
    apiFetch(`/leave-calendars/employee/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify({ leaves: leavesForEmployee })
    });
  }

  public deleteLeave(leaveId: string): boolean {
    const leaves = this.getStorage();
    const filtered = leaves.filter(l => l.id !== leaveId);
    if (filtered.length !== leaves.length) {
      this.saveStorage(filtered);
      return true;
    }
    return false;
  }
}

export const leaveService = new LeaveService();
