# Dashboard Analytics Temporal Breakdowns — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add day/week/month breakdowns of revenue, units washed, and service type to `/admin/dashboard` (executive summary with sparklines + comparisons) and `/admin/reportes` (deep analysis with temporal charts and sortable tables).

**Architecture:** Extend the existing `/api/admin/analytics` endpoint with temporal series data, add a new lightweight `/api/admin/analytics/summary` endpoint dedicated to the dashboard's three period cards, and add React components using the already-installed `recharts` library. Date logic is centralized in a testable `lib/date-ranges.ts` module using `date-fns-tz` with `America/Mexico_City` timezone.

**Tech Stack:**
- Next.js 14 App Router (existing)
- Supabase JS SDK (existing)
- `recharts` ^3.8.1 (**already installed** in `apps/web`)
- `date-fns` + `date-fns-tz` (**new**, to be installed in `apps/web`)
- `node:test` built-in runner for unit tests (no new dev dependency)
- TypeScript, Tailwind CSS (existing)

**Spec reference:** `docs/superpowers/specs/2026-04-09-dashboard-analytics-breakdowns-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|---------------|
| `apps/web/src/lib/date-ranges.ts` | Pure functions for computing current/previous period ranges and grouping rows by day/week/month. All timezone-aware (MX). |
| `apps/web/src/lib/date-ranges.test.ts` | Unit tests using `node:test` for date-ranges helpers. |
| `apps/web/src/lib/analytics-colors.ts` | Fixed color palette for stacked service charts. Deterministic assignment by service name. |
| `apps/web/src/lib/analytics-helpers.ts` | Shared query helpers: fetches completed+rated appointments for a car wash + date range, applies optional hora_inicio cutoff. Used by both API routes. |
| `apps/web/src/app/api/admin/analytics/summary/route.ts` | New lightweight endpoint for the dashboard's three period cards. |
| `apps/web/src/components/period-card.tsx` | Dashboard card: label, units, revenue, delta %, sparkline. Server component wrapping a client Sparkline. |
| `apps/web/src/components/sparkline.tsx` | Client component: thin recharts LineChart, no axes/tooltip. |
| `apps/web/src/components/top-services-card.tsx` | Dashboard card: top 3 services of current month. Server component. |
| `apps/web/src/components/revenue-line-chart.tsx` | Client component: recharts LineChart for /reportes revenue-over-time. |
| `apps/web/src/components/stacked-services-chart.tsx` | Client component: recharts stacked BarChart of units by service over time. |
| `apps/web/src/components/service-breakdown-table.tsx` | Client component: sortable table of services (units, revenue, avg ticket, %). |
| `apps/web/src/components/period-toggle.tsx` | Client component: segmented control for Day/Week/Month grouping. |

### Modified files

| Path | Changes |
|------|---------|
| `apps/web/package.json` | Add `date-fns` + `date-fns-tz` dependencies. Add `test:unit` script. |
| `apps/web/src/app/admin/dashboard/page.tsx` | Rewrite data fetching to use new summary helper. Replace "Citas hoy" and "Ingresos totales" cards with 3 PeriodCards + TopServicesCard. Keep Calificación, Estatus, Próximas citas. |
| `apps/web/src/app/api/admin/analytics/route.ts` | Extend response with `series` and `topServices` fields. Accept `from`, `to`, `group_by` params. Keep `days` backward compatibility. |
| `apps/web/src/app/admin/reportes/analytics-client.tsx` | Add period toggle, date range picker, call the extended endpoint, render new revenue-line-chart + stacked-services-chart + service-breakdown-table. Keep existing charts. |

---

## Tasks

### Task 1: Install date-fns dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install dependencies**

Run from repo root:
```bash
cd "apps/web" && npm install date-fns@^3.6.0 date-fns-tz@^3.2.0
```

Expected: `package.json` shows both packages in `dependencies`. No install errors.

- [ ] **Step 2: Verify install**

```bash
cd "apps/web" && node -e "console.log(require('date-fns-tz').fromZonedTime('2026-04-09', 'America/Mexico_City'))"
```

Expected: Prints a Date object (no errors).

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: add date-fns and date-fns-tz for analytics timezone handling"
```

---

### Task 2: Create analytics-colors utility

**Files:**
- Create: `apps/web/src/lib/analytics-colors.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/web/src/lib/analytics-colors.ts

/**
 * Fixed palette for service colors in stacked charts.
 * Colors are drawn from the Tailwind config tokens to stay consistent
 * with the rest of the app's visual identity.
 */
const SERVICE_PALETTE = [
  '#059669', // accent (emerald 600)
  '#0284C7', // primary (sky 600)
  '#F59E0B', // warning (amber 500)
  '#8B5CF6', // violet 500
  '#EC4899', // pink 500
  '#14B8A6', // teal 500
  '#F97316', // orange 500
  '#6366F1', // indigo 500
] as const;

/**
 * Deterministic color assignment. Sorts service names alphabetically
 * and assigns palette colors by index so the same service always
 * gets the same color across renders.
 */
export function assignServiceColors(serviceNames: string[]): Record<string, string> {
  const sorted = [...new Set(serviceNames)].sort((a, b) => a.localeCompare(b, 'es'));
  const result: Record<string, string> = {};
  for (let i = 0; i < sorted.length; i++) {
    result[sorted[i]] = SERVICE_PALETTE[i % SERVICE_PALETTE.length];
  }
  return result;
}

export { SERVICE_PALETTE };
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/analytics-colors.ts
git commit -m "feat(analytics): add fixed service color palette"
```

---

### Task 3: Write failing tests for date-ranges helpers

**Files:**
- Create: `apps/web/src/lib/date-ranges.test.ts`

- [ ] **Step 1: Write tests using node:test**

