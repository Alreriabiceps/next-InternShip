'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { studentApi, type Log } from '@/lib/student-api';
import { format, subDays } from 'date-fns';
import { FileText, CheckCircle2, Flame, LogIn, LogOut, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getLogDateKey, parseLocalDate } from '@/lib/date';

interface MergedLog {
  _id: string;
  date: string;
  amLog?: Log['amLog'];
  pmLog?: Log['pmLog'];
}

const INITIAL_HISTORY_COUNT = 3;
const LOAD_MORE_COUNT = 5;

export default function StudentLogsPage() {
  const router = useRouter();
  const { user } = useStudentAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyDisplayCount, setHistoryDisplayCount] = useState(INITIAL_HISTORY_COUNT);

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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHistoryDisplayCount(INITIAL_HISTORY_COUNT);
    loadLogs();
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
  const yesterdayPendingPM = !!(yesterdayLog?.amLog && !yesterdayLog?.pmLog);

  const actionableLogs = useMemo(() => {
    const items: { dateKey: string; label: string; log?: MergedLog }[] = [
      { dateKey: todayKey, label: 'Today', log: todayLog },
      { dateKey: yesterdayKey, label: 'Yesterday', log: yesterdayLog },
    ];
    return items;
  }, [todayKey, yesterdayKey, todayLog, yesterdayLog]);

  const historyLogs = useMemo(() => {
    return mergedLogs.filter((m) => m.date !== todayKey && m.date !== yesterdayKey);
  }, [mergedLogs, todayKey, yesterdayKey]);

  const displayedHistoryLogs = useMemo(() => {
    return historyLogs.slice(0, historyDisplayCount);
  }, [historyLogs, historyDisplayCount]);

  const hasMoreHistory = historyLogs.length > historyDisplayCount;

  const handleLoadMore = () => {
    setHistoryDisplayCount((prev) => prev + LOAD_MORE_COUNT);
  };

  const totalLogs = mergedLogs.length;
  const completeLogs = mergedLogs.filter((m) => m.amLog && m.pmLog).length;
  const completionRate = totalLogs > 0 ? Math.round((completeLogs / totalLogs) * 100) : 0;

  const currentStreak = useMemo(() => {
    if (mergedLogs.length === 0) return 0;
    const byDate = new Map<string, MergedLog>();
    mergedLogs.forEach((m) => {
      if (m.amLog && m.pmLog) byDate.set(m.date, m);
    });
    if (byDate.size === 0) return 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    if (!byDate.has(todayKey)) checkDate = subDays(checkDate, 1);
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(checkDate, 'yyyy-MM-dd');
      if (byDate.has(d)) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return count;
  }, [mergedLogs, todayKey]);

  const getWorkDuration = (log: MergedLog) => {
    if (!log.amLog || !log.pmLog) return null;
    const amTime = new Date(log.amLog.timestamp);
    const pmTime = new Date(log.pmLog.timestamp);
    const hours = Math.floor((pmTime.getTime() - amTime.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((pmTime.getTime() - amTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const handleLogPress = (log: MergedLog, period: 'AM' | 'PM') => {
    const logData = period === 'AM' ? log.amLog : log.pmLog;
    if (!logData) return;
    router.push(`/student/logs/${log._id}?period=${period}`);
  };

  const handleLogEntryNavigate = (period: 'AM' | 'PM', dateKey?: string) => {
    const isToday = !dateKey || dateKey === todayKey;
    if (isToday && period === 'AM' && yesterdayPendingPM) {
      router.push('/student/home');
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
          <p className="text-gray-600">Loading logs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentStreak}</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
        </div>
      </motion.div>

      {/* Actionable Logs (Today/Yesterday) */}
      <div className="space-y-4 mb-6">
        {actionableLogs.map((item) => {
          const { dateKey, label, log } = item;
          const logDate = parseLocalDate(dateKey);
          const hasAM = !!log?.amLog;
          const hasPM = !!log?.pmLog;
          const isComplete = hasAM && hasPM;
          const workDuration = log ? getWorkDuration(log) : null;
          const locationAddress = log?.amLog?.location?.address || log?.pmLog?.location?.address;
          const isToday = dateKey === todayKey;
          const canSubmitAM = isToday ? !yesterdayPendingPM : true;
          const canSubmitPM = true;

          const onAMPress = () => {
            if (hasAM && log) handleLogPress(log, 'AM');
            else if (canSubmitAM) handleLogEntryNavigate('AM', isToday ? undefined : dateKey);
          };
          const onPMPress = () => {
            if (hasPM && log) handleLogPress(log, 'PM');
            else if (canSubmitPM) handleLogEntryNavigate('PM', isToday ? undefined : dateKey);
          };

          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{format(logDate, 'MMMM d, yyyy')}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
                {isComplete && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-600">Complete</span>
                  </div>
                )}
              </div>
              {locationAddress && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <span>📍</span>
                  <span className="truncate">{locationAddress}</span>
                </div>
              )}
              {workDuration && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{workDuration.hours}h {workDuration.minutes}m</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <button
                  onClick={onAMPress}
                  disabled={!hasAM && !canSubmitAM}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    hasAM
                      ? 'bg-green-50 hover:bg-green-100'
                      : canSubmitAM
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {hasAM && log?.amLog?.imageUrl ? (
                      <Image
                        src={log.amLog.imageUrl}
                        alt="Check In"
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        hasAM ? 'bg-green-200' : 'bg-gray-200'
                      }`}>
                        {hasAM ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <LogIn className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`text-sm font-medium ${hasAM ? 'text-green-700' : 'text-gray-600'}`}>
                        Check In
                      </p>
                      {hasAM && log?.amLog && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.amLog.timestamp), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  {(hasAM || canSubmitAM) && <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>
                <button
                  onClick={onPMPress}
                  disabled={!hasPM && !canSubmitPM}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    hasPM
                      ? 'bg-green-50 hover:bg-green-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {hasPM && log?.pmLog?.imageUrl ? (
                      <Image
                        src={log.pmLog.imageUrl}
                        alt="Check Out"
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        hasPM ? 'bg-green-200' : 'bg-gray-200'
                      }`}>
                        {hasPM ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <LogOut className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`text-sm font-medium ${hasPM ? 'text-green-700' : 'text-gray-600'}`}>
                        Check Out
                      </p>
                      {hasPM && log?.pmLog && (
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.pmLog.timestamp), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  {(hasPM || canSubmitPM) && <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* History Section */}
      {historyLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">History</h2>
            </div>
            <span className="text-sm text-gray-500">{historyLogs.length} logs</span>
          </div>
          <div className="space-y-2 mb-4">
            {displayedHistoryLogs.map((log) => {
              const logDate = parseLocalDate(log.date);
              const hasAM = !!log.amLog;
              const hasPM = !!log.pmLog;
              const isComplete = hasAM && hasPM;
              const workDuration = getWorkDuration(log);
              const locationAddress = log.amLog?.location?.address || log.pmLog?.location?.address;

              const onAMPress = () => {
                if (hasAM) handleLogPress(log, 'AM');
              };
              const onPMPress = () => {
                if (hasPM) handleLogPress(log, 'PM');
              };

              return (
                <div
                  key={log._id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{format(logDate, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-500">{format(logDate, 'EEEE')}</p>
                    </div>
                    {isComplete ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-lg">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-600">Incomplete</span>
                      </div>
                    )}
                  </div>
                  {locationAddress && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <span>📍</span>
                      <span className="truncate">{locationAddress}</span>
                    </div>
                  )}
                  {workDuration && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{workDuration.hours}h {workDuration.minutes}m</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex gap-3">
                    <button
                      onClick={onAMPress}
                      disabled={!hasAM}
                      className={`flex-1 flex items-center gap-2 p-2 rounded-lg text-sm ${
                        hasAM
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {hasAM ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {hasAM && log.amLog
                          ? format(new Date(log.amLog.timestamp), 'h:mm a')
                          : 'No Check In'}
                      </span>
                      {hasAM && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                    <button
                      onClick={onPMPress}
                      disabled={!hasPM}
                      className={`flex-1 flex items-center gap-2 p-2 rounded-lg text-sm ${
                        hasPM
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {hasPM ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {hasPM && log.pmLog
                          ? format(new Date(log.pmLog.timestamp), 'h:mm a')
                          : 'No Check Out'}
                      </span>
                      {hasPM && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMoreHistory && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 bg-white border border-blue-200 rounded-lg text-blue-600 font-semibold flex items-center justify-center gap-2 hover:bg-blue-50"
            >
              <span>View More ({Math.min(LOAD_MORE_COUNT, historyLogs.length - historyDisplayCount)} more)</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold mb-2">No logs to show</p>
          <p className="text-sm text-gray-500">Today and yesterday will appear here</p>
        </div>
      )}
    </div>
  );
}
