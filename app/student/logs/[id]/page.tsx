'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentApi, type Log } from '@/lib/student-api';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date';
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LogDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get('period') as 'AM' | 'PM' | null;
  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLog();
  }, [params.id]);

  const loadLog = async () => {
    try {
      const data = await studentApi.getLog(params.id);
      setLog(data);
    } catch (error) {
      console.error('Error loading log:', error);
    } finally {
      setLoading(false);
    }
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

  if (!log) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Log not found</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const logData = period === 'AM' ? log.amLog : log.pmLog || log.amLog;
  if (!logData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Log data not available</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const logDate = parseLocalDate(log.date);
  const timestamp = new Date(logData.timestamp);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">
              {period === 'AM' ? 'Check In' : 'Check Out'} Details
            </h1>
            <p className="text-sm text-gray-500">{format(logDate, 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl overflow-hidden shadow-lg"
        >
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={logData.imageUrl}
              alt={`${period === 'AM' ? 'Check In' : 'Check Out'} photo`}
              fill
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl overflow-hidden shadow-lg"
        >
          <div className="relative w-full h-64">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${logData.location.latitude},${logData.location.longitude}&output=embed&z=15`}
              allowFullScreen
            />
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">{format(logDate, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-semibold text-gray-900">{format(timestamp, 'h:mm a')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Location</p>
              {logData.location.address ? (
                <p className="font-semibold text-gray-900 mb-1">{logData.location.address}</p>
              ) : null}
              <p className="text-sm text-gray-600">
                {logData.location.latitude.toFixed(6)}, {logData.location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {logData.notes && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Notes</p>
              <p className="text-gray-900">{logData.notes}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
