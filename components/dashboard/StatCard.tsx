'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string | number;
  href?: string;
  icon?: React.ElementType;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export default function StatCard({
  title,
  value,
  href,
  icon: Icon,
  trend,
  trendType = 'positive',
  className = '',
}: StatCardProps) {
  const CardContent = () => (
    <div className="relative overflow-hidden p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
          "bg-macos-blue/10 text-macos-blue"
        )}>
          {Icon ? <Icon className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
        </div>
        {href && (
          <div className="text-gray-400 group-hover:text-macos-blue transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">
          {title}
        </h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trendType === 'positive' && "bg-green-100 text-green-700",
              trendType === 'negative' && "bg-red-100 text-red-700",
              trendType === 'neutral' && "bg-gray-100 text-gray-700"
            )}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-macos-blue/5 rounded-full blur-3xl" />
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group mac-card hover:shadow-mac-hover transition-all duration-300 cursor-pointer",
            className
          )}
        >
          <CardContent />
        </motion.div>
      </Link>
    );
  }

  return (
    <div className={cn("mac-card transition-all duration-300", className)}>
      <CardContent />
    </div>
  );
}