```ts
// apps/web/src/lib/date-ranges.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTodayRange,
  getThisWeekRange,
  getThisMonthRange,
  getYesterdayRange,
  getLastWeekToTodayRange,
  getLastMonthToTodayRange,
  getCurrentHourCutoff,
  getLastNDaysRanges,
  getLastNWeeksRanges,
  getLastNMonthsRanges,
  groupByPeriod,
  formatPeriodLabel,
} from './date-ranges';

// All tests use a fixed "now" via the optional `now` parameter for determinism.

test('getTodayRange returns same day for from and to', () => {
  const now = new Date('2026-04-09T15:30:00Z'); // 9:30 AM MX (UTC-6)
  const range = getTodayRange(now);
  assert.equal(range.from, '2026-04-09');
  assert.equal(range.to, '2026-04-09');
});

test('getYesterdayRange returns previous day', () => {
  const now = new Date('2026-04-09T15:30:00Z');
  const range = getYesterdayRange(now);
  assert.equal(range.from, '2026-04-08');
  assert.equal(range.to, '2026-04-08');
});

test('getThisWeekRange starts on Monday and ends on current day (Thursday 2026-04-09)', () => {
  // 2026-04-09 is a Thursday
  const now = new Date('2026-04-09T15:30:00Z');
  const range = getThisWeekRange(now);
  assert.equal(range.from, '2026-04-06'); // Monday
  assert.equal(range.to, '2026-04-09');   // Thursday (today)
});

test('getLastWeekToTodayRange returns previous week Monday to same weekday', () => {
  // If today is Thursday 2026-04-09, last week's window is Mon 2026-03-30 to Thu 2026-04-02
  const now = new Date('2026-04-09T15:30:00Z');
  const range = getLastWeekToTodayRange(now);
  assert.equal(range.from, '2026-03-30');
  assert.equal(range.to, '2026-04-02');
});

test('getThisMonthRange goes from day 1 to today', () => {
  const now = new Date('2026-04-09T15:30:00Z');
  const range = getThisMonthRange(now);
  assert.equal(range.from, '2026-04-01');
  assert.equal(range.to, '2026-04-09');
});

test('getLastMonthToTodayRange goes from day 1 of last month to same day of last month', () => {
  const now = new Date('2026-04-09T15:30:00Z');
  const range = getLastMonthToTodayRange(now);
  assert.equal(range.from, '2026-03-01');
  assert.equal(range.to, '2026-03-09');
});

test('getLastMonthToTodayRange handles shorter previous month (Mar 31 -> Feb 28)', () => {
  const now = new Date('2026-03-31T15:30:00Z');
  const range = getLastMonthToTodayRange(now);
  assert.equal(range.from, '2026-02-01');
  // Feb 2026 has 28 days, so the clamp is 2026-02-28
  assert.equal(range.to, '2026-02-28');
});

test('getCurrentHourCutoff returns HH:MM:SS in MX timezone', () => {
  const now = new Date('2026-04-09T15:30:45Z'); // 9:30:45 AM MX
  const cutoff = getCurrentHourCutoff(now);
  assert.equal(cutoff, '09:30:45');
});

test('getLastNDaysRanges returns n consecutive day ranges ending yesterday', () => {
  const now = new Date('2026-04-09T15:30:00Z');
  const ranges = getLastNDaysRanges(3, now);
  assert.equal(ranges.length, 3);
  assert.deepEqual(ranges[0], { from: '2026-04-06', to: '2026-04-06' });
  assert.deepEqual(ranges[1], { from: '2026-04-07', to: '2026-04-07' });
  assert.deepEqual(ranges[2], { from: '2026-04-08', to: '2026-04-08' });
});

test('getLastNWeeksRanges returns n consecutive full-week ranges ending last week', () => {
  const now = new Date('2026-04-09T15:30:00Z'); // Thursday
  const ranges = getLastNWeeksRanges(2, now);
  assert.equal(ranges.length, 2);
  // Two weeks ago: Mon 2026-03-23 to Sun 2026-03-29
  assert.deepEqual(ranges[0], { from: '2026-03-23', to: '2026-03-29' });
  // Last week: Mon 2026-03-30 to Sun 2026-04-05
  assert.deepEqual(ranges[1], { from: '2026-03-30', to: '2026-04-05' });
});

test('getLastNMonthsRanges returns n consecutive full-month ranges ending last month', () => {
  const now = new Date('2026-04-09T15:30:00Z');
  const ranges = getLastNMonthsRanges(2, now);
  assert.equal(ranges.length, 2);
  // Two months ago: Feb 2026 (2026-02-01 to 2026-02-28)
  assert.deepEqual(ranges[0], { from: '2026-02-01', to: '2026-02-28' });
  // Last month: Mar 2026 (2026-03-01 to 2026-03-31)
  assert.deepEqual(ranges[1], { from: '2026-03-01', to: '2026-03-31' });
});

test('groupByPeriod day groups rows by fecha', () => {
  const rows = [
    { fecha: '2026-04-07', precio_cobrado: 100, service_id: 's1', service_name: 'A' },
    { fecha: '2026-04-07', precio_cobrado: 200, service_id: 's2', service_name: 'B' },
    { fecha: '2026-04-08', precio_cobrado: 150, service_id: 's1', service_name: 'A' },
  ];
  const result = groupByPeriod(rows, 'day');
  assert.equal(result.length, 2);
  assert.equal(result[0].period, '2026-04-07');
  assert.equal(result[0].revenue, 300);
  assert.equal(result[0].units, 2);
  assert.deepEqual(result[0].byService['A'], { units: 1, revenue: 100 });
  assert.deepEqual(result[0].byService['B'], { units: 1, revenue: 200 });
  assert.equal(result[1].period, '2026-04-08');
  assert.equal(result[1].revenue, 150);
  assert.equal(result[1].units, 1);
});

test('groupByPeriod week groups rows by ISO week', () => {
  const rows = [
    // Week of 2026-03-30 (Mon) to 2026-04-05 (Sun)
    { fecha: '2026-03-30', precio_cobrado: 100, service_id: 's1', service_name: 'A' },
    { fecha: '2026-04-05', precio_cobrado: 200, service_id: 's1', service_name: 'A' },
    // Week of 2026-04-06 (Mon) to 2026-04-12 (Sun)
    { fecha: '2026-04-07', precio_cobrado: 300, service_id: 's1', service_name: 'A' },
  ];
  const result = groupByPeriod(rows, 'week');
  assert.equal(result.length, 2);
  assert.equal(result[0].revenue, 300); // 100 + 200
  assert.equal(result[1].revenue, 300);
  assert.equal(result[1].units, 1);
});

test('groupByPeriod month groups rows by YYYY-MM', () => {
  const rows = [
    { fecha: '2026-03-15', precio_cobrado: 100, service_id: 's1', service_name: 'A' },
    { fecha: '2026-03-31', precio_cobrado: 200, service_id: 's1', service_name: 'A' },
    { fecha: '2026-04-01', precio_cobrado: 300, service_id: 's1', service_name: 'A' },
  ];
  const result = groupByPeriod(rows, 'month');
  assert.equal(result.length, 2);
  assert.equal(result[0].period, '2026-03');
  assert.equal(result[0].revenue, 300);
  assert.equal(result[0].units, 2);
  assert.equal(result[1].period, '2026-04');
});

test('formatPeriodLabel formats day as "d MMM"', () => {
  assert.equal(formatPeriodLabel('2026-04-09', 'day'), '9 abr');
});

test('formatPeriodLabel formats week as "Sem W"', () => {
  // ISO week 15 of 2026 is the one containing 2026-04-09
  const label = formatPeriodLabel('2026-W15', 'week');
  assert.equal(label, 'Sem 15');
});

test('formatPeriodLabel formats month as "MMM YYYY"', () => {
  assert.equal(formatPeriodLabel('2026-04', 'month'), 'abr 2026');
});
```

- [ ] **Step 2: Add test:unit script to package.json**

Edit `apps/web/package.json`, add to `scripts` object:

```json
"test:unit": "node --import tsx --test 'src/**/*.test.ts'"
```

The scripts block becomes:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:unit": "node --import tsx --test 'src/**/*.test.ts'"
}
```

- [ ] **Step 3: Install tsx for running TypeScript tests**

```bash
cd "apps/web" && npm install --save-dev tsx@^4.7.0
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd "apps/web" && npm run test:unit
```

Expected: FAIL — module `./date-ranges` not found (file doesn't exist yet).

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/lib/date-ranges.test.ts
git commit -m "test(analytics): add failing tests for date-ranges helpers"
```

---

### Task 4: Implement date-ranges helpers

**Files:**
- Create: `apps/web/src/lib/date-ranges.ts`

- [ ] **Step 1: Create the file with full implementation**

