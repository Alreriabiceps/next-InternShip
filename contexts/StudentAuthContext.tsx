'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { studentApi, type Intern, type LoginResponse } from '@/lib/student-api';
import { getStudentToken, setStudentToken, clearStudentToken, getStudentUser, setStudentUser, clearStudentUser } from '@/lib/student-storage';

interface StudentAuthContextType {
  user: Intern | null;
  loading: boolean;
  login: (studentId: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocally: (updates: Partial<Intern>) => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Intern | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = getStudentToken();
      const storedUser = getStudentUser();

      if (token && storedUser) {
        // Try to refresh user data from server
        try {
          const response = await studentApi.getCurrentUser();
          if (response.success && response.intern) {
            setUser(response.intern);
            setStudentUser(response.intern);
          } else {
            // Token might be invalid, clear everything
            clearAuth();
          }
        } catch (error) {
          // If refresh fails, use stored user but mark as potentially stale
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    clearStudentToken();
    clearStudentUser();
    setUser(null);
  };

  const login = async (studentId: string, password: string): Promise<LoginResponse> => {
    const response = await studentApi.login(studentId, password);
    
    if (response.success && response.token) {
      setStudentToken(response.token);
      const internData = {
        id: response.intern.id,
        name: response.intern.name,
        email: response.intern.email,
        studentId: response.intern.studentId,
        company: response.intern.company,
        companyAddress: response.intern.companyAddress,
        mustChangePassword: response.intern.mustChangePassword,
        profilePicture: response.intern.profilePicture || null,
      };
      setStudentUser(internData);
      setUser(internData);
    }
    
    return response;
  };

  const logout = async () => {
    clearAuth();
    router.push('/student/login');
  };

  const refreshUser = async () => {
    if (!user?.studentId) return;
    
    try {
      const response = await studentApi.getCurrentUser();
      if (response.success && response.intern) {
        setUser(response.intern);
        setStudentUser(response.intern);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateUserLocally = (updates: Partial<Intern>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setStudentUser(updatedUser);
  };

  // Redirect to login if not authenticated and not on login/setup pages
  useEffect(() => {
    if (!loading && !user && pathname?.startsWith('/student') && pathname !== '/student/login' && pathname !== '/student/first-login-setup') {
      router.push('/student/login');
    }
  }, [loading, user, pathname, router]);

  return (
    <StudentAuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateUserLocally }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
}
