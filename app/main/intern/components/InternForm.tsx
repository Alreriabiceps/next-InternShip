'use client';

import { InternFormData } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InternFormProps {
  formData: InternFormData;
  error: string;
  onChange: (data: InternFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing?: boolean;
}

export default function InternForm({ formData, error, onChange, onSubmit, isEditing = false }: InternFormProps) {
  const handleChange = (field: keyof InternFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  const fields = [
    { label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe', required: true },
    { label: 'Email Address', field: 'email', type: 'email', placeholder: 'john@example.com', required: true },
    { label: 'Student ID', field: 'studentId', type: 'text', placeholder: 'INT-2026-001', required: true },
    { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '+63 912 345 6789', required: false },
    { label: 'Company Name', field: 'company', type: 'text', placeholder: 'Acme Corp', required: true },
    { label: 'Company Address', field: 'companyAddress', type: 'text', placeholder: '123 Tech Lane, Silicon Valley', required: true },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-4 bg-macos-red/10 border border-macos-red/20 rounded-2xl text-macos-red text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {fields.map((f) => (
          <div key={f.field} className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 ml-1 uppercase tracking-wider">
              {f.label} {f.required && <span className="text-macos-red">*</span>}
            </label>
            <input
              type={f.type}
              value={formData[f.field as keyof InternFormData]}
              onChange={(e) => handleChange(f.field as keyof InternFormData, e.target.value)}
              required={f.required}
              placeholder={f.placeholder}
              className="mac-input w-full text-[15px] font-medium"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="mac-button-primary flex items-center space-x-2 px-8 py-3 font-bold text-[15px] shadow-lg shadow-macos-blue/30"
        >
          <Check className="w-5 h-5" />
          <span>{isEditing ? 'Update Intern Profile' : 'Create Intern Account'}</span>
        </button>
      </div>
    </form>
  );
}
