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
