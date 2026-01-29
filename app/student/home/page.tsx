'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { studentApi, type Log } from '@/lib/student-api';
import { format, isToday, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { FileText, Calendar, CheckCircle2, LogIn, LogOut, Clock, Building2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getLogDateKey, parseLocalDate } from '@/lib/date';

interface MergedLog {
  _id: string;
  date: string;
  amLog?: Log['amLog'];
  pmLog?: Log['pmLog'];
}

export default function StudentHomePage() {
  const router = useRouter();
  const { user } = useStudentAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadLogs();
    }
  }, [user?.id]);

  const loadLogs = async () => {
    if (!user?.id) return;
    try {
      const data = await studentApi.getLogs(user.id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergedLogs = useMemo(() => {
    const byDate = new Map<string, Log[]>();
    logs.forEach((l) => {
      const key = getLogDateKey(l.date);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(l);
    });
    const result: MergedLog[] = [];
    byDate.forEach((dateLogs, key) => {
      const first = dateLogs[0]!;
      let amLog = first.amLog;
      let pmLog = first.pmLog;
      for (let i = 1; i < dateLogs.length; i++) {
        const l = dateLogs[i]!;
        if (l.amLog) amLog = l.amLog;
        if (l.pmLog) pmLog = l.pmLog;
      }
      const withBoth = dateLogs.find((l) => l.amLog && l.pmLog);
      const primary = withBoth ?? dateLogs.find((l) => l.pmLog) ?? first;
      result.push({ _id: primary._id, date: key, amLog, pmLog });
    });
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const yesterdayKey = format(subDays(today, 1), 'yyyy-MM-dd');
  const todayLog = useMemo(() => mergedLogs.find((m) => m.date === todayKey), [mergedLogs, todayKey]);
  const yesterdayLog = useMemo(() => mergedLogs.find((m) => m.date === yesterdayKey), [mergedLogs, yesterdayKey]);
  const hasAM = !!todayLog?.amLog;
  const hasPM = !!todayLog?.pmLog;
  const yesterdayPendingPM = !!(yesterdayLog?.amLog && !yesterdayLog?.pmLog);

  const totalLogs = mergedLogs.length;
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekLogs = mergedLogs.filter((m) =>
    isWithinInterval(parseLocalDate(m.date), { start: weekStart, end: weekEnd })
  ).length;
  const completeLogs = mergedLogs.filter((m) => m.amLog && m.pmLog).length;
  const completionRate = totalLogs > 0 ? Math.round((completeLogs / totalLogs) * 100) : 0;

  const historyLogs = useMemo(() => {
    return mergedLogs
      .filter((m) => m.date !== todayKey && m.date !== yesterdayKey)
      .slice(0, 2);
  }, [mergedLogs, todayKey, yesterdayKey]);

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogEntry = (period: 'AM' | 'PM', dateKey?: string) => {
    const isToday = !dateKey || dateKey === todayKey;
    if (isToday && period === 'AM' && hasAM) {
      alert("You've already checked in for today.");
      return;
    }
    if (isToday && period === 'PM' && hasPM) {
      alert("You've already checked out for today.");
      return;
    }
    if (isToday && period === 'AM' && yesterdayPendingPM) {
      alert("Complete yesterday's Check Out before checking in for today.");
      return;
    }
    const params = new URLSearchParams();
    params.set('period', period);
    if (dateKey) {
      params.set('date', dateKey);
    }
    router.push(`/student/log-entry?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-8 pb-12 rounded-b-3xl"
      >
        <div className="flex items-center gap-4 mb-4">
          {user?.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.name}
              width={72}
              height={72}
              className="rounded-full border-2 border-white/30"
            />
          ) : (
            <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold">{user?.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-blue-100 text-sm">{getGreeting()}</p>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-blue-100 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
      </motion.div>

      <div className="px-6 -mt-6">
        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
              <p className="text-xs text-gray-500">Total Logs</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{weekLogs}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Logs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Today's Logs</h2>
            {(hasAM || hasPM) && (
              <button
                onClick={() => router.push('/student/logs')}
                className="text-blue-600 text-sm font-semibold flex items-center gap-1"
              >
                View Details
                <span>→</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">Submit your Check In and Check Out logs</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Check In Card */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogEntry('AM')}
              disabled={!hasAM && yesterdayPendingPM}
              className={`bg-white rounded-xl p-6 border-2 text-left transition-all ${
                hasAM
                  ? 'border-green-300 bg-green-50'
                  : !hasAM && yesterdayPendingPM
                  ? 'opacity-60 cursor-not-allowed border-gray-200'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                hasAM ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {hasAM ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <LogIn className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h3 className={`font-bold text-lg mb-1 ${hasAM ? 'text-green-700' : 'text-blue-600'}`}>
                {hasAM ? 'Checked In ✓' : 'Check In'}
              </h3>
              {hasAM && todayLog?.amLog ? (
                <p className="text-sm text-green-600 font-medium">
                  {format(new Date(todayLog.amLog.timestamp), 'h:mm a')}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Start your shift</p>
              )}
            </motion.button>

            {/* Check Out Card */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLogEntry('PM')}
              className={`bg-white rounded-xl p-6 border-2 text-left transition-all ${
                hasPM
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                hasPM ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {hasPM ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <LogOut className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <h3 className={`font-bold text-lg mb-1 ${hasPM ? 'text-green-700' : 'text-gray-700'}`}>
                {hasPM ? 'Checked Out ✓' : 'Check Out'}
              </h3>
              {hasPM && todayLog?.pmLog ? (
                <p className="text-sm text-green-600 font-medium">
                  {format(new Date(todayLog.pmLog.timestamp), 'h:mm a')}
                </p>
              ) : (
                <p className="text-sm text-gray-500">End your shift</p>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Yesterday Card */}
        {yesterdayLog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 mb-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Yesterday</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(parseLocalDate(yesterdayKey), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                yesterdayLog.amLog ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
              }`}>
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {yesterdayLog.amLog ? 'Checked In ✓' : 'Check In'}
                </span>
              </div>
              {yesterdayLog.pmLog ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Checked Out ✓</span>
                </div>
              ) : yesterdayLog.amLog ? (
                <button
                  onClick={() => handleLogEntry('PM', yesterdayKey)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Check Out</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-500">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Check Out</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent History */}
        {historyLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Recent History</h2>
              </div>
              <button
                onClick={() => router.push('/student/logs')}
                className="text-blue-600 text-sm font-semibold flex items-center gap-1"
              >
                View All
                <span>→</span>
              </button>
            </div>
            <div className="space-y-2">
              {historyLogs.map((log) => {
                const logDate = parseLocalDate(log.date);
                const hasCheckIn = !!log.amLog;
                const hasCheckOut = !!log.pmLog;
                const isComplete = hasCheckIn && hasCheckOut;

                return (
                  <button
                    key={log._id}
                    onClick={() => router.push('/student/logs')}
                    className="w-full bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{format(logDate, 'MMM d')}</p>
                        <p className="text-xs text-gray-500">{format(logDate, 'EEE')}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {hasCheckIn ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm ${hasCheckIn ? 'text-gray-900' : 'text-gray-400'}`}>
                            {hasCheckIn && log.amLog
                              ? format(new Date(log.amLog.timestamp), 'h:mm a')
                              : 'No Check In'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasCheckOut ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm ${hasCheckOut ? 'text-gray-900' : 'text-gray-400'}`}>
                            {hasCheckOut && log.pmLog
                              ? format(new Date(log.pmLog.timestamp), 'h:mm a')
                              : 'No Check Out'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isComplete ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-amber-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Company Card */}
        {user?.company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-4 mb-6 border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user.company}</p>
                {user.companyAddress && (
                  <p className="text-sm text-gray-500">{user.companyAddress}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              Each log requires a photo and your current location. Make sure you're at your
              internship location before submitting.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
