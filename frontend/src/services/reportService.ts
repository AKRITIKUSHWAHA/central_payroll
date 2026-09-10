import { PayrollPeriod, AuditLogItem } from '../types';
import { initialAuditLogs } from '../mock/mockData';
import { payrollService } from './payrollService';
import { apiFetch } from './api';

const AUDIT_STORAGE_KEY = 'cdl_audit_logs';

class ReportService {
  private getAuditStorage(): AuditLogItem[] {
    const data = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const logs: AuditLogItem[] = JSON.parse(data);
      // Filter out dummy sample logs
      const realLogs = logs.filter(l => 
        l.user !== 'prashant' && 
        l.user !== 'Neli Outerbridge' && 
        l.user !== 'alesia' && 
        l.id !== 'aud-1' && 
        l.id !== 'aud-2' && 
        l.id !== 'aud-3'
      );
      if (realLogs.length !== logs.length) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(realLogs));
      }
      return realLogs;
    } catch {
      return [];
    }
  }

  public async fetchAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await apiFetch<{ success: boolean; auditLogs: AuditLogItem[] }>('/reports/audit');
      if (res && res.success && res.auditLogs) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(res.auditLogs));
        return res.auditLogs;
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs from API:', err);
    }
    return this.getAuditStorage();
  }

  public getAuditLogs(): AuditLogItem[] {
    this.fetchAuditLogs();
    return this.getAuditStorage();
  }

  public async addAuditLog(log: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    const logs = this.getAuditStorage();
    const newLog: AuditLogItem = {
      ...log,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };
    logs.unshift(newLog);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));

    try {
      await apiFetch('/reports/audit', {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
    } catch (err) {
      console.error('Failed to save audit log to backend:', err);
    }
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
