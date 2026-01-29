'use client';

import { useState, useEffect } from 'react';
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface LocationPickerProps {
  onLocationChange: (location: Location) => void;
  onError?: (error: string) => void;
}

export default function LocationPicker({ onLocationChange, onError }: LocationPickerProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser.';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            const addrParts = [
              data.address.road,
              data.address.village || data.address.quarter,
              data.address.city || data.address.town,
              data.address.state,
              data.address.country,
            ].filter(Boolean);
            loc.address = addrParts.join(', ');
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err);
        }

        setLocation(loc);
        onLocationChange(loc);
        setLoading(false);
      },
      (err) => {
        let errorMsg = 'Failed to get location.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please allow location access.';
        } else if (err.code === 2) {
          errorMsg = 'Location unavailable. Please check your GPS settings.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Getting location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-semibold mb-1">Location Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={getCurrentLocation}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      </div>
    );
  }

  if (!location) {
    return (
      <button
        onClick={getCurrentLocation}
        className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <MapPin className="w-12 h-12 text-gray-400" />
        <span className="text-gray-600 font-semibold">Get Location</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Map Preview */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&output=embed&z=15`}
              allowFullScreen
            />
      </div>

      {/* Location Info */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            {location.address ? (
              <>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p className="font-semibold text-gray-900 mb-2">{location.address}</p>
              </>
            ) : null}
            <p className="text-sm text-gray-500 mb-1">Coordinates</p>
            <p className="text-sm text-gray-700 font-mono">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
            {location.accuracy && (
              <p className="text-xs text-gray-500 mt-1">
                Accuracy: ±{Math.round(location.accuracy)}m
              </p>
            )}
          </div>
          <button
            onClick={getCurrentLocation}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh location"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
