// apps/web/src/lib/date-ranges.ts
import {
  format,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
  addDays,
  getDaysInMonth,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
} from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TZ = 'America/Mexico_City';

export type DateRange = { from: string; to: string };
export type GroupBy = 'day' | 'week' | 'month';

export interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
  byService: Record<string, { units: number; revenue: number }>;
}

interface AppointmentRow {
  fecha: string;
  precio_cobrado: number | null;
  service_id: string | null;
  service_name: string;
}

/**
 * Formats a Date as YYYY-MM-DD in MX timezone.
 */
function toMxDateString(d: Date): string {
  return formatInTimeZone(d, TZ, 'yyyy-MM-dd');
}

/**
 * Converts a Date to a zoned Date in MX timezone (for date-fns calculations).
 */
function toMxDate(d: Date): Date {
  return toZonedTime(d, TZ);
}

// ─── Current period ranges ────────────────────────────────────────────

export function getTodayRange(now: Date = new Date()): DateRange {
  const today = toMxDateString(now);
  return { from: today, to: today };
}

export function getThisWeekRange(now: Date = new Date()): DateRange {
  const zoned = toMxDate(now);
  // ISO week starts on Monday
  const weekStart = startOfISOWeek(zoned);
  return {
    from: format(weekStart, 'yyyy-MM-dd'),
    to: format(zoned, 'yyyy-MM-dd'),
  };
}

export function getThisMonthRange(now: Date = new Date()): DateRange {
  const zoned = toMxDate(now);
  const monthStart = startOfMonth(zoned);
  return {
    from: format(monthStart, 'yyyy-MM-dd'),
    to: format(zoned, 'yyyy-MM-dd'),
  };
}

// ─── Previous period ranges (fair comparison: same cut-off) ──────────

export function getYesterdayRange(now: Date = new Date()): DateRange {
  const zoned = toMxDate(now);
  const yesterday = subDays(zoned, 1);
  const dayStr = format(yesterday, 'yyyy-MM-dd');
  return { from: dayStr, to: dayStr };
}

/**
 * Previous week, Monday through the same weekday as today.
 * Example: if today is Thu, returns last Mon through last Thu.
 */
export function getLastWeekToTodayRange(now: Date = new Date()): DateRange {
  const zoned = toMxDate(now);
  const thisWeekStart = startOfISOWeek(zoned);
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  // Days elapsed since this week's Monday (0 = Monday, 3 = Thursday)
  const daysSinceMonday = Math.floor(
    (zoned.getTime() - thisWeekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWeekSameDay = addDays(lastWeekStart, daysSinceMonday);
  return {
    from: format(lastWeekStart, 'yyyy-MM-dd'),
    to: format(lastWeekSameDay, 'yyyy-MM-dd'),
  };
}

/**
 * Previous month, day 1 through the same day-of-month as today (clamped).
 * Example: if today is Apr 9, returns Mar 1 through Mar 9.
 * If today is Mar 31, previous month has 28 days, returns Feb 1 through Feb 28.
 */
export function getLastMonthToTodayRange(now: Date = new Date()): DateRange {
  const zoned = toMxDate(now);
  const lastMonth = subMonths(zoned, 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const dayOfMonth = zoned.getDate();
  const daysInLastMonth = getDaysInMonth(lastMonth);
  const clampedDay = Math.min(dayOfMonth, daysInLastMonth);
  const lastMonthSameDay = new Date(
    lastMonth.getFullYear(),
    lastMonth.getMonth(),
    clampedDay
  );
  return {
    from: format(lastMonthStart, 'yyyy-MM-dd'),
    to: format(lastMonthSameDay, 'yyyy-MM-dd'),
  };
}

/**
 * HH:MM:SS string representing "now" in MX timezone.
 * Used as a cutoff for hora_inicio <= cutoff when comparing "hoy" vs "ayer".
 */
export function getCurrentHourCutoff(now: Date = new Date()): string {
  return formatInTimeZone(now, TZ, 'HH:mm:ss');
}

// ─── Sparkline ranges ────────────────────────────────────────────────

/**
 * Returns `n` consecutive single-day ranges ending yesterday (oldest first).
 */
export function getLastNDaysRanges(n: number, now: Date = new Date()): DateRange[] {
  const zoned = toMxDate(now);
  const ranges: DateRange[] = [];
  for (let i = n; i >= 1; i--) {
    const day = subDays(zoned, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    ranges.push({ from: dayStr, to: dayStr });
  }
  return ranges;
}

/**
 * Returns `n` consecutive full-week ranges ending last week (oldest first).
 * Each range is Monday through Sunday.
 */
export function getLastNWeeksRanges(n: number, now: Date = new Date()): DateRange[] {
  const zoned = toMxDate(now);
  const thisWeekStart = startOfISOWeek(zoned);
  const ranges: DateRange[] = [];
  for (let i = n; i >= 1; i--) {
    const weekStart = subWeeks(thisWeekStart, i);
    const weekEnd = endOfISOWeek(weekStart);
    ranges.push({
      from: format(weekStart, 'yyyy-MM-dd'),
      to: format(weekEnd, 'yyyy-MM-dd'),
    });
  }
  return ranges;
}

/**
 * Returns `n` consecutive full-month ranges ending last month (oldest first).
 */
export function getLastNMonthsRanges(n: number, now: Date = new Date()): DateRange[] {
  const zoned = toMxDate(now);
  const ranges: DateRange[] = [];
  for (let i = n; i >= 1; i--) {
    const monthDate = subMonths(zoned, i);
    const monthStart = startOfMonth(monthDate);
    const lastDay = getDaysInMonth(monthDate);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth(), lastDay);
    ranges.push({
      from: format(monthStart, 'yyyy-MM-dd'),
      to: format(monthEnd, 'yyyy-MM-dd'),
    });
  }
  return ranges;
}

// ─── Grouping ────────────────────────────────────────────────────────

/**
 * Groups appointment rows by day/week/month. Sorts output by period ASC.
 */
export function groupByPeriod(rows: AppointmentRow[], groupBy: GroupBy): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();

  for (const row of rows) {
    const key = periodKey(row.fecha, groupBy);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        period: key,
        periodLabel: formatPeriodLabel(key, groupBy),
        revenue: 0,
        units: 0,
        byService: {},
      };
      buckets.set(key, bucket);
    }
    const revenue = Number(row.precio_cobrado ?? 0);
    bucket.revenue += revenue;
    bucket.units += 1;
    const svc = row.service_name || 'Sin servicio';
    if (!bucket.byService[svc]) {
      bucket.byService[svc] = { units: 0, revenue: 0 };
    }
    bucket.byService[svc].units += 1;
    bucket.byService[svc].revenue += revenue;
  }

  return Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Computes the bucket key for a given date.
 * - day: "2026-04-09"
 * - week: "2026-W15" (ISO week)
 * - month: "2026-04"
 */
function periodKey(fecha: string, groupBy: GroupBy): string {
  if (groupBy === 'day') return fecha;
  const date = parseISO(fecha);
  if (groupBy === 'week') {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  // month
  return fecha.slice(0, 7);
}

export function formatPeriodLabel(period: string, groupBy: GroupBy): string {
  if (groupBy === 'day') {
    const date = parseISO(period);
    return format(date, 'd MMM', { locale: es });
  }
  if (groupBy === 'week') {
    // "2026-W15" → "Sem 15"
    const weekNum = period.split('-W')[1];
    return `Sem ${parseInt(weekNum, 10)}`;
  }
  // month: "2026-04" → "abr 2026"
  const date = parseISO(`${period}-01`);
  return format(date, 'MMM yyyy', { locale: es });
}
