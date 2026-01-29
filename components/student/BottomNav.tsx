'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  
  // Hide on login and setup pages
  if (pathname === '/student/login' || pathname === '/student/first-login-setup') {
    return null;
  }

  const navItems = [
    { href: '/student/home', icon: Home, label: 'Home' },
    { href: '/student/logs', icon: FileText, label: 'Logs' },
    { href: '/student/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom shadow-lg">
      <div className="flex justify-around items-center h-16 px-2 safe-area-inset-left safe-area-inset-right">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/student/home' && pathname === '/student');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors touch-target ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
