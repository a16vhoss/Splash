export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCard } from '@/components/wash-card';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const { data: topWashes } = await supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url')
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
        <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Encuentra y agenda tu autolavado en segundos
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Busca autolavados cercanos, compara precios y agenda tu cita sin complicaciones.
            </p>
            <form action="/autolavados" className="mt-8 flex gap-2 max-w-md mx-auto">
              <input
                name="q"
                type="text"
                placeholder="Buscar por nombre o zona..."
                className="flex-1 px-4 py-3 rounded-card border border-border bg-white text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="submit" className="px-6 py-3 rounded-card bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Buscar
              </button>
            </form>
          </div>
        </section>

        {/* Featured washes */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">Autolavados destacados</h2>
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
            <p className="text-muted-foreground">No hay autolavados disponibles aun.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
