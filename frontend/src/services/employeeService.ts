import { Employee } from '../types';
import { initialEmployees } from '../mock/mockData';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_payroll_employees';

export const isRealEmployee = (e: any): boolean => {
  if (!e || !e.id) return false;
  const id = String(e.id).toLowerCase().trim();
  const empId = String(e.employeeId || '').toLowerCase().trim();
  const name = String(e.displayName || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase().trim();
  const first = String(e.firstName || '').toLowerCase().trim();
  const last = String(e.lastName || '').toLowerCase().trim();

  // Exclude customer IDs
  if (id.startsWith('cust_') || empId.startsWith('cust_')) return false;
  if (['cust_416', 'cust_417', 'cust_485', 'staff6', 'staff7', 'aman'].includes(id)) return false;

  // Exclude Tanuvi Patel (confirmed not in client's authoritative list)
  if (id === 'tanuvi' || name.includes('tanuvi') || first === 'tanuvi' || (first === 'tanuvi' && last.includes('patel'))) {
    return false;
  }

  // Exclude duplicate customer Tyonika McGowan (keep canonical staff Ty / CDL-003)
  if ((name.includes('tyonika mcgowan') || first === 'tyonika') && id !== 'ty' && empId !== 'cdl-003') {
    return false;
  }

  return true;
};

class EmployeeService {
  private getStorage(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data === null) {
      const canonical = initialEmployees.filter(isRealEmployee);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(canonical));
      return canonical;
    }
    try {
      const parsed: Employee[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(isRealEmployee);
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveStorage(employees: Employee[]) {
    const cleaned = employees.filter(isRealEmployee);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  public getEmployees(): Employee[] {
    // Attempt background sync with backend
    apiFetch<{ success: boolean; employees: Employee[] }>('/employees').then(res => {
      if (res && res.success && res.employees) {
        const valid = res.employees.filter(isRealEmployee);
        this.saveStorage(valid);
      }
    }).catch(() => {});
    return this.getStorage();
  }

  public async fetchEmployees(): Promise<Employee[]> {
    try {
      const res = await apiFetch<{ success: boolean; employees: Employee[] }>('/employees');
      if (res && res.success && res.employees) {
        const valid = res.employees.filter(isRealEmployee);
        this.saveStorage(valid);
        return valid;
      }
    } catch (e) {
      console.error('Failed to fetch employees:', e);
    }
    return this.getStorage();
  }

  public getEmployeeById(id: string): Employee | undefined {
    const employees = this.getStorage();
    return employees.find(e => e.id === id || e.employeeId === id);
  }

  public async saveEmployee(employee: Partial<Employee> & { firstName: string; lastName: string }): Promise<Employee> {
    const employees = this.getStorage();
    let savedEmployee: Employee;

    if (employee.id) {
      const index = employees.findIndex(e => e.id === employee.id || e.employeeId === employee.id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...employee } as Employee;
        savedEmployee = employees[index];
        this.saveStorage(employees);

        // Sync PUT to backend
        await apiFetch(`/employees/${savedEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(savedEmployee)
        }).catch(() => {});

        return savedEmployee;
      }
    }

    const newId = employee.id || `emp-${Date.now()}`;
    const nextEmpNum = employees.length + 1;
    savedEmployee = {
      id: newId,
      employeeId: employee.employeeId || `CDL-${String(nextEmpNum).padStart(3, '0')}`,
      firstName: employee.firstName,
      middleInitial: employee.middleInitial || '',
      lastName: employee.lastName,
      displayName: employee.displayName || `${employee.firstName} ${employee.lastName}`,
      position: employee.position || 'Staff Member',
      department: employee.department || 'Operations',
      status: employee.status || 'Active',
      employmentType: employee.employmentType || 'Full-Time',
      payType: employee.payType || 'Hourly',
      payRate: employee.payRate ?? 16.00,
      holidayRate: employee.holidayRate ?? 24.00,
      startDate: employee.startDate || new Date().toISOString().split('T')[0],
      dateOfBirth: employee.dateOfBirth || '1995-01-01',
      personalPhone: employee.personalPhone || '(441) 555-0000',
      workPhone: employee.workPhone || '(441) 295-4141',
      email: employee.email || `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}@centraldispatch.bm`,
      address: employee.address || 'Hamilton, Bermuda',
      emergencyContactName: employee.emergencyContactName || 'Family Contact',
      emergencyContactPhone: employee.emergencyContactPhone || '(441) 555-0000',
      emergencyContactRelation: employee.emergencyContactRelation || 'Relative',
      paymentMethod: employee.paymentMethod || 'Direct Deposit',
      bankName: employee.bankName || 'Butterfield Bank Bermuda',
      bankAccountMasked: employee.bankAccountMasked || '••••••••1234'
    };

    employees.push(savedEmployee);
    this.saveStorage(employees);

    // Sync POST to backend
    await apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(savedEmployee)
    }).catch(() => {});

    return savedEmployee;
  }

  public async deleteEmployee(id: string): Promise<boolean> {
    const employees = this.getStorage();
    const filtered = employees.filter(e => e.id !== id && e.employeeId !== id);
    this.saveStorage(filtered);

    // Sync DELETE to backend endpoints
    await apiFetch(`/employees/${id}`, { method: 'DELETE' }).catch(() => {});
    await apiFetch(`/staff-contact-details/${id}`, { method: 'DELETE' }).catch(() => {});
    return true;
  }
}

export const employeeService = new EmployeeService();
