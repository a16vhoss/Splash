import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { TRIAL_DAYS } from '@splash/shared';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verify user is wash_admin
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'wash_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { nombre, direccion, whatsapp, latitud, longitud } = body;

  if (!nombre || !direccion) {
    return NextResponse.json({ error: 'Nombre y direccion son requeridos' }, { status: 400 });
  }

  const slug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const { data: carWash, error } = await supabase
    .from('car_washes')
    .insert({
      owner_id: user.id,
      nombre,
      slug,
      direccion,
      subscription_status: 'trial',
      trial_ends_at: trialEnd.toISOString(),
      num_estaciones: 1,
      whatsapp: whatsapp || null,
      latitud: latitud ?? null,
      longitud: longitud ?? null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Error al crear negocio' }, { status: 500 });
  }

  return NextResponse.json({ id: carWash.id });
}
