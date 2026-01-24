'use client';

import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F6F6F6]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-macos-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 animate-pulse uppercase tracking-widest">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F6F6F6] text-gray-900 font-sans overflow-hidden select-none">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="p-8 max-w-[1600px] mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
          {/* Subtle Glass Reflection Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/20 rounded-none z-50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
        </main>

        <Footer />
      </div>
    </div>
  );
}
