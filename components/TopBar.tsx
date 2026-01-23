'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, User } from 'lucide-react';

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Overview';
    if (path.startsWith('/main/intern')) return 'Intern Profiles';
    if (path.startsWith('/main/logs')) return 'Activity Logs';
    if (path === '/profile') return 'Account Settings';
    return 'Management';
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight transition-all duration-200">
          {getPageTitle(pathname)}
        </h2>
      </div>

      <div className="flex items-center space-x-5">
        <div className="hidden md:flex items-center bg-black/[0.03] rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-macos-blue/30 transition-all border border-black/5">
          <Search className="w-4 h-4 text-gray-400 mr-2.5" />
          <input 
            type="text" 
            placeholder="Quick search..." 
            className="bg-transparent border-none outline-none text-[13px] font-medium w-48 text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-macos-red rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center pl-5 border-l border-black/5">
          <div className="flex items-center space-x-3.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                {user?.name || user?.username || 'Admin'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                Administrator
              </p>
            </div>
            <div className="w-9 h-9 bg-macos-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-macos-blue/20">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
