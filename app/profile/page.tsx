'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Save, 
  ArrowLeft, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Mail,
  UserCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Section = ({ title, description, icon: Icon, children }: { title: string, description: string, icon: any, children: React.ReactNode }) => (
  <div className="space-y-6">
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 rounded-xl bg-macos-blue/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-macos-blue" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="mac-card p-8 space-y-6">
      {children}
    </div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        name: user.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.username?.trim() || !formData.name?.trim()) {
        setError('Username and name are required');
        setLoading(false);
        return;
      }

      if (formData.newPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          setError('Current password is required to change password');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }
      }

      const updateData: any = {
        username: formData.username,
        name: formData.name,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await api.put('/auth/profile', updateData);

      if (response.data.success) {
        setSuccess('Security profile updated successfully!');
        await checkAuth(); 
        setFormData({
          username: response.data.user?.username || formData.username,
          name: response.data.user?.name || formData.name,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2.5 bg-black/5 hover:bg-black/10 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-3 p-4 bg-macos-red/10 border border-macos-red/20 rounded-2xl text-macos-red text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-3 p-4 bg-macos-green/10 border border-macos-green/20 rounded-2xl text-macos-green text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-10 pb-20">
        <Section 
          title="Personal Information" 
          description="Update your identification and display details."
          icon={UserCircle}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                  className="mac-input w-full pl-4 font-semibold"
                  placeholder="admin_user"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="mac-input w-full pl-4 font-semibold"
                placeholder="Administrator"
              />
            </div>
          </div>
        </Section>

        <Section 
          title="Security & Password" 
          description="Maintain account safety with regular password updates."
          icon={Shield}
        >
          <div className="space-y-8">
            <div className="space-y-2 max-w-md">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  className="mac-input w-full !pl-[56px]"
                  placeholder="Required for any security changes"
                  style={{ paddingLeft: '56px' }}
                />
              </div>
            </div>

            <div className="h-px bg-black/5" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    className="mac-input w-full !pl-[56px]"
                    placeholder="Min. 6 characters"
                    style={{ paddingLeft: '56px' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="mac-input w-full !pl-[56px]"
                    placeholder="Repeat new password"
                    style={{ paddingLeft: '56px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="mac-button-primary flex items-center space-x-2 px-10 py-4 font-bold text-base shadow-xl shadow-macos-blue/30 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>Save All Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
