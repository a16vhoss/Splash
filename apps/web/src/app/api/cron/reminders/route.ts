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
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];
  const nowTime = now.toTimeString().slice(0, 5);
  const twoHoursTime = twoHoursFromNow.toTimeString().slice(0, 5);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, fecha, hora_inicio, car_wash_id, car_washes!car_wash_id(nombre, direccion), services!service_id(nombre)')
    .eq('estado', 'confirmed')
    .eq('fecha', today)
    .gte('hora_inicio', nowTime)
    .lte('hora_inicio', twoHoursTime);

  if (!appointments?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const apt of appointments) {
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

    await supabase.from('notifications').insert({
      user_id: apt.client_id,
      appointment_id: apt.id,
      tipo: 'reminder',
      titulo: 'Recordatorio de cita',
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

  return NextResponse.json({ sent });
}
