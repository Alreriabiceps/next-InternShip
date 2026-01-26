import { format } from 'date-fns';

/**
 * Returns the calendar date key (YYYY-MM-DD) for a log's date field.
 * Log dates are stored as UTC midnight, so we use the UTC date part
 * so grouping and filtering are timezone-independent.
 */
export function getLogDateKey(date: string | Date): string {
  if (typeof date === 'string' && date.length >= 10) {
    return date.slice(0, 10);
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/**
 * Parses a YYYY-MM-DD key as local date for display (avoids UTC midnight showing as previous day).
 */
export function parseLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a log's date for display (e.g. "Jan 25, 2025") without timezone shift.
 */
export function formatLogDate(date: string | Date, formatStr: string = 'MMM d, yyyy'): string {
  const key = getLogDateKey(date);
  return format(parseLocalDate(key), formatStr);
}
