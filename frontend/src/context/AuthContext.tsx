import React, { createContext, useContext, useState } from 'react';
import { UserAccount, PermissionMatrix } from '../types';
import { userService } from '../services/userService';
import { apiFetch } from '../services/api';

interface AuthContextType {
  currentUser: UserAccount | null;
  permissions: PermissionMatrix;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  refreshPermissions: () => void;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'cdl_current_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [permissions, setPermissions] = useState<PermissionMatrix>(() =>
    userService.getPermissions(currentUser?.role || 'superadmin')
  );

  const refreshPermissions = () => {
    setPermissions(userService.getPermissions(currentUser?.role || 'superadmin'));
  };

  const login = async (username: string, pass: string): Promise<boolean> => {
    const cleanUsername = username.trim();

    // 1. Try API login with backend MySQL database
    try {
      const res = await apiFetch<{ success: boolean; user: UserAccount; token?: string; error?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password: pass })
      });
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setPermissions(userService.getPermissions(res.user.role));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
        if (res.token) {
          localStorage.setItem('cdl_token', res.token);
        }
        return true;
      }
    } catch (err) {
      console.warn('API login failed, checking local fallback:', err);
    }

    // 2. Check LocalStorage fallback
    const users = userService.getUsers();
    const found = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (found) {
      if (found.status !== 'Active') {
        return false;
      }
      const expectedPassword = found.password || 'ChangeMe123!';
      if (pass === expectedPassword) {
        setCurrentUser(found);
        setPermissions(userService.getPermissions(found.role));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
        return true;
      }
    }

    // 3. Guaranteed initial role fallbacks
    const normalized = cleanUsername.toLowerCase();
    if (pass === 'ChangeMe123!' || pass === 'ChangeMe123') {
      if (normalized === 'admin') {
        const adminUser: UserAccount = {
          id: 'usr-1',
          username: 'admin',
          displayName: 'Administrator',
          email: 'operations@centraldispatch.bm',
          role: 'admin',
          status: 'Active',
          createdAt: '2026-01-01'
        };
        setCurrentUser(adminUser);
        setPermissions(userService.getPermissions('admin'));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        return true;
      }
      if (normalized === 'staff') {
        const staffUser: UserAccount = {
          id: 'usr-3',
          username: 'staff',
          displayName: 'Staff',
          email: 'staff@centraldispatch.bm',
          role: 'staff',
          status: 'Active',
          createdAt: '2026-01-01'
        };
        setCurrentUser(staffUser);
        setPermissions(userService.getPermissions('staff'));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(staffUser));
        return true;
      }
      if (normalized === 'superadmin') {
        const superAdminUser: UserAccount = {
          id: 'usr-2',
          username: 'superadmin',
          displayName: 'Super Admin',
          email: 'admin@centraldispatch.bm',
          role: 'superadmin',
          status: 'Active',
          createdAt: '2026-01-01'
        };
        setCurrentUser(superAdminUser);
        setPermissions(userService.getPermissions('superadmin'));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(superAdminUser));
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('cdl_token');
    setPermissions(userService.getPermissions('superadmin'));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        login,
        logout,
        refreshPermissions,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
