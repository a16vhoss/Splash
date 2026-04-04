import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get active alerts for today and tomorrow
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { data: alerts } = await supabase
    .from('availability_alerts')
    .select('*, car_washes(nombre, slug, num_estaciones)')
    .eq('estado', 'activo')
    .in('fecha', [today, tomorrow]);

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ checked: 0, notified: 0 });
  }

  let notified = 0;

  for (const alert of alerts) {
    // Check how many appointments occupy the requested time range
    const { count: occupied } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('car_wash_id', alert.car_wash_id)
      .eq('fecha', alert.fecha)
      .gte('hora_inicio', alert.hora_inicio)
      .lte('hora_inicio', alert.hora_fin)
      .in('estado', ['confirmed', 'in_progress']);

    const numEstaciones = (alert.car_washes as any)?.num_estaciones || 1;
    const available = numEstaciones - (occupied || 0);

    if (available > 0) {
      // Create notification for the user
      await supabase.from('notifications').insert({
        user_id: alert.user_id,
        tipo: 'availability_alert',
        titulo: `¡Horario disponible en ${(alert.car_washes as any)?.nombre}!`,
        mensaje: `Se abrió un espacio el ${alert.fecha} entre ${alert.hora_inicio} y ${alert.hora_fin}. ¡Reserva ahora!`,
        link: `/agendar?car_wash_id=${alert.car_wash_id}&fecha=${alert.fecha}`,
      });

      // Mark alert as notified
      await supabase
        .from('availability_alerts')
        .update({ estado: 'notificado' })
        .eq('id', alert.id);

      notified++;
    }
  }

  // Expire old alerts (past dates)
  await supabase
    .from('availability_alerts')
    .update({ estado: 'expirado' })
    .eq('estado', 'activo')
    .lt('fecha', today);

  return NextResponse.json({ checked: alerts.length, notified });
}
