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

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // 1. Mark past confirmed/in_progress appointments as no_show (vencido)
  //    - Appointments from previous days
  const { data: expiredPastDays, error: err1 } = await supabase
    .from('appointments')
    .update({ estado: 'no_show' })
    .in('estado', ['confirmed', 'in_progress'])
    .lt('fecha', today)
    .select('id');

  // 2. Mark today's appointments whose time has passed as no_show
  const { data: expiredToday, error: err2 } = await supabase
    .from('appointments')
    .update({ estado: 'no_show' })
    .in('estado', ['confirmed', 'in_progress'])
    .eq('fecha', today)
    .lt('hora_fin', currentTime)
    .select('id');

  const expiredCount = (expiredPastDays?.length ?? 0) + (expiredToday?.length ?? 0);

  if (err1 || err2) {
    console.error('Expire appointments errors:', err1, err2);
  }

  return NextResponse.json({
    expired: expiredCount,
    timestamp: now.toISOString(),
  });
}
