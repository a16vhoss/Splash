import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // 1. Auth via user session
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Parse body
  const { appointment_id, car_wash_id, rating, comentario } = await request.json();
  if (!appointment_id || !car_wash_id || !rating) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }

  // 3. Insert review (user session — RLS validates client_id)
  const { error: insertError } = await supabase.from('reviews').insert({
    appointment_id,
    client_id: user.id,
    car_wash_id,
    rating,
    comentario: comentario || null,
  });

  if (insertError) {
    const msg = insertError.code === '23505' ? 'Ya calificaste este servicio' : insertError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 4. Update appointment status to rated
  await supabase.from('appointments').update({ estado: 'rated' }).eq('id', appointment_id);

  // 5. Use service role to update rating averages and create notification
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update car wash rating_promedio and total_reviews
  const { data: stats } = await admin
    .from('reviews')
    .select('rating')
    .eq('car_wash_id', car_wash_id);

  if (stats && stats.length > 0) {
    const avg = stats.reduce((sum: number, r: any) => sum + r.rating, 0) / stats.length;
    await admin.from('car_washes').update({
      rating_promedio: Math.round(avg * 10) / 10,
      total_reviews: stats.length,
    }).eq('id', car_wash_id);
  }

  // 5. Notify admin
  const { data: carWash } = await admin
    .from('car_washes')
    .select('owner_id, nombre')
    .eq('id', car_wash_id)
    .single();

  if (carWash) {
    const { data: reviewer } = await admin
      .from('users')
      .select('nombre')
      .eq('id', user.id)
      .single();

    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    await admin.from('notifications').insert({
      user_id: carWash.owner_id,
      appointment_id,
      tipo: 'review_request',
      titulo: 'Nueva resena recibida',
      mensaje: `${reviewer?.nombre ?? 'Un cliente'} califico ${carWash.nombre} con ${stars}${comentario ? `: "${comentario}"` : ''}`,
      leida: false,
    });
  }

  return NextResponse.json({ success: true });
}
