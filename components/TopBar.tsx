'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { cloudinaryThumbnail } from '@/lib/cloudinary-thumbnail';

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Overview';
    if (path.startsWith('/main/intern')) return 'Intern Profiles';
    if (path.startsWith('/main/logs')) return 'Activity Logs';
    if (path.startsWith('/main/calendar')) return 'Calendar View';
    if (path.startsWith('/main/reports')) return 'Reports';
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
        <div className="hidden md:block w-80">
          <GlobalSearch />
        </div>

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
            {user?.profilePicture ? (
              <div className="w-9 h-9 rounded-2xl overflow-hidden border-2 border-macos-blue/20 flex-shrink-0 shadow-lg shadow-macos-blue/20">
                <img
                  src={cloudinaryThumbnail(user.profilePicture, 36, 36)}
                  alt={user.name || user.username || 'Admin'}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="w-9 h-9 bg-macos-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-macos-blue/20">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
