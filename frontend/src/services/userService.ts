import { UserAccount, UserRole, PermissionMatrix } from '../types';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_user_accounts';

export const superAdminPermissions: PermissionMatrix = {
  dashboard: { view: true },
  employees: { view: true, create: true, edit: true, delete: true }, // Staff Management & Pay Rates
  payroll: { view: true, edit: true, approve: true, export: true }, // Payroll Calculation & Approval
  schedules: { view: true, edit: true, print: true }, // Weekly Schedules & Notes
  leave: { view: true, manage: true }, // Leave Calendars
  contacts: { view: true, edit: true }, // Staff Contact Details
  reports: { view: true, export: true }, // Payroll Reports
  payslips: { view: true, print: true, email: true }, // Payslips
  audit: { view: true, export: true }, // Audit Reports
  permissions: { view: true, edit: true }, // Permissions Administration
  userAccounts: { view: true, manage: true }, // User Accounts Administration
  settings: { view: true, edit: true }, // Company Profile & Settings
  accounts: { view: true } // Customer Invoices & General Ledger
};

export const adminPermissions: PermissionMatrix = {
  dashboard: { view: true },
  employees: { view: true, create: true, edit: true, delete: true }, // Staff Management & Pay Rates (Kept for Admin)
  contacts: { view: true, edit: true }, // Staff Contact Details
  schedules: { view: true, edit: true, print: true }, // Weekly Schedules & Rotas
  leave: { view: true, manage: true }, // Leave Calendars
  accounts: { view: true }, // Customer Invoices, Payments & General Ledger
  settings: { view: true, edit: true }, // Company Settings
  audit: { view: true, export: true }, // Audit Logging
  payroll: { view: false, edit: false, approve: false, export: false }, // Strictly REMOVED from Admin (Super Admin only)
  reports: { view: false, export: false }, // Strictly REMOVED from Admin (Super Admin only)
  payslips: { view: false, print: false, email: false }, // Strictly REMOVED from Admin (Super Admin only)
  permissions: { view: false, edit: false }, // Strictly NO permissions administration (Super Admin only)
  userAccounts: { view: false, manage: false } // Strictly NO user-account administration (Super Admin only)
};

export const staffPermissions: PermissionMatrix = {
  dashboard: { view: false },
  employees: { view: false, create: false, edit: false, delete: false },
  payroll: { view: false, edit: false, approve: false, export: false },
  schedules: { view: true, edit: false, print: false }, // Staff can view weekly schedules & write notes
  leave: { view: false, manage: false },
  contacts: { view: false, edit: false },
  reports: { view: false, export: false },
  payslips: { view: false, print: false, email: false },
  audit: { view: false, export: false },
  permissions: { view: false, edit: false },
  userAccounts: { view: false, manage: false },
  settings: { view: false, edit: false },
  accounts: { view: false }
};

export const defaultPermissions = superAdminPermissions;

class UserService {
  private getStorage(): UserAccount[] {
    const data = localStorage.getItem(STORAGE_KEY);
    const defaultUsers: UserAccount[] = [
      {
        id: 'usr-1',
        username: 'admin',
        displayName: 'Administrator',
        email: 'operations@centraldispatch.bm',
        role: 'admin',
        status: 'Active',
        lastLogin: '2026-09-10 10:30 AM',
        createdAt: '2026-01-01'
      },
      {
        id: 'usr-2',
        username: 'superadmin',
        displayName: 'Super Admin',
        email: 'admin@centraldispatch.bm',
        role: 'superadmin',
        status: 'Active',
        lastLogin: '2026-09-10 12:00 PM',
        createdAt: '2026-01-01'
      },
      {
        id: 'usr-3',
        username: 'staff',
        displayName: 'Staff',
        email: 'staff@centraldispatch.bm',
        role: 'staff',
        status: 'Active',
        lastLogin: '2026-09-10 08:45 AM',
        createdAt: '2026-01-01'
      }
    ];

    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      const parsed = JSON.parse(data);
      // Clean out any unwanted auto-seeded staff accounts from previous session
      const filtered = Array.isArray(parsed)
        ? parsed.filter((u: any) => !['usr-alesia', 'usr-global', 'usr-ssh', 'usr-neli', 'usr-ty', 'usr-tanuvi'].includes(u.id))
        : defaultUsers;
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered.length > 0 ? filtered : defaultUsers;
    } catch {
      return defaultUsers;
    }
  }

  private saveStorage(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  public async fetchUsers(): Promise<UserAccount[]> {
    try {
      const res = await apiFetch<{ success: boolean; users: UserAccount[] }>('/user-accounts');
      if (res && res.success && res.users) {
        this.saveStorage(res.users);
        return res.users;
      }
    } catch (err) {
      console.error('Failed to fetch users from API:', err);
    }
    return this.getStorage();
  }

  public getUsers(): UserAccount[] {
    apiFetch<{ success: boolean; users: UserAccount[] }>('/user-accounts').then(res => {
      if (res && res.success && res.users) {
        this.saveStorage(res.users);
      }
    }).catch(() => {});

    return this.getStorage();
  }

  public getUserByUsername(username: string): UserAccount | undefined {
    return this.getStorage().find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public async createUser(user: Omit<UserAccount, 'id' | 'createdAt'>): Promise<UserAccount> {
    const users = this.getStorage();
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    this.saveStorage(users);

    try {
      await apiFetch('/user-accounts', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
    } catch (err) {
      console.error('Failed to sync created user to backend:', err);
    }

    return newUser;
  }

  public async toggleUserStatus(id: string): Promise<UserAccount | undefined> {
    const users = this.getStorage();
    const user = users.find(u => u.id === id || u.username === id);
    if (user) {
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      user.status = newStatus;
      this.saveStorage(users);

      try {
        await apiFetch(`/user-accounts/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error('Failed to sync toggleUserStatus to backend:', err);
      }

      return user;
    }
    return undefined;
  }

  public async changePassword(params: { userId?: string; username?: string; currentPassword?: string; newPassword: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/user-accounts/change-password', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      if (res && res.success) {
        const users = this.getStorage();
        const identifier = params.userId || params.username;
        const target = users.find(u => u.id === identifier || u.username.toLowerCase() === identifier?.toLowerCase());
        if (target) {
          target.password = params.newPassword;
          this.saveStorage(users);
        }
        return res;
      }
      return { success: false, error: res?.error || 'Failed to update password' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating password' };
    }
  }

  public async deleteUser(id: string): Promise<boolean> {
    try {
      await apiFetch(`/user-accounts/${id}`, { method: 'DELETE' });
      const users = this.getStorage().filter(u => u.id !== id && u.username.toLowerCase() !== id.toLowerCase());
      this.saveStorage(users);
      return true;
    } catch {
      const users = this.getStorage().filter(u => u.id !== id && u.username.toLowerCase() !== id.toLowerCase());
      this.saveStorage(users);
      return true;
    }
  }

  public getPermissions(role: UserRole): PermissionMatrix {
    if (role === 'superadmin') {
      return superAdminPermissions;
    }
    if (role === 'admin') {
      return adminPermissions;
    }
    return staffPermissions;
  }
}

export const userService = new UserService();
