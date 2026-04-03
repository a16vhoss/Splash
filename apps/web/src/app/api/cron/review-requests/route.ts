import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReviewRequestEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, car_wash_id, car_washes!car_wash_id(nombre)')
    .eq('estado', 'completed')
    .gte('updated_at', twoHoursAgo);

  if (!appointments?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const apt of appointments) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('tipo', 'review_request')
      .limit(1);

    if (existing?.length) continue;

    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('appointment_id', apt.id)
      .limit(1);

    if (review?.length) continue;

    const { data: client } = await supabase
      .from('users')
      .select('email')
      .eq('id', apt.client_id)
      .single();

    if (!client?.email) continue;

    await supabase.from('notifications').insert({
      user_id: apt.client_id,
      appointment_id: apt.id,
      tipo: 'review_request',
      titulo: 'Califica tu experiencia',
      mensaje: `Como fue tu servicio en ${(apt as any).car_washes?.nombre ?? 'el autolavado'}?`,
    });

    await sendReviewRequestEmail(client.email, {
      carWashName: (apt as any).car_washes?.nombre ?? '',
      appointmentId: apt.id,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
