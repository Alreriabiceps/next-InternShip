'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  _id: string;
  username: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    // Skip if already checked and we have a user
    if (hasChecked && user) {
      setLoading(false);
      return;
    }

    // Skip if already checking
    if (loading && hasChecked) {
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setHasChecked(true);
    } catch (error: any) {
      // 401 is expected when user is not logged in, so we handle it silently
      const isUnauthorized = error.response?.status === 401;
      
      setUser(null);
      setHasChecked(true);
      
      // Only redirect if we're not already on login page and it's an auth error
      if (isUnauthorized && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasChecked) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth }}>
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

