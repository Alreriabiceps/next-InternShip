'use client';

import { useState, useEffect } from 'react';
import { getReminderPreferences, setReminderPreferences } from '@/lib/student-storage';
import { Bell, Clock, AlertCircle, CheckCircle2, Flame, Calendar, BarChart3, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import TimePicker from '@/components/student/TimePicker';

function formatTimeDisplay(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

function addMinutesToTime(hour: number, minute: number, deltaMins: number): { hour: number; minute: number } {
  const total = hour * 60 + minute + deltaMins;
  const h = Math.floor(total / 60) % 24;
  const m = ((total % 60) + 60) % 60;
  return { hour: h, minute: m };
}

function getMissedTimeInDisplay(prefs: any): string {
  const { hour, minute } = addMinutesToTime(prefs.timeInHour, prefs.timeInMinute, 2 * 60);
  return formatTimeDisplay(hour, minute);
}

function getIncompleteDayDisplay(prefs: any): string {
  return formatTimeDisplay(prefs.timeOutHour, prefs.timeOutMinute);
}

function getStreakNudgeDisplay(prefs: any): string {
  const { hour, minute } = addMinutesToTime(prefs.timeInHour, prefs.timeInMinute, 30);
  return formatTimeDisplay(hour, minute);
}

export default function RemindersPage() {
  const [prefs, setPrefs] = useState(getReminderPreferences());

  useEffect(() => {
    setReminderPreferences(prefs);
  }, [prefs]);

  const handleTimeInChange = (hour: number, minute: number) => {
    setPrefs((p) => ({ ...p, timeInHour: hour, timeInMinute: minute }));
  };

  const handleTimeOutChange = (hour: number, minute: number) => {
    setPrefs((p) => ({ ...p, timeOutHour: hour, timeOutMinute: minute }));
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Please enable notifications in your browser settings to receive reminders.');
      }
    } else {
      alert('Notifications are not supported in your browser.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reminders</h1>
        <p className="text-gray-600">Manage your notification preferences</p>
      </motion.div>

      {/* Master Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-lg mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Enable Reminders</p>
              <p className="text-sm text-gray-500">Turn on/off all reminder notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, enabled: e.target.checked }));
                if (e.target.checked) handleRequestPermission();
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </motion.div>

      {/* Time Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">Reminder Times</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set your Check In and Check Out reminder times
        </p>
        <div className="bg-white rounded-xl p-4 shadow-lg space-y-2">
          <TimePicker
            hour={prefs.timeInHour}
            minute={prefs.timeInMinute}
            onTimeChange={handleTimeInChange}
            label="Check In"
          />
          <div className="h-px bg-gray-200 my-2" />
          <TimePicker
            hour={prefs.timeOutHour}
            minute={prefs.timeOutMinute}
            onTimeChange={handleTimeOutChange}
            label="Check Out"
          />
        </div>
      </motion.div>

      {/* Notification Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">Notification Types</h2>
        <p className="text-sm text-gray-600 mb-4">Choose which reminders you want to receive</p>
        <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Missed Check In</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Remind at {getMissedTimeInDisplay(prefs)} (2h after Check In) if you haven't checked in
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.missedTimeInEnabled && prefs.enabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, missedTimeInEnabled: e.target.checked }))}
                  disabled={!prefs.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Incomplete Day</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Remind at {getIncompleteDayDisplay(prefs)} (Check Out) if you checked in but not out
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.incompleteDayEnabled && prefs.enabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, incompleteDayEnabled: e.target.checked }))}
                  disabled={!prefs.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Flame className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Streak Nudge</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Remind at {getStreakNudgeDisplay(prefs)} (30 min after Check In) to keep your streak
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.streakNudgeEnabled && prefs.enabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, streakNudgeEnabled: e.target.checked }))}
                  disabled={!prefs.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Monday Nudge</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Weekly reminder every Monday at {formatTimeDisplay(prefs.timeInHour, prefs.timeInMinute)} (Check In)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.mondayNudgeEnabled && prefs.enabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, mondayNudgeEnabled: e.target.checked }))}
                  disabled={!prefs.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <BarChart3 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Weekly Summary</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Get a summary every Friday at {getIncompleteDayDisplay(prefs)} (Check Out)
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.weeklySummaryEnabled && prefs.enabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, weeklySummaryEnabled: e.target.checked }))}
                  disabled={!prefs.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 rounded-xl p-4 border border-blue-100"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            Reminders are scheduled based on your preferences. Make sure notifications are enabled
            in your browser settings for the best experience.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
