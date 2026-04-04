import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: favorites } = await supabase
    .from('favorites')
    .select('car_wash_id, created_at, car_washes(id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url, fotos)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ favorites: favorites ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { car_wash_id } = await request.json();
  if (!car_wash_id) return NextResponse.json({ error: 'car_wash_id requerido' }, { status: 400 });

  // Toggle: if exists delete, if not insert
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('car_wash_id', car_wash_id)
    .single();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return NextResponse.json({ favorited: false });
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, car_wash_id });
    return NextResponse.json({ favorited: true });
  }
}
