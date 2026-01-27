'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Users, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserX,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import DailyTrendsChart from '@/components/dashboard/DailyTrendsChart';
import TodayAttendanceChart from '@/components/dashboard/TodayAttendanceChart';
import OnTimeVsLateChart from '@/components/dashboard/OnTimeVsLateChart';
import CompletionTrendChart from '@/components/dashboard/CompletionTrendChart';
import CompanyBreakdownChart from '@/components/dashboard/CompanyBreakdownChart';
import AttendanceHeatmap from '@/components/dashboard/AttendanceHeatmap';

interface MissingIntern {
  id: string;
  name: string;
  company: string;
}

interface Stats {
  totalInterns: number;
  totalLogs: number;
  todayLogs: number;
  completeLogs: number;
  completionRate: number;
  internsLoggedToday: number;
  internsNotLoggedToday: number;
  missingToday: MissingIntern[];
  lateSubmissionsToday: number;
  lateSubmissionsWeek: number;
  onTimeLogs: number;
  lateLogs: number;
  avgHoursPerDay: number;
  totalHoursLogged: number;
  dailyTrends: Array<{ date: string; count: number; complete: number }>;
  completionTrend: Array<{ date: string; rate: number }>;
  companyBreakdown: Array<{ company: string; logCount: number; internCount: number }>;
  internActivity: Array<{ internId: string; internName: string; logCount: number; lastActivity: string }>;
  heatmapData: Array<{ date: string; count: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeatmapDateClick = (date: string) => {
    router.push(`/main/logs?startDate=${date}&endDate=${date}`);
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    onClick
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any; 
    color?: 'blue' | 'green' | 'amber' | 'red';
    onClick?: () => void;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      amber: 'bg-amber-50 text-amber-600',
      red: 'bg-red-50 text-red-600',
    };

    return (
      <motion.div
        whileHover={onClick ? { scale: 1.02 } : undefined}
        className={`mac-card p-5 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? '...' : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interns"
          value={stats?.totalInterns ?? 0}
          subtitle="Registered in system"
          icon={Users}
          color="blue"
          onClick={() => router.push('/main/intern')}
        />
        <StatCard
          title="Today's Attendance"
          value={stats?.internsLoggedToday ?? 0}
          subtitle={`of ${stats?.totalInterns ?? 0} logged in`}
          icon={CheckCircle2}
          color="green"
          onClick={() => router.push('/main/logs')}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats?.completionRate ?? 0}%`}
          subtitle={`${stats?.completeLogs ?? 0} complete logs`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Late Today"
          value={stats?.lateSubmissionsToday ?? 0}
          subtitle={`${stats?.lateSubmissionsWeek ?? 0} this week`}
          icon={AlertTriangle}
          color="amber"
          onClick={() => router.push('/main/logs')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Trends */}
          <div className="mac-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Log Trends</h2>
            {stats?.dailyTrends && stats.dailyTrends.length > 0 ? (
              <DailyTrendsChart data={stats.dailyTrends} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Two Column Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Attendance Donut */}
            <div className="mac-card p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Today's Attendance
              </h3>
              <TodayAttendanceChart
                logged={stats?.internsLoggedToday ?? 0}
                notLogged={stats?.internsNotLoggedToday ?? 0}
              />
            </div>

            {/* On-Time vs Late */}
            <div className="mac-card p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                On-Time vs Late (30 days)
              </h3>
              <OnTimeVsLateChart
                onTime={stats?.onTimeLogs ?? 0}
                late={stats?.lateLogs ?? 0}
              />
            </div>
          </div>

          {/* Completion Trend */}
          <div className="mac-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Completion Rate Trend (7 days)
              </h3>
              <div className="text-2xl font-bold text-macos-blue">
                {stats?.completionRate ?? 0}%
              </div>
            </div>
            {stats?.completionTrend && stats.completionTrend.length > 0 ? (
              <CompletionTrendChart data={stats.completionTrend} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Company Breakdown */}
          {stats?.companyBreakdown && stats.companyBreakdown.length > 0 && (
            <div className="mac-card p-6">
              <CompanyBreakdownChart data={stats.companyBreakdown} />
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Average Hours Card */}
          <div className="mac-card p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-5 h-5 text-macos-blue" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Avg Hours/Day</h3>
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {stats?.avgHoursPerDay ?? 0}h
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.totalHoursLogged ?? 0} total hours logged
            </p>
          </div>

          {/* Missing Today */}
          <div className="mac-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Missing Today
              </h3>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg">
                {stats?.internsNotLoggedToday ?? 0}
              </span>
            </div>
            {stats?.missingToday && stats.missingToday.length > 0 ? (
              <div className="space-y-2">
                {stats.missingToday.map((intern) => (
                  <div
                    key={intern.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/main/logs?internId=${intern.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserX className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {intern.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {intern.company}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.internsNotLoggedToday > 10 && (
                  <button
                    onClick={() => router.push('/main/intern')}
                    className="w-full text-center text-sm text-macos-blue font-semibold py-2 hover:underline"
                  >
                    View all ({stats.internsNotLoggedToday})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Everyone has logged in!</p>
              </div>
            )}
          </div>

          {/* Attendance Heatmap */}
          <div className="mac-card p-6">
            {stats?.heatmapData && stats.heatmapData.length > 0 ? (
              <AttendanceHeatmap 
                data={stats.heatmapData} 
                onDateClick={handleHeatmapDateClick}
              />
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Attendance Heatmap
                </h3>
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mac-card p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              {[
                { label: 'View All Logs', href: '/main/logs', icon: CalendarDays },
                { label: 'Manage Interns', href: '/main/intern', icon: Users },
                { label: 'Reports', href: '/main/reports', icon: TrendingUp },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <link.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
