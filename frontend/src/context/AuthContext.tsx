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
    if (!cleanUsername || !pass) return false;

    // 1. Primary Auth: Verify against backend MySQL database
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
        // Update local cache password to match new credentials
        const users = userService.getUsers();
        const found = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.id === res.user.id);
        if (found) {
          found.password = pass;
          userService.saveStorage(users);
        }
        return true;
      }

      // If backend explicitly rejected the login credentials, return false immediately
      if (res && res.success === false) {
        return false;
      }
    } catch (err) {
      console.warn('Backend connection failed, checking offline fallback:', err);
    }

    // 2. Offline Fallback ONLY if backend server is unreachable
    const users = userService.getUsers();
    const found = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (found && found.status === 'Active') {
      const stored = found.password || 'ChangeMe123!';
      if (pass === stored) {
        setCurrentUser(found);
        setPermissions(userService.getPermissions(found.role));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
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
