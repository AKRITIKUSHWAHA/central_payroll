import React, { createContext, useContext, useState } from 'react';
import { UserAccount, PermissionMatrix } from '../types';
import { userService } from '../services/userService';
import { apiFetch } from '../services/api';

interface AuthContextType {
  currentUser: UserAccount | null;
  permissions: PermissionMatrix;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
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

  const permissions = userService.getPermissions(currentUser?.role || 'superadmin');

  const login = async (username: string, pass: string): Promise<boolean> => {
    const cleanUsername = username.trim();

    // 1. Try API login with backend MySQL database
    try {
      const res = await apiFetch<{ success: boolean; user: UserAccount; error?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password: pass })
      });
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.user));
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
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
        return true;
      }
    }

    // Default superadmin account fallback
    if (cleanUsername.toLowerCase() === 'superadmin' && pass === 'ChangeMe123!') {
      const superAdminUser = users.find(u => u.username.toLowerCase() === 'superadmin') || {
        id: 'usr-2',
        username: 'superadmin',
        displayName: 'Super Admin',
        email: 'admin@centraldispatch.bm',
        role: 'superadmin' as const,
        status: 'Active' as const,
        createdAt: '2026-01-01'
      };
      setCurrentUser(superAdminUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(superAdminUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        login,
        logout,
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
