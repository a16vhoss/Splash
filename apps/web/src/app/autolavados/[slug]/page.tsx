export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ServiceCard } from '@/components/service-card';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default async function CarWashProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();

  if (!carWash) notFound();

  const [{ data: services }, { data: hours }, { data: reviews }] = await Promise.all([
    supabase.from('services').select('*').eq('car_wash_id', carWash.id).eq('activo', true).order('orden'),
    supabase.from('business_hours').select('*').eq('car_wash_id', carWash.id).order('dia_semana'),
    supabase.from('reviews').select('rating, comentario, created_at, users!client_id(nombre)').eq('car_wash_id', carWash.id).order('created_at', { ascending: false }).limit(10),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-modal bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-extrabold text-primary">{carWash.nombre.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground">{carWash.nombre}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-warning text-lg">★</span>
                  <span className="text-lg font-bold text-foreground">{Number(carWash.rating_promedio).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({carWash.total_reviews} resenas)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{carWash.direccion}</p>
                {carWash.descripcion && (
                  <p className="text-sm text-muted-foreground mt-2">{carWash.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
          {/* Services */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Servicios</h2>
            {services && services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service: any) => (
                  <ServiceCard key={service.id} service={service} carWashId={carWash.id} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay servicios disponibles.</p>
            )}
          </section>

          {/* Business Hours */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Horarios</h2>
            <div className="rounded-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {dayNames.map((day, i) => {
                    const h = hours?.find((hr: any) => hr.dia_semana === i);
                    return (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-semibold text-foreground">{day}</td>
                        <td className="px-4 py-2.5 text-right">
                          {h?.cerrado ? (
                            <span className="text-destructive text-xs font-semibold">Cerrado</span>
                          ) : h ? (
                            <span className="text-muted-foreground">{h.hora_apertura} - {h.hora_cierre}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Resenas</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any, i: number) => (
                  <div key={i} className="rounded-card border border-border p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`text-sm ${star <= review.rating ? 'text-warning' : 'text-border'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(review.users as any)?.nombre ?? 'Cliente'}
                      </span>
                    </div>
                    {review.comentario && (
                      <p className="text-sm text-foreground mt-2">{review.comentario}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aun no hay resenas.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
