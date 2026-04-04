import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');

  if (carWashId) {
    // Get specific card
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*, car_washes(nombre, slug, loyalty_stamps_required), loyalty_rewards(*)')
      .eq('user_id', user.id)
      .eq('car_wash_id', carWashId)
      .single();

    return NextResponse.json({ card });
  }

  // Get all cards
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('*, car_washes(nombre, slug, loyalty_stamps_required), loyalty_rewards(*)')
    .eq('user_id', user.id)
    .order('stamps', { ascending: false });

  return NextResponse.json({ cards: cards ?? [] });
}
