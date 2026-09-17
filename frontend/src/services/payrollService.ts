import { Employee, PayrollPeriod, EmployeePayrollItem, PayrollStatus } from '../types';
import { initialPayrollPeriods } from '../mock/mockData';
import { employeeService, isRealEmployee } from './employeeService';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_payroll_periods';

class PayrollService {
  private getStorage(): PayrollPeriod[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: PayrollPeriod[] = JSON.parse(data);
      return parsed.map(p => ({
        ...p,
        periodStart: this.sanitizeDate(p.periodStart),
        periodEnd: this.sanitizeDate(p.periodEnd),
        payDate: this.sanitizeDate(p.payDate),
      }));
    } catch {
      return [];
    }
  }

  private saveStorage(periods: PayrollPeriod[]) {
    const sanitized = periods.map(p => ({
      ...p,
      periodStart: this.sanitizeDate(p.periodStart),
      periodEnd: this.sanitizeDate(p.periodEnd),
      payDate: this.sanitizeDate(p.payDate),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }

  public createNewDraft(): PayrollPeriod {
    const employees = employeeService.getEmployees();
    const today = new Date();

    const periodStart = today.toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
    const periodEnd = nextWeek.toISOString().split('T')[0];
    const payDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const items: EmployeePayrollItem[] = employees.map((emp: Employee) => {
      const regRate = emp.payRate || 0;
      const holRate = emp.holidayRate || (regRate * 1.5);
      const regPay = Math.round(regRate * 40 * 100) / 100;
      return {
        employeeId: emp.id || emp.employeeId,
        employeeName: emp.displayName,
        position: emp.position,
        department: emp.department,
        regularRate: regRate,
        regularHours: 40,
        regularPay: regPay,
        holidayRate: holRate,
        holidayHours: 0,
        holidayPay: 0,
        otherPay: 0,
        deductions: 0,
        totalHours: 40,
        grossPay: regPay,
        netPay: regPay,
        status: 'Incomplete'
      };
    });

    const totals = this.calculateTotals(items);

    const draft: PayrollPeriod = {
      id: `pay-${Date.now()}`,
      periodStart,
      periodEnd,
      payDate,
      status: 'Draft',
      items,
      totalHours: totals.totalHours,
      totalGrossPayroll: totals.totalGrossPayroll,
      totalDeductions: totals.totalDeductions,
      totalNetPayroll: totals.totalNetPayroll,
      createdBy: 'Super Admin',
      createdAt: new Date().toISOString().split('T')[0]
    };

    return draft;
  }

  public removeDeletedEmployee(employeeId: string) {
    const idLower = employeeId.toLowerCase().trim();
    const periods = this.getStorage();
    let modified = false;

    const updated = periods.map(p => {
      // Historical periods (Paid, Approved) must NEVER be altered — preserve full payroll history!
      if (p.status !== 'Draft') return p;

      const filteredItems = (p.items || []).filter(i => {
        const iId = (i.employeeId || '').toLowerCase().trim();
        const iName = (i.employeeName || '').toLowerCase().trim();
        return iId !== idLower && !iName.includes(idLower);
      });

      if (filteredItems.length !== (p.items || []).length) {
        modified = true;
        const totals = this.calculateTotals(filteredItems);
        return {
          ...p,
          items: filteredItems,
          totalHours: totals.totalHours,
          totalGrossPayroll: totals.totalGrossPayroll,
          totalDeductions: totals.totalDeductions,
          totalNetPayroll: totals.totalNetPayroll,
        };
      }
      return p;
    });

    if (modified) {
      this.saveStorage(updated);
    }
  }

  public syncItemsWithEmployees(period: PayrollPeriod): PayrollPeriod {
    // Historical periods must remain frozen snapshots
    if (period.status !== 'Draft') return period;

    const employees = employeeService.getEmployees().filter(e => isRealEmployee(e) && (e.status || 'Active') !== 'Inactive');
    if (!employees || employees.length === 0) return period;

    const validEmpIdMap = new Map<string, Employee>();
    employees.forEach(e => {
      if (e.id) validEmpIdMap.set(e.id.toLowerCase(), e);
      if (e.employeeId) validEmpIdMap.set(e.employeeId.toLowerCase(), e);
    });

    // 1. Keep only items belonging to valid active employees in Draft
    let items = (period.items || []).filter(i => {
      const idKey = (i.employeeId || '').toLowerCase().trim();
      const nameKey = (i.employeeName || '').toLowerCase().trim();
      return validEmpIdMap.has(idKey) || employees.some(e => e.displayName && e.displayName.toLowerCase() === nameKey);
    });

    let modified = items.length !== (period.items || []).length;

    // 2. Add any active employee missing from the draft
    employees.forEach((emp: Employee) => {
      const has = items.some(i => 
        (i.employeeId && i.employeeId.toLowerCase() === (emp.id || '').toLowerCase()) ||
        (i.employeeId && emp.employeeId && i.employeeId.toLowerCase() === emp.employeeId.toLowerCase()) ||
        (i.employeeName && emp.displayName && i.employeeName.toLowerCase() === emp.displayName.toLowerCase())
      );

      if (!has) {
        modified = true;
        const regRate = emp.payRate || 0;
        const holRate = emp.holidayRate || (regRate * 1.5);
        const regPay = Math.round(regRate * 40 * 100) / 100;
        items.push({
          employeeId: emp.id || emp.employeeId,
          employeeName: emp.displayName,
          position: emp.position,
          department: emp.department,
          regularRate: regRate,
          regularHours: 40,
          regularPay: regPay,
          holidayRate: holRate,
          holidayHours: 0,
          holidayPay: 0,
          otherPay: 0,
          deductions: 0,
          totalHours: 40,
          grossPay: regPay,
          netPay: regPay,
          status: 'Incomplete'
        });
      }
    });

    if (modified) {
      const totals = this.calculateTotals(items);
      const updated = {
        ...period,
        items,
        totalHours: totals.totalHours,
        totalGrossPayroll: totals.totalGrossPayroll,
        totalDeductions: totals.totalDeductions,
        totalNetPayroll: totals.totalNetPayroll,
      };
      this.savePayrollPeriod(updated);
      return updated;
    }

    return period;
  }

  public async fetchPayrollPeriods(): Promise<PayrollPeriod[]> {
    try {
      const res = await apiFetch<{ success: boolean; periods: PayrollPeriod[] }>('/payroll');
      if (res && res.success && res.periods && res.periods.length > 0) {
        this.saveStorage(res.periods);
        return res.periods;
      }
    } catch (err) {
      console.warn('Failed to fetch /payroll:', err);
    }
    return this.getPayrollPeriods();
  }

  public getPayrollPeriods(): PayrollPeriod[] {
    // Async background sync with backend
    apiFetch<{ success: boolean; periods: PayrollPeriod[] }>('/payroll').then(res => {
      if (res && res.success && res.periods && res.periods.length > 0) {
        this.saveStorage(res.periods);
      }
    });

    const storage = this.getStorage();
    if (storage.length === 0) {
      const initialDraft = this.createNewDraft();
      this.saveStorage([initialDraft]);
      return [initialDraft];
    }
    return storage;
  }

  public getPayrollPeriodById(id: string): PayrollPeriod | undefined {
    const periods = this.getPayrollPeriods();
    return periods.find(p => p.id === id);
  }

  public getCurrentDraft(): PayrollPeriod {
    const periods = this.getPayrollPeriods();
    let draft = periods.find(p => p.status === 'Draft' || p.status === 'Calculated');
    if (!draft && periods.length > 0) draft = periods[0];
    if (!draft) draft = this.createNewDraft();
    return this.syncItemsWithEmployees(draft);
  }

  private sanitizeDate(d: any): string {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().split('T')[0];
    const s = String(d);
    return s.includes('T') ? s.split('T')[0] : s;
  }

  public calculateTotals(items: EmployeePayrollItem[]) {
    let totalHours = 0;
    let totalGrossPayroll = 0;
    let totalDeductions = 0;
    let totalNetPayroll = 0;

    items.forEach(item => {
      const regRate = Number(item.regularRate) || 0;
      const regHours = Number(item.regularHours) || 0;
      const holRate = Number(item.holidayRate) || 0;
      const holHours = Number(item.holidayHours) || 0;
      const otherPay = Number(item.otherPay) || 0;
      const deductions = Number(item.deductions) || 0;

      item.regularRate = regRate;
      item.regularHours = regHours;
      item.holidayRate = holRate;
      item.holidayHours = holHours;
      item.otherPay = otherPay;
      item.deductions = deductions;

      item.regularPay = Math.round(regRate * regHours * 100) / 100;
      item.holidayPay = Math.round(holRate * holHours * 100) / 100;
      item.totalHours = Number((regHours + holHours).toFixed(2));
      item.grossPay = Math.round((item.regularPay + item.holidayPay + otherPay) * 100) / 100;
      item.netPay = Math.round((item.grossPay - deductions) * 100) / 100;

      totalHours += item.totalHours;
      totalGrossPayroll += item.grossPay;
      totalDeductions += deductions;
      totalNetPayroll += item.netPay;
    });

    return {
      totalHours: Number(totalHours.toFixed(2)),
      totalGrossPayroll: Math.round(totalGrossPayroll * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPayroll: Math.round(totalNetPayroll * 100) / 100,
    };
  }

  public savePayrollPeriod(period: PayrollPeriod): PayrollPeriod {
    const periods = this.getStorage();
    const totals = this.calculateTotals(period.items);
    
    const updated: PayrollPeriod = {
      ...period,
      totalHours: totals.totalHours,
      totalGrossPayroll: totals.totalGrossPayroll,
      totalDeductions: totals.totalDeductions,
      totalNetPayroll: totals.totalNetPayroll,
    };

    const index = periods.findIndex(p => p.id === period.id);
    if (index !== -1) {
      periods[index] = updated;
    } else {
      periods.unshift(updated);
    }

    this.saveStorage(periods);

    // Sync PUT items to backend
    apiFetch(`/payroll/${updated.id}/items`, {
      method: 'PUT',
      body: JSON.stringify({
        items: updated.items,
        periodStart: updated.periodStart,
        periodEnd: updated.periodEnd,
        payDate: updated.payDate,
        status: updated.status
      })
    });

    return updated;
  }

  public updatePayrollStatus(periodId: string, status: PayrollStatus, user: string): PayrollPeriod | undefined {
    const periods = this.getStorage();
    const period = periods.find(p => p.id === periodId);
    if (period) {
      period.status = status;
      if (status === 'Approved') {
        period.approvedBy = user;
        period.approvedAt = new Date().toISOString();
      } else if (status === 'Paid') {
        period.paidAt = new Date().toISOString();
        period.items.forEach(i => i.status = 'Paid');
      }
      this.saveStorage(periods);

      // Sync PATCH status to backend
      apiFetch(`/payroll/${periodId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, approvedBy: user, period })
      });

      return period;
    }
    return undefined;
  }

  public async deletePayrollPeriod(periodId: string): Promise<boolean> {
    const periods = this.getStorage();
    const filtered = periods.filter(p => p.id !== periodId);
    this.saveStorage(filtered);

    try {
      await apiFetch(`/payroll/${periodId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (err) {
      console.warn('Failed to delete payroll period from backend:', err);
      return false;
    }
  }
}

export const payrollService = new PayrollService();
