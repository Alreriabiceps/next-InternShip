'use client';

import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
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
              <Shield className="w-6 h-6 text-macos-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
              <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 pt-4 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Data Collection
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                InternShip collects and processes the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Student identification information (name, student ID, email)</li>
                <li>Company and internship details</li>
                <li>Daily log entries including timestamps, photos, and location data</li>
                <li>Activity and attendance records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Storage & Security
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to authorized administrators only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Data Usage
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                Your data is used solely for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Tracking and managing internship attendance and activities</li>
                <li>Generating reports for academic and administrative purposes</li>
                <li>Improving the InternShip platform and user experience</li>
                <li>Compliance with institutional requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-sm leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Access your personal data stored in the system</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your data (subject to institutional policies)</li>
                <li>Contact us with privacy concerns at <a href="mailto:russelleroxas11@gmail.com" className="text-macos-blue hover:underline">russelleroxas11@gmail.com</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-sm leading-relaxed">
                For questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:russelleroxas11@gmail.com" className="text-macos-blue hover:underline">
                  russelleroxas11@gmail.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
