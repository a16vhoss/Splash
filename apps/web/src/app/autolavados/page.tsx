export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AutolavadosListing } from './listing-wrapper';

export default async function AutolavadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    rating?: string;
    sort?: string;
    categoria?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();

  let query = supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url, fotos, latitud, longitud')
    .eq('activo', true)
    .in('subscription_status', ['trial', 'active']);

  if (params.q) {
    query = query.or(`nombre.ilike.%${params.q}%,direccion.ilike.%${params.q}%`);
  }
  if (params.rating) {
    query = query.gte('rating_promedio', Number(params.rating));
  }

  // Default server sort by rating (client will re-sort by distance if geo available)
  query = query.order('rating_promedio', { ascending: false });

  const { data: washes } = await query.limit(50);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <AutolavadosListing
          washes={washes ?? []}
          query={params.q}
          activeRating={params.rating}
          activeSort={params.sort}
        />
      </main>
      <Footer />
    </div>
  );
}
