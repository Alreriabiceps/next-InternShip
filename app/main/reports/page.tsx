'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileText, Download, Calendar, Users, Building2, TrendingUp } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';

interface ReportData {
  totalInterns: number;
  totalLogs: number;
  completeLogs: number;
  incompleteLogs: number;
  companyStats: Array<{ company: string; internCount: number; logCount: number }>;
  dateRange: { start: string; end: string };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchReportData();
  }, [dateRange, customStart, customEnd]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string = format(new Date(), 'yyyy-MM-dd');
      if (dateRange === 'week') {
        startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      } else if (dateRange === 'month') {
        startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      } else {
        startDate = customStart;
        endDate = customEnd;
      }

      const [internsResponse, logsResponse] = await Promise.all([
        api.get('/interns'),
        api.get(`/logs?startDate=${startDate}&endDate=${endDate}`)
      ]);

      const logs = logsResponse.data.logs || [];
      const interns = internsResponse.data.interns || [];
      const completeLogs = logs.filter((log: any) => log.amLog && log.pmLog).length;
      const incompleteLogs = logs.length - completeLogs;

      const companyMap = new Map<string, { internCount: number; logCount: number }>();
      interns.forEach((intern: any) => {
        if (!companyMap.has(intern.company)) {
          companyMap.set(intern.company, { internCount: 0, logCount: 0 });
        }
        companyMap.get(intern.company)!.internCount += 1;
      });

      logs.forEach((log: any) => {
        const company = log.internId?.company || 'Unknown';
        if (!companyMap.has(company)) {
          companyMap.set(company, { internCount: 0, logCount: 0 });
        }
        companyMap.get(company)!.logCount += 1;
      });

      setReportData({
        totalInterns: interns.length,
        totalLogs: logs.length,
        completeLogs,
        incompleteLogs,
        companyStats: Array.from(companyMap.entries()).map(([company, stats]) => ({ company, ...stats })),
        dateRange: { start: startDate, end: endDate }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    const csvRows = [
      ['InternShip - Activity Report'],
      [`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`],
      [`Date Range: ${format(new Date(reportData.dateRange.start), 'MMM d, yyyy')} - ${format(new Date(reportData.dateRange.end), 'MMM d, yyyy')}`],
      [],
      ['Summary'],
      ['Total Interns', reportData.totalInterns.toString()],
      ['Total Logs', reportData.totalLogs.toString()],
      ['Complete Logs', reportData.completeLogs.toString()],
      ['Incomplete Logs', reportData.incompleteLogs.toString()],
      ['Completion Rate', `${((reportData.completeLogs / reportData.totalLogs) * 100).toFixed(1)}%`],
      [],
      ['Company Breakdown'],
      ['Company', 'Interns', 'Logs'],
      ...reportData.companyStats.map(stat => [stat.company, stat.internCount.toString(), stat.logCount.toString()])
    ];
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `internship-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-macos-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="w-8 h-8 mr-3 text-macos-blue" />
            Reports & Analytics
          </h1>
          <p className="text-gray-500 mt-1">Generate comprehensive reports and export data.</p>
        </div>
        <button onClick={exportToCSV} className="mac-button-primary flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="mac-card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Report Period</h2>
        <div className="flex flex-wrap gap-3">
          {(['week', 'month', 'custom'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                dateRange === range
                  ? 'bg-macos-blue text-white'
                  : 'bg-black/5 text-gray-600 hover:bg-black/10'
              }`}
            >
              {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'This Month' : 'Custom Range'}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Start Date</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mac-input w-full" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">End Date</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mac-input w-full" />
            </div>
          </div>
        )}
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: reportData.totalInterns, label: 'Total Interns', color: 'text-macos-blue' },
              { icon: FileText, value: reportData.totalLogs, label: 'Total Logs', color: 'text-green-500' },
              { icon: TrendingUp, value: reportData.completeLogs, label: 'Complete Logs', color: 'text-green-600' },
              { icon: Calendar, value: `${reportData.totalLogs > 0 ? ((reportData.completeLogs / reportData.totalLogs) * 100).toFixed(1) : 0}%`, label: 'Completion Rate', color: 'text-orange-500' }
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="mac-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mac-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-macos-blue" />
              Company Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Company</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Interns</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Logs</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Avg. Logs/Intern</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.companyStats.map((stat, index) => (
                    <motion.tr key={stat.company} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="border-b border-gray-100 hover:bg-black/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stat.company}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{stat.internCount}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{stat.logCount}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{stat.internCount > 0 ? (stat.logCount / stat.internCount).toFixed(1) : '0'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
