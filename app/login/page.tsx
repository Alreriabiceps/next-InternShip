'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Github, Linkedin, Globe, Facebook, Eye, EyeOff, Check } from 'lucide-react';
import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const REMEMBER_KEY = 'internship_admin_remember';
const REMEMBER_USER_KEY = 'internship_admin_remember_username';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      const savedUser = localStorage.getItem(REMEMBER_USER_KEY);
      if (saved === '1' && savedUser) {
        setRememberMe(true);
        setUsername(savedUser);
      }
    } catch (_) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, '1');
            localStorage.setItem(REMEMBER_USER_KEY, username);
          } else {
            localStorage.removeItem(REMEMBER_KEY);
            localStorage.removeItem(REMEMBER_USER_KEY);
          }
        } catch (_) {}
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#F2F2F7]">
      {/* Refined clean background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-macos-blue/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-macos-blue/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[420px] z-10 p-6"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.06)] border border-white/20 overflow-hidden">
          <div className="p-10 pt-12 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative w-20 h-20 mx-auto mb-6"
            >
              <Image 
                src="/logo.png" 
                alt="InternShip Logo" 
                fill 
                className="object-contain drop-shadow-md"
                priority
              />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              InternShip
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Information Network for Tracking Everyday Records and Notification
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-10 pb-12 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-macos-red/5 border border-macos-red/10 text-macos-red text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-macos-blue transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="w-full bg-black/5 border-none rounded-2xl pl-11 pr-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-macos-blue/40 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-macos-blue transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-black/5 border-none rounded-2xl pl-11 pr-12 py-4 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-macos-blue/40 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                  rememberMe ? 'border-macos-blue bg-macos-blue' : 'border-gray-300 group-hover:border-gray-400'
                )}
                aria-hidden
              >
                {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-sm text-gray-600 group-hover:text-gray-800">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-macos-blue text-white py-4 px-4 rounded-2xl font-bold shadow-lg shadow-macos-blue/20 hover:bg-[#0071EB] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
        
        <footer className="mt-8 flex items-center justify-center gap-4">
          <a
            href="https://github.com/Alreriabiceps"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/rroxas121709/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="https://russelle-roxas-porfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            aria-label="Portfolio"
          >
            <Globe className="w-5 h-5" />
          </a>
          <a
            href="https://www.facebook.com/raroxas1217092/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </footer>
      </motion.div>
    </div>
  );
}
