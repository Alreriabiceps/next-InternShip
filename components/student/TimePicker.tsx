'use client';

import { useState } from 'react';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimePickerProps {
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
  label: string;
}

function formatTimeDisplay(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function TimePicker({ hour, minute, onTimeChange, label }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempHour, setTempHour] = useState(hour);
  const [tempMinute, setTempMinute] = useState(minute);

  const handleConfirm = () => {
    onTimeChange(tempHour, tempMinute);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempHour(hour);
    setTempMinute(minute);
    setShowPicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTempHour(hour);
          setTempMinute(minute);
          setShowPicker(true);
        }}
        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-semibold">{formatTimeDisplay(hour, minute)}</span>
          <span className="text-gray-400">→</span>
        </div>
      </button>

      <AnimatePresence>
        {showPicker && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Set {label}</h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex h-full">
                  {/* Hour Column */}
                  <div className="flex-1 flex flex-col">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 text-center">Hour</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {hours.map((h) => (
                        <button
                          key={h}
                          onClick={() => setTempHour(h)}
                          className={`w-full py-3 text-center transition-colors ${
                            tempHour === h
                              ? 'bg-blue-100 text-blue-600 font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {h.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minute Column */}
                  <div className="flex-1 flex flex-col border-l border-gray-200">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 text-center">Minute</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {minutes.map((m) => (
                        <button
                          key={m}
                          onClick={() => setTempMinute(m)}
                          className={`w-full py-3 text-center transition-colors ${
                            tempMinute === m
                              ? 'bg-blue-100 text-blue-600 font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {m.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
