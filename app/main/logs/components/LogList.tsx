'use client';

import { format, isToday, startOfDay } from 'date-fns';
import { DailyLog } from '../types';
import { getLogDateKey, parseLocalDate } from '@/lib/date';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock
} from 'lucide-react';
import ListContainer from '@/components/lists/ListContainer';
import { cloudinaryThumbnail } from '@/lib/cloudinary-thumbnail';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Merged log: one per (date, intern). Combines AM/PM from multiple docs if backend duplicated. */
interface MergedLog {
  dateKey: string;
  internId: string;
  internName: string;
  studentId: string;
  profilePicture?: string;
  amLog?: DailyLog['amLog'];
  pmLog?: DailyLog['pmLog'];
  primaryId: string;   // for Details
  amLate?: boolean;
  pmLate?: boolean;
}

interface LogListProps {
  logs: DailyLog[];
  loading: boolean;
  onView: (logId: string) => void;
}

export default function LogList({ logs, loading, onView }: LogListProps) {
  const StatusBadge = ({ submitted, period, isLate }: { submitted: boolean, period: 'AM' | 'PM', isLate?: boolean }) => (
    <div className={cn(
      "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
      !submitted 
        ? "bg-gray-100 text-gray-500"
        : isLate
        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
        : "bg-green-100 text-green-700"
    )}>
      {!submitted ? (
        <XCircle className="w-3.5 h-3.5 opacity-50" />
      ) : isLate ? (
        <Clock className="w-3.5 h-3.5" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      <span>{period === 'AM' ? 'Time In' : 'Time Out'}</span>
      {isLate && <span className="text-[9px]">(Late)</span>}
    </div>
  );

  // Group by date, then merge by (date, internId) so one row per person per day
  const logsByDate = useMemo(() => {
    const byDate = new Map<string, DailyLog[]>();
    logs.forEach(log => {
      const dateKey = getLogDateKey(log.date);
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)!.push(log);
    });

    const result: { dateKey: string; merged: MergedLog[] }[] = [];
    for (const [dateKey, dateLogs] of Array.from(byDate.entries()).sort((a, b) => b[0].localeCompare(a[0]))) {
      const byIntern = new Map<string, DailyLog[]>();
      dateLogs.forEach(log => {
        const id = (log.internId as { _id?: unknown })._id;
        const internId = id != null ? String(id) : '';
        if (!byIntern.has(internId)) byIntern.set(internId, []);
        byIntern.get(internId)!.push(log);
      });

      const mergedList: MergedLog[] = [];
      byIntern.forEach((internLogs) => {
        const first = internLogs[0]!;
        let amLog = first.amLog;
        let pmLog = first.pmLog;
        for (let i = 1; i < internLogs.length; i++) {
          const l = internLogs[i]!;
          if (l.amLog) amLog = l.amLog;
          if (l.pmLog) pmLog = l.pmLog;
        }
        const withBoth = internLogs.find(l => l.amLog && l.pmLog);
        const primary = withBoth ?? internLogs.find(l => l.pmLog) ?? first;
        const intern = first.internId as { _id?: unknown; name?: string; studentId?: string; profilePicture?: string };
        mergedList.push({
          dateKey,
          internId: intern._id != null ? String(intern._id) : '',
          internName: intern.name ?? 'Unknown',
          studentId: intern.studentId ?? '',
          profilePicture: intern.profilePicture,
          amLog,
          pmLog,
          primaryId: primary._id,
          amLate: amLog?.submittedLate,
          pmLate: pmLog?.submittedLate,
        });
      });
      result.push({ dateKey, merged: mergedList });
    }
    return result;
  }, [logs]);

  // Track which date groups are expanded - today is expanded by default, past dates collapsed
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Initialize expanded state when logs change - expand today, collapse past
  useEffect(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const initialExpanded = new Set<string>();
    
    logsByDate.forEach(entry => {
      const entryDate = parseLocalDate(entry.dateKey);
      if (isToday(entryDate)) {
        initialExpanded.add(entry.dateKey);
      }
    });
    
    // If no today entry, expand the most recent date
    if (initialExpanded.size === 0 && logsByDate.length > 0) {
      initialExpanded.add(logsByDate[0].dateKey);
    }
    
    setExpandedDates(initialExpanded);
  }, [logsByDate]);

  const toggleDateExpanded = (dateKey: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  return (
    <ListContainer
      loading={loading && logs.length === 0}
      isEmpty={logs.length === 0}
      emptyMessage="No daily logs have been submitted yet for the selected filters."
      title="Daily Submission History"
    >
      {logsByDate.map((entry, dateIndex) => {
        const date = parseLocalDate(entry.dateKey);
        const isTodayDate = isToday(date);
        const isExpanded = expandedDates.has(entry.dateKey);
        const entryCount = entry.merged.length;
        
        return (
          <div key={entry.dateKey} className="border-b border-gray-100 last:border-b-0">
            {/* Date Header - Clickable */}
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIndex * 0.05 }}
              onClick={() => toggleDateExpanded(entry.dateKey)}
              className={cn(
                "w-full px-6 py-4 flex items-center justify-between transition-colors",
                isTodayDate ? "bg-macos-blue/5" : "bg-gray-50/50",
                "hover:bg-black/[0.03]"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isTodayDate ? "bg-macos-blue text-white" : "bg-macos-blue/10"
                )}>
                  <Calendar className={cn("w-5 h-5", isTodayDate ? "text-white" : "text-macos-blue")} />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {isTodayDate ? 'Today' : format(date, 'EEEE, MMMM do')}
                  </h3>
                  {isTodayDate && (
                    <span className="text-sm font-medium text-gray-500">
                      {format(date, 'MMMM do')}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {format(date, 'yyyy')}
                  </span>
                  {isTodayDate && (
                    <span className="px-2 py-0.5 rounded-md bg-macos-blue text-white text-[10px] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-gray-500">
                  {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </motion.button>

            {/* Student Entries for this Date (one per intern, AM+PM combined) - Collapsible */}
            <AnimatePresence initial={false}>
              {isExpanded && entry.merged.map((m, logIndex) => {
              const hasLateSubmission = m.amLate || m.pmLate;
              return (
                <motion.div
                  key={`${m.dateKey}-${m.internId}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "group px-6 py-4 hover:bg-black/[0.02] transition-all duration-200 overflow-hidden",
                    hasLateSubmission && "bg-amber-50/50 border-l-4 border-l-amber-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex items-center text-sm font-semibold text-gray-600 flex-1 min-w-0">
                        {m.profilePicture ? (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-macos-blue/20 mr-1.5 flex-shrink-0">
                            <img
                              src={cloudinaryThumbnail(m.profilePicture, 24, 24)}
                              alt={m.internName}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        ) : (
                          <User className="w-3.5 h-3.5 mr-1.5 opacity-70 flex-shrink-0" />
                        )}
                        <span className="truncate">{m.internName}</span>
                        <span className="mx-2 opacity-30 flex-shrink-0">•</span>
                        <span className="text-xs font-medium opacity-70 truncate">{m.studentId}</span>
                        {hasLateSubmission && (
                          <span className="ml-3 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Late</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-3 px-8">
                      <StatusBadge submitted={!!m.amLog} period="AM" isLate={m.amLate} />
                      <StatusBadge submitted={!!m.pmLog} period="PM" isLate={m.pmLate} />
                    </div>

                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => onView(m.primaryId)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-macos-blue hover:bg-macos-blue/10 rounded-xl transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                      <div className="pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        );
      })}
    </ListContainer>
  );
}
