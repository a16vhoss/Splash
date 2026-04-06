'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast';
import { LoyaltyCard } from '@/components/loyalty-card';
import { LoyaltyMini } from '@/components/loyalty-mini';

interface Appointment {
  id: string;
  fecha: string;
  hora_inicio: string;
  precio_cobrado: number;
  estado: string;
  car_wash_id: string;
  service_id: string;
  services: { nombre: string } | null;
  car_washes: { nombre: string; slug: string; latitud?: number; longitud?: number; whatsapp?: string; fotos?: string[] } | null;
  reviews?: { id: string }[] | null;
}

interface FavoriteWash {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  rating_promedio: number;
  total_reviews: number;
  fotos?: string[] | null;
}

interface LoyaltyCardData {
  id: string;
  stamps: number;
  stamps_required: number;
  car_washes: { nombre: string; slug: string } | null;
}

interface DashboardClientProps {
  userName: string;
  upcoming: Appointment[];
  history: Appointment[];
  favorites: FavoriteWash[];
  loyaltyCards: LoyaltyCardData[];
}

const TABS = ['Próximas', 'Historial', 'Favoritos', 'Mi tarjeta'];

function getCountdown(fecha: string, hora: string): string {
  const target = new Date(`${fecha}T${hora}`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Ahora';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

export function DashboardClient({ userName, upcoming, history, favorites, loyaltyCards }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [removedFavs, setRemovedFavs] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const toast = useToast();

  async function removeFavorite(carWashId: string) {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_wash_id: carWashId }),
    });
    if (res.ok) {
      setRemovedFavs((prev) => new Set(prev).add(carWashId));
      toast('Favorito eliminado');
    } else {
      toast('Error al eliminar favorito', 'error');
    }
  }

  async function hideFromHistory(appointmentId: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ oculta_cliente: true })
      .eq('id', appointmentId);

    if (error) {
      toast('Error al eliminar', 'error');
      return;
    }
    setHiddenIds((prev) => new Set(prev).add(appointmentId));
    toast('Eliminado del historial');
  }

  const topLoyalty = loyaltyCards[0];

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Hola, {userName.split(' ')[0]}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {upcoming.length > 0 ? `Tienes ${upcoming.length} cita${upcoming.length > 1 ? 's' : ''} próxima${upcoming.length > 1 ? 's' : ''}` : 'No tienes citas próximas'}
              </p>
            </div>
            {topLoyalty && <LoyaltyMini stamps={topLoyalty.stamps} stampsRequired={topLoyalty.stamps_required} />}
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === i
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Próximas */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes citas próximas</p>
                <Link href="/autolavados" className="text-sm text-primary font-semibold hover:underline mt-2 inline-block">Buscar autolavados</Link>
              </div>
            ) : (
              upcoming.map((apt) => {
                const cw = apt.car_washes as any;
                const svc = apt.services as any;
                const foto = cw?.fotos?.[0];
                return (
                  <div key={apt.id} className="bg-white rounded-modal border-l-4 border-l-accent border border-border p-4 shadow-card">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-modal overflow-hidden flex-shrink-0">
                          {foto ? (
                            <img src={foto} alt={cw?.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg">
                              {cw?.nombre?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{cw?.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{svc?.nombre}</p>
                          <div className="flex gap-3 mt-1 text-sm">
                            <span className="text-foreground">{new Date(apt.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="text-foreground">{apt.hora_inicio}</span>
                            <span className="text-accent font-semibold">${Number(apt.precio_cobrado).toLocaleString('es-MX')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-accent/10 rounded-card px-3 py-1.5 text-center flex-shrink-0">
                        <div className="text-lg font-extrabold text-accent">{getCountdown(apt.fecha, apt.hora_inicio)}</div>
                        <div className="text-[9px] text-accent font-semibold uppercase">Faltan</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-muted">
                      <a
                        href={`data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${apt.fecha.replace(/-/g, '')}T${apt.hora_inicio.replace(':', '')}00%0ASUMMARY:${encodeURIComponent((svc?.nombre || 'Cita') + ' - ' + (cw?.nombre || ''))}%0AEND:VEVENT%0AEND:VCALENDAR`}
                        download={`cita-${apt.id}.ics`}
                        className="flex-1 bg-muted py-2 rounded-card text-center text-xs font-semibold text-foreground hover:bg-border transition-colors"
                      >
                        Calendario
                      </a>
                      {cw?.latitud && cw?.longitud && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${cw.latitud},${cw.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-muted py-2 rounded-card text-center text-xs font-semibold text-foreground hover:bg-border transition-colors"
                        >
                          Llegar
                        </a>
                      )}
                      {cw?.whatsapp && (
                        <a
                          href={`https://wa.me/${cw.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-muted py-2 rounded-card text-center text-xs font-semibold text-foreground hover:bg-border transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                      <Link
                        href={`/mis-citas?cancel=${apt.id}`}
                        className="flex-1 bg-destructive/10 py-2 rounded-card text-center text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Cancelar
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Historial */}
        {activeTab === 1 && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin historial de citas</p>
            ) : (
              history.filter((apt) => !hiddenIds.has(apt.id)).map((apt) => {
                const cw = apt.car_washes as any;
                const svc = apt.services as any;
                const foto = cw?.fotos?.[0];
                const hasReview = apt.reviews && (apt.reviews as any[]).length > 0;
                return (
                  <div key={apt.id} className="bg-white rounded-modal border border-border p-3.5 flex items-center justify-between relative group">
                    <div className="flex gap-3 items-center">
                      <div className="w-11 h-11 rounded-card overflow-hidden flex-shrink-0">
                        {foto ? (
                          <img src={foto} alt={cw?.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold">
                            {cw?.nombre?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{cw?.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {svc?.nombre} · {new Date(apt.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · ${Number(apt.precio_cobrado).toLocaleString('es-MX')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {apt.estado === 'completed' && !hasReview && (
                        <Link
                          href={`/calificar/${apt.id}`}
                          className="bg-accent text-white px-3 py-1.5 rounded-card text-xs font-semibold hover:bg-accent/90 transition-colors"
                        >
                          Calificar
                        </Link>
                      )}
                      {hasReview && (
                        <span className="bg-accent/10 text-accent px-3 py-1.5 rounded-card text-xs font-semibold">
                          Calificado
                        </span>
                      )}
                      <Link
                        href={`/agendar?car_wash_id=${apt.car_wash_id}&service_id=${apt.service_id}`}
                        className="bg-primary text-white px-3 py-1.5 rounded-card text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Reservar de nuevo
                      </Link>
                      <button
                        onClick={() => hideFromHistory(apt.id)}
                        className="text-muted-foreground hover:text-destructive px-1.5 py-1.5 text-xs transition-colors"
                        title="Eliminar del historial"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Favoritos */}
        {activeTab === 2 && (
          <div>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tienes autolavados favoritos</p>
                <Link href="/autolavados" className="text-sm text-primary font-semibold hover:underline mt-2 inline-block">Explorar autolavados</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.filter((wash) => !removedFavs.has(wash.id)).map((wash) => {
                  const foto = wash.fotos?.[0];
                  return (
                    <div key={wash.id} className="bg-white rounded-modal border border-border overflow-hidden">
                      <div className="h-24 relative">
                        {foto ? (
                          <img src={foto} alt={wash.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light" />
                        )}
                        <button
                          onClick={() => removeFavorite(wash.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive text-sm hover:bg-white transition-colors"
                          title="Quitar de favoritos"
                        >
                          &#9829;
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-sm text-foreground">{wash.nombre}</div>
                        <div className="text-xs text-muted-foreground">&#9733; {Number(wash.rating_promedio).toFixed(1)} · {wash.total_reviews} resenas</div>
                        <Link
                          href={`/agendar?car_wash_id=${wash.id}`}
                          className="block mt-2 bg-accent text-white py-2 rounded-card text-center text-xs font-semibold hover:bg-accent/90 transition-colors"
                        >
                          Reservar
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mi tarjeta */}
        {activeTab === 3 && (
          <div className="max-w-md mx-auto">
            {loyaltyCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aun no tienes tarjetas de lealtad</p>
                <p className="text-xs text-muted-foreground mt-1">Completa citas en autolavados participantes para empezar a acumular sellos</p>
              </div>
            ) : (
              <div className="space-y-6">
                {loyaltyCards.map((card) => (
                  <div key={card.id}>
                    <LoyaltyCard
                      userName={userName}
                      stamps={card.stamps}
                      stampsRequired={card.stamps_required}
                      carWashName={(card.car_washes as any)?.nombre}
                    />
                  </div>
                ))}
                {/* How it works */}
                <div className="bg-white rounded-modal border border-border p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">Como funciona?</h3>
                  <div className="space-y-2.5 text-sm text-foreground">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-7 h-7 rounded-card bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <span>Cada cita completada = 1 sello</span>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <div className="w-7 h-7 rounded-card bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <span>Acumula 10 sellos en el mismo autolavado</span>
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <div className="w-7 h-7 rounded-card bg-accent/10 flex items-center justify-center text-xs flex-shrink-0">&#127873;</div>
                      <span>Tu siguiente lavado es <strong className="text-accent">GRATIS</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
