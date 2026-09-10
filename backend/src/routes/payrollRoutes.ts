import { Router, Request, Response } from 'express';
import { mySQLDb } from '../db/mysqlDatabase';
import { db } from '../db/database';
import { PayrollPeriod } from '../types';

const router = Router();

// GET all payroll periods
router.get('/', async (req: Request, res: Response) => {
  try {
    const periods = await mySQLDb.getPayrollPeriods();
    res.json({ success: true, periods });
  } catch (err) {
    const periods = db.getPayrollPeriods();
    res.json({ success: true, periods });
  }
});

// GET single payroll period
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const periods = await mySQLDb.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (!period) {
      return res.status(404).json({ success: false, error: 'Payroll period not found' });
    }
    res.json({ success: true, period });
  } catch (err) {
    const periods = db.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (!period) {
      return res.status(404).json({ success: false, error: 'Payroll period not found' });
    }
    res.json({ success: true, period });
  }
});

// POST create or initialize new payroll period
router.post('/', async (req: Request, res: Response) => {
  const { periodStart, periodEnd, payDate, createdBy } = req.body;

  if (!periodStart || !periodEnd || !payDate) {
    return res.status(400).json({ success: false, error: 'periodStart, periodEnd, and payDate are required' });
  }

  try {
    const employees = await mySQLDb.getEmployees();
    const newPeriod: PayrollPeriod = {
      id: `pay-${periodEnd}`,
      periodStart,
      periodEnd,
      payDate,
      status: 'Draft',
      totalHours: 0,
      totalGrossPayroll: 0,
      totalDeductions: 0,
      totalNetPayroll: 0,
      createdBy: createdBy || 'System User',
      createdAt: new Date().toISOString(),
      items: employees.map(emp => ({
        employeeId: emp.employeeId,
        employeeName: emp.displayName,
        position: emp.position,
        department: emp.department,
        regularRate: emp.payRate,
        regularHours: 0,
        regularPay: 0,
        holidayRate: emp.holidayRate,
        holidayHours: 0,
        holidayPay: 0,
        otherPay: 0,
        deductions: 0,
        totalHours: 0,
        grossPay: 0,
        netPay: 0,
        status: 'Ready'
      }))
    };
    await mySQLDb.savePayrollPeriod(newPeriod);
    res.status(201).json({ success: true, period: newPeriod });
  } catch (err) {
    const employees = db.getEmployees();
    const periods = db.getPayrollPeriods();
    const newPeriod: PayrollPeriod = {
      id: `pay-${periodEnd}`,
      periodStart,
      periodEnd,
      payDate,
      status: 'Draft',
      totalHours: 0,
      totalGrossPayroll: 0,
      totalDeductions: 0,
      totalNetPayroll: 0,
      createdBy: createdBy || 'System User',
      createdAt: new Date().toISOString(),
      items: employees.map(emp => ({
        employeeId: emp.employeeId,
        employeeName: emp.displayName,
        position: emp.position,
        department: emp.department,
        regularRate: emp.payRate,
        regularHours: 0,
        regularPay: 0,
        holidayRate: emp.holidayRate,
        holidayHours: 0,
        holidayPay: 0,
        otherPay: 0,
        deductions: 0,
        totalHours: 0,
        grossPay: 0,
        netPay: 0,
        status: 'Ready'
      }))
    };
    periods.push(newPeriod);
    db.setPayrollPeriods(periods);
    res.status(201).json({ success: true, period: newPeriod });
  }
});

// PATCH update payroll period status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, approvedBy } = req.body;

  try {
    const periods = await mySQLDb.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (!period) {
      return res.status(404).json({ success: false, error: 'Payroll period not found' });
    }
    period.status = status;
    const now = new Date().toISOString();

    if (status === 'Approved') {
      period.approvedBy = approvedBy || 'Admin';
      period.approvedAt = now;
    } else if (status === 'Paid') {
      period.paidAt = now;
      period.items.forEach(item => { item.status = 'Paid'; });
    }
    await mySQLDb.savePayrollPeriod(period);
    res.json({ success: true, period });
  } catch (err) {
    const periods = db.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (period) {
      period.status = status;
      db.setPayrollPeriods(periods);
    }
    res.json({ success: true, period });
  }
});

// PUT update items in a payroll period
router.put('/:id/items', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    const periods = await mySQLDb.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (!period) {
      return res.status(404).json({ success: false, error: 'Payroll period not found' });
    }
    if (Array.isArray(items)) {
      period.items = items;
      period.totalHours = items.reduce((acc, item) => acc + (item.totalHours || 0), 0);
      period.totalGrossPayroll = items.reduce((acc, item) => acc + (item.grossPay || 0), 0);
      period.totalDeductions = items.reduce((acc, item) => acc + (item.deductions || 0), 0);
      period.totalNetPayroll = items.reduce((acc, item) => acc + (item.netPay || 0), 0);
    }
    await mySQLDb.savePayrollPeriod(period);
    res.json({ success: true, period });
  } catch (err) {
    const periods = db.getPayrollPeriods();
    const period = periods.find(p => p.id === id);
    if (period && Array.isArray(items)) {
      period.items = items;
      db.setPayrollPeriods(periods);
    }
    res.json({ success: true, period });
  }
});

export default router;
