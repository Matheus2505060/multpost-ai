'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/supabase';
import { robustFetch, handleApiError, logError } from '@/lib/errorHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await robustFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro no login' };
      }
    } catch (error) {
      logError(error, 'AuthProvider.login', { email });
      return { success: false, error: handleApiError(error) };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await robustFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro no cadastro' };
      }
    } catch (error) {
      logError(error, 'AuthProvider.signup', { name, email });
      return { success: false, error: handleApiError(error) };
    }
  };

  const logout = async () => {
    try {
      await robustFetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      logError(error, 'AuthProvider.logout');
    } finally {
      setUser(null);
      // Usar replace para evitar problemas de navegação
      window.location.replace('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await robustFetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Se não conseguir buscar o usuário, limpar estado
        setUser(null);
      }
    } catch (error) {
      logError(error, 'AuthProvider.refreshUser');
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (isMounted) {
          await refreshUser();
        }
      } catch (error) {
        logError(error, 'AuthProvider.initAuth');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      refreshUser,
    }}>
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