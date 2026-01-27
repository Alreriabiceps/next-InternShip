'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { format } from 'date-fns';
import { DailyLog, ImageLog } from '../types';
import { formatLogDate } from '@/lib/date';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Cloud, 
  Info, 
  Maximize2, 
  ExternalLink, 
  Calendar,
  Smartphone,
  XCircle,
  User,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cloudinaryThumbnail } from '@/lib/cloudinary-thumbnail';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// In-memory cache for reverse geocode results (Nominatim asks to cache)
const reverseGeocodeCache = new Map<string, { municipality: string | null; barangay: string | null }>();

async function reverseGeocode(lat: number, lng: number): Promise<{ municipality: string | null; barangay: string | null }> {
  const key = `v2,${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = reverseGeocodeCache.get(key);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=13`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'InternShip-Admin/1.0 (Contact: intern-tracker)' },
    });
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const addr = data?.address || {};
    // Municipality: town/municipality/city (PH: municipality or city LGU)
    const municipality = addr.town || addr.municipality || addr.city || addr.county || null;
    // Barangay (PH OSM): place=village (rural) or place=quarter (urban). Avoid neighbourhood/hamlet (sitio/purok) and suburb (often district) as primary.
    const barangay =
      addr.village ||   // rural barangay
      addr.quarter ||   // urban barangay
      addr.district ||  // PH addr:district can be barangay
      addr.city_district ||
      addr.borough ||
      addr.suburb ||    // sometimes barangay; in PH can be city district
      addr.neighbourhood || // sitio/purok in PH; fallback only
      addr.hamlet ||    // sitio/purok in PH; fallback only
      null;
    const result = { municipality, barangay };
    reverseGeocodeCache.set(key, result);
    return result;
  } catch {
    return { municipality: null, barangay: null };
  }
}

interface LogDetailModalProps {
  log: DailyLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'AM' | 'PM'>('AM');
  const [placeDetails, setPlaceDetails] = useState<{ municipality: string | null; barangay: string | null } | null>(null);
  const [placeDetailsLoading, setPlaceDetailsLoading] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const googleMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Reverse geocode to get municipality and barangay from coordinates
  useEffect(() => {
    if (!isOpen || !log) {
      setPlaceDetails(null);
      setPlaceDetailsLoading(false);
      return;
    }
    const currentLog = activeTab === 'AM' ? log.amLog : log.pmLog;
    if (!currentLog?.location?.latitude || !currentLog?.location?.longitude) {
      setPlaceDetails(null);
      setPlaceDetailsLoading(false);
      return;
    }
    const { latitude, longitude } = currentLog.location;
    setPlaceDetailsLoading(true);
    setPlaceDetails(null);
    reverseGeocode(latitude, longitude).then((r) => {
      setPlaceDetails(r);
      setPlaceDetailsLoading(false);
    });
  }, [log, isOpen, activeTab]);

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
        const currentLogData = activeTab === 'AM' ? log.amLog : log.pmLog; 
        if (!currentLogData) return;
        
        const map = (window as any).L.map(mapRef.current).setView(
          [currentLogData.location.latitude, currentLogData.location.longitude],
          15
        );
        
