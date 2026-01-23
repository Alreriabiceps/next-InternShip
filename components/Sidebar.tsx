'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Interns', href: '/main/intern', icon: Users },
  { name: 'Daily Logs', href: '/main/logs', icon: ClipboardList },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/profile', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen flex flex-col mac-sidebar sticky top-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-10 pl-1">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="InternShip" 
              fill 
              className="object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            InternShip
          </h1>
        </div>

        <nav className="space-y-1.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-3">
            Navigation
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-4 py-2.5 text-[14px] font-semibold rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-macos-blue text-white shadow-md shadow-macos-blue/25" 
                    : "text-gray-600 hover:bg-black/5"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"
                  )} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>

        <nav className="mt-10 space-y-1.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-3">
            Account
          </div>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-4 py-2.5 text-[14px] font-semibold rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-macos-blue text-white shadow-md shadow-macos-blue/25" 
                    : "text-gray-600 hover:bg-black/5"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-700"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-black/5">
        <button
          onClick={async () => {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) window.location.href = '/login';
          }}
          className="group flex w-full items-center px-4 py-3 text-[14px] font-bold text-macos-red hover:bg-macos-red/5 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
