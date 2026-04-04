import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');
  const days = parseInt(searchParams.get('days') || '30');

  if (!carWashId) {
    return NextResponse.json({ error: 'car_wash_id requerido' }, { status: 400 });
  }

  // Verify ownership
  const { data: cw } = await supabase
    .from('car_washes')
    .select('owner_id')
    .eq('id', carWashId)
    .single();

  if (!cw || cw.owner_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Appointments in date range
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, precio_cobrado, estado, service_id, client_id, services(nombre)')
    .eq('car_wash_id', carWashId)
    .gte('fecha', startDateStr)
    .order('fecha');

  const allApts = appointments ?? [];

  // Calculate metrics
  const completed = allApts.filter((a) => a.estado === 'completed');
  const cancelled = allApts.filter((a) => a.estado === 'cancelled');
  const totalRevenue = completed.reduce((sum, a) => sum + Number(a.precio_cobrado || 0), 0);
  const cancelRate = allApts.length > 0 ? (cancelled.length / allApts.length * 100) : 0;
  const uniqueClients = new Set(allApts.map((a) => a.client_id)).size;

  // Appointments by day
  const byDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  for (const apt of allApts) {
    byDay[apt.fecha] = (byDay[apt.fecha] || 0) + 1;
    if (apt.estado === 'completed') {
      revenueByDay[apt.fecha] = (revenueByDay[apt.fecha] || 0) + Number(apt.precio_cobrado || 0);
    }
  }

  // Revenue by service
  const byService: Record<string, { count: number; revenue: number }> = {};
  for (const apt of completed) {
    const name = (apt.services as any)?.nombre || 'Sin servicio';
    if (!byService[name]) byService[name] = { count: 0, revenue: 0 };
    byService[name].count++;
    byService[name].revenue += Number(apt.precio_cobrado || 0);
  }

  // Popular hours
  const byHour: Record<string, number> = {};
  for (const apt of allApts) {
    const hour = apt.hora_inicio?.substring(0, 5) || 'unknown';
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  return NextResponse.json({
    totalAppointments: allApts.length,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    totalRevenue,
    cancelRate: Math.round(cancelRate * 10) / 10,
    uniqueClients,
    byDay,
    revenueByDay,
    byService,
    byHour,
  });
}
