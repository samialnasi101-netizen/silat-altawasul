/**
 * Saudi Arabia uses Arabia Standard Time (AST) = UTC+3, no DST.
 * Helpers for "today" and time comparisons in Saudi time.
 */

const TIMEZONE = 'Asia/Riyadh';

/** Get current date parts (year, month, day) in Saudi. */
export function getSaudiDateParts(from: Date = new Date()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(from);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10);
  return { year, month, day };
}

/** Get current time parts (hours, minutes) in Saudi. Use for client-side comparison. */
export function getSaudiTimeParts(from: Date = new Date()): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(from);
  const hours = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return { hours, minutes };
}

/** Parse "HH:mm" to minutes since midnight (for comparison). */
export function timeStringToMinutes(timeStr: string): number {
  const parts = (timeStr || '09:00').trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  return h * 60 + m;
}

/** Parse "HH:mm" (e.g. "09:00") as that time in Saudi on the given Saudi date; returns UTC Date for comparison with Date.now(). */
export function parseWorkTimeToSaudiToday(
  timeStr: string,
  ref: Date = new Date()
): Date {
  const { year, month, day } = getSaudiDateParts(ref);
  const parts = (timeStr || '09:00').trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  // Saudi = UTC+3, so local 09:00 Saudi = 06:00 UTC
  return new Date(Date.UTC(year, month - 1, day, h - 3, m, 0, 0));
}

/** Current moment - use for display in Saudi. Same as new Date() but when formatted with Asia/Riyadh shows correct time. */
export function nowInSaudi(): Date {
  return new Date();
}

/** Format a Date for display in Saudi time (e.g. time only). */
export function formatTimeSaudi(date: Date): string {
  return date.toLocaleTimeString('ar-SA', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateSaudi(date: Date): string {
  return date.toLocaleDateString('ar-SA', { timeZone: TIMEZONE });
}