```ts
// apps/web/src/lib/date-ranges.ts
import {
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
  getDay,
  addDays,
  getDaysInMonth,
  parseISO,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  startOfISOWeek,
  endOfISOWeek,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
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
  const daysSinceMonday = Math.floor((zoned.getTime() - thisWeekStart.getTime()) / (1000 * 60 * 60 * 24));
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

  return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd "apps/web" && npm run test:unit
```

Expected: All tests pass.

- [ ] **Step 3: If any test fails**

Read the failure, fix the implementation (NOT the test, unless the test itself is wrong based on the spec). Re-run until green.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/date-ranges.ts
git commit -m "feat(analytics): implement timezone-aware date range helpers"
```

---

### Task 5: Create analytics-helpers shared query module

**Files:**
- Create: `apps/web/src/lib/analytics-helpers.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/web/src/lib/analytics-helpers.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AppointmentRow {
  id: string;
  fecha: string;
  hora_inicio: string;
  precio_cobrado: number | null;
  estado: string;
  service_id: string | null;
  client_id: string;
  service_name: string;
}

/**
 * Fetches completed+rated appointments for a car wash within a date range.
 * Optionally applies an hora_inicio cutoff (used for fair "hoy vs ayer"
 * comparisons where both ranges are truncated to the same time-of-day).
 */
export async function fetchCompletedAppointments(
  supabase: SupabaseClient,
  carWashId: string,
  range: { from: string; to: string },
  hourCutoff?: string
): Promise<AppointmentRow[]> {
  let query = supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, precio_cobrado, estado, service_id, client_id, services(nombre)')
    .eq('car_wash_id', carWashId)
    .in('estado', ['completed', 'rated'])
    .gte('fecha', range.from)
    .lte('fecha', range.to);

  if (hourCutoff) {
    query = query.lte('hora_inicio', hourCutoff);
  }

  const { data } = await query;
  const rows = (data ?? []) as Array<{
    id: string;
    fecha: string;
    hora_inicio: string;
    precio_cobrado: number | null;
    estado: string;
    service_id: string | null;
    client_id: string;
    services: { nombre: string } | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha,
    hora_inicio: r.hora_inicio,
    precio_cobrado: r.precio_cobrado,
    estado: r.estado,
    service_id: r.service_id,
    client_id: r.client_id,
    service_name: r.services?.nombre ?? 'Sin servicio',
  }));
}

/**
 * Returns the sum of units and revenue from a list of appointment rows.
 */
export function aggregateTotals(rows: AppointmentRow[]): { units: number; revenue: number } {
  return {
    units: rows.length,
    revenue: rows.reduce((sum, r) => sum + Number(r.precio_cobrado ?? 0), 0),
  };
}

/**
 * Verifies the authenticated user owns the given car wash.
 * Returns true if authorized, false otherwise.
 */
export async function verifyCarWashOwnership(
  supabase: SupabaseClient,
  carWashId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('car_washes')
    .select('owner_id')
    .eq('id', carWashId)
    .single();
  return !!data && data.owner_id === userId;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/analytics-helpers.ts
git commit -m "feat(analytics): add shared query helpers for analytics endpoints"
```

---

### Task 6: Create /api/admin/analytics/summary endpoint

**Files:**
- Create: `apps/web/src/app/api/admin/analytics/summary/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
// apps/web/src/app/api/admin/analytics/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  fetchCompletedAppointments,
  aggregateTotals,
  verifyCarWashOwnership,
  type AppointmentRow,
} from '@/lib/analytics-helpers';
import {
  getTodayRange,
  getThisWeekRange,
  getThisMonthRange,
  getYesterdayRange,
  getLastWeekToTodayRange,
  getLastMonthToTodayRange,
  getCurrentHourCutoff,
  getLastNDaysRanges,
  getLastNWeeksRanges,
  getLastNMonthsRanges,
} from '@/lib/date-ranges';

interface PeriodSummary {
  units: number;
  revenue: number;
  prevUnits: number;
  prevRevenue: number;
  sparkline: number[];
}

interface TopService {
  serviceName: string;
  units: number;
  revenue: number;
  pctOfUnits: number;
}

interface SummaryResponse {
  today: PeriodSummary;
  week: PeriodSummary;
  month: PeriodSummary;
  topServicesMonth: TopService[];
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');
  if (!carWashId) {
    return NextResponse.json({ error: 'car_wash_id requerido' }, { status: 400 });
  }

