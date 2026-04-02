import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data } = await supabase
    .from('car_washes')
    .select('id, slug, nombre')
    .eq('owner_id', user.id)
    .single();

  if (!data) return NextResponse.json({ error: 'No car wash found' }, { status: 404 });

  return NextResponse.json(data);
}
