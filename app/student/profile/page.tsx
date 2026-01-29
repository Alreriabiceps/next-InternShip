'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { studentApi } from '@/lib/student-api';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';
import { 
  User, 
  LogOut, 
  FileText, 
  CheckCircle2, 
  Flame, 
  Building2, 
  MapPin, 
  School,
  Info,
  HelpCircle,
  MessageSquare,
  Phone,
  Trophy,
  Calendar,
  Link as LinkIcon,
  Settings,
  Camera,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getLogDateKey, parseLocalDate } from '@/lib/date';

interface Log {
  _id: string;
  date: string;
  amLog?: { timestamp: string };
  pmLog?: { timestamp: string };
}

interface MergedLog {
  _id: string;
  date: string;
  amLog?: Log['amLog'];
  pmLog?: Log['pmLog'];
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser, updateUserLocally } = useStudentAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadLogs();
    }
  }, [user?.id]);

  const loadLogs = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await studentApi.getLogs(user.id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergedLogs = useMemo(() => {
    const byDate = new Map<string, Log[]>();
    logs.forEach((l) => {
      const key = getLogDateKey(l.date);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(l);
    });
    const result: MergedLog[] = [];
    byDate.forEach((dateLogs, key) => {
      const first = dateLogs[0]!;
      let amLog = first.amLog;
      let pmLog = first.pmLog;
      for (let i = 1; i < dateLogs.length; i++) {
        const l = dateLogs[i]!;
        if (l.amLog) amLog = l.amLog;
        if (l.pmLog) pmLog = l.pmLog;
      }
      const withBoth = dateLogs.find((l) => l.amLog && l.pmLog);
      const primary = withBoth ?? dateLogs.find((l) => l.pmLog) ?? first;
      result.push({ _id: primary._id, date: key, amLog, pmLog });
    });
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const totalLogs = mergedLogs.length;
  const completeLogs = mergedLogs.filter((m) => m.amLog && m.pmLog).length;
  const lastLog = mergedLogs[0];
  const lastLogDate = lastLog ? parseLocalDate(lastLog.date) : null;

  const memberSinceDate = useMemo(() => {
    if (mergedLogs.length === 0) return null;
    const oldest = mergedLogs.reduce(
      (acc, m) => (m.date < acc.date ? m : acc),
      mergedLogs[0]
    );
    return parseLocalDate(oldest!.date);
  }, [mergedLogs]);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const streak = useMemo(() => {
    if (mergedLogs.length === 0) return 0;
    const byDate = new Map<string, MergedLog>();
    mergedLogs.forEach((m) => {
      if (m.amLog && m.pmLog) byDate.set(m.date, m);
    });
    if (byDate.size === 0) return 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    if (!byDate.has(todayKey)) checkDate = subDays(checkDate, 1);
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(checkDate, 'yyyy-MM-dd');
      if (byDate.has(d)) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return count;
  }, [mergedLogs, todayKey]);

  const perfectWeek = useMemo(() => {
    if (mergedLogs.length < 7) return false;
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekLogs = mergedLogs.filter((m) =>
      isWithinInterval(parseLocalDate(m.date), { start: weekStart, end: weekEnd })
    );
    const completeWeek = weekLogs.filter((m) => m.amLog && m.pmLog);
    return completeWeek.length >= 7;
  }, [mergedLogs]);

  const achievements = [
    { id: '10', label: '10 Logs', icon: FileText, unlocked: totalLogs >= 10 },
    { id: '50', label: '50 Logs', icon: FileText, unlocked: totalLogs >= 50 },
    { id: 'week', label: 'Perfect Week', icon: Calendar, unlocked: perfectWeek },
    { id: 'streak7', label: '7-Day Streak', icon: Flame, unlocked: streak >= 7 },
    { id: 'streak30', label: '30-Day Streak', icon: Trophy, unlocked: streak >= 30 },
  ];

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.studentId) return;

    setUploading(true);
    try {
      const result = await studentApi.uploadProfilePicture(user.studentId, file);
      if (result.success && result.profilePicture) {
        updateUserLocally({ profilePicture: result.profilePicture });
        await refreshUser();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/student/login');
  };

  const handleAbout = () => {
    alert(
      'InternShip helps you track your daily Check In and Check Out logs during your internship. Submit photos and location for each entry.'
    );
  };

  const handleHelp = () => {
    alert(
      '• Tap Check In / Check Out on Home to submit logs.\n• Each log requires a photo and your location.\n• View past logs in the Logs tab.\n• Contact your coordinator for account issues.'
    );
  };

  const handleFeedback = () => {
    const email = 'russelleroxas11@gmail.com';
    const subject = encodeURIComponent('InternShip App Feedback');
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  const socialLinks = {
    linkedin: 'https://www.linkedin.com/in/rroxas121709/',
    github: 'https://github.com/Alreriabiceps',
    portfolio: 'https://russelle-roxas-porfolio.vercel.app/',
    facebook: 'https://www.facebook.com/raroxas1217092/',
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

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-12"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={120}
                height={120}
                className="rounded-full border-4 border-white/30"
              />
            ) : (
              <div className="w-30 h-30 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-bold">{user?.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors border-2 border-white">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-4">{user?.name}</h1>
          <p className="text-blue-100">{user?.email}</p>
        </div>
      </motion.div>

      <div className="px-6 -mt-6 space-y-6">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Account Info</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Status</span>
              <span className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs font-semibold text-green-700">Active</span>
              </span>
            </div>
            {memberSinceDate && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Member since</span>
                <span className="text-sm font-semibold text-gray-900">
                  {format(memberSinceDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}
            {user?.studentId && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Student ID</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{user.studentId}</span>
              </div>
            )}
            {user?.company && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Company</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 text-right">{user.company}</span>
              </div>
            )}
            {user?.companyAddress && (
              <div className="flex items-start justify-between py-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-500">Address</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">
                  {user.companyAddress}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Activity Summary</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
              <p className="text-xs text-gray-500">Total logs</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{completeLogs}</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{streak}</p>
              <p className="text-xs text-gray-500">Day streak</p>
            </div>
          </div>
          {lastLogDate && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Last log</span>
              <span className="text-sm font-semibold text-gray-900">
                {isSameDay(lastLogDate, today) ? 'Today' : format(lastLogDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 text-center ${
                    achievement.unlocked
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      achievement.unlocked ? 'bg-blue-100' : 'bg-gray-200'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        achievement.unlocked ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {achievement.label}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Connect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Connect</h2>
          </div>
          <div className="space-y-2">
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                <span>→</span>
              </a>
            )}
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">GitHub</span>
                <span>→</span>
              </a>
            )}
            {socialLinks.portfolio && (
              <a
                href={socialLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Portfolio</span>
                <span>→</span>
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">Facebook</span>
                <span>→</span>
              </a>
            )}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleAbout}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">About</span>
              </div>
              <span>→</span>
            </button>
            <button
              onClick={handleHelp}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Help</span>
              </div>
              <span>→</span>
            </button>
            <button
              onClick={() => router.push('/student/reminders')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Reminders</span>
              </div>
              <span>→</span>
            </button>
            <button
              onClick={handleFeedback}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Feedback</span>
              </div>
              <span>→</span>
            </button>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Version</span>
              </div>
              <span className="text-sm text-gray-500">1.0.0</span>
            </div>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign out</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
