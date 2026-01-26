'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { DailyLog, LogFilters } from './types';
import LogFiltersComponent from './components/LogFilters';
import LogList from './components/LogList';
import LogDetailModal from './components/LogDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, AlertCircle, Search, RefreshCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LogsContent() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    internId: searchParams.get('internId') || '',
    startDate: '',
    endDate: '',
    status: 'all',
    companyId: '',
    sortBy: 'newest',
    datePreset: 'custom',
  });

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.internId) params.append('internId', filters.internId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = async (logId: string) => {
    try {
      const response = await api.get(`/logs/${logId}`);
      setSelectedLog(response.data.log);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching log details:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            Daily Logs
          </h1>
          <p className="text-gray-500 mt-1">Review and verify check-in/out logs submitted by interns.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2.5 bg-black/5 hover:bg-black/10 rounded-xl transition-all active:rotate-180 duration-500"
          title="Refresh logs"
        >
          <RefreshCcw className={cn("w-5 h-5 text-gray-600", loading && "animate-spin")} />
        </button>
      </div>

      <div className="space-y-6">
        <LogFiltersComponent filters={filters} onChange={setFilters} />

        <LogList
          logs={logs}
          loading={loading}
          onView={handleViewLog}
        />
      </div>

      <LogDetailModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <RefreshCcw className="w-10 h-10 text-macos-blue animate-spin" />
      </div>
    }>
      <LogsContent />
    </Suspense>
  );
}
