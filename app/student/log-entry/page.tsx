'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { studentApi } from '@/lib/student-api';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/date';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import CameraCapture from '@/components/student/CameraCapture';
import LocationPicker from '@/components/student/LocationPicker';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export default function LogEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStudentAuth();
  const period = (searchParams.get('period') || 'AM') as 'AM' | 'PM';
  const dateParam = searchParams.get('date');
  
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const sessionStartTime = useRef<number>(Date.now());
  const retakeCount = useRef<number>(0);

  const logDate = dateParam ? parseLocalDate(dateParam) : new Date();
  const dateStr = format(logDate, 'yyyy-MM-dd');
  const now = new Date();
  const submissionDate = format(now, 'yyyy-MM-dd');
  const submissionHour = now.getHours();
  const submissionMinute = now.getMinutes();

  const handleImageCapture = (blob: Blob) => {
    setImageBlob(blob);
    setCameraError(null);
  };

  const handleLocationChange = (loc: Location) => {
    setLocation(loc);
    setLocationError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!imageBlob) {
      setError('Please capture a photo');
      return;
    }

    if (!location) {
      setError('Please wait for location to load');
      return;
    }

    if (!user?.id) {
      setError('User information missing');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('internId', user.id);
      formData.append('date', dateStr);
      formData.append('period', period);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      if (location.address) {
        formData.append('address', location.address);
      }
      if (location.accuracy) {
        formData.append('locationAccuracy', location.accuracy.toString());
      }
      
      // Append image file
      const imageFile = new File([imageBlob], 'photo.jpg', { type: 'image/jpeg' });
      formData.append('image', imageFile);

      // Add submission metadata
      formData.append('submissionDate', submissionDate);
      formData.append('submissionHour', submissionHour.toString());
      formData.append('submissionMinute', submissionMinute.toString());

      // Add device info (web browser)
      formData.append('deviceModel', navigator.userAgent);
      formData.append('osVersion', navigator.platform);
      formData.append('appVersion', '1.0.0');
      formData.append('networkType', 'UNKNOWN');
      formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

      // Calculate session duration
      const sessionDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
      formData.append('sessionDuration', sessionDuration.toString());
      formData.append('retakeCount', retakeCount.current.toString());

      // Device orientation
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      formData.append('deviceOrientation', orientation);

      await studentApi.submitLog(formData);

      // Success - redirect back
      router.push('/student/home');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit log';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    retakeCount.current += 1;
    setImageBlob(null);
  };

  const canSubmit = imageBlob && location && !loading;

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
              {period === 'AM' ? 'Check In' : 'Check Out'} Log Entry
            </h1>
            <p className="text-sm text-gray-500">{format(logDate, 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Camera Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capture Photo</h2>
          {imageBlob ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={URL.createObjectURL(imageBlob)}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleRetake}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Retake Photo
              </button>
            </div>
          ) : (
            <CameraCapture
              onCapture={handleImageCapture}
              onError={(err) => {
                setCameraError(err);
                setError(err);
              }}
            />
          )}
          {cameraError && (
            <p className="text-sm text-red-600 mt-2">{cameraError}</p>
          )}
        </div>

        {/* Location Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <LocationPicker
            onLocationChange={handleLocationChange}
            onError={(err) => {
              setLocationError(err);
              setError(err);
            }}
          />
          {locationError && (
            <p className="text-sm text-red-600 mt-2">{locationError}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 touch-target ${
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Submit Log</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
