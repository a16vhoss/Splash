export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCard } from '@/components/wash-card';
import { SearchBar } from '@/components/search-bar';
import { CategoryGrid } from '@/components/category-grid';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const { data: topWashes } = await supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url, fotos')
    .eq('activo', true)
    .eq('verificado', true)
    .in('subscription_status', ['trial', 'active'])
    .order('rating_promedio', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary to-accent py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Encuentra tu autolavado ideal
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/80 max-w-xl mx-auto">
              Reserva en segundos. Sin esperas.
            </p>
            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>
          </div>
        </section>

        {/* Mejor calificados */}
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Mejor calificados</h2>
            <Link href="/autolavados" className="text-sm font-semibold text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          {topWashes && topWashes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWashes.map((wash: any) => (
                <WashCard key={wash.id} wash={wash} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay autolavados disponibles aún.</p>
          )}
        </section>

        {/* Buscar por servicio */}
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <h2 className="text-xl font-bold text-foreground mb-6">Buscar por servicio</h2>
          <CategoryGrid />
        </section>
      </main>
      <Footer />
    </div>
  );
}
