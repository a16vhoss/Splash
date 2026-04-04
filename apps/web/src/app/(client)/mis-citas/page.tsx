export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';

export default async function MisCitasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user.id)
    .single();

  // Upcoming appointments
  const today = new Date().toISOString().split('T')[0];
  const { data: upcoming } = await supabase
    .from('appointments')
    .select('*, services(nombre), car_washes(nombre, slug, latitud, longitud, whatsapp, fotos)')
    .eq('client_id', user.id)
    .in('estado', ['confirmed', 'in_progress'])
    .gte('fecha', today)
    .order('fecha')
    .order('hora_inicio');

  // Past appointments
  const { data: history } = await supabase
    .from('appointments')
    .select('*, services(nombre), car_washes(nombre, slug, fotos), reviews!left(id)')
    .eq('client_id', user.id)
    .in('estado', ['completed', 'cancelled', 'no_show'])
    .order('fecha', { ascending: false })
    .limit(20);

  // Favorites
  const { data: favorites } = await supabase
    .from('favorites')
    .select('car_wash_id, car_washes(id, nombre, slug, direccion, rating_promedio, total_reviews, fotos)')
    .eq('user_id', user.id);

  // Loyalty cards
  const { data: loyaltyCards } = await supabase
    .from('loyalty_cards')
    .select('*, car_washes(nombre, slug)')
    .eq('user_id', user.id)
    .order('stamps', { ascending: false });

  return (
    <DashboardClient
      userName={userData?.nombre || 'Usuario'}
      upcoming={upcoming ?? []}
      history={history ?? []}
      favorites={(favorites ?? []).map((f: any) => f.car_washes).filter(Boolean)}
      loyaltyCards={loyaltyCards ?? []}
    />
  );
}
