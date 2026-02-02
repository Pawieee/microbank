import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types ---

export interface User {
  username: string;
  role: 'admin' | 'manager' | 'teller'; // You can expand these roles as needed
  full_name: string;
  is_first_login: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateLoginStatus: (updates: Partial<User>) => void;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

interface AuthResponse extends ApiResponse {
  username: string;
  role: 'admin' | 'manager' | 'teller';
  full_name: string;
  is_first_login: boolean;
}

// --- Context Creation ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Check Session on Load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/check', { 
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data: AuthResponse = await res.json();
          if (data.success) {
            setUser({
              username: data.username,
              role: data.role,
              full_name: data.full_name,
              is_first_login: data.is_first_login
            });
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Login Function
  const login = async (username: string, password: string): Promise<boolean> => {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    const data: AuthResponse = await res.json();

    if (data.success) {
      setUser({
        username: data.username,
        role: data.role,
        full_name: data.full_name,
        is_first_login: data.is_first_login
      });
      return true;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  // 3. Logout Function
  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (error) {
      console.error("Logout error", error);
    }
    setUser(null);
  };

  // 4. Update Local State (Helper for the Modal)
  const updateLoginStatus = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateLoginStatus, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook ---

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};