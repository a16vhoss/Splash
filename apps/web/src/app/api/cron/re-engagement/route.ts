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

  // Find appointments completed exactly 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const targetDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, car_wash_id, car_washes(nombre, slug)')
    .eq('estado', 'completed')
    .eq('fecha', targetDate);

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const apt of appointments) {
    const cwName = (apt.car_washes as any)?.nombre || 'tu autolavado';
    const cwSlug = (apt.car_washes as any)?.slug || '';

    await supabase.from('notifications').insert({
      user_id: apt.client_id,
      tipo: 're_engagement',
      titulo: '¿Tu auto necesita otro lavado?',
      mensaje: `Han pasado 7 días desde tu última visita a ${cwName}. ¡Reserva de nuevo!`,
      link: `/autolavados/${cwSlug}`,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
