export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PhotoGallery } from '@/components/photo-gallery';
import { BookingWidget } from '@/components/booking-widget';
import { BookingBottomBar } from '@/components/booking-bottom-bar';
import { RatingBreakdown } from '@/components/rating-breakdown';
import { FavoriteButton } from '@/components/favorite-button';
import { TabNavigation } from '@/components/tab-navigation';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TABS = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'ubicacion', label: 'Ubicación' },
];

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

  const [{ data: services }, { data: hours }, { data: reviews }, { data: user }] = await Promise.all([
    supabase.from('services').select('*').eq('car_wash_id', carWash.id).eq('activo', true).order('orden'),
    supabase.from('business_hours').select('*').eq('car_wash_id', carWash.id).order('dia_semana'),
    supabase.from('reviews').select('rating, comentario, created_at, rating_servicio, rating_limpieza, rating_tiempo, rating_valor, users!client_id(nombre)').eq('car_wash_id', carWash.id).order('created_at', { ascending: false }).limit(10),
    supabase.auth.getUser(),
  ]);

  // Check if user has favorited this car wash
  let isFavorited = false;
  if (user?.user) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('car_wash_id', carWash.id)
      .single();
    isFavorited = !!fav;
  }

  const mainServices = (services ?? []).filter((s: any) => !s.es_complementario);
  const extraServices = (services ?? []).filter((s: any) => s.es_complementario);
  const fotos: string[] = carWash.fotos ?? [];
  const minPrice = mainServices.length > 0 ? Math.min(...mainServices.map((s: any) => Number(s.precio))) : 0;

  // Count today's appointments for social proof
  const today = new Date().toISOString().split('T')[0];
  const { count: citasHoy } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('car_wash_id', carWash.id)
    .eq('fecha', today);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Photo Gallery */}
        <PhotoGallery fotos={fotos} nombre={carWash.nombre} />

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{carWash.nombre}</h1>
              <p className="text-sm text-muted-foreground mt-1">{carWash.direccion}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                <span className="bg-warning/10 text-warning px-2.5 py-0.5 rounded-card text-sm font-bold">
                  ★ {Number(carWash.rating_promedio).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">{carWash.total_reviews} reseñas</span>
                {citasHoy != null && citasHoy > 0 && (
                  <span className="text-xs text-accent font-semibold">{citasHoy} citas hoy</span>
                )}
              </div>
              {carWash.descripcion && (
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{carWash.descripcion}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <FavoriteButton carWashId={carWash.id} initialFavorited={isFavorited} />
              {carWash.whatsapp && (
                <a
                  href={`https://wa.me/${carWash.whatsapp}?text=${encodeURIComponent('Hola, vi su autolavado en Splash')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-sm text-muted-foreground hover:text-[#25D366] hover:border-[#25D366] transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              )}
              {carWash.latitud && carWash.longitud && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${carWash.latitud},${carWash.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                  aria-label="Cómo llegar"
                >
                  📍
                </a>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <TabNavigation tabs={TABS} />
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-10">
              {/* Services */}
              <section id="servicios">
                <h2 className="text-lg font-bold text-foreground mb-4">Servicios</h2>
                {mainServices.length > 0 ? (
                  <div className="space-y-3">
                    {mainServices.map((service: any, i: number) => (
                      <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-modal bg-white border border-border hover:shadow-card transition-shadow">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{service.nombre}</h4>
                            {i === 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-pill font-semibold">Popular</span>}
                          </div>
                          {service.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.descripcion}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm font-bold text-accent">${Number(service.precio).toLocaleString('es-MX')} MXN</span>
                            <span className="text-xs text-muted-foreground">⏱ {service.duracion_min} min</span>
                          </div>
                        </div>
                        <Link
                          href={`/agendar?car_wash_id=${carWash.id}&service_id=${service.id}`}
                          className="w-full sm:w-auto text-center px-4 py-2 rounded-card bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors whitespace-nowrap"
                        >
                          Reservar
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay servicios disponibles.</p>
                )}

                {extraServices.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
                      + Ver servicios complementarios ({extraServices.length})
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {extraServices.map((svc: any) => (
                        <div key={svc.id} className="rounded-card border border-border p-3">
                          <div className="font-medium text-sm text-foreground">{svc.nombre}</div>
                          {svc.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{svc.descripcion}</p>}
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="font-bold text-foreground">+${Number(svc.precio).toLocaleString('es-MX')}</span>
                            <span className="text-muted-foreground">{svc.duracion_min} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </section>

              {/* Reviews */}
              <section id="resenas">
                <h2 className="text-lg font-bold text-foreground mb-4">Reseñas</h2>
                <RatingBreakdown
                  overall={carWash.rating_promedio}
                  totalReviews={carWash.total_reviews}
                  servicio={carWash.avg_rating_servicio}
                  limpieza={carWash.avg_rating_limpieza}
                  tiempo={carWash.avg_rating_tiempo}
                  valor={carWash.avg_rating_valor}
                />
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {reviews.map((review: any, i: number) => (
                      <div key={i} className="rounded-modal bg-white border border-border p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {((review.users as any)?.nombre ?? 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{(review.users as any)?.nombre ?? 'Cliente'}</div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-xs ${star <= review.rating ? 'text-warning' : 'text-border'}`}>★</span>
                              ))}
                              <span className="text-[10px] text-muted-foreground ml-1">
                                {new Date(review.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comentario && (
                          <p className="text-sm text-foreground leading-relaxed">{review.comentario}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-4">Aún no hay reseñas.</p>
                )}
              </section>

              {/* Hours */}
              <section id="horarios">
                <h2 className="text-lg font-bold text-foreground mb-4">Horarios</h2>
                <div className="rounded-modal border border-border overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {dayNames.map((day, i) => {
                        const h = hours?.find((hr: any) => hr.dia_semana === i);
                        const isToday = new Date().getDay() === i;
                        return (
                          <tr key={i} className={isToday ? 'bg-primary/5' : 'hover:bg-muted/30'}>
                            <td className={`px-4 py-2.5 font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                              {day} {isToday && <span className="text-[10px] text-primary font-normal">(Hoy)</span>}
                            </td>
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

              {/* Location */}
              <section id="ubicacion">
                <h2 className="text-lg font-bold text-foreground mb-4">Ubicación</h2>
                <p className="text-sm text-muted-foreground mb-3">{carWash.direccion}</p>
                {carWash.latitud && carWash.longitud && (
                  <div className="rounded-modal overflow-hidden border border-border h-64">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(carWash.longitud) - 0.01},${Number(carWash.latitud) - 0.005},${Number(carWash.longitud) + 0.01},${Number(carWash.latitud) + 0.005}&layer=mapnik&marker=${carWash.latitud},${carWash.longitud}`}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-3">
                  {carWash.latitud && carWash.longitud && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${carWash.latitud},${carWash.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      🗺️ Cómo llegar
                    </a>
                  )}
                  {carWash.whatsapp && (
                    <a
                      href={`https://wa.me/${carWash.whatsapp}?text=${encodeURIComponent('Hola, vi su autolavado en Splash')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-card bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
                    </a>
                  )}
                </div>
              </section>
            </div>

            {/* Booking Widget - sidebar, hidden on mobile */}
            <div className="hidden lg:block w-[320px] flex-shrink-0">
              <BookingWidget
                carWashId={carWash.id}
                services={services ?? []}
                carWashName={carWash.nombre}
              />
            </div>
          </div>
        </div>

        {/* Mobile bottom bar */}
        <BookingBottomBar minPrice={minPrice} carWashId={carWash.id} />
      </main>
      <Footer />
    </div>
  );
}
