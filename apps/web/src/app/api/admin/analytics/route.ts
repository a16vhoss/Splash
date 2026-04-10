// apps/web/src/app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
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

  const allRows = (allData ?? []) as unknown as Array<{
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
  const allServicesSorted = Array.from(serviceStats.entries())
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
