export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCardHorizontal } from '@/components/wash-card-horizontal';
import { SearchBar } from '@/components/search-bar';
import { FilterPills } from '@/components/filter-pills';
import { ListingMapSection } from './listing-client';

export default async function AutolavadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    fecha?: string;
    hora?: string;
    vehiculo?: string;
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

  // Sort
  const sort = params.sort || 'rating';
  if (sort === 'rating') query = query.order('rating_promedio', { ascending: false });
  else if (sort === 'reviews') query = query.order('total_reviews', { ascending: false });
  else if (sort === 'name') query = query.order('nombre', { ascending: true });
  else query = query.order('rating_promedio', { ascending: false });

  const { data: washes } = await query.limit(50);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Search refinement */}
        <div className="mb-4">
          <SearchBar
            variant="compact"
            defaultQuery={params.q}
            defaultFecha={params.fecha}
            defaultHora={params.hora}
            defaultVehiculo={params.vehiculo}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterPills />
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground mb-4">
          {washes?.length ?? 0} autolavados encontrados
          {params.q ? ` para "${params.q}"` : ''}
        </p>

        {washes && washes.length > 0 ? (
          <div className="flex gap-6">
            {/* Cards column */}
            <div className="flex-1 min-w-0 space-y-3">
              {washes.map((wash: any) => (
                <WashCardHorizontal key={wash.id} wash={wash} />
              ))}
            </div>

            {/* Map column - hidden on mobile */}
            <div className="hidden lg:block w-[400px] flex-shrink-0">
              <div className="sticky top-6">
                <ListingMapSection carWashes={washes} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No se encontraron autolavados.</p>
            {params.q && (
              <a href="/autolavados" className="text-sm text-primary hover:underline mt-2 inline-block">Ver todos</a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
