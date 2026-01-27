'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Intern } from '../types';
import { DailyLog } from '../../logs/types';
import { getLogDateKey, parseLocalDate } from '@/lib/date';
import { cloudinaryThumbnail } from '@/lib/cloudinary-thumbnail';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ChevronRight,
  Loader2,
  Eye,
  Flame
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InternDetailModalProps {
  intern: Intern | null;
  isOpen: boolean;
  onClose: () => void;
  onViewLog?: (logId: string) => void;
}

interface InternStats {
  totalLogs: number;
  completeLogs: number;
  incompleteLogs: number;
  totalHours: number;
  attendanceRate: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  currentStreak: number;
  longestStreak: number;
}

export default function InternDetailModal({ intern, isOpen, onClose, onViewLog }: InternDetailModalProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && intern) {
      fetchInternLogs();
    } else {
      setLogs([]);
    }
  }, [isOpen, intern]);

  const fetchInternLogs = async () => {
    if (!intern) return;
    setLoading(true);
    try {
      const response = await api.get(`/logs?internId=${intern._id}&sortBy=newest`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching intern logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo<InternStats>(() => {
    if (logs.length === 0) {
      return {
        totalLogs: 0,
        completeLogs: 0,
        incompleteLogs: 0,
        totalHours: 0,
        attendanceRate: 0,
        onTimeSubmissions: 0,
        lateSubmissions: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    let completeLogs = 0;
    let incompleteLogs = 0;
    let totalMinutes = 0;
    let onTimeSubmissions = 0;
    let lateSubmissions = 0;

    logs.forEach(log => {
      const hasAM = !!log.amLog;
      const hasPM = !!log.pmLog;

      if (hasAM && hasPM) {
        completeLogs++;
        // Calculate hours between AM and PM
        const amTime = new Date(log.amLog!.timestamp);
        const pmTime = new Date(log.pmLog!.timestamp);
        const minutes = differenceInMinutes(pmTime, amTime);
        if (minutes > 0 && minutes < 1440) { // Less than 24 hours
          totalMinutes += minutes;
        }
      } else {
        incompleteLogs++;
      }

      // Count late submissions
      if (log.amLog?.submittedLate) lateSubmissions++;
      else if (hasAM) onTimeSubmissions++;
      
      if (log.pmLog?.submittedLate) lateSubmissions++;
      else if (hasPM) onTimeSubmissions++;
    });

    // Calculate streaks
    const sortedDates = logs
      .map(log => getLogDateKey(log.date))
      .sort((a, b) => b.localeCompare(a)); // newest first

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    // Sort oldest first for streak calculation
    const oldestFirst = [...sortedDates].reverse();
    oldestFirst.forEach(dateKey => {
      const date = parseLocalDate(dateKey);
      if (prevDate) {
        const dayDiff = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = date;
    });

    // Current streak (from most recent date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tempStreak = 0;
    prevDate = null;
    sortedDates.forEach(dateKey => {
      const date = parseLocalDate(dateKey);
      if (prevDate === null) {
        const dayDiff = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 1) {
          tempStreak = 1;
          prevDate = date;
        }
      } else {
        const dayDiff = Math.round((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
          prevDate = date;
        }
      }
    });
    currentStreak = tempStreak;

    const totalSubmissions = onTimeSubmissions + lateSubmissions;

    return {
      totalLogs: logs.length,
      completeLogs,
      incompleteLogs,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      attendanceRate: logs.length > 0 ? Math.round((completeLogs / logs.length) * 100) : 0,
      onTimeSubmissions,
      lateSubmissions,
      currentStreak,
      longestStreak,
    };
  }, [logs]);

  // Recent logs (last 10)
  const recentLogs = useMemo(() => logs.slice(0, 10), [logs]);

  if (!intern) return null;

  const StatCard = ({ icon: Icon, label, value, subValue, color = 'text-macos-blue', bgColor = 'bg-macos-blue/10' }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
    bgColor?: string;
  }) => (
    <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  );

  return (
    <>
      {typeof window !== 'undefined' && isOpen && (
        <>
          {createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
                style={{ zIndex: 100 }}
              />
            </AnimatePresence>,
            document.body
          )}
          {createPortal(
            <AnimatePresence>
              <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 101 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 40 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl max-h-[90vh] bg-[#F2F2F7] rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto"
                >
                  {/* Header */}
                  <div className="px-8 py-6 bg-white/50 backdrop-blur-xl border-b border-black/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-5">
                        {intern.profilePicture ? (
                          <div className="w-20 h-20 rounded-[24px] overflow-hidden border-4 border-white shadow-lg">
                            <img
                              src={cloudinaryThumbnail(intern.profilePicture, 160, 160)}
                              alt={intern.name}
                              className="w-full h-full object-cover object-center"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-[24px] bg-macos-blue/10 flex items-center justify-center border-4 border-white shadow-lg">
                            <User className="w-10 h-10 text-macos-blue" />
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{intern.name}</h2>
                          <p className="text-sm font-semibold text-gray-500 mt-1">{intern.studentId}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-4 h-4 mr-1.5 opacity-60" />
                              {intern.email}
                            </div>
                            {intern.phone && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="w-4 h-4 mr-1.5 opacity-60" />
                                {intern.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2.5 bg-black/5 hover:bg-black/10 rounded-full transition-all"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Company Info */}
                    <div className="mt-4 flex items-center space-x-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="w-4 h-4 mr-2 text-macos-blue" />
                        <span className="font-semibold">{intern.company}</span>
                      </div>
                      {intern.companyAddress && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-2 opacity-60" />
                          <span className="truncate max-w-[300px]">{intern.companyAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-macos-blue animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Stats Grid */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                            Performance Overview
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                              icon={Clock}
                              label="Total Hours"
                              value={stats.totalHours}
                              subValue="Logged work hours"
                              color="text-macos-blue"
                              bgColor="bg-macos-blue/10"
                            />
                            <StatCard
                              icon={TrendingUp}
                              label="Attendance Rate"
                              value={`${stats.attendanceRate}%`}
                              subValue={`${stats.completeLogs} complete logs`}
                              color="text-green-600"
                              bgColor="bg-green-100"
                            />
                            <StatCard
                              icon={CheckCircle2}
                              label="On-Time"
                              value={stats.onTimeSubmissions}
                              subValue="Submissions on time"
                              color="text-green-600"
                              bgColor="bg-green-100"
                            />
                            <StatCard
                              icon={AlertTriangle}
                              label="Late"
                              value={stats.lateSubmissions}
                              subValue="Late submissions"
                              color="text-amber-600"
                              bgColor="bg-amber-100"
                            />
                          </div>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <StatCard
                            icon={FileText}
                            label="Total Logs"
                            value={stats.totalLogs}
                            color="text-gray-600"
                            bgColor="bg-gray-100"
                          />
                          <StatCard
                            icon={XCircle}
                            label="Incomplete"
                            value={stats.incompleteLogs}
                            subValue="Missing AM or PM"
                            color="text-red-500"
                            bgColor="bg-red-100"
                          />
                          <StatCard
                            icon={Flame}
                            label="Current Streak"
                            value={stats.currentStreak}
                            subValue="Consecutive days"
                            color="text-orange-500"
                            bgColor="bg-orange-100"
                          />
                          <StatCard
                            icon={Flame}
                            label="Best Streak"
                            value={stats.longestStreak}
                            subValue="Longest streak"
                            color="text-purple-500"
                            bgColor="bg-purple-100"
                          />
                        </div>

                        {/* Recent Logs Timeline */}
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                            Recent Activity
                          </h3>
                          {recentLogs.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center border border-black/5">
                              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500 font-semibold">No logs submitted yet</p>
                              <p className="text-sm text-gray-400 mt-1">Activity will appear here once the intern submits logs.</p>
                            </div>
                          ) : (
                            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                              {recentLogs.map((log, index) => {
                                const hasAM = !!log.amLog;
                                const hasPM = !!log.pmLog;
                                const isComplete = hasAM && hasPM;
                                const hasLate = log.amLog?.submittedLate || log.pmLog?.submittedLate;
                                const date = parseLocalDate(getLogDateKey(log.date));

                                return (
                                  <div
                                    key={log._id}
                                    className={cn(
                                      "flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors cursor-pointer",
                                      index !== recentLogs.length - 1 && "border-b border-gray-100"
                                    )}
                                    onClick={() => onViewLog?.(log._id)}
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        isComplete ? "bg-green-100" : "bg-amber-100"
                                      )}>
                                        <Calendar className={cn(
                                          "w-5 h-5",
                                          isComplete ? "text-green-600" : "text-amber-600"
                                        )} />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {format(date, 'EEEE, MMM d')}
                                        </p>
                                        <div className="flex items-center space-x-3 mt-1">
                                          <span className={cn(
                                            "text-xs font-semibold",
                                            hasAM ? "text-green-600" : "text-gray-400"
                                          )}>
                                            {hasAM ? `In: ${format(new Date(log.amLog!.timestamp), 'h:mm a')}` : 'No Time In'}
                                          </span>
                                          <span className="text-gray-300">•</span>
                                          <span className={cn(
                                            "text-xs font-semibold",
                                            hasPM ? "text-blue-600" : "text-gray-400"
                                          )}>
                                            {hasPM ? `Out: ${format(new Date(log.pmLog!.timestamp), 'h:mm a')}` : 'No Time Out'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      {hasLate && (
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                          Late
                                        </span>
                                      )}
                                      {isComplete ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                          Complete
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                          Incomplete
                                        </span>
                                      )}
                                      <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* View All Logs Link */}
                        {logs.length > 10 && (
                          <div className="text-center">
                            <a
                              href={`/main/logs?internId=${intern._id}`}
                              className="inline-flex items-center space-x-2 text-sm font-semibold text-macos-blue hover:underline"
                            >
                              <span>View all {logs.length} logs</span>
                              <ChevronRight className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-4 bg-white/30 backdrop-blur-xl border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Registered: {format(new Date(intern.createdAt), 'MMM d, yyyy')}
                    </span>
                    <a
                      href={`/main/logs?internId=${intern._id}`}
                      className="flex items-center space-x-2 px-4 py-2 bg-macos-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View All Logs</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </>
  );
}
