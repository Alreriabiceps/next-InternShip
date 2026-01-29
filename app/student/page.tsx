'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';

export default function StudentPage() {
  const router = useRouter();
  const { user, loading } = useStudentAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/student/home');
      } else {
        router.replace('/student/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
