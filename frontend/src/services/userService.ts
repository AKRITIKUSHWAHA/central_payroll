import { UserAccount, UserRole, PermissionMatrix } from '../types';
import { initialUsers } from '../mock/mockData';
import { apiFetch } from './api';

const STORAGE_KEY = 'cdl_user_accounts';

export const defaultPermissions: PermissionMatrix = {
  dashboard: { view: true },
  employees: { view: true, create: true, edit: true, delete: true },
  payroll: { view: true, edit: true, approve: true, export: true },
  schedules: { view: true, edit: true, print: true },
  leave: { view: true, manage: true },
  contacts: { view: true, edit: true },
  reports: { view: true, export: true },
  payslips: { view: true, print: true, email: true },
  audit: { view: true, export: true },
  permissions: { view: true, edit: true },
  userAccounts: { view: true, manage: true },
  settings: { view: true, edit: true },
};

export const staffPermissions: PermissionMatrix = {
  dashboard: { view: true },
  employees: { view: false, create: false, edit: false, delete: false },
  payroll: { view: false, edit: false, approve: false, export: false },
  schedules: { view: true, edit: false, print: true },
  leave: { view: true, manage: false },
  contacts: { view: true, edit: false },
  reports: { view: false, export: false },
  payslips: { view: true, print: true, email: false },
  audit: { view: false, export: false },
  permissions: { view: false, edit: false },
  userAccounts: { view: false, manage: false },
  settings: { view: false, edit: false },
};

class UserService {
  private getStorage(): UserAccount[] {
    const data = localStorage.getItem(STORAGE_KEY);
    const defaultSuperAdmin: UserAccount[] = [
      {
        id: 'usr-2',
        username: 'superadmin',
        displayName: 'Super Admin',
        email: 'admin@centraldispatch.bm',
        role: 'superadmin',
        status: 'Active',
        createdAt: '2026-01-01'
      }
    ];
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSuperAdmin));
      return defaultSuperAdmin;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSuperAdmin;
    } catch {
      return defaultSuperAdmin;
    }
  }

  private saveStorage(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  public async fetchUsers(): Promise<UserAccount[]> {
    try {
      const res = await apiFetch<{ success: boolean; users: UserAccount[] }>('/users');
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
    // Sync with backend API in background
    apiFetch<{ success: boolean; users: UserAccount[] }>('/users').then(res => {
      if (res && res.success && res.users) {
        this.saveStorage(res.users);
      }
    });

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

    // Sync POST to backend
    try {
      await apiFetch('/users', {
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

      // Sync PATCH to backend and wait for response
      try {
        await apiFetch(`/users/${id}/status`, {
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

  public getPermissions(role: UserRole): PermissionMatrix {
    if (role === 'superadmin' || role === 'admin') {
      return defaultPermissions;
    }
    return staffPermissions;
  }
}

export const userService = new UserService();
