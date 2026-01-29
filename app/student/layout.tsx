'use client';

import { StudentAuthProvider } from '@/contexts/StudentAuthContext';
import BottomNav from '@/components/student/BottomNav';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentAuthProvider>
      <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset-bottom no-bounce">
        <div className="safe-area-inset-top">
          {children}
        </div>
      </div>
      <BottomNav />
    </StudentAuthProvider>
  );
}
