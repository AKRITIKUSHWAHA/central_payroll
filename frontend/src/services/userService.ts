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
  dashboard: { view: false }, // Strictly Super Admin Only
  employees: { view: false, create: false, edit: false, delete: false }, // Strictly Super Admin Only (Pay Rates protected)
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
    // 1. Always update local user account storage
    const users = this.getStorage();
    const identifier = params.userId || params.username;
    const target = users.find(u => u.id === identifier || u.username.toLowerCase() === identifier?.toLowerCase());
    if (target) {
      target.password = params.newPassword;
      this.saveStorage(users);
    }

    // 2. Sync to cloud backend API
    try {
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/user-accounts/change-password', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      if (res && res.success) {
        return res;
      }
    } catch (err: any) {
      console.warn('Backend password sync error, persisted locally:', err);
    }
    return { success: true, message: 'Password updated successfully' };
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
    const custom = localStorage.getItem('cdl_custom_permissions');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        if (parsed && parsed[role]) {
          return {
            ...(role === 'admin' ? adminPermissions : staffPermissions),
            ...parsed[role]
          };
        }
      } catch (_) {}
    }
    if (role === 'admin') {
      return adminPermissions;
    }
    return staffPermissions;
  }

  public async fetchRolePermissions(): Promise<{ superadmin: PermissionMatrix; admin: PermissionMatrix; staff: PermissionMatrix }> {
    try {
      const res = await apiFetch<{ success: boolean; data: any }>('/permissions');
      if (res && res.success && res.data?.rolePermissions) {
        localStorage.setItem('cdl_custom_permissions', JSON.stringify(res.data.rolePermissions));
        return res.data.rolePermissions;
      }
    } catch (err) {
      console.warn('Could not fetch permissions from API:', err);
    }
    const custom = localStorage.getItem('cdl_custom_permissions');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        return {
          superadmin: superAdminPermissions,
          admin: parsed.admin || adminPermissions,
          staff: parsed.staff || staffPermissions
        };
      } catch (_) {}
    }
    return {
      superadmin: superAdminPermissions,
      admin: adminPermissions,
      staff: staffPermissions
    };
  }

  public async saveRolePermissions(rolePermissions: { admin: any; staff: any }): Promise<boolean> {
    const fullPayload = {
      superadmin: superAdminPermissions,
      admin: rolePermissions.admin,
      staff: rolePermissions.staff
    };
    localStorage.setItem('cdl_custom_permissions', JSON.stringify(fullPayload));

    try {
      const res = await apiFetch<{ success: boolean }>('/permissions', {
        method: 'POST',
        body: JSON.stringify({ rolePermissions: fullPayload })
      });
      return !!(res && res.success);
    } catch (err) {
      console.error('Failed to sync permissions to backend:', err);
      return true;
    }
  }

  public async resetRolePermissions(): Promise<boolean> {
    const defaults = {
      superadmin: superAdminPermissions,
      admin: adminPermissions,
      staff: staffPermissions
    };
    localStorage.setItem('cdl_custom_permissions', JSON.stringify(defaults));
    try {
      await apiFetch('/permissions/reset', { method: 'POST' });
    } catch (_) {}
    return true;
  }
}

export const userService = new UserService();

