import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { getDemoUser } from '../services/demoFallback';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || 'demo_token_12345';
  });
  const [user, setUser] = useState<User | null>(getDemoUser());
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      setUser(getDemoUser());
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<User>('/api/auth/me');
      if (res.data && res.data.email) {
        setUser(res.data);
      } else {
        setUser(getDemoUser());
      }
    } catch (err: any) {
      setUser(getDemoUser());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const dUser = getDemoUser();
    setUser(dUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(getDemoUser());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
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