  const authorized = await verifyCarWashOwnership(supabase, carWashId, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const now = new Date();
  const hourCutoff = getCurrentHourCutoff(now);

  // Run all queries in parallel
  const [
    todayRows,
    yesterdayRows,
    weekRows,
    lastWeekRows,
    monthRows,
    lastMonthRows,
  ] = await Promise.all([
    fetchCompletedAppointments(supabase, carWashId, getTodayRange(now), hourCutoff),
    fetchCompletedAppointments(supabase, carWashId, getYesterdayRange(now), hourCutoff),
    fetchCompletedAppointments(supabase, carWashId, getThisWeekRange(now)),
    fetchCompletedAppointments(supabase, carWashId, getLastWeekToTodayRange(now)),
    fetchCompletedAppointments(supabase, carWashId, getThisMonthRange(now)),
    fetchCompletedAppointments(supabase, carWashId, getLastMonthToTodayRange(now)),
  ]);

  // Sparklines: fetch historical ranges and aggregate revenue per bucket
  const sparklineDays = await fetchSparklineRevenue(
    supabase,
    carWashId,
    getLastNDaysRanges(7, now)
  );
  const sparklineWeeks = await fetchSparklineRevenue(
    supabase,
    carWashId,
    getLastNWeeksRanges(8, now)
  );
  const sparklineMonths = await fetchSparklineRevenue(
    supabase,
    carWashId,
    getLastNMonthsRanges(6, now)
  );

  const todayTotals = aggregateTotals(todayRows);
  const yesterdayTotals = aggregateTotals(yesterdayRows);
  const weekTotals = aggregateTotals(weekRows);
  const lastWeekTotals = aggregateTotals(lastWeekRows);
  const monthTotals = aggregateTotals(monthRows);
  const lastMonthTotals = aggregateTotals(lastMonthRows);

  const topServicesMonth = computeTopServices(monthRows, 3);

  const response: SummaryResponse = {
    today: {
      units: todayTotals.units,
      revenue: todayTotals.revenue,
      prevUnits: yesterdayTotals.units,
      prevRevenue: yesterdayTotals.revenue,
      sparkline: sparklineDays,
    },
    week: {
      units: weekTotals.units,
      revenue: weekTotals.revenue,
      prevUnits: lastWeekTotals.units,
      prevRevenue: lastWeekTotals.revenue,
      sparkline: sparklineWeeks,
    },
    month: {
      units: monthTotals.units,
      revenue: monthTotals.revenue,
      prevUnits: lastMonthTotals.units,
      prevRevenue: lastMonthTotals.revenue,
      sparkline: sparklineMonths,
    },
    topServicesMonth,
  };

  return NextResponse.json(response);
}

/**
 * Fetches total revenue for each range in sequence, returns as numeric array.
 * Runs queries in parallel with Promise.all for speed.
 */
async function fetchSparklineRevenue(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  carWashId: string,
  ranges: Array<{ from: string; to: string }>
): Promise<number[]> {
  const results = await Promise.all(
    ranges.map((range) => fetchCompletedAppointments(supabase, carWashId, range))
  );
  return results.map((rows) => aggregateTotals(rows).revenue);
}

function computeTopServices(rows: AppointmentRow[], limit: number): TopService[] {
  const totals = new Map<string, { units: number; revenue: number }>();
  for (const row of rows) {
    const key = row.service_name;
    const current = totals.get(key) ?? { units: 0, revenue: 0 };
    current.units += 1;
    current.revenue += Number(row.precio_cobrado ?? 0);
    totals.set(key, current);
  }
  const totalUnits = rows.length;
  const sorted = [...totals.entries()]
    .map(([serviceName, stats]) => ({
      serviceName,
      units: stats.units,
      revenue: stats.revenue,
      pctOfUnits: totalUnits > 0 ? Math.round((stats.units / totalUnits) * 100) : 0,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
  return sorted;
}
```

- [ ] **Step 2: Manually test the endpoint**

Start the dev server in one terminal:
```bash
cd "apps/web" && npm run dev
```

In another terminal, log in via the browser at http://localhost:3000/login with an admin user, then test:
```bash
# Get a car_wash_id from the DB first via the existing /api/my-car-wash endpoint
curl -b "$(cat ~/.cookies-splash)" "http://localhost:3000/api/admin/analytics/summary?car_wash_id=<your-uuid>"
```

Expected: JSON with `today`, `week`, `month`, `topServicesMonth` keys. No errors.

(Alternative: navigate to `/admin/dashboard` in the browser after Task 11 is done — the integration will call this endpoint.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/admin/analytics/summary/route.ts
git commit -m "feat(analytics): add summary endpoint for dashboard period cards"
```

---

### Task 7: Extend /api/admin/analytics with series and topServices

**Files:**
- Modify: `apps/web/src/app/api/admin/analytics/route.ts`

- [ ] **Step 1: Replace the entire file**

```ts
// apps/web/src/app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  fetchCompletedAppointments,
  verifyCarWashOwnership,
  type AppointmentRow,
} from '@/lib/analytics-helpers';
import { groupByPeriod, type GroupBy } from '@/lib/date-ranges';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');
  if (!carWashId) {
    return NextResponse.json({ error: 'car_wash_id requerido' }, { status: 400 });
  }

  // Support both old `days` param (backward compat) and new `from`/`to` params.
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const daysParam = searchParams.get('days');
  const groupByParam = (searchParams.get('group_by') ?? 'day') as GroupBy;

  let from: string;
  let to: string;
  if (fromParam && toParam) {
    from = fromParam;
    to = toParam;
  } else {
    const days = parseInt(daysParam ?? '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    from = startDate.toISOString().split('T')[0];
    to = new Date().toISOString().split('T')[0];
  }

  if (!['day', 'week', 'month'].includes(groupByParam)) {
    return NextResponse.json({ error: 'group_by debe ser day, week o month' }, { status: 400 });
  }

  const authorized = await verifyCarWashOwnership(supabase, carWashId, user.id);
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Fetch all appointments (not only completed) for the range, to compute
  // cancellation rate + completed subset for revenue/units.
  const { data: allData } = await supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, precio_cobrado, estado, service_id, client_id, services(nombre)')
    .eq('car_wash_id', carWashId)
    .gte('fecha', from)
    .lte('fecha', to)
    .order('fecha');

  const allRows = (allData ?? []) as Array<{
    id: string;
    fecha: string;
    hora_inicio: string;
    precio_cobrado: number | null;
    estado: string;
    service_id: string | null;
    client_id: string;
    services: { nombre: string } | null;
  }>;

  const normalized: AppointmentRow[] = allRows.map((r) => ({
    id: r.id,
    fecha: r.fecha,
    hora_inicio: r.hora_inicio,
    precio_cobrado: r.precio_cobrado,
    estado: r.estado,
    service_id: r.service_id,
    client_id: r.client_id,
    service_name: r.services?.nombre ?? 'Sin servicio',
  }));

  const completed = normalized.filter((r) => r.estado === 'completed' || r.estado === 'rated');
  const cancelled = normalized.filter((r) => r.estado === 'cancelled');
  const totalRevenue = completed.reduce((sum, r) => sum + Number(r.precio_cobrado ?? 0), 0);
  const cancelRate = normalized.length > 0 ? (cancelled.length / normalized.length) * 100 : 0;
  const uniqueClients = new Set(normalized.map((r) => r.client_id)).size;

  // Existing shape preserved
  const byDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  for (const r of normalized) {
    byDay[r.fecha] = (byDay[r.fecha] ?? 0) + 1;
    if (r.estado === 'completed' || r.estado === 'rated') {
      revenueByDay[r.fecha] = (revenueByDay[r.fecha] ?? 0) + Number(r.precio_cobrado ?? 0);
    }
  }

  const byService: Record<string, { count: number; revenue: number }> = {};
  for (const r of completed) {
    const name = r.service_name;
    if (!byService[name]) byService[name] = { count: 0, revenue: 0 };
    byService[name].count += 1;
    byService[name].revenue += Number(r.precio_cobrado ?? 0);
  }

  const byHour: Record<string, number> = {};
  for (const r of normalized) {
    const hour = r.hora_inicio?.substring(0, 5) ?? 'unknown';
    byHour[hour] = (byHour[hour] ?? 0) + 1;
  }

  // NEW: series (grouped by day/week/month) — uses only completed rows
  const series = groupByPeriod(completed, groupByParam);

  // NEW: topServices (top 10 + "Otros" bucket if needed)
  const serviceStats = new Map<string, { serviceId: string; units: number; revenue: number }>();
  for (const r of completed) {
    const name = r.service_name;
    const current = serviceStats.get(name) ?? {
      serviceId: r.service_id ?? '',
      units: 0,
      revenue: 0,
    };
    current.units += 1;
    current.revenue += Number(r.precio_cobrado ?? 0);
    serviceStats.set(name, current);
  }
  const totalUnits = completed.length;
  const allServicesSorted = [...serviceStats.entries()]
    .map(([serviceName, s]) => ({
      serviceId: s.serviceId,
      serviceName,
      units: s.units,
      revenue: s.revenue,
      avgTicket: s.units > 0 ? s.revenue / s.units : 0,
      pctOfUnits: totalUnits > 0 ? Math.round((s.units / totalUnits) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.units - a.units);

  const topServices = allServicesSorted.slice(0, 10);
  if (allServicesSorted.length > 10) {
    const others = allServicesSorted.slice(10);
    const othersUnits = others.reduce((s, x) => s + x.units, 0);
    const othersRevenue = others.reduce((s, x) => s + x.revenue, 0);
    topServices.push({
      serviceId: '__others__',
      serviceName: 'Otros',
      units: othersUnits,
      revenue: othersRevenue,
      avgTicket: othersUnits > 0 ? othersRevenue / othersUnits : 0,
      pctOfUnits: totalUnits > 0 ? Math.round((othersUnits / totalUnits) * 1000) / 10 : 0,
    });
  }

  return NextResponse.json({
    totalAppointments: normalized.length,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    totalRevenue,
    cancelRate: Math.round(cancelRate * 10) / 10,
    uniqueClients,
    byDay,
    revenueByDay,
    byService,
    byHour,
    series,
    topServices,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manually test backward compat**

```bash
# With dev server running
curl "http://localhost:3000/api/admin/analytics?car_wash_id=<uuid>&days=30"
```

Expected: JSON includes both old fields (`totalAppointments`, `byDay`, etc.) and new fields (`series`, `topServices`).

- [ ] **Step 4: Test new params**

```bash
curl "http://localhost:3000/api/admin/analytics?car_wash_id=<uuid>&from=2026-03-01&to=2026-04-09&group_by=week"
```

Expected: `series` array with `period` values like `2026-W09`, `2026-W10`, etc.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/admin/analytics/route.ts
git commit -m "feat(analytics): extend analytics endpoint with series and topServices"
```

---

### Task 8: Create Sparkline component

**Files:**
- Create: `apps/web/src/components/sparkline.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/sparkline.tsx
'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#0284C7', height = 32 }: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ height }} className="text-[10px] text-muted-foreground">—</div>;
  }
  const chartData = data.map((value, index) => ({ index, value }));
  // Ensure a non-zero min/max so a flat line still renders visibly
  const min = Math.min(...data);
  const max = Math.max(...data);
  const domain: [number, number] = min === max ? [min - 1, max + 1] : [min, max];

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={domain} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sparkline.tsx
git commit -m "feat(components): add Sparkline component"
```

---

### Task 9: Create PeriodCard component

**Files:**
- Create: `apps/web/src/components/period-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/period-card.tsx
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/sparkline';

interface PeriodCardProps {
  label: string;
  units: number;
  revenue: number;
  prevUnits: number;
  prevRevenue: number;
  sparkline: number[];
}

function formatDelta(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0 && current === 0) return { text: '—', positive: true };
  if (previous === 0) return { text: 'Nuevo', positive: true };
  const pct = ((current - previous) / previous) * 100;
  return {
    text: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}%`,
    positive: pct >= 0,
  };
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function PeriodCard({
  label,
  units,
  revenue,
  prevUnits,
  prevRevenue,
  sparkline,
}: PeriodCardProps) {
  const unitsDelta = formatDelta(units, prevUnits);
  const revenueDelta = formatDelta(revenue, prevRevenue);

  return (
    <div className="rounded-card bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2">
        <p className="text-2xl font-bold text-foreground">
          {units.toLocaleString('es-MX')} <span className="text-sm font-medium text-muted-foreground">lav.</span>
        </p>
        <p className="mt-0.5 text-sm font-semibold text-accent">{formatMxn(revenue)}</p>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
        <span className={cn(unitsDelta.positive ? 'text-accent' : 'text-destructive')}>
          {unitsDelta.text} lav.
        </span>
        <span className={cn(revenueDelta.positive ? 'text-accent' : 'text-destructive')}>
          {revenueDelta.text} ingr.
        </span>
      </div>
      <div className="mt-3">
        <Sparkline data={sparkline} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/period-card.tsx
git commit -m "feat(components): add PeriodCard for dashboard period summaries"
```

---

### Task 10: Create TopServicesCard component

**Files:**
- Create: `apps/web/src/components/top-services-card.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/top-services-card.tsx
import Link from 'next/link';

interface TopService {
  serviceName: string;
  units: number;
  revenue: number;
  pctOfUnits: number;
}

interface TopServicesCardProps {
  services: TopService[];
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function TopServicesCard({ services }: TopServicesCardProps) {
  return (
    <div className="rounded-card bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">Top servicios del mes</h3>
      </div>
      {services.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          Aún no hay servicios registrados este mes
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {services.map((svc, i) => (
            <li key={svc.serviceName} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                <span className="text-sm font-semibold text-foreground">{svc.serviceName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">{svc.units} ({svc.pctOfUnits}%)</span>
                <span className="font-semibold text-accent">{formatMxn(svc.revenue)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border px-6 py-3">
        <Link href="/admin/reportes" className="text-xs font-semibold text-primary hover:underline">
          Ver detalle completo →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/top-services-card.tsx
git commit -m "feat(components): add TopServicesCard for dashboard"
```

---

### Task 11: Rewrite /admin/dashboard to use new components

**Files:**
- Modify: `apps/web/src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// apps/web/src/app/admin/dashboard/page.tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { MetricCard } from '@/components/metric-card';
import { StatusBadge } from '@/components/status-badge';
import { PeriodCard } from '@/components/period-card';
import { TopServicesCard } from '@/components/top-services-card';
import { completeAppointment } from '@/app/admin/citas/actions';
import {
  fetchCompletedAppointments,
  aggregateTotals,
} from '@/lib/analytics-helpers';
import {
  getTodayRange,
  getThisWeekRange,
  getThisMonthRange,
  getYesterdayRange,
  getLastWeekToTodayRange,
  getLastMonthToTodayRange,
  getCurrentHourCutoff,
  getLastNDaysRanges,
  getLastNWeeksRanges,
  getLastNMonthsRanges,
} from '@/lib/date-ranges';

interface TopService {
  serviceName: string;
  units: number;
  revenue: number;
  pctOfUnits: number;
}

async function fetchSparklineRevenue(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  carWashId: string,
  ranges: Array<{ from: string; to: string }>
): Promise<number[]> {
  const results = await Promise.all(
    ranges.map((range) => fetchCompletedAppointments(supabase, carWashId, range))
  );
  return results.map((rows) => aggregateTotals(rows).revenue);
}

function computeTopServices(
  rows: Array<{ service_name: string; precio_cobrado: number | null }>,
  limit: number
): TopService[] {
  const totals = new Map<string, { units: number; revenue: number }>();
  for (const row of rows) {
    const key = row.service_name;
    const current = totals.get(key) ?? { units: 0, revenue: 0 };
    current.units += 1;
    current.revenue += Number(row.precio_cobrado ?? 0);
    totals.set(key, current);
  }
  const totalUnits = rows.length;
  return [...totals.entries()]
    .map(([serviceName, stats]) => ({
      serviceName,
      units: stats.units,
      revenue: stats.revenue,
      pctOfUnits: totalUnits > 0 ? Math.round((stats.units / totalUnits) * 100) : 0,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const carWash = await getAdminCarWash('id, nombre, rating_promedio, total_reviews, activo, subscription_status') as {
    id: string;
    nombre: string;
    rating_promedio: number | null;
    total_reviews: number | null;
    activo: boolean | null;
    subscription_status: string | null;
  } | null;

  const today = new Date().toISOString().split('T')[0];

  let todayData = { units: 0, revenue: 0, prevUnits: 0, prevRevenue: 0, sparkline: [] as number[] };
  let weekData = { units: 0, revenue: 0, prevUnits: 0, prevRevenue: 0, sparkline: [] as number[] };
  let monthData = { units: 0, revenue: 0, prevUnits: 0, prevRevenue: 0, sparkline: [] as number[] };
  let topServicesMonth: TopService[] = [];
  let upcomingAppointments: Array<{
    id: string;
    fecha: string;
    hora_inicio: string;
    estado: string;
    precio_cobrado: number | null;
    estacion: number | null;
    users: { nombre: string | null; email: string } | null;
    services: { nombre: string } | null;
  }> = [];

  if (carWash) {
    const now = new Date();
    const hourCutoff = getCurrentHourCutoff(now);

    const [
      todayRows,
      yesterdayRows,
      weekRows,
      lastWeekRows,
      monthRows,
      lastMonthRows,
      sparklineDays,
      sparklineWeeks,
      sparklineMonths,
    ] = await Promise.all([
      fetchCompletedAppointments(supabase, carWash.id, getTodayRange(now), hourCutoff),
      fetchCompletedAppointments(supabase, carWash.id, getYesterdayRange(now), hourCutoff),
      fetchCompletedAppointments(supabase, carWash.id, getThisWeekRange(now)),
      fetchCompletedAppointments(supabase, carWash.id, getLastWeekToTodayRange(now)),
      fetchCompletedAppointments(supabase, carWash.id, getThisMonthRange(now)),
      fetchCompletedAppointments(supabase, carWash.id, getLastMonthToTodayRange(now)),
      fetchSparklineRevenue(supabase, carWash.id, getLastNDaysRanges(7, now)),
      fetchSparklineRevenue(supabase, carWash.id, getLastNWeeksRanges(8, now)),
      fetchSparklineRevenue(supabase, carWash.id, getLastNMonthsRanges(6, now)),
    ]);

    const t = aggregateTotals(todayRows);
    const y = aggregateTotals(yesterdayRows);
    const w = aggregateTotals(weekRows);
    const lw = aggregateTotals(lastWeekRows);
    const m = aggregateTotals(monthRows);
    const lm = aggregateTotals(lastMonthRows);

    todayData = { ...t, prevUnits: y.units, prevRevenue: y.revenue, sparkline: sparklineDays };
    weekData = { ...w, prevUnits: lw.units, prevRevenue: lw.revenue, sparkline: sparklineWeeks };
    monthData = { ...m, prevUnits: lm.units, prevRevenue: lm.revenue, sparkline: sparklineMonths };
    topServicesMonth = computeTopServices(monthRows, 3);

    const { data: upcoming } = await supabase
      .from('appointments')
      .select('id, fecha, hora_inicio, estado, precio_cobrado, estacion, users!client_id(nombre, email), services!service_id(nombre)')
      .eq('car_wash_id', carWash.id)
      .gte('fecha', today)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .limit(10);

    upcomingAppointments = (upcoming ?? []) as typeof upcomingAppointments;
  }

  const rating = carWash?.rating_promedio ?? 0;
  const totalReviews = carWash?.total_reviews ?? 0;
  const estatus = carWash?.activo ? 'Activo' : 'Inactivo';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      </div>

      {/* Status row: rating + status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          title="Calificacion"
          value={rating > 0 ? rating.toFixed(1) : '—'}
          subtitle={`${totalReviews} resenas`}
        />
        <MetricCard
          title="Estatus"
          value={estatus}
          subtitle={carWash?.subscription_status ?? ''}
        />
      </div>

      {/* Period cards: today / week / month */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PeriodCard
          label="Hoy"
          units={todayData.units}
          revenue={todayData.revenue}
          prevUnits={todayData.prevUnits}
          prevRevenue={todayData.prevRevenue}
          sparkline={todayData.sparkline}
        />
        <PeriodCard
          label="Esta semana"
          units={weekData.units}
          revenue={weekData.revenue}
          prevUnits={weekData.prevUnits}
          prevRevenue={weekData.prevRevenue}
          sparkline={weekData.sparkline}
        />
        <PeriodCard
          label="Este mes"
          units={monthData.units}
          revenue={monthData.revenue}
          prevUnits={monthData.prevUnits}
          prevRevenue={monthData.prevRevenue}
          sparkline={monthData.sparkline}
        />
      </div>

      {/* Top services of the month */}
      <TopServicesCard services={topServicesMonth} />

      {/* Upcoming appointments */}
      <div className="rounded-card bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Proximas citas</h3>
        </div>
        {upcomingAppointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No hay citas proximas
          </div>
        ) : (
          <>
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">{apt.users?.nombre || apt.users?.email || '—'}</span>
                  <StatusBadge status={apt.estado} />
                </div>
                <p className="text-xs text-muted-foreground">{apt.services?.nombre ?? '—'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{apt.fecha}</span>
                  <span>{apt.hora_inicio?.slice(0, 5)}</span>
                  <span>E{apt.estacion}</span>
                </div>
                {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                  <form action={async () => { 'use server'; await completeAppointment(apt.id); const { revalidatePath } = await import('next/cache'); revalidatePath('/admin/dashboard'); }}>
                    <button type="submit" className="mt-1 text-xs font-medium text-primary hover:underline">Completar</button>
                  </form>
                )}
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Servicio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Hora</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estacion</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium text-foreground">
                      {apt.users?.nombre || apt.users?.email || '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {apt.services?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.fecha}</td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.hora_inicio?.slice(0, 5)}</td>
                    <td className="px-6 py-3 text-muted-foreground">E{apt.estacion}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={apt.estado} />
                    </td>
                    <td className="px-6 py-3">
                      {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                        <form action={async () => { 'use server'; await completeAppointment(apt.id); const { revalidatePath } = await import('next/cache'); revalidatePath('/admin/dashboard'); }}>
                          <button type="submit" className="rounded-input bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent/90">
                            Completar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start dev server and visually verify**

```bash
cd "apps/web" && npm run dev
```

Navigate to http://localhost:3000/admin/dashboard (log in as `wash_admin`). Verify:
- 3 period cards render (Hoy / Esta semana / Este mes)
- Each card shows units, revenue, delta, sparkline
- "Top servicios del mes" card renders
- "Próximas citas" table still works
- No console errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/dashboard/page.tsx
git commit -m "feat(dashboard): add period cards and top services to admin dashboard"
```

---

### Task 12: Create PeriodToggle component

**Files:**
- Create: `apps/web/src/components/period-toggle.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/period-toggle.tsx
'use client';

import { cn } from '@/lib/utils';

export type GroupBy = 'day' | 'week' | 'month';

interface PeriodToggleProps {
  value: GroupBy;
  onChange: (value: GroupBy) => void;
}

const OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-pill transition-colors',
            value === opt.value
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/period-toggle.tsx
git commit -m "feat(components): add PeriodToggle for day/week/month selection"
```

---

### Task 13: Create RevenueLineChart component

**Files:**
- Create: `apps/web/src/components/revenue-line-chart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/revenue-line-chart.tsx
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
}

interface RevenueLineChartProps {
  series: SeriesPoint[];
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function RevenueLineChart({ series }: RevenueLineChartProps) {
  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatMxn(Number(v))}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [formatMxn(value), 'Ingresos']}
            labelStyle={{ color: '#0F172A', fontWeight: 600 }}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/revenue-line-chart.tsx
git commit -m "feat(components): add RevenueLineChart for reportes"
```

---

### Task 14: Create StackedServicesChart component

**Files:**
- Create: `apps/web/src/components/stacked-services-chart.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/stacked-services-chart.tsx
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { assignServiceColors } from '@/lib/analytics-colors';

interface SeriesPoint {
  period: string;
  periodLabel: string;
  byService: Record<string, { units: number; revenue: number }>;
}

interface StackedServicesChartProps {
  series: SeriesPoint[];
}

export function StackedServicesChart({ series }: StackedServicesChartProps) {
  const { chartData, serviceNames, colors } = useMemo(() => {
    const names = new Set<string>();
    for (const point of series) {
      for (const name of Object.keys(point.byService)) {
        names.add(name);
      }
    }
    const serviceNames = [...names].sort((a, b) => a.localeCompare(b, 'es'));
    const colors = assignServiceColors(serviceNames);
    const chartData = series.map((point) => {
      const row: Record<string, string | number> = {
        periodLabel: point.periodLabel,
      };
      for (const name of serviceNames) {
        row[name] = point.byService[name]?.units ?? 0;
      }
      return row;
    });
    return { chartData, serviceNames, colors };
  }, [series]);

  if (series.length === 0 || serviceNames.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#0F172A', fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {serviceNames.map((name) => (
            <Bar key={name} dataKey={name} stackId="services" fill={colors[name]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/stacked-services-chart.tsx
git commit -m "feat(components): add StackedServicesChart for reportes"
```

---

### Task 15: Create ServiceBreakdownTable component

**Files:**
- Create: `apps/web/src/components/service-breakdown-table.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/service-breakdown-table.tsx
'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ServiceRow {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

interface ServiceBreakdownTableProps {
  services: ServiceRow[];
}

type SortKey = 'serviceName' | 'units' | 'revenue' | 'avgTicket' | 'pctOfUnits';
type SortDir = 'asc' | 'desc';

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function ServiceBreakdownTable({ services }: ServiceBreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('units');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...services];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [services, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const headers: Array<{ key: SortKey; label: string; align: 'left' | 'right' }> = [
    { key: 'serviceName', label: 'Servicio', align: 'left' },
    { key: 'units', label: 'Unidades', align: 'right' },
    { key: 'revenue', label: 'Ingresos', align: 'right' },
    { key: 'avgTicket', label: 'Ticket prom.', align: 'right' },
    { key: 'pctOfUnits', label: '%', align: 'right' },
  ];

  if (services.length === 0) {
    return (
      <div className="rounded-modal border border-border bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-foreground">Desglose por servicio</h3>
        <p className="text-xs text-muted-foreground">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-modal border border-border bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">Desglose por servicio</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={cn(
                    'cursor-pointer select-none px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground',
                    h.align === 'right' && 'text-right'
                  )}
                  onClick={() => toggleSort(h.key)}
                >
                  {h.label}
                  {sortKey === h.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((svc) => (
              <tr key={svc.serviceId || svc.serviceName} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">{svc.serviceName}</td>
                <td className="px-3 py-2 text-right text-foreground">{svc.units.toLocaleString('es-MX')}</td>
                <td className="px-3 py-2 text-right font-semibold text-accent">{formatMxn(svc.revenue)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{formatMxn(svc.avgTicket)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{svc.pctOfUnits}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/service-breakdown-table.tsx
git commit -m "feat(components): add ServiceBreakdownTable for reportes"
```

---

### Task 16: Update reportes page to use new components

**Files:**
- Modify: `apps/web/src/app/admin/reportes/analytics-client.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// apps/web/src/app/admin/reportes/analytics-client.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PeriodToggle, type GroupBy } from '@/components/period-toggle';
import { RevenueLineChart } from '@/components/revenue-line-chart';
import { StackedServicesChart } from '@/components/stacked-services-chart';
import { ServiceBreakdownTable } from '@/components/service-breakdown-table';

interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
  byService: Record<string, { units: number; revenue: number }>;
}

interface TopService {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

interface Analytics {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  cancelRate: number;
  uniqueClients: number;
  byDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  byService: Record<string, { count: number; revenue: number }>;
  byHour: Record<string, number>;
  series: SeriesPoint[];
  topServices: TopService[];
}

function defaultGroupBy(days: number): GroupBy {
  if (days <= 30) return 'day';
  if (days <= 90) return 'week';
  return 'month';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function AnalyticsDashboard({ carWashId }: { carWashId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState<number | 'custom'>(30);
  const [fromDate, setFromDate] = useState<string>(daysAgoStr(30));
  const [toDate, setToDate] = useState<string>(todayStr());
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [userOverrodeGroupBy, setUserOverrodeGroupBy] = useState(false);
  const [loading, setLoading] = useState(true);

  // When rangepreset changes, sync fromDate/toDate and auto-adjust groupBy
  useEffect(() => {
    if (days === 'custom') return;
    setFromDate(daysAgoStr(days));
    setToDate(todayStr());
    if (!userOverrodeGroupBy) {
      setGroupBy(defaultGroupBy(days));
    }
  }, [days, userOverrodeGroupBy]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      car_wash_id: carWashId,
      from: fromDate,
      to: toDate,
      group_by: groupBy,
    });
    fetch(`/api/admin/analytics?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carWashId, fromDate, toDate, groupBy]);

  const handleGroupByChange = (gb: GroupBy) => {
    setGroupBy(gb);
    setUserOverrodeGroupBy(true);
  };

  const sortedServices = useMemo(
    () => (data ? Object.entries(data.byService).sort((a, b) => b[1].revenue - a[1].revenue) : []),
    [data]
  );
  const sortedHours = useMemo(
    () =>
      data
        ? Object.entries(data.byHour).sort((a, b) => b[1] - a[1]).slice(0, 8)
        : [],
    [data]
  );
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v), 1);

  if (loading && !data) {
    return <div className="text-center py-12 text-muted-foreground">Cargando analiticas...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Error al cargar datos</div>;
  }

  return (
    <div>
      {/* Controls row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Agrupar:</span>
          <PeriodToggle value={groupBy} onChange={handleGroupByChange} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Rango:</span>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-foreground hover:border-primary/50'
                }`}
              >
                {d} dias
              </button>
            ))}
            <button
              onClick={() => setDays('custom')}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                days === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-foreground hover:border-primary/50'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>
        {days === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
            <span>a</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Citas totales</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.totalAppointments}</div>
          <div className="text-xs text-accent mt-0.5">{data.completedCount} completadas</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Ingresos</div>
          <div className="text-2xl font-extrabold text-accent mt-1">
            ${Number(data.totalRevenue).toLocaleString('es-MX')}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">MXN</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Tasa cancelacion</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.cancelRate}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">{data.cancelledCount} canceladas</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Clientes unicos</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.uniqueClients}</div>
          <div className="text-xs text-muted-foreground mt-0.5">en el rango</div>
        </div>
      </div>

      {/* Revenue over time */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Ingresos en el tiempo</h3>
        <RevenueLineChart series={data.series} />
      </div>

      {/* Stacked services */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Unidades lavadas por servicio</h3>
        <StackedServicesChart series={data.series} />
      </div>

      {/* Service breakdown table */}
      <div className="mb-6">
        <ServiceBreakdownTable services={data.topServices} />
      </div>

      {/* Existing charts preserved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-modal border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Ingresos por servicio</h3>
          {sortedServices.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {sortedServices.map(([name, info]) => {
                const maxRev = sortedServices[0]?.[1]?.revenue || 1;
                const pct = (info.revenue / maxRev) * 100;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{name}</span>
                      <span className="text-muted-foreground">
                        {info.count} citas · ${Number(info.revenue).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="bg-muted rounded-pill h-2.5">
                      <div className="bg-accent rounded-pill h-2.5 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-modal border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Horarios mas populares</h3>
          {sortedHours.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {sortedHours.map(([hour, count]) => {
                const pct = (count / maxHourCount) * 100;
                return (
                  <div key={hour} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground w-12">{hour}</span>
                    <div className="flex-1 bg-muted rounded-pill h-5">
                      <div
                        className="bg-primary rounded-pill h-5 flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        <span className="text-[9px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Visual smoke test**

With dev server running, navigate to http://localhost:3000/admin/reportes (logged in as `wash_admin`). Verify:
- Period toggle (Día/Semana/Mes) is visible and clickable
- Range selector (7/14/30/60/90/Personalizado) works
- "Personalizado" reveals date inputs
- Revenue line chart renders
- Stacked services chart renders with legend
- Service breakdown table renders with sortable columns
- Clicking column headers re-sorts the table
- Existing "Ingresos por servicio" and "Horarios más populares" charts still work

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/reportes/analytics-client.tsx
git commit -m "feat(reportes): add temporal charts, period toggle, and sortable service table"
```

---

### Task 17: Add E2E smoke test for new dashboard and reportes sections

**Files:**
- Create: `apps/web/e2e/admin/analytics-breakdowns.spec.ts`

- [ ] **Step 1: Find the existing admin E2E project naming pattern**

```bash
cd "apps/web" && ls e2e/admin/ 2>/dev/null || ls e2e/
```

Look at one existing admin test to confirm auth fixture usage pattern. Run:

```bash
cd "apps/web" && cat playwright.config.ts | head -60
```

Note the project name this file should belong to (likely `admin` — check the `testMatch` and `storageState` for that project).

- [ ] **Step 2: Create the spec file**

If the existing project pattern places admin tests in `e2e/admin/`, create the file there. Otherwise, use `e2e/admin-analytics-breakdowns.spec.ts` and adjust `testMatch` in the matching project.

```ts
// apps/web/e2e/admin/analytics-breakdowns.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin analytics breakdowns', () => {
  test('dashboard renders 3 period cards and top services card', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByText('Hoy', { exact: false })).toBeVisible();
    await expect(page.getByText('Esta semana', { exact: false })).toBeVisible();
    await expect(page.getByText('Este mes', { exact: false })).toBeVisible();
    await expect(page.getByText('Top servicios del mes')).toBeVisible();
    await expect(page.getByText('Proximas citas')).toBeVisible();
  });

  test('reportes page: period toggle switches grouping without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/admin/reportes');
    await expect(page.getByText('Reportes y Analiticas')).toBeVisible();

    // Wait for initial analytics fetch
    await page.waitForResponse((r) => r.url().includes('/api/admin/analytics') && r.status() === 200);

    // Click the "Semana" toggle button
    await page.getByRole('button', { name: 'Semana' }).click();
    await page.waitForResponse((r) => r.url().includes('group_by=week'));

    // Click the "Mes" toggle button
    await page.getByRole('button', { name: 'Mes' }).click();
    await page.waitForResponse((r) => r.url().includes('group_by=month'));

    // Verify the stacked services and revenue chart headers are present
    await expect(page.getByText('Ingresos en el tiempo')).toBeVisible();
    await expect(page.getByText('Unidades lavadas por servicio')).toBeVisible();
    await expect(page.getByText('Desglose por servicio')).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run the new test against a running dev server**

In one terminal:
```bash
cd "apps/web" && npm run dev
```

In another:
```bash
cd "apps/web" && npx playwright test e2e/admin/analytics-breakdowns.spec.ts --project=admin
```

If the project name differs, use the correct one from `playwright.config.ts`.

Expected: Both tests pass. If the `admin` project relies on a prior `setup` project to create auth state, run the setup first:
```bash
cd "apps/web" && npx playwright test --project=setup
cd "apps/web" && npx playwright test e2e/admin/analytics-breakdowns.spec.ts --project=admin
```

- [ ] **Step 4: If tests fail**

- If "element not visible" — read the screenshot in `test-results/` and adjust selectors.
- If project name doesn't match — update `testMatch` in the appropriate project in `playwright.config.ts` or move the file.

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/admin/analytics-breakdowns.spec.ts
git commit -m "test(e2e): add smoke tests for dashboard and reportes breakdowns"
```

---

### Task 18: Final verification — build, lint, type-check, full test sweep

**Files:** None (validation only)

- [ ] **Step 1: Run type check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run lint**

```bash
cd "apps/web" && npm run lint
```

Expected: No errors. Warnings about existing code are acceptable; no new warnings from files created in this plan.

- [ ] **Step 3: Run unit tests**

```bash
cd "apps/web" && npm run test:unit
```

Expected: All date-ranges tests pass.

- [ ] **Step 4: Run the production build**

```bash
cd "apps/web" && npm run build
```

Expected: Build succeeds. Check for warnings about:
- Unused imports in modified files
- Type errors in modified files
- Hydration mismatches (should be none)

- [ ] **Step 5: Visual final check**

Start dev server, log in as `wash_admin`, and walk through:

1. `/admin/dashboard` — period cards + top services + upcoming appointments all render.
2. `/admin/reportes` — toggle changes grouping, range changes reload data, charts render, table sorts.
3. Browser console has zero errors on both pages.

- [ ] **Step 6: Final commit if any fixes were needed**

Only if anything above required fixes:

```bash
git add -A
git commit -m "fix: address issues from final verification sweep"
```

---

## Self-Review Checklist (completed by plan author)

**Spec coverage:**
- ✅ Dashboard 3 period cards (hoy/semana/mes) with delta + sparkline → Tasks 8, 9, 11
- ✅ Top services card on dashboard → Tasks 10, 11
- ✅ Bug fix: "Ingresos totales" removed → Task 11
- ✅ Reportes: period toggle → Tasks 12, 16
- ✅ Reportes: custom date range → Task 16
- ✅ Reportes: revenue line chart → Tasks 13, 16
- ✅ Reportes: stacked services chart → Tasks 14, 16
- ✅ Reportes: sortable service breakdown table → Tasks 15, 16
- ✅ Extended `/api/admin/analytics` endpoint → Task 7
- ✅ New `/api/admin/analytics/summary` endpoint → Task 6
- ✅ Canonical metrics (`completed` + `rated`) → Tasks 5, 6, 7, 11
- ✅ Timezone handling (`America/Mexico_City`) → Tasks 3, 4
- ✅ Fair comparison (hour cutoff for hoy/ayer, same-day cutoff for week/month) → Tasks 4, 6, 11
- ✅ Service color palette → Task 2
- ✅ Unit tests for date-ranges → Tasks 3, 4
- ✅ E2E smoke test → Task 17

**Placeholder scan:** No "TBD", "TODO", "implement later", or vague steps. All code blocks contain complete implementations.

**Type consistency:**
- `DateRange` type used consistently as `{ from: string; to: string }`
- `GroupBy` exported from `date-ranges.ts` and re-exported via `period-toggle.tsx`
- `SeriesPoint` shape matches across `date-ranges.ts`, analytics route, and chart components
- `AppointmentRow` type shared from `analytics-helpers.ts`
- `assignServiceColors` signature matches usage in `stacked-services-chart.tsx`

**Scope check:** Single feature, focused on one area (admin analytics). Each task produces a self-contained commit that leaves the app in a buildable state.