        (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }).addTo(map);
        
        (window as any).L.marker([currentLogData.location.latitude, currentLogData.location.longitude]).addTo(map);
        
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

  // Early return after all hooks (React rules)
  if (!log) return null;

  // TypeScript assertion: log is guaranteed to be non-null after the check above
  const logData: NonNullable<typeof log> = log;

  const renderImageLog = (imageLog: ImageLog | undefined, period: 'AM' | 'PM') => {
    if (!imageLog) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-black/[0.02] rounded-[32px] border-2 border-dashed border-black/5">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-400">No {period === 'AM' ? 'Time In' : 'Time Out'} Entry</h3>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-[200px]">The intern has not submitted a log for this period yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Main Content - Clean Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo */}
          <div className="relative aspect-[4/3] w-full bg-black/5 rounded-[28px] overflow-hidden group shadow-xl">
            <Image
              src={imageLog.imageUrl}
              alt={`${period} log image`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              unoptimized
            />
            <div className="absolute top-4 right-4">
              <a 
                href={imageLog.imageUrl} 
                target="_blank" 
                className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
              </a>
            </div>
            {imageLog.submittedLate && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-lg bg-amber-500/90 text-white text-[11px] font-bold uppercase tracking-wider">
                  Submitted late
                </span>
              </div>
            )}
          </div>

          {/* Map - Bigger */}
          <div className="h-full min-h-[280px] lg:min-h-0 w-full rounded-[28px] overflow-hidden border border-black/5 shadow-lg relative">
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{ zIndex: 0 }}
            />
            <a
              href={googleMapsUrl(imageLog.location.latitude, imageLog.location.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-black/5 hover:bg-white transition-all z-10"
            >
              <ExternalLink className="w-4 h-4 text-macos-blue" />
            </a>
          </div>
        </div>

        {/* Essential Info Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-black/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Date</span>
              </div>
              <p className="text-base font-bold text-gray-900">{format(new Date(imageLog.timestamp), 'MMM d, yyyy')}</p>
            </div>

            {/* Time */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Time</span>
              </div>
              <p className="text-base font-bold text-gray-900">{format(new Date(imageLog.timestamp), 'h:mm a')}</p>
            </div>

            {/* Municipality */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Municipality</span>
              </div>
              <p className="text-base font-bold text-gray-900">
                {placeDetails?.municipality ?? (placeDetailsLoading ? 'Loading...' : '—')}
              </p>
            </div>

            {/* Barangay */}
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">Barangay</span>
              </div>
              <p className="text-base font-bold text-gray-900">
                {placeDetails?.barangay ?? (placeDetailsLoading ? 'Loading...' : '—')}
              </p>
            </div>
          </div>
        </div>

        {/* Show More Info Toggle */}
        <button
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-black/[0.03] hover:bg-black/[0.05] rounded-2xl transition-all text-gray-500 font-semibold text-sm"
        >
          <span>{showMoreInfo ? 'Hide Details' : 'Show More Info'}</span>
          {showMoreInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {showMoreInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Location Details */}
                <DetailSection title="Location Details" icon={MapPin}>
                  <DetailItem 
                    label="Full Address" 
                    value={imageLog.location.address || 'Address not available'} 
                  />
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

                {/* System Information */}
                <DetailSection title="System Information" icon={Smartphone}>
                  {imageLog.deviceInfo && (
                    <DetailItem label="Device Model" value={imageLog.deviceInfo.model} subValue={imageLog.deviceInfo.osVersion} />
                  )}
                  <DetailItem 
                    label="Network Status" 
                    value={imageLog.networkType || 'Unknown'}
                  />
                  {imageLog.wifiSSID && (
                    <DetailItem label="WiFi Network" value={imageLog.wifiSSID} />
                  )}
                  {imageLog.signalStrength !== undefined && (
                    <DetailItem label="Signal Strength" value={`${imageLog.signalStrength} dBm`} />
                  )}
                  {imageLog.networkSpeed !== undefined && (
                    <DetailItem label="Network Speed" value={`${imageLog.networkSpeed.toFixed(2)} Mbps`} />
                  )}
                  <DetailItem 
                    label="Battery Level" 
                    value={imageLog.batteryLevel !== undefined ? `${imageLog.batteryLevel}%` : 'N/A'} 
                  />
                  {imageLog.deviceOrientation && (
                    <DetailItem 
                      label="Device Orientation" 
                      value={imageLog.deviceOrientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    />
                  )}
                  {imageLog.availableStorage !== undefined && (
                    <DetailItem label="Available Storage" value={`${(imageLog.availableStorage / (1024 * 1024 * 1024)).toFixed(2)} GB`} />
                  )}
                  {imageLog.screenBrightness !== undefined && (
                    <DetailItem label="Screen Brightness" value={`${imageLog.screenBrightness}%`} />
                  )}
                  <DetailItem label="IP Address" value={imageLog.ipAddress || 'Not logged'} />
                </DetailSection>

                {/* Activity Metrics */}
                <DetailSection title="Activity Metrics" icon={Activity}>
                  {imageLog.hoursWorked !== undefined && (
                    <DetailItem label="Reported Hours" value={`${imageLog.hoursWorked} hours`} />
                  )}
                  {imageLog.activityType && (
                    <DetailItem label="Activity Type" value={imageLog.activityType} />
                  )}
                  {imageLog.sessionDuration !== undefined && (
                    <DetailItem 
                      label="Session Duration" 
                      value={`${Math.floor(imageLog.sessionDuration / 60)}m ${imageLog.sessionDuration % 60}s`}
                      subValue="Time in app before submission"
                    />
                  )}
                  {imageLog.timeSinceLastLog !== undefined && (
                    <DetailItem 
                      label="Time Since Last Log" 
                      value={imageLog.timeSinceLastLog < 60 
                        ? `${imageLog.timeSinceLastLog}s`
                        : imageLog.timeSinceLastLog < 3600
                        ? `${Math.floor(imageLog.timeSinceLastLog / 60)}m`
                        : `${Math.floor(imageLog.timeSinceLastLog / 3600)}h ${Math.floor((imageLog.timeSinceLastLog % 3600) / 60)}m`
                      }
                      subValue="Activity pattern indicator"
                    />
                  )}
                  {imageLog.captureTime !== undefined && (
                    <DetailItem 
                      label="Capture Time" 
                      value={`${imageLog.captureTime}s`}
                      subValue="Time from opening camera to submission"
                    />
                  )}
                  {imageLog.retakeCount !== undefined && imageLog.retakeCount > 0 && (
                    <DetailItem label="Photo Retakes" value={`${imageLog.retakeCount} ${imageLog.retakeCount === 1 ? 'retake' : 'retakes'}`} />
                  )}
                </DetailSection>

                {/* Environment & Media */}
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

                {/* Intern Notes */}
                {imageLog.notes && (
                  <div className="lg:col-span-2 p-5 bg-macos-blue/5 border border-macos-blue/10 rounded-[24px]">
                    <h6 className="text-[10px] font-bold text-macos-blue uppercase tracking-widest mb-2 flex items-center">
                      <Info className="w-3 h-3 mr-1.5" /> Intern Notes
                    </h6>
                    <p className="text-sm text-gray-700 italic font-medium">"{imageLog.notes}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {typeof window !== 'undefined' && isOpen && (
        <>
          {createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
                style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  width: '100vw', 
                  height: '100vh',
                  zIndex: 100
                }}
              />
            </AnimatePresence>,
            document.body
          )}
          {createPortal(
            <AnimatePresence>
              <div 
                className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  width: '100vw', 
                  height: '100vh',
                  zIndex: 101
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 40 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl max-h-[90vh] bg-[#F2F2F7] rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto"
                >
                  {/* Header */}
                  <div className="px-8 py-5 bg-white/50 backdrop-blur-xl border-b border-black/5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {(logData.internId as DailyLog['internId']).profilePicture ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-macos-blue/20 flex-shrink-0">
                          <img
                            src={cloudinaryThumbnail((logData.internId as DailyLog['internId']).profilePicture!, 40, 40)}
                            alt={logData.internId.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-macos-blue/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-macos-blue" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                          {logData.internId.name}
                        </h3>
                        <p className="text-xs font-medium text-gray-500">
                          {formatLogDate(logData.date, 'PPPP')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2.5 bg-black/5 hover:bg-black/10 rounded-full transition-all active:scale-90"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Tab Navigation with Total Duration */}
                  <div className="px-8 py-3 flex items-center justify-between bg-black/[0.02] border-b border-black/5">
                    <div className="flex items-center space-x-1 p-1 bg-black/5 rounded-xl">
                      <button
                        onClick={() => { setActiveTab('AM'); setShowMoreInfo(false); }}
                        className={cn(
                          "px-5 py-1.5 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'AM' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Time In
                      </button>
                      <button
                        onClick={() => { setActiveTab('PM'); setShowMoreInfo(false); }}
                        className={cn(
                          "px-5 py-1.5 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'PM' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Time Out
                      </button>
                    </div>
                    {/* Total Duration - Only show when PM log exists */}
                    {logData.amLog && logData.pmLog && (
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-macos-blue/10 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-macos-blue" />
                        <span className="text-sm font-bold text-gray-900">
                          {((new Date(logData.pmLog.timestamp).getTime() - new Date(logData.amLog.timestamp).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: activeTab === 'AM' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeTab === 'AM' ? 20 : -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {renderImageLog(activeTab === 'AM' ? logData.amLog : logData.pmLog, activeTab)}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Footer Information */}
                  <div className="px-10 py-4 bg-white/30 backdrop-blur-xl border-t border-black/5 flex items-center justify-center text-[10px] font-semibold text-gray-400">
                    Log ID: {logData._id}
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </>
  );
}

