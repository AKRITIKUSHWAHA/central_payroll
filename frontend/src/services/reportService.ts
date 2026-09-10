import { PayrollPeriod, AuditLogItem } from '../types';
import { initialAuditLogs } from '../mock/mockData';
import { payrollService } from './payrollService';

const AUDIT_STORAGE_KEY = 'cdl_audit_logs';

class ReportService {
  private getAuditStorage(): AuditLogItem[] {
    const data = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public getAuditLogs(): AuditLogItem[] {
    return this.getAuditStorage();
  }

  public addAuditLog(log: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    const logs = this.getAuditStorage();
    const newLog: AuditLogItem = {
      ...log,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString()
    };
    logs.unshift(newLog);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  }

  public generateWeeklyPayrollSummary(periodId?: string) {
    const periods = payrollService.getPayrollPeriods();
    const period = periodId ? periods.find(p => p.id === periodId) : periods[0];
    return period;
  }

  public exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const reportService = new ReportService();
