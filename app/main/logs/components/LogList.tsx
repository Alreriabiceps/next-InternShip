'use client';

import { format } from 'date-fns';
import { DailyLog } from '../types';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  Clock,
  ChevronRight 
} from 'lucide-react';
import ListContainer from '@/components/lists/ListContainer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogListProps {
  logs: DailyLog[];
  loading: boolean;
  onView: (logId: string) => void;
  onDelete: (logId: string) => void;
}

export default function LogList({ logs, loading, onView, onDelete }: LogListProps) {
  const StatusBadge = ({ submitted, period }: { submitted: boolean, period: string }) => (
    <div className={cn(
      "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
      submitted 
        ? "bg-green-100 text-green-700" 
        : "bg-gray-100 text-gray-500"
    )}>
      {submitted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
      <span>{period}: {submitted ? 'Submitted' : 'Pending'}</span>
    </div>
  );

  return (
    <ListContainer
      loading={loading && logs.length === 0}
      isEmpty={logs.length === 0}
      emptyMessage="No daily logs have been submitted yet for the selected filters."
      title="Daily Submission History"
    >
      {logs.map((log, index) => (
        <motion.div
          key={log._id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group px-6 py-5 hover:bg-black/[0.02] transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            {/* Left Section - Date & Intern */}
            <div className="flex items-center space-x-5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-macos-blue/10 flex items-center justify-center flex-shrink-0 group-hover:rotate-3 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-macos-blue" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {format(new Date(log.date), 'EEEE, MMMM do')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {format(new Date(log.date), 'yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center text-sm font-semibold text-gray-600">
                  <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  <span>{log.internId.name}</span>
                  <span className="mx-2 opacity-30">•</span>
                  <span className="text-xs font-medium opacity-70">{log.internId.studentId}</span>
                </div>
              </div>
            </div>

            {/* Middle Section - Status Badges */}
            <div className="hidden md:flex items-center space-x-3 px-8">
              <StatusBadge submitted={!!log.amLog} period="AM" />
              <StatusBadge submitted={!!log.pmLog} period="PM" />
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2 ml-6">
              <button
                onClick={() => onView(log._id)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-macos-blue hover:bg-macos-blue/10 rounded-xl transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Details</span>
              </button>
              
              <button
                onClick={() => onDelete(log._id)}
                className="p-2 text-gray-400 hover:text-macos-red hover:bg-macos-red/10 rounded-xl transition-all duration-200"
                title="Delete Log Entry"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              
              <div className="pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </ListContainer>
  );
}
