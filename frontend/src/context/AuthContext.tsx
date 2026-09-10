import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, PermissionMatrix } from '../types';
import { userService } from '../services/userService';

interface AuthContextType {
  currentUser: UserAccount | null;
  permissions: PermissionMatrix;
  login: (username: string, pass: string) => boolean;
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

  const login = (username: string, pass: string): boolean => {
    const found = userService.getUserByUsername(username);
    if (found && found.status === 'Active') {
      setCurrentUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      return true;
    }
    // Fallback for default temporary password check
    if (username.toLowerCase() === 'superadmin' && pass === 'ChangeMe123!') {
      const superAdminUser = userService.getUsers().find(u => u.username === 'superadmin') || userService.getUsers()[0];
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
