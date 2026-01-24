'use client';

import { ArrowLeft, Info, GraduationCap, Users, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F6F6F6]">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mac-card p-8 space-y-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-macos-blue/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-macos-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">About InternShip</h1>
              <p className="text-gray-500">Information Network for Tracking Everyday Records and Notification</p>
            </div>
          </div>

          <div className="space-y-6 pt-4 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Our Mission
              </h2>
              <p className="text-sm leading-relaxed">
                InternShip is designed to streamline internship management and tracking for students and administrators. 
                Our platform enables efficient monitoring of daily attendance, activity logs, and progress reporting, 
                ensuring a comprehensive record of internship experiences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Institution
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-1">Exact College of Asia</p>
                <p className="text-sm text-gray-600">Information System Department</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Features
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Daily Time In/Time Out logging with photo verification</li>
                <li>Location-based attendance tracking</li>
                <li>Comprehensive activity reports and analytics</li>
                <li>Calendar view for easy date-based navigation</li>
                <li>Admin dashboard for managing interns and viewing logs</li>
                <li>Mobile app for convenient on-the-go logging</li>
                <li>Notification reminders for consistent logging</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Version</h2>
              <p className="text-sm leading-relaxed">
                Current version: <strong>0.1.0</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-sm leading-relaxed">
                For inquiries, support, or feedback, please contact:{' '}
                <a href="mailto:russelleroxas11@gmail.com" className="text-macos-blue hover:underline">
                  russelleroxas11@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Developer</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-900">Russelle Roxas</p>
                <div className="flex items-center gap-4 text-sm">
                  <a href="https://github.com/Alreriabiceps" target="_blank" rel="noopener noreferrer" className="text-macos-blue hover:underline">
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/rroxas121709/" target="_blank" rel="noopener noreferrer" className="text-macos-blue hover:underline">
                    LinkedIn
                  </a>
                  <a href="https://russelle-roxas-porfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-macos-blue hover:underline">
                    Portfolio
                  </a>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
