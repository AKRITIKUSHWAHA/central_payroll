import { Employee, PayrollPeriod, EmployeePayrollItem, PayrollStatus } from '../types';
import { initialPayrollPeriods } from '../mock/mockData';
import { employeeService } from './employeeService';
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
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveStorage(periods: PayrollPeriod[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  }

  public createNewDraft(): PayrollPeriod {
    const employees = employeeService.getEmployees();
    const today = new Date();

    const periodStart = today.toISOString().split('T')[0];
    const nextWeek = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
    const periodEnd = nextWeek.toISOString().split('T')[0];
    const payDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const items: EmployeePayrollItem[] = employees.map((emp: Employee) => ({
      employeeId: emp.id || emp.employeeId,
      employeeName: emp.displayName,
      position: emp.position,
      department: emp.department,
      regularRate: emp.payRate || 0,
      regularHours: 40,
      regularPay: (emp.payRate || 0) * 40,
      holidayRate: emp.holidayRate || (emp.payRate || 0) * 1.5,
      holidayHours: 0,
      holidayPay: 0,
      otherPay: 0,
      deductions: 0,
      totalHours: 40,
      grossPay: (emp.payRate || 0) * 40,
      netPay: (emp.payRate || 0) * 40,
      status: 'Incomplete'
    }));

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
    const draft = periods.find(p => p.status === 'Draft' || p.status === 'Calculated');
    if (draft) return draft;
    if (periods.length > 0) return periods[0];
    return this.createNewDraft();
  }

  public calculateTotals(items: EmployeePayrollItem[]) {
    let totalHours = 0;
    let totalGrossPayroll = 0;
    let totalDeductions = 0;
    let totalNetPayroll = 0;

    items.forEach(item => {
      item.regularPay = Math.round(item.regularRate * item.regularHours * 100) / 100;
      item.holidayPay = Math.round(item.holidayRate * item.holidayHours * 100) / 100;
      item.totalHours = Number((item.regularHours + item.holidayHours).toFixed(2));
      item.grossPay = Math.round((item.regularPay + item.holidayPay + (item.otherPay || 0)) * 100) / 100;
      item.netPay = Math.round((item.grossPay - (item.deductions || 0)) * 100) / 100;

      totalHours += item.totalHours;
      totalGrossPayroll += item.grossPay;
      totalDeductions += (item.deductions || 0);
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
      body: JSON.stringify({ items: updated.items })
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
        body: JSON.stringify({ status, approvedBy: user })
      });

      return period;
    }
    return undefined;
  }
}

export const payrollService = new PayrollService();
