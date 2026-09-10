import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET audit logs
router.get('/audit', (req: Request, res: Response) => {
  const auditLogs = db.getAuditLogs();
  res.json({ success: true, auditLogs });
});

// GET overall system stats for dashboard / reports
router.get('/summary', (req: Request, res: Response) => {
  const employees = db.getEmployees();
  const periods = db.getPayrollPeriods();
  const leaves = db.getLeaves();

  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const currentPeriod = periods[0] || null;
  const employeesOnLeave = leaves.filter(l => l.status === 'Approved').length;

  res.json({
    success: true,
    summary: {
      totalEmployees: employees.length,
      activeEmployees,
      employeesOnLeave,
      currentPeriodStatus: currentPeriod ? currentPeriod.status : 'Draft',
      totalHours: currentPeriod ? currentPeriod.totalHours : 0,
      totalGrossPayroll: currentPeriod ? currentPeriod.totalGrossPayroll : 0,
      totalNetPayroll: currentPeriod ? currentPeriod.totalNetPayroll : 0
    }
  });
});

export default router;
