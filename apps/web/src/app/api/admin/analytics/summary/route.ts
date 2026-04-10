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
 * Fetches total revenue for each range in parallel, returns as numeric array.
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
  const sorted = Array.from(totals.entries())
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
