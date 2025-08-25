'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'member';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || 'http://localhost:4000';
const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'user',
};

async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage and validate token
    const restoreSession = async () => {
      try {
        const savedUser = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.user) : null;
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.token) : null;
        
        if (savedUser && savedToken) {
          const parsed = JSON.parse(savedUser) as User;
          setUser(parsed);
          setToken(savedToken);
          
          // Validate token with backend
          try {
            const resp = await apiRequest('/api/auth/me', {
              method: 'GET',
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            
            if (resp?.user) {
              setUser(resp.user as User);
              localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(resp.user));
            }
          } catch (error) {
            console.log('Token validation failed, clearing session');
            // Token is invalid or expired
            localStorage.removeItem(STORAGE_KEYS.token);
            localStorage.removeItem(STORAGE_KEYS.user);
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear invalid data
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, _role?: string): Promise<boolean> => {
    try {
      const resp = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (resp?.token && resp?.user) {
        localStorage.setItem(STORAGE_KEYS.token, resp.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(resp.user));
        setUser(resp.user as User);
        setToken(resp.token);
        return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    try {
      const resp = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      if (resp?.token && resp?.user) {
        localStorage.setItem(STORAGE_KEYS.token, resp.token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(resp.user));
        setUser(resp.user as User);
        setToken(resp.token);
        return true;
      }
      return false;
    } catch (_e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, signup, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}