export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCard } from '@/components/wash-card';

export default async function AutolavadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rating?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();

  let query = supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url')
    .eq('activo', true)
    .eq('verificado', true)
    .in('subscription_status', ['trial', 'active'])
    .order('rating_promedio', { ascending: false });

  if (params.q) {
    query = query.ilike('nombre', `%${params.q}%`);
  }
  if (params.rating) {
    query = query.gte('rating_promedio', Number(params.rating));
  }

  const { data: washes } = await query.limit(50);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {params.q ? `Resultados para "${params.q}"` : 'Todos los autolavados'}
          </h1>
          {/* Search form */}
          <form action="/autolavados" className="flex gap-2">
            <input
              name="q"
              type="text"
              defaultValue={params.q ?? ''}
              placeholder="Buscar..."
              className="px-3 py-2 rounded-card border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-64"
            />
            <button type="submit" className="px-4 py-2 rounded-card bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Buscar
            </button>
          </form>
        </div>

        {washes && washes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {washes.map((wash: any) => (
              <WashCard key={wash.id} wash={wash} />
            ))}
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
