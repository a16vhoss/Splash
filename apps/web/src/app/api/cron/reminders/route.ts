import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReminderEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  let sent = 0;

  // 1. Day-based reminders (recordatorio_dias): check appointments N days from now
  for (let days = 1; days <= 7; days++) {
    const targetDate = new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];

    const { data: dayAppointments } = await supabase
      .from('appointments')
      .select('id, client_id, fecha, hora_inicio, car_wash_id, car_washes!car_wash_id(nombre, direccion), services!service_id(nombre)')
      .eq('estado', 'confirmed')
      .eq('fecha', targetDate)
      .eq('recordatorio_dias', days);

    if (!dayAppointments?.length) continue;

    for (const apt of dayAppointments) {
      // Check if reminder already sent
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('appointment_id', apt.id)
        .eq('tipo', 'reminder')
        .limit(1);

      if (existing?.length) continue;

      const { data: client } = await supabase
        .from('users')
        .select('email')
        .eq('id', apt.client_id)
        .single();

      if (!client?.email) continue;

      const carWashName = (apt as any).car_washes?.nombre ?? 'el autolavado';
      const mensaje = days === 1
        ? `Tu cita en ${carWashName} es mañana a las ${apt.hora_inicio?.slice(0, 5)}`
        : `Tu cita en ${carWashName} es en ${days} días (${apt.fecha}) a las ${apt.hora_inicio?.slice(0, 5)}`;

      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        tipo: 'reminder',
        titulo: 'Recordatorio de cita',
        mensaje,
      });

      await sendReminderEmail(client.email, {
        carWashName,
        serviceName: (apt as any).services?.nombre ?? '',
        fecha: apt.fecha,
        hora: apt.hora_inicio?.slice(0, 5) ?? '',
        direccion: (apt as any).car_washes?.direccion ?? '',
      });

      sent++;
    }
  }

  // 2. Same-day 2-hour reminders (original behavior, for all confirmed appointments)
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const nowTime = now.toTimeString().slice(0, 5);
  const twoHoursTime = twoHoursFromNow.toTimeString().slice(0, 5);

  const { data: soonAppointments } = await supabase
    .from('appointments')
    .select('id, client_id, fecha, hora_inicio, car_wash_id, car_washes!car_wash_id(nombre, direccion), services!service_id(nombre)')
    .eq('estado', 'confirmed')
    .eq('fecha', today)
    .gte('hora_inicio', nowTime)
    .lte('hora_inicio', twoHoursTime);

  if (soonAppointments?.length) {
    for (const apt of soonAppointments) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('appointment_id', apt.id)
        .eq('tipo', 'reminder')
        .eq('titulo', 'Tu cita es pronto')
        .limit(1);

      if (existing?.length) continue;

      const { data: client } = await supabase
        .from('users')
        .select('email')
        .eq('id', apt.client_id)
        .single();

      if (!client?.email) continue;

      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        tipo: 'reminder',
        titulo: 'Tu cita es pronto',
        mensaje: `Tu cita en ${(apt as any).car_washes?.nombre ?? 'el autolavado'} es en aproximadamente 2 horas`,
      });

      await sendReminderEmail(client.email, {
        carWashName: (apt as any).car_washes?.nombre ?? '',
        serviceName: (apt as any).services?.nombre ?? '',
        fecha: apt.fecha,
        hora: apt.hora_inicio?.slice(0, 5) ?? '',
        direccion: (apt as any).car_washes?.direccion ?? '',
      });

      sent++;
    }
  }

  return NextResponse.json({ sent });
}
