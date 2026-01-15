import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely format a date string or Date object.
 * Returns a formatted date string or a fallback if the date is invalid.
 */
export const safeFormatDate = (
  date: string | number | Date | null | undefined,
  formatStr: string = 'dd MMM yyyy',
  fallback: string = 'TBD'
): string => {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return fallback;

    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};

/**
 * Safely format a time string or Date object.
 */
export const safeFormatTime = (
  date: string | number | Date | null | undefined,
  formatStr: string = 'hh:mm a',
  fallback: string = ''
): string => {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return fallback;

    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting time:', error);
    return fallback;
  }
};
