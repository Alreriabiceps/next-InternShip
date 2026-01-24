'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StatCard from '@/components/dashboard/StatCard';
import DailyTrendsChart from '@/components/dashboard/DailyTrendsChart';
import ActivityChart from '@/components/dashboard/ActivityChart';
import CompanyBreakdownChart from '@/components/dashboard/CompanyBreakdownChart';
import AttendanceHeatmap from '@/components/dashboard/AttendanceHeatmap';
import InternActivityChart from '@/components/dashboard/InternActivityChart';
import { 
  Users, 
  ClipboardCheck, 
  Clock, 
  FileText, 
  CheckCircle2,
  ArrowRight,
  Activity,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Stats {
  totalInterns: number;
  totalLogs: number;
  recentLogs: number;
  todayLogs: number;
  completeLogs: number;
  completionRate: number;
  dailyTrends: Array<{ date: string; count: number; complete: number }>;
  weeklyActivity: Array<{ week: string; count: number }>;
  monthlyActivity: Array<{ month: string; count: number }>;
  companyBreakdown: Array<{ company: string; logCount: number; internCount: number }>;
  internActivity: Array<{ internId: string; internName: string; logCount: number; lastActivity: string }>;
  heatmapData: Array<{ date: string; count: number }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

  const statCards = [
    {
      title: 'Total Interns',
      value: stats?.totalInterns ?? (loading ? '...' : 0),
      href: '/main/intern',
      icon: Users,
      trend: '+2.4%',
      trendType: 'positive' as const,
    },
    {
      title: 'Total Logs',
      value: stats?.totalLogs ?? (loading ? '...' : 0),
      href: '/main/logs',
      icon: FileText,
      trend: '+12%',
      trendType: 'positive' as const,
    },
    {
      title: "Today's Logs",
      value: stats?.todayLogs ?? (loading ? '...' : 0),
      href: '/main/logs',
      icon: Clock,
      trend: 'On track',
      trendType: 'neutral' as const,
    },
    {
      title: 'Complete Logs',
      value: stats?.completeLogs ?? (loading ? '...' : 0),
      href: '/main/logs',
      icon: CheckCircle2,
      trend: `${stats?.completionRate ?? 0}% complete`,
      trendType: 'positive' as const,
    },
    {
      title: 'Recent Activity',
      value: stats?.recentLogs ?? (loading ? '...' : 0),
      href: '/main/logs',
      icon: Activity,
      trend: 'Last 7 days',
      trendType: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of intern activities and daily submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card, index) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              href={card.href}
              icon={card.icon}
              trend={card.trend}
              trendType={card.trendType}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          {/* Daily Trends Chart */}
          <div className="mac-card p-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-6">
              Daily Log Trends
            </h2>
            {stats?.dailyTrends && stats.dailyTrends.length > 0 ? (
              <DailyTrendsChart data={stats.dailyTrends} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Activity Charts */}
          <div className="mac-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Activity Overview
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveChart('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChart === 'daily'
                      ? 'bg-macos-blue text-white'
                      : 'bg-black/5 text-gray-600 hover:bg-black/10'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setActiveChart('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChart === 'weekly'
                      ? 'bg-macos-blue text-white'
                      : 'bg-black/5 text-gray-600 hover:bg-black/10'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setActiveChart('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChart === 'monthly'
                      ? 'bg-macos-blue text-white'
                      : 'bg-black/5 text-gray-600 hover:bg-black/10'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            {activeChart === 'weekly' && stats?.weeklyActivity && (
              <ActivityChart data={stats.weeklyActivity} title="Weekly Activity" type="weekly" />
            )}
            {activeChart === 'monthly' && stats?.monthlyActivity && (
              <ActivityChart data={stats.monthlyActivity} title="Monthly Activity" type="monthly" />
            )}
            {activeChart === 'daily' && stats?.dailyTrends && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Daily Activity</h3>
                <div className="text-sm text-gray-500">
                  Showing last 30 days of activity. Switch to Weekly or Monthly view for longer trends.
                </div>
              </div>
            )}
          </div>

          {/* Company Breakdown */}
          {stats?.companyBreakdown && stats.companyBreakdown.length > 0 && (
            <div className="mac-card p-6">
              <CompanyBreakdownChart data={stats.companyBreakdown} />
            </div>
          )}

          {/* Top Active Interns */}
          {stats?.internActivity && stats.internActivity.length > 0 && (
            <div className="mac-card p-6">
              <InternActivityChart data={stats.internActivity} />
            </div>
          )}
        </section>

        <section className="space-y-8">
          {/* Attendance Heatmap */}
          <div className="mac-card p-6">
            {stats?.heatmapData && stats.heatmapData.length > 0 ? (
              <AttendanceHeatmap 
                data={stats.heatmapData} 
                onDateClick={handleHeatmapDateClick}
              />
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Attendance Heatmap</h3>
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Quick Actions
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Add New Intern', icon: Users, href: '/main/intern' },
                { title: 'Review Pending Logs', icon: ClipboardCheck, href: '/main/logs' },
                { title: 'View Reports', icon: FileText, href: '/main/reports' },
                { title: 'Calendar View', icon: Activity, href: '/main/calendar' },
              ].map((action) => (
                <motion.button
                  key={action.title}
                  whileHover={{ x: 5 }}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center justify-between p-4 mac-card hover:bg-macos-blue hover:text-white group transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-macos-blue/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <action.icon className="w-5 h-5 text-macos-blue group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-sm">{action.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Completion Rate Card */}
          <div className="mac-card p-6 bg-gradient-to-br from-macos-blue/10 to-macos-blue/5">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-macos-blue" />
              <h3 className="text-lg font-bold text-gray-900">Completion Rate</h3>
            </div>
            <div className="text-4xl font-bold text-macos-blue mb-2">
              {stats?.completionRate ?? 0}%
            </div>
            <p className="text-sm text-gray-500">
              {stats?.completeLogs ?? 0} of {stats?.totalLogs ?? 0} logs are complete (AM & PM)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
