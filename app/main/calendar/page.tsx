'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, eachWeekOfInterval, isSameWeek, addWeeks, subWeeks, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, User, Clock, CheckCircle2, ExternalLink, Sun, Moon, MapPin, Search, Filter, ChevronDown, TrendingUp, TrendingDown, Minus, Grid3x3, Calendar, Building2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyLog } from '../logs/types';
import { getLogDateKey } from '@/lib/date';

interface Intern {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  company?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [prevMonthLogs, setPrevMonthLogs] = useState<DailyLog[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Fetch interns for filtering
  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const response = await api.get('/interns');
        setInterns(response.data.interns || []);
      } catch (error) {
        console.error('Error fetching interns:', error);
      }
    };
    fetchInterns();
  }, []);

  // Fetch logs for current and previous month
  useEffect(() => {
    fetchLogsForPeriod();
  }, [currentDate, viewMode, selectedIntern, completionFilter]);

  const fetchLogsForPeriod = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;
      
      if (viewMode === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      }

      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString().split('T')[0]);
      params.append('endDate', endDate.toISOString().split('T')[0]);
      
      if (selectedIntern !== 'all') {
        params.append('internId', selectedIntern);
      }
      
      if (completionFilter === 'complete') {
        params.append('status', 'complete');
      } else if (completionFilter === 'incomplete') {
        params.append('status', 'incomplete');
      }

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs || []);

      // Fetch previous month for comparison
      const prevStart = startOfMonth(subMonths(currentDate, 1));
      const prevEnd = endOfMonth(subMonths(currentDate, 1));
      const prevParams = new URLSearchParams();
      prevParams.append('startDate', prevStart.toISOString().split('T')[0]);
      prevParams.append('endDate', prevEnd.toISOString().split('T')[0]);
      
      if (selectedIntern !== 'all') {
        prevParams.append('internId', selectedIntern);
      }
      
      const prevResponse = await api.get(`/logs?${prevParams.toString()}`);
      setPrevMonthLogs(prevResponse.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Organize logs by date
  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyLog[]>();
    logs.forEach(log => {
      const dateStr = getLogDateKey(log.date);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(log);
    });
    return map;
  }, [logs]);

  // Calculate completion rate and stats for a date
  const getDateStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateLogs = logsByDate.get(dateStr) || [];
    
    if (dateLogs.length === 0) {
      return {
        count: 0,
        complete: 0,
        incomplete: 0,
        completionRate: 0,
        hasAM: false,
        hasPM: false,
        companies: new Set<string>(),
        missingInterns: [] as string[]
      };
    }

    const complete = dateLogs.filter(log => log.amLog && log.pmLog).length;
    const incomplete = dateLogs.length - complete;
    const hasAM = dateLogs.some(log => log.amLog);
    const hasPM = dateLogs.some(log => log.pmLog);
    
    const companies = new Set<string>();
    dateLogs.forEach(log => {
      if (log.internId && (log.internId as any).company) {
        companies.add((log.internId as any).company);
      }
    });

    // Find missing interns (if filtering by intern, this will be empty)
    const loggedInternIds = new Set(dateLogs.map(log => log.internId._id));
    const missingInterns = selectedIntern === 'all' 
      ? interns.filter(intern => !loggedInternIds.has(intern._id)).map(i => i.name)
      : [];

    return {
      count: dateLogs.length,
      complete,
      incomplete,
      completionRate: dateLogs.length > 0 ? (complete / dateLogs.length) * 100 : 0,
      hasAM,
      hasPM,
      companies: Array.from(companies),
      missingInterns: missingInterns.slice(0, 5) // Limit to 5 for tooltip
    };
  };

  // Calculate heatmap intensity (0-1) based on completion rate
  const getHeatmapIntensity = (date: Date): number => {
    const stats = getDateStats(date);
    if (stats.count === 0) return 0;
    return stats.completionRate / 100;
  };

  // Calculate streaks for each intern
  const calculateStreaks = useMemo(() => {
    const internStreaks = new Map<string, { current: number; longest: number; dates: Date[] }>();
    
    const allDates = viewMode === 'month' 
      ? eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
      : eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) });

    interns.forEach(intern => {
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const streakDates: Date[] = [];

      allDates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const hasLog = logsByDate.get(dateStr)?.some(log => log.internId._id === intern._id);
        
        if (hasLog) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          if (isSameDay(date, new Date()) || date < new Date()) {
            currentStreak = tempStreak;
            streakDates.push(date);
          }
        } else {
          tempStreak = 0;
        }
      });

      internStreaks.set(intern._id, { current: currentStreak, longest: longestStreak, dates: streakDates });
    });

    return internStreaks;
  }, [logs, interns, logsByDate, currentDate, viewMode, interns]);

  // Monthly summary statistics
  const monthlyStats = useMemo(() => {
    const allDates = eachDayOfInterval({ 
      start: startOfMonth(currentDate), 
      end: endOfMonth(currentDate) 
    });

    let totalDays = 0;
    let totalLogs = 0;
    let totalComplete = 0;
    const dailyRates: number[] = [];

    allDates.forEach(date => {
      const stats = getDateStats(date);
      if (stats.count > 0) {
        totalDays++;
        totalLogs += stats.count;
        totalComplete += stats.complete;
        dailyRates.push(stats.completionRate);
      }
    });

    const avgCompletionRate = dailyRates.length > 0 
      ? dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length 
      : 0;

    // Previous month comparison
    const prevAllDates = eachDayOfInterval({ 
      start: startOfMonth(subMonths(currentDate, 1)), 
      end: endOfMonth(subMonths(currentDate, 1)) 
    });

    let prevTotalLogs = 0;
    let prevTotalComplete = 0;
    const prevDailyRates: number[] = [];

    prevMonthLogs.forEach(log => {
      const dateStr = getLogDateKey(log.date);
      if (prevAllDates.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
        prevTotalLogs++;
        if (log.amLog && log.pmLog) prevTotalComplete++;
      }
    });

    prevAllDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dateLogs = prevMonthLogs.filter(log => getLogDateKey(log.date) === dateStr);
      if (dateLogs.length > 0) {
        const complete = dateLogs.filter(log => log.amLog && log.pmLog).length;
        prevDailyRates.push((complete / dateLogs.length) * 100);
      }
    });

    const prevAvgCompletionRate = prevDailyRates.length > 0 
      ? prevDailyRates.reduce((a, b) => a + b, 0) / prevDailyRates.length 
      : 0;

    const logsTrend = prevTotalLogs > 0 ? ((totalLogs - prevTotalLogs) / prevTotalLogs) * 100 : 0;
    const completionTrend = prevAvgCompletionRate > 0 
      ? avgCompletionRate - prevAvgCompletionRate 
      : 0;

    return {
      totalDays,
      totalLogs,
      totalComplete,
      avgCompletionRate,
      prevTotalLogs,
      prevTotalComplete,
      prevAvgCompletionRate,
      logsTrend,
      completionTrend
    };
  }, [logs, prevMonthLogs, currentDate]);

  const getDateLogs = (date: Date): DailyLog[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logsByDate.get(dateStr) || [];
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewAllLogs = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    router.push(`/main/logs?startDate=${dateStr}&endDate=${dateStr}`);
  };

  const selectedDateLogs = selectedDate ? getDateLogs(selectedDate) : [];

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    let filtered = selectedDateLogs;

    if (statusFilter === 'complete') {
      filtered = filtered.filter(log => log.amLog && log.pmLog);
    } else if (statusFilter === 'incomplete') {
      filtered = filtered.filter(log => !log.amLog || !log.pmLog);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.internId.name.toLowerCase().includes(query) ||
        log.internId.email.toLowerCase().includes(query) ||
        log.internId.studentId.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedDateLogs, statusFilter, searchQuery]);

  const summaryStats = useMemo(() => {
    const total = selectedDateLogs.length;
    const complete = selectedDateLogs.filter(log => log.amLog && log.pmLog).length;
    const incomplete = total - complete;
    const amOnly = selectedDateLogs.filter(log => log.amLog && !log.pmLog).length;
    const pmOnly = selectedDateLogs.filter(log => !log.amLog && log.pmLog).length;
    
    return { total, complete, incomplete, amOnly, pmOnly };
  }, [selectedDateLogs]);

  const displayedLogs = filteredLogs.slice(0, displayLimit);
  const hasMore = filteredLogs.length > displayLimit;

  useEffect(() => {
    if (selectedDate) {
      setDisplayLimit(10);
      setSearchQuery('');
      setStatusFilter('all');
    }
  }, [selectedDate]);

  // Week view calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month view calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatTrend = (value: number) => {
    const abs = Math.abs(value);
    return `${value >= 0 ? '+' : ''}${abs.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <CalendarIcon className="w-8 h-8 mr-3 text-macos-blue" />
            Calendar View
          </h1>
          <p className="text-gray-500 mt-1">Visual attendance tracking and log submissions by date.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
            className="mac-button-secondary flex items-center gap-2"
          >
            {viewMode === 'month' ? <Grid3x3 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            {viewMode === 'month' ? 'Week View' : 'Month View'}
          </button>
        </div>
      </div>

      {/* Monthly Summary Card */}
      {viewMode === 'month' && (
        <div className="mac-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Days with Logs</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats.totalDays}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                {getTrendIcon(monthlyStats.logsTrend)}
                <span>{formatTrend(monthlyStats.logsTrend)} vs last month</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Logs</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats.totalLogs}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                {getTrendIcon(monthlyStats.logsTrend)}
                <span>{formatTrend(monthlyStats.logsTrend)} vs last month</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Avg. Completion Rate</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats.avgCompletionRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                {getTrendIcon(monthlyStats.completionTrend)}
                <span>{formatTrend(monthlyStats.completionTrend)}% vs last month</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Complete Logs</div>
              <div className="text-2xl font-bold text-green-600">{monthlyStats.totalComplete}</div>
              <div className="text-xs text-gray-500 mt-1">
                {monthlyStats.totalLogs > 0 
                  ? `${((monthlyStats.totalComplete / monthlyStats.totalLogs) * 100).toFixed(1)}% of total`
                  : 'No logs'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mac-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Filter by Intern</label>
            <select
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
              className="mac-input w-full"
            >
              <option value="all">All Interns</option>
              {interns.map(intern => (
                <option key={intern._id} value={intern._id}>{intern.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Completion Status</label>
            <select
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value as any)}
              className="mac-input w-full"
            >
              <option value="all">All Status</option>
              <option value="complete">Complete Only</option>
              <option value="incomplete">Incomplete Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="mac-card p-8">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))} 
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
            }
          </h2>
          <button 
            onClick={() => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))} 
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {viewMode === 'month' ? (
          <>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDayLabels.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysBeforeMonth.map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
              {daysInMonth.map((day) => {
                const stats = getDateStats(day);
                const intensity = getHeatmapIntensity(day);
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isHovered = hoveredDate && isSameDay(day, hoveredDate);
                
                // Check for streaks
                const hasStreak = Array.from(calculateStreaks.values()).some(streak => 
                  streak.dates.some(d => isSameDay(d, day))
                );

                // Color intensity based on completion rate
                const bgIntensity = intensity > 0.8 ? 'bg-green-600' :
                                      intensity > 0.6 ? 'bg-green-500' :
                                      intensity > 0.4 ? 'bg-green-400' :
                                      intensity > 0.2 ? 'bg-green-300' :
                                      intensity > 0 ? 'bg-green-200' : 'bg-gray-50';

                return (
                  <div key={day.toISOString()} className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => setHoveredDate(day)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`aspect-square p-2 rounded-xl transition-all relative w-full ${
                        isToday ? 'ring-2 ring-macos-blue' : ''
                      } ${isSelected ? 'bg-macos-blue/20' : ''} ${
                        stats.count > 0 ? `${bgIntensity} hover:opacity-80` : 'bg-gray-50 hover:bg-gray-100'
                      } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''} ${hasStreak ? 'ring-1 ring-yellow-400' : ''}`}
                    >
                      <div className="flex flex-col h-full">
                        <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-macos-blue' : stats.count > 0 ? 'text-white' : 'text-gray-700'}`}>
                          {format(day, 'd')}
                        </span>
                        {stats.count > 0 && (
                          <div className="flex-1 flex flex-col justify-end space-y-1">
                            <div className="flex space-x-1">
                              {stats.hasAM && <div className="flex-1 h-1.5 bg-white/80 rounded-full" title="AM Log" />}
                              {stats.hasPM && <div className="flex-1 h-1.5 bg-blue-300 rounded-full" title="PM Log" />}
                            </div>
                            {stats.count > 1 && (
                              <span className={`text-[10px] font-bold ${stats.count > 0 ? 'text-white/90' : 'text-gray-600'}`}>
                                {stats.count}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>

                    {/* Hover Tooltip */}
                    {isHovered && stats.count > 0 && (
                      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 mac-card p-4 shadow-2xl pointer-events-none">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          {format(day, 'EEEE, MMMM d')}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Logs:</span>
                            <span className="font-bold">{stats.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completion:</span>
                            <span className="font-bold">{stats.completionRate.toFixed(1)}%</span>
                          </div>
                          {(() => {
                            const companiesArray = Array.from(stats.companies);
                            return companiesArray.length > 0 && (
                              <div>
                                <span className="text-gray-600">Companies:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {companiesArray.slice(0, 3).map((company, i) => (
                                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      {company}
                                    </span>
                                  ))}
                                  {companiesArray.length > 3 && (
                                    <span className="text-xs text-gray-500">+{companiesArray.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          {stats.missingInterns.length > 0 && (
                            <div>
                              <span className="text-gray-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Missing:
                              </span>
                              <div className="text-xs text-red-600 mt-1">
                                {stats.missingInterns.join(', ')}
                                {stats.missingInterns.length === 5 && '...'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          // Week View
          <div className="space-y-4">
            {weekDays.map((day) => {
              const stats = getDateStats(day);
              const intensity = getHeatmapIntensity(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayLogs = getDateLogs(day);

              const bgIntensity = intensity > 0.8 ? 'bg-green-600' :
                                  intensity > 0.6 ? 'bg-green-500' :
                                  intensity > 0.4 ? 'bg-green-400' :
                                  intensity > 0.2 ? 'bg-green-300' :
                                  intensity > 0 ? 'bg-green-200' : 'bg-gray-50';

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`mac-card p-4 border-2 ${
                    isToday ? 'border-macos-blue' : 'border-gray-200'
                  } ${isSelected ? 'bg-macos-blue/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {format(day, 'EEEE, MMMM d')}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          <strong>{stats.count}</strong> logs
                        </span>
                        <span className="text-gray-600">
                          <strong>{stats.complete}</strong> complete
                        </span>
                        <span className="text-gray-600">
                          <strong>{stats.completionRate.toFixed(1)}%</strong> completion
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDateClick(day)}
                      className="mac-button-secondary text-sm"
                    >
                      View Details
                    </button>
                  </div>

                  {dayLogs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dayLogs.slice(0, 6).map((log) => {
                        const hasAM = !!log.amLog;
                        const hasPM = !!log.pmLog;
                        return (
                          <div key={log._id} className="mac-card p-2 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <User className="w-4 h-4 text-macos-blue flex-shrink-0" />
                                <span className="text-xs font-semibold text-gray-900 truncate">
                                  {log.internId.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {hasAM && <Sun className="w-3 h-3 text-green-600" />}
                                {hasPM && <Moon className="w-3 h-3 text-blue-600" />}
                                {hasAM && hasPM && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {dayLogs.length > 6 && (
                        <div className="mac-card p-2 border border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            +{dayLogs.length - 6} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center space-x-6 mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600">AM Log</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-600">PM Log</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-xl border-2 border-macos-blue" />
            <span className="text-xs text-gray-600">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-xl border border-yellow-400 bg-yellow-50" />
            <span className="text-xs text-gray-600">Streak</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-xl bg-green-500" />
            <span className="text-xs text-gray-600">High Completion</span>
          </div>
        </div>
      </div>

      {/* Date Detail Modal - Keep existing modal code */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md"
              style={{ zIndex: 9998 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-black/5 max-h-[90vh] flex flex-col z-[9999] overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {summaryStats.total} {summaryStats.total === 1 ? 'log entry' : 'log entries'}
                      {filteredLogs.length !== summaryStats.total && (
                        <span className="ml-2">({filteredLogs.length} filtered)</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {summaryStats.total > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="mac-card p-3 bg-blue-50 border border-blue-200">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total</div>
                      <div className="text-xl font-bold text-blue-900">{summaryStats.total}</div>
                    </div>
                    <div className="mac-card p-3 bg-green-50 border border-green-200">
                      <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Complete</div>
                      <div className="text-xl font-bold text-green-900">{summaryStats.complete}</div>
                    </div>
                    <div className="mac-card p-3 bg-orange-50 border border-orange-200">
                      <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Incomplete</div>
                      <div className="text-xl font-bold text-orange-900">{summaryStats.incomplete}</div>
                    </div>
                    <div className="mac-card p-3 bg-yellow-50 border border-yellow-200">
                      <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">AM Only</div>
                      <div className="text-xl font-bold text-yellow-900">{summaryStats.amOnly}</div>
                    </div>
                    <div className="mac-card p-3 bg-purple-50 border border-purple-200">
                      <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">PM Only</div>
                      <div className="text-xl font-bold text-purple-900">{summaryStats.pmOnly}</div>
                    </div>
                  </div>
                )}

                {summaryStats.total > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or student ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 mac-input"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'complete' | 'incomplete')}
                        className="mac-input pr-10 appearance-none cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="complete">Complete Only</option>
                        <option value="incomplete">Incomplete Only</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {summaryStats.total === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold">No logs for this date</p>
                    <p className="text-sm text-gray-400 mt-2">No check-in or check-out records found.</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-semibold">No logs match your filters</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {displayedLogs.map((log) => {
                        const hasAM = !!log.amLog;
                        const hasPM = !!log.pmLog;
                        const isComplete = hasAM && hasPM;
                        
                        return (
                          <motion.div
                            key={log._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mac-card p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-macos-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-macos-blue" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{log.internId.name}</p>
                                    {isComplete && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 truncate">{log.internId.email}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                                  hasAM ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                                }`}>
                                  <Sun className={`w-3 h-3 ${hasAM ? 'text-green-600' : 'text-gray-400'}`} />
                                  {hasAM && log.amLog ? (
                                    <span className="text-[10px] font-semibold text-gray-700">
                                      {format(new Date(log.amLog.timestamp), 'h:mm a')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">-</span>
                                  )}
                                </div>

                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                                  hasPM ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                                }`}>
                                  <Moon className={`w-3 h-3 ${hasPM ? 'text-blue-600' : 'text-gray-400'}`} />
                                  {hasPM && log.pmLog ? (
                                    <span className="text-[10px] font-semibold text-gray-700">
                                      {format(new Date(log.pmLog.timestamp), 'h:mm a')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {hasMore && (
                      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-4">
                          Showing {displayLimit} of {filteredLogs.length} logs
                        </p>
                        <button
                          onClick={() => setDisplayLimit(prev => Math.min(prev + 20, filteredLogs.length))}
                          className="mac-button-secondary"
                        >
                          Load More ({filteredLogs.length - displayLimit} remaining)
                        </button>
                      </div>
                    )}

                    {!hasMore && filteredLogs.length > 10 && (
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">Showing all {filteredLogs.length} logs</p>
                      </div>
                    )}
                  </>
                )}

                {summaryStats.total > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleViewAllLogs}
                      className="w-full mac-button-primary flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View All Logs for This Date</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
