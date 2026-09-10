import { PayrollPeriod, EmployeePayrollItem, PayrollStatus } from '../types';
import { initialPayrollPeriods } from '../mock/mockData';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_payroll_periods';

class PayrollService {
  private getStorage(): PayrollPeriod[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPayrollPeriods));
      return initialPayrollPeriods;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialPayrollPeriods;
    }
  }

  private saveStorage(periods: PayrollPeriod[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  }

  public getPayrollPeriods(): PayrollPeriod[] {
    // Async background sync with backend
    apiFetch<{ success: boolean; periods: PayrollPeriod[] }>('/payroll').then(res => {
      if (res && res.success && res.periods) {
        this.saveStorage(res.periods);
      }
    });
    return this.getStorage();
  }

  public getPayrollPeriodById(id: string): PayrollPeriod | undefined {
    const periods = this.getStorage();
    return periods.find(p => p.id === id);
  }

  public getCurrentDraft(): PayrollPeriod {
    const periods = this.getStorage();
    const draft = periods.find(p => p.status === 'Draft' || p.status === 'Calculated');
    if (draft) return draft;
    return periods[0];
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
