'use client';

import { ArrowLeft, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-macos-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Terms of Service</h1>
              <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 pt-4 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                By accessing and using the InternShip platform, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                User Responsibilities
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Provide accurate and truthful information when submitting logs</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
                <li>Use the platform in compliance with institutional policies and applicable laws</li>
                <li>Submit daily logs in a timely and honest manner</li>
                <li>Respect the privacy and rights of other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Prohibited Activities
              </h2>
              <p className="text-sm leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Submit false, misleading, or fraudulent log entries</li>
                <li>Attempt to gain unauthorized access to the system or other users' accounts</li>
                <li>Use the platform for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the platform's operation or security</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Service Availability</h2>
              <p className="text-sm leading-relaxed">
                We strive to maintain high availability of the InternShip platform but do not guarantee 
                uninterrupted access. The service may be temporarily unavailable due to maintenance, 
                updates, or unforeseen circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-sm leading-relaxed">
                All content, features, and functionality of the InternShip platform are owned by Exact College of Asia 
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-sm leading-relaxed">
                InternShip and Exact College of Asia shall not be liable for any indirect, incidental, 
                special, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-sm leading-relaxed">
                For questions about these Terms of Service, please contact us at{' '}
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
