'use client';

import { ReactNode } from 'react';

interface FormContainerProps {
  title?: string;
  error?: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export default function FormContainer({
  title,
  error,
  children,
  onSubmit,
  className = '',
}: FormContainerProps) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 mb-6 ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {onSubmit ? (
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
        </form>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}


