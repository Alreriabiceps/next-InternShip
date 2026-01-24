'use client';

import { Github, Linkedin, Globe, Facebook } from 'lucide-react';
import Link from 'next/link';

const APP_VERSION = '0.1.0';

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-xl border-t border-black/5 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          {/* Brand & Info */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-gray-900">InternShip</h3>
            <p className="text-xs text-gray-500 leading-tight">
              Information Network for Tracking Everyday Records and Notification
            </p>
            <p className="text-xs text-gray-600 pt-1">
              Information System · Exact College of Asia
            </p>
          </div>

          {/* Links */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Resources</h4>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
              <li><Link href="/help" className="text-gray-500 hover:text-gray-900 transition-colors">Help</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">Terms</Link></li>
              <li><Link href="/about" className="text-gray-500 hover:text-gray-900 transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Connect</h4>
            <div className="flex items-center gap-2">
              <a href="https://github.com/Alreriabiceps" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors" aria-label="GitHub"><Github className="w-5 h-5" /></a>
              <a href="https://www.linkedin.com/in/rroxas121709/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
              <a href="https://russelle-roxas-porfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors" aria-label="Portfolio"><Globe className="w-5 h-5" /></a>
              <a href="https://www.facebook.com/raroxas1217092/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-3 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} InternShip</p>
          <div className="flex items-center gap-2">
            <span>v{APP_VERSION}</span>
            <span className="hidden md:inline">·</span>
            <span>Exact College of Asia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
