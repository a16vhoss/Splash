import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';

const COOKIE_NAME = 'selected_car_wash_id';

/**
 * Returns the currently selected car wash for the logged-in admin.
 * Falls back to first owned car wash if cookie is missing or invalid.
 */
export async function getAdminCarWash(select = 'id'): Promise<any> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(COOKIE_NAME)?.value;

  // If we have a cookie, try to fetch that specific car wash (verify ownership)
  if (selectedId) {
    const { data } = await supabase
      .from('car_washes')
      .select(select)
      .eq('id', selectedId)
      .eq('owner_id', user.id)
      .single();

    if (data) return data;
  }

  // Fallback: get the first car wash owned by this admin
  const { data } = await supabase
    .from('car_washes')
    .select(select)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return data;
}

/**
 * Returns all car washes owned by the logged-in admin.
 */
export async function getAdminCarWashes() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('car_washes')
    .select('id, nombre, subscription_status')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  return data ?? [];
}
