'use client';

import { ArrowLeft, HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HelpPage() {
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
              <HelpCircle className="w-6 h-6 text-macos-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Help & Support</h1>
              <p className="text-gray-500">Get assistance with InternShip Admin Dashboard</p>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">Dashboard Overview</h3>
                  <p className="text-sm leading-relaxed">
                    The dashboard provides a comprehensive view of intern activity, including total logs, completion rates, and recent submissions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Managing Interns</h3>
                  <p className="text-sm leading-relaxed">
                    Navigate to <strong>Intern Profiles</strong> to view, add, edit, or remove intern accounts. You can filter by company and search by name or student ID.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Viewing Logs</h3>
                  <p className="text-sm leading-relaxed">
                    The <strong>Activity Logs</strong> section shows all daily submissions. Filter by date, intern, company, or completion status. Click on any log to view detailed information including photos and location.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Calendar View</h3>
                  <p className="text-sm leading-relaxed">
                    Use the <strong>Calendar</strong> to see daily activity at a glance. Click on any date to view all interns who submitted logs on that day.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Common Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">How do I add a new intern?</h3>
                  <p className="text-sm text-gray-600">Go to Intern Profiles and click the "Add Intern" button. Fill in the required information and save.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Can I export log data?</h3>
                  <p className="text-sm text-gray-600">Yes, visit the Reports section to generate and download reports in various formats.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">How do I filter logs by company?</h3>
                  <p className="text-sm text-gray-600">Use the filter options in the Activity Logs page. You can select a specific company from the dropdown.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Support</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-macos-blue" />
                  <div>
                    <p className="font-semibold text-gray-900">Email Support</p>
                    <a href="mailto:russelleroxas11@gmail.com" className="text-sm text-macos-blue hover:underline">
                      russelleroxas11@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-macos-blue" />
                  <div>
                    <p className="font-semibold text-gray-900">Need more help?</p>
                    <p className="text-sm text-gray-600">Reach out via email for technical assistance or feature requests.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
