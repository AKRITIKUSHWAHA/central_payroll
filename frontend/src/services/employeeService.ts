import { Employee } from '../types';
import { initialEmployees } from '../mock/mockData';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_payroll_employees';

class EmployeeService {
  private getStorage(): Employee[] {
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

  private saveStorage(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }

  public getEmployees(): Employee[] {
    // Attempt background sync with backend
    apiFetch<{ success: boolean; employees: Employee[] }>('/employees').then(res => {
      if (res && res.success && res.employees) {
        this.saveStorage(res.employees);
      }
    });
    return this.getStorage();
  }

  public getEmployeeById(id: string): Employee | undefined {
    const employees = this.getStorage();
    return employees.find(e => e.id === id || e.employeeId === id);
  }

  public saveEmployee(employee: Partial<Employee> & { firstName: string; lastName: string }): Employee {
    const employees = this.getStorage();
    let savedEmployee: Employee;

    if (employee.id) {
      const index = employees.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...employee } as Employee;
        savedEmployee = employees[index];
        this.saveStorage(employees);

        // Sync PUT to backend
        apiFetch(`/employees/${savedEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(savedEmployee)
        });

        return savedEmployee;
      }
    }

    const newId = `emp-${Date.now()}`;
    const nextEmpNum = employees.length + 1;
    savedEmployee = {
      id: newId,
      employeeId: employee.employeeId || `CDL-${String(nextEmpNum).padStart(3, '0')}`,
      firstName: employee.firstName,
      middleInitial: employee.middleInitial || '',
      lastName: employee.lastName,
      displayName: employee.displayName || `${employee.firstName} ${employee.lastName}`,
      position: employee.position || 'Staff Member',
      department: employee.department || 'Dispatch Operations',
      status: employee.status || 'Active',
      employmentType: employee.employmentType || 'Full-Time',
      payType: employee.payType || 'Hourly',
      payRate: employee.payRate ?? 16.00,
      holidayRate: employee.holidayRate ?? 24.00,
      startDate: employee.startDate || new Date().toISOString().split('T')[0],
      dateOfBirth: employee.dateOfBirth || '1995-01-01',
      personalPhone: employee.personalPhone || '(441) 555-0000',
      workPhone: employee.workPhone || '(441) 292-1234',
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
    apiFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(savedEmployee)
    });

    return savedEmployee;
  }

  public deleteEmployee(id: string): boolean {
    const employees = this.getStorage();
    const filtered = employees.filter(e => e.id !== id && e.employeeId !== id);
    if (filtered.length !== employees.length) {
      this.saveStorage(filtered);

      // Sync DELETE to backend
      apiFetch(`/employees/${id}`, { method: 'DELETE' });

      return true;
    }
    return false;
  }
}

export const employeeService = new EmployeeService();
