'use client';

import { format } from 'date-fns';
import { DailyLog } from '../types';
import { getLogDateKey, parseLocalDate } from '@/lib/date';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ChevronRight 
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
}

interface LogListProps {
  logs: DailyLog[];
  loading: boolean;
  onView: (logId: string) => void;
}

export default function LogList({ logs, loading, onView }: LogListProps) {
  const StatusBadge = ({ submitted, period }: { submitted: boolean, period: 'AM' | 'PM' }) => (
    <div className={cn(
      "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
      submitted 
        ? "bg-green-100 text-green-700" 
        : "bg-gray-100 text-gray-500"
    )}>
      {submitted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
      <span>{period === 'AM' ? 'Time In' : 'Time Out'}</span>
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
        });
      });
      result.push({ dateKey, merged: mergedList });
    }
    return result;
  }, [logs]);

  return (
    <ListContainer
      loading={loading && logs.length === 0}
      isEmpty={logs.length === 0}
      emptyMessage="No daily logs have been submitted yet for the selected filters."
      title="Daily Submission History"
    >
      {logsByDate.map((entry, dateIndex) => {
        const date = parseLocalDate(entry.dateKey);
        return (
          <div key={entry.dateKey} className="border-b border-gray-100 last:border-b-0">
            {/* Date Header */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dateIndex * 0.05 }}
              className="px-6 py-4 bg-gray-50/50 border-b border-gray-100"
            >
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-macos-blue/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-macos-blue" />
                </div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {format(date, 'EEEE, MMMM do')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {format(date, 'yyyy')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Student Entries for this Date (one per intern, AM+PM combined) */}
            {entry.merged.map((m, logIndex) => (
              <motion.div
                key={`${m.dateKey}-${m.internId}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dateIndex * 0.05 + logIndex * 0.03 }}
                className="group px-6 py-4 hover:bg-black/[0.02] transition-all duration-200"
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
                    </div>
                  </div>

                  <div className="hidden md:flex items-center space-x-3 px-8">
                    <StatusBadge submitted={!!m.amLog} period="AM" />
                    <StatusBadge submitted={!!m.pmLog} period="PM" />
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
            ))}
          </div>
        );
      })}
    </ListContainer>
  );
}
