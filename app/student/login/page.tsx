'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { setRememberMe as saveRememberMe, getRememberedCredentials } from '@/lib/student-storage';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login, user } = useStudentAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStudentIdValid, setIsStudentIdValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.mustChangePassword || !user.profilePicture) {
        router.push('/student/first-login-setup');
      } else {
        router.push('/student/home');
      }
      return;
    }

    // Load remembered credentials
    const remembered = getRememberedCredentials();
    if (remembered) {
      setStudentId(remembered.studentId);
      setPassword(remembered.password);
      setRememberMe(true);
    }
  }, [user, router]);

  useEffect(() => {
    setIsStudentIdValid(studentId.length >= 3 && /^[0-9A-Za-z-]+$/.test(studentId));
  }, [studentId]);

  useEffect(() => {
    setIsPasswordValid(password.length >= 6);
  }, [password]);

  const calculatePasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (!pwd) return { strength: 0, label: '', color: '#E5E5EA' };
    
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/\d/.test(pwd)) strength += 25;
    
    if (strength <= 25) return { strength, label: 'Weak', color: '#FF3B30' };
    if (strength <= 50) return { strength, label: 'Fair', color: '#FF9500' };
    if (strength <= 75) return { strength, label: 'Good', color: '#34C759' };
    return { strength, label: 'Strong', color: '#007AFF' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isStudentIdValid) {
      setError('Student ID must be at least 3 characters');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await login(studentId, password);
      
      // Save credentials if remember me is checked
      saveRememberMe(rememberMe, studentId, password);

      // Redirect based on user state
      if (response.intern.mustChangePassword || !response.intern.profilePicture) {
        router.push('/student/first-login-setup');
      } else {
        router.push('/student/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">InternShip</h1>
          <p className="text-gray-600">Student Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student ID
                {isStudentIdValid && (
                  <CheckCircle2 className="inline-block w-4 h-4 text-green-500 ml-2" />
                )}
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setError(null);
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  isStudentIdValid
                    ? 'border-green-300 bg-green-50 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter Student ID"
                autoCapitalize="none"
                autoComplete="username"
              />
              {studentId.length > 0 && !isStudentIdValid && (
                <p className="text-xs text-red-500 mt-1">Must be at least 3 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
                {isPasswordValid && (
                  <CheckCircle2 className="inline-block w-4 h-4 text-green-500 ml-2" />
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all pr-12 ${
                    isPasswordValid
                      ? 'border-green-300 bg-green-50 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter Password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.strength}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: passwordStrength.color }}
                    />
                  </div>
                  {passwordStrength.label && (
                    <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </p>
                  )}
                </div>
              )}
              
              {password.length > 0 && !isPasswordValid && (
                <p className="text-xs text-red-500 mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !isStudentIdValid || !isPasswordValid}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-target"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
