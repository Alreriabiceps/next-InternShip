'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { DailyLog, LogFilters } from './types';
import LogFiltersComponent from './components/LogFilters';
import LogList from './components/LogList';
import LogDetailModal from './components/LogDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Trash2, AlertCircle, Search, RefreshCcw } from 'lucide-react';
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
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

  const handleDeleteClick = (logId: string) => {
    setDeleteConfirm({ isOpen: true, id: logId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    try {
      await api.delete(`/logs/${deleteConfirm.id}`);
      setDeleteConfirm({ isOpen: false, id: null });
      fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      setErrorModal({ isOpen: true, message: 'Failed to delete log' });
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
          onDelete={handleDeleteClick}
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

      {/* macOS Style Modal for Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] mac-card p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-macos-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-macos-red" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Log Entry?</h3>
              <p className="text-sm text-gray-500 text-center mb-8">
                This will permanently remove this daily log record. This action cannot be reversed.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full py-3 bg-macos-red text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-macos-red/20"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                  className="w-full py-3 text-gray-600 font-semibold hover:bg-black/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* macOS Style Error Modal */}
      <AnimatePresence>
        {errorModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorModal({ isOpen: false, message: '' })}
              className="absolute inset-0 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-[350px] mac-card p-6 shadow-xl border-macos-red/20"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-macos-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-macos-red" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Action Failed</h3>
                  <p className="text-sm text-gray-500 mt-1">{errorModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                className="w-full py-2.5 mac-button-primary mt-2"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
