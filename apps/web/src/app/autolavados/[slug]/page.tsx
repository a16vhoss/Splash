export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {services && services.filter((s: any) => !s.es_complementario).length > 0 && (
                    <Link
                      href={`/agendar?car_wash_id=${carWash.id}&service_id=${services.filter((s: any) => !s.es_complementario)[0].id}`}
                      className="inline-flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Reservar
                    </Link>
                  )}
                  {carWash.latitud && carWash.longitud && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${carWash.latitud},${carWash.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      Como llegar
                    </a>
                  )}
                  {carWash.whatsapp && (
                    <a
                      href={`https://wa.me/${carWash.whatsapp}?text=${encodeURIComponent('Hola, vi su autolavado en Splash')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-card bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.685-1.228A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.316 0-4.47-.756-6.209-2.034l-.346-.27-3.587.94.957-3.496-.296-.47A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
          {/* Services */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Servicios</h2>
            {services && services.filter((s: any) => !s.es_complementario).length > 0 ? (
              <div className="space-y-3">
                {services.filter((s: any) => !s.es_complementario).map((service: any) => (
                  <ServiceCard key={service.id} service={service} carWashId={carWash.id} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay servicios disponibles.</p>
            )}

            {services && services.some((s: any) => s.es_complementario) && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-foreground mb-3">Servicios complementarios</h3>
                <p className="text-sm text-muted-foreground mb-3">Agrega extras al agendar tu cita</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.filter((s: any) => s.es_complementario).map((svc: any) => (
                    <div key={svc.id} className="rounded-card border border-border p-4">
                      <div className="font-medium text-foreground">{svc.nombre}</div>
                      {svc.descripcion && <p className="text-xs text-muted-foreground mt-1">{svc.descripcion}</p>}
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="font-bold text-foreground">+${Number(svc.precio).toLocaleString('es-MX')}</span>
                        <span className="text-muted-foreground">{svc.duracion_min} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
