'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress browser extension errors (password managers, etc.)
    const handleError = (e: ErrorEvent) => {
      if (
        e.message &&
        (e.message.includes('bootstrap-autofill-overlay') ||
          e.message.includes('insertBefore') ||
          e.message.includes('password manager') ||
          (e.filename && e.filename.includes('extension')))
      ) {
        e.preventDefault();
        return true;
      }
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      if (
        e.reason &&
        e.reason.message &&
        (e.reason.message.includes('bootstrap-autofill-overlay') ||
          e.reason.message.includes('insertBefore') ||
          e.reason.message.includes('password manager') ||
          e.reason.message.includes('NotFoundError'))
      ) {
        e.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
