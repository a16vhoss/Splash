import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: alerts } = await supabase
    .from('availability_alerts')
    .select('*, car_washes(nombre, slug)')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
    .order('created_at', { ascending: false });

  return NextResponse.json({ alerts: alerts ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  const { car_wash_id, service_id, fecha, hora_inicio, hora_fin, canal } = body;

  if (!car_wash_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }

  const { data: alert, error } = await supabase
    .from('availability_alerts')
    .insert({
      user_id: user.id,
      car_wash_id,
      service_id: service_id || null,
      fecha,
      hora_inicio,
      hora_fin,
      canal: canal || ['email'],
      estado: 'activo',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Error al crear alerta' }, { status: 500 });
  }

  return NextResponse.json({ alert });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  await supabase
    .from('availability_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return NextResponse.json({ deleted: true });
}
