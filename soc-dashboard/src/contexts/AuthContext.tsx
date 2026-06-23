'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: RegisterData) => { success: boolean; error?: string };
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'soc_users';
const SESSION_KEY = 'soc_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session on mount
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const getUsers = (): Record<string, { password: string; user: User }> => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const login = useCallback((email: string, password: string) => {
    const users = getUsers();
    const record = users[email.trim().toLowerCase()];
    if (!record) return { success: false, error: 'No account found with this email.' };
    if (record.password !== btoa(password)) return { success: false, error: 'Incorrect password.' };
    setUser(record.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
    return { success: true };
  }, []);

  const register = useCallback((data: RegisterData) => {
    const users = getUsers();
    const key = data.email.trim().toLowerCase();
    if (users[key]) return { success: false, error: 'An account with this email already exists.' };
    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      createdAt: new Date().toISOString(),
    };
    users[key] = { password: btoa(data.password), user: newUser };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
