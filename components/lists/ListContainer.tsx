'use client';

import { ReactNode, Children } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ListContainerProps {
  children: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  isEmpty?: boolean;
  className?: string;
  title?: string;
}

export default function ListContainer({
  children,
  loading = false,
  emptyMessage,
  emptyAction,
  isEmpty = false,
  className = '',
  title,
}: ListContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-macos-blue animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">Loading records...</p>
        </div>
      );
    }

    if (emptyMessage && (isEmpty || Children.count(children) === 0)) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No data found</h3>
          <p className="text-sm text-gray-500 max-w-[200px]">{emptyMessage}</p>
          {emptyAction && <div className="mt-6">{emptyAction}</div>}
        </div>
      );
    }

    return (
      <div className="divide-y divide-black/5">
        {children}
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "mac-card overflow-hidden",
        className
      )}
    >
      {title && (
        <div className="px-6 py-4 border-b border-black/5 bg-black/[0.02]">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      {renderContent()}
    </motion.div>
  );
}
