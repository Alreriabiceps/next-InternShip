'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { DailyLog, ImageLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Monitor, 
  Cloud, 
  Info, 
  Maximize2, 
  ExternalLink, 
  CheckCircle2,
  Calendar,
  Smartphone,
  ShieldCheck,
  Signal, 
  Battery, 
  Globe, 
  XCircle,
  User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogDetailModalProps {
  log: DailyLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'AM' | 'PM'>('AM');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  if (!log) return null;

  const googleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen || !mapRef.current || !log) return;

    const currentLog = activeTab === 'AM' ? log.amLog : log.pmLog;
    if (!currentLog) return;

    const initMap = () => {
      if (!mapRef.current) return;

      // Destroy existing map if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Load Leaflet if not already loaded
      if (!(window as any).L) {
        // Check if already loading
        if (document.querySelector('script[src*="leaflet"]')) {
          const checkInterval = setInterval(() => {
            if ((window as any).L) {
              clearInterval(checkInterval);
              createMap();
            }
          }, 100);
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        if (!document.querySelector('link[href*="leaflet"]')) {
          document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = createMap;
        if (!document.querySelector('script[src*="leaflet"]')) {
          document.body.appendChild(script);
        }
      } else {
        createMap();
      }

      function createMap() {
        if (!mapRef.current || !(window as any).L || !log) return;
        
        // Re-check currentLog since this function might be called asynchronously
        const logData = activeTab === 'AM' ? log.amLog : log.pmLog; 
        if (!logData) return;
        
        const map = (window as any).L.map(mapRef.current).setView(
          [logData.location.latitude, logData.location.longitude],
          15
        );
        
        (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);
        
        (window as any).L.marker([logData.location.latitude, logData.location.longitude]).addTo(map);
        
        mapInstanceRef.current = map;
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [log, isOpen, activeTab]);

  const DetailSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <Icon className="w-4 h-4 text-macos-blue" />
        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h5>
      </div>
      <div className="bg-black/[0.03] rounded-2xl p-4 space-y-3 border border-black/5">
        {children}
      </div>
    </div>
  );

  const DetailItem = ({ label, value, subValue }: { label: string, value: React.ReactNode, subValue?: string }) => (
    <div className="flex justify-between items-start">
      <span className="text-sm font-semibold text-gray-500">{label}</span>
      <div className="text-right">
        <div className="text-sm font-bold text-gray-900">{value}</div>
        {subValue && <div className="text-[10px] font-medium text-gray-400">{subValue}</div>}
      </div>
    </div>
  );

  const renderImageLog = (imageLog: ImageLog | undefined, period: 'AM' | 'PM') => {
    if (!imageLog) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-black/[0.02] rounded-[32px] border-2 border-dashed border-black/5">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-400">No {period} Entry</h3>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-[200px]">The intern has not submitted a log for this period yet.</p>
        </div>
      );
    }


    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visual Content Column */}
        <div className="space-y-6">
          <div className="relative aspect-[4/3] w-full bg-black/5 rounded-[32px] overflow-hidden group shadow-xl">
            <Image
              src={imageLog.imageUrl}
              alt={`${period} log image`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              unoptimized
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <a 
                href={imageLog.imageUrl} 
                target="_blank" 
                className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </a>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center text-white space-x-2">
                <Clock className="w-4 h-4 opacity-70" />
                <span className="text-sm font-bold">{format(new Date(imageLog.timestamp), 'h:mm:ss a')}</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full rounded-[32px] overflow-hidden border border-black/5 shadow-lg relative">
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{ zIndex: 0 }}
            />
            <div className="absolute top-4 left-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-black/5 flex items-center space-x-2 max-w-[80%] z-10 pointer-events-none">
              <MapPin className="w-4 h-4 text-macos-blue flex-shrink-0" />
              <span className="text-[11px] font-bold text-gray-700 truncate leading-none">
                {imageLog.location.address || 'Location Coordinates Pinpointed'}
              </span>
            </div>
            <a
              href={googleMapsUrl(imageLog.location.latitude, imageLog.location.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-black/5 hover:bg-white transition-all z-10 pointer-events-auto"
            >
              <ExternalLink className="w-4 h-4 text-macos-blue" />
            </a>
          </div>
        </div>

        {/* Data Content Column */}
        <div className="space-y-6">
          <DetailSection title="Activity Details" icon={Clock}>
            <DetailItem 
              label="Submission Time" 
              value={format(new Date(imageLog.timestamp), 'PPpp')} 
            />
            {imageLog.hoursWorked !== undefined && (
              <DetailItem label="Reported Hours" value={`${imageLog.hoursWorked} hours`} />
            )}
            {imageLog.activityType && (
              <DetailItem label="Activity Type" value={imageLog.activityType} />
            )}
            {period === 'AM' && log.pmLog && (
              <DetailItem 
                label="Total Duration" 
                value={`${((new Date(log.pmLog.timestamp).getTime() - new Date(imageLog.timestamp).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours`}
                subValue="Calculated from AM to PM"
              />
            )}
          </DetailSection>

          <DetailSection title="Location Accuracy" icon={MapPin}>
            <DetailItem 
              label="Coordinates" 
              value={`${imageLog.location.latitude.toFixed(6)}, ${imageLog.location.longitude.toFixed(6)}`} 
            />
            <DetailItem 
              label="Altitude" 
              value={imageLog.location.altitude ? `${imageLog.location.altitude.toFixed(1)}m` : 'N/A'} 
            />
            <DetailItem 
              label="Accuracy" 
              value={imageLog.location.accuracy ? `±${imageLog.location.accuracy.toFixed(1)}m` : 'N/A'} 
            />
            <DetailItem 
              label="Device Speed" 
              value={imageLog.location.speed ? `${(imageLog.location.speed * 3.6).toFixed(1)} km/h` : 'Stationary'} 
            />
          </DetailSection>

          <DetailSection title="System Information" icon={Smartphone}>
            {imageLog.deviceInfo && (
              <DetailItem label="Device Model" value={imageLog.deviceInfo.model} subValue={imageLog.deviceInfo.osVersion} />
            )}
            <DetailItem 
              label="Network Status" 
              value={imageLog.networkType || 'Unknown'}
            />
            <DetailItem 
              label="Battery Level" 
              value={imageLog.batteryLevel !== undefined ? `${imageLog.batteryLevel}%` : 'N/A'} 
            />
            <DetailItem label="IP Address" value={<span className="font-mono text-[11px]">{imageLog.ipAddress || 'Not logged'}</span>} />
          </DetailSection>

          <DetailSection title="Environment & Media" icon={Cloud}>
            {imageLog.weatherData && (
              <DetailItem 
                label="Weather" 
                value={imageLog.weatherData.conditions || 'Cloudy'} 
                subValue={imageLog.weatherData.temperature !== undefined ? `${imageLog.weatherData.temperature}°C` : undefined}
              />
            )}
            <DetailItem 
              label="Image Metadata" 
              value={imageLog.imageDimensions ? `${imageLog.imageDimensions.width} × ${imageLog.imageDimensions.height}` : 'Standard'}
              subValue={imageLog.imageFileSize ? `${(imageLog.imageFileSize / 1024).toFixed(1)} KB` : undefined}
            />
            {imageLog.timezone && (
              <DetailItem label="Timezone" value={imageLog.timezone} />
            )}
          </DetailSection>

          {imageLog.notes && (
            <div className="p-5 bg-macos-blue/5 border border-macos-blue/10 rounded-[24px]">
              <h6 className="text-[10px] font-bold text-macos-blue uppercase tracking-widest mb-2 flex items-center">
                <Info className="w-3 h-3 mr-1.5" /> Intern Notes
              </h6>
              <p className="text-sm text-gray-700 italic font-medium">"{imageLog.notes}"</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-[#F2F2F7] rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-10 py-8 bg-white/50 backdrop-blur-xl border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-macos-blue rounded-[20px] shadow-lg shadow-macos-blue/20 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {format(new Date(log.date), 'PPPP')}
                  </h3>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-sm font-semibold text-gray-500 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5" /> {log.internId.name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{log.internId.studentId}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-black/5 hover:bg-black/10 rounded-full transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-10 py-4 flex space-x-2 bg-black/[0.02] border-b border-black/5">
              <button
                onClick={() => setActiveTab('AM')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'AM' 
                    ? "bg-macos-blue text-white shadow-lg shadow-macos-blue/20" 
                    : "text-gray-500 hover:bg-black/5"
                )}
              >
                Morning Entry (AM)
              </button>
              <button
                onClick={() => setActiveTab('PM')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'PM' 
                    ? "bg-macos-blue text-white shadow-lg shadow-macos-blue/20" 
                    : "text-gray-500 hover:bg-black/5"
                )}
              >
                Afternoon Entry (PM)
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === 'AM' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === 'AM' ? 20 : -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {renderImageLog(activeTab === 'AM' ? log.amLog : log.pmLog, activeTab)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Information */}
            <div className="px-10 py-6 bg-white/30 backdrop-blur-xl border-t border-black/5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-macos-green" />
                  System Verified Log
                </div>
                <div className="flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  Origin: {log.amLog?.ipAddress || log.pmLog?.ipAddress || 'Unknown'}
                </div>
              </div>
              <div>ID: {log._id}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

