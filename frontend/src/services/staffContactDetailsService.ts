import { Employee } from '../types';
import { apiFetch } from './api';
import { employeeService } from './employeeService';

export interface StaffRecordItem {
  id: string;
  staffId: string;
  type: 'sick' | 'vacation' | 'note';
  date: string;
  note: string;
  createdAt: string;
}

const RECORDS_STORAGE_KEY = 'cdl_staff_records';

class StaffContactDetailsService {
  private getLocalRecords(): Record<string, StaffRecordItem[]> {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveLocalRecords(records: Record<string, StaffRecordItem[]>) {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  }

  public async getStaffContactDetails(): Promise<Employee[]> {
    try {
      const res = await apiFetch<{ success: boolean; contacts: Employee[] }>('/staff-contact-details');
      if (res && res.success && res.contacts) {
        return res.contacts;
      }
    } catch (err) {
      console.warn('Failed to fetch from /staff-contact-details:', err);
    }
    return employeeService.getEmployees();
  }

  public async updateStaffContactDetail(id: string, contactData: Partial<Employee>): Promise<Employee> {
    const updated = employeeService.saveEmployee({ ...contactData, id } as any);
    try {
      const res = await apiFetch<{ success: boolean; contact: Employee }>(`/staff-contact-details/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contactData)
      });
      if (res && res.success && res.contact) {
        return res.contact;
      }
    } catch (err) {
      console.warn('Failed to update /staff-contact-details:', err);
    }
    return updated;
  }

  public async addStaffContact(contactData: Partial<Employee>): Promise<Employee> {
    const created = employeeService.saveEmployee(contactData as any);
    try {
      const res = await apiFetch<{ success: boolean; contact: Employee }>('/staff-contact-details', {
        method: 'POST',
        body: JSON.stringify(contactData)
      });
      if (res && res.success && res.contact) {
        return res.contact;
      }
    } catch (err) {
      console.warn('Failed to post to /staff-contact-details:', err);
    }
    return created;
  }

  public async deleteStaffContact(id: string): Promise<boolean> {
    await employeeService.deleteEmployee(id);
    try {
      await apiFetch(`/staff-contact-details/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (err) {
      console.warn('Failed to delete from /staff-contact-details:', err);
      return true;
    }
  }

  public async getStaffRecords(staffId: string): Promise<StaffRecordItem[]> {
    try {
      const res = await apiFetch<{ success: boolean; records: StaffRecordItem[] }>(`/staff-contact-details/${staffId}/records`);
      if (res && res.success && res.records) {
        const local = this.getLocalRecords();
        local[staffId] = res.records;
        this.saveLocalRecords(local);
        return res.records;
      }
    } catch (err) {
      console.warn('Failed to fetch staff records from API:', err);
    }
    const local = this.getLocalRecords();
    return local[staffId] || [];
  }

  public async addStaffRecord(staffId: string, item: { type: 'sick' | 'vacation' | 'note'; date: string; note: string }): Promise<StaffRecordItem> {
    const record: StaffRecordItem = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      staffId,
      type: item.type,
      date: item.date,
      note: item.note,
      createdAt: new Date().toISOString()
    };

    const local = this.getLocalRecords();
    if (!local[staffId]) local[staffId] = [];
    local[staffId].unshift(record);
    this.saveLocalRecords(local);

    try {
      const res = await apiFetch<{ success: boolean; record: StaffRecordItem }>(`/staff-contact-details/${staffId}/records`, {
        method: 'POST',
        body: JSON.stringify(record)
      });
      if (res && res.success && res.record) {
        return res.record;
      }
    } catch (err) {
      console.warn('Failed to post staff record to API:', err);
    }
    return record;
  }

  public async deleteStaffRecord(staffId: string, recordId: string): Promise<void> {
    const local = this.getLocalRecords();
    if (local[staffId]) {
      local[staffId] = local[staffId].filter(r => r.id !== recordId);
      this.saveLocalRecords(local);
    }

    try {
      await apiFetch(`/staff-contact-details/${staffId}/records/${recordId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to delete staff record via API:', err);
    }
  }
}

export const staffContactDetailsService = new StaffContactDetailsService();
