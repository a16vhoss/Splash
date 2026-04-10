'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookingWizard } from '@/components/booking-wizard';

interface CarWashOption {
  id: string;
  nombre: string;
  direccion: string | null;
  rating_promedio: number | null;
  total_reviews: number | null;
  logo_url: string | null;
}

function CarWashSelector() {
  const router = useRouter();
  const [carWashes, setCarWashes] = useState<CarWashOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('car_washes')
      .select('id, nombre, direccion, rating_promedio, total_reviews, logo_url')
      .eq('activo', true)
      .in('subscription_status', ['trial', 'active'])
      .order('rating_promedio', { ascending: false })
      .then(({ data }) => {
        setCarWashes(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando autolavados...</p>
      </div>
    );
  }

  if (carWashes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No hay autolavados disponibles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-foreground mb-1">Agendar lavado</h2>
      <p className="text-sm text-muted-foreground mb-4">Selecciona un autolavado para continuar</p>
      <div className="space-y-3">
        {carWashes.map((cw) => {
          const initial = cw.nombre.charAt(0).toUpperCase();
          const rating = cw.rating_promedio ?? 0;
          return (
            <button
              key={cw.id}
              type="button"
              onClick={() => router.push(`/agendar?car_wash_id=${cw.id}`)}
              className="w-full flex items-center gap-4 rounded-card bg-card p-4 shadow-card text-left hover:shadow-card-hover transition-shadow"
            >
              {cw.logo_url ? (
                <img
                  src={cw.logo_url}
                  alt={cw.nombre}
                  className="h-12 w-12 rounded-card object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-card bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{initial}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{cw.nombre}</p>
                {cw.direccion && (
                  <p className="text-xs text-muted-foreground truncate">{cw.direccion}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  ★ {rating > 0 ? rating.toFixed(1) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {cw.total_reviews ?? 0} reseñas
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendarPage() {
  const searchParams = useSearchParams();
  const carWashId = searchParams.get('car_wash_id');
  const serviceId = searchParams.get('service_id');

  if (!carWashId) {
    return <CarWashSelector />;
  }

  return <BookingWizard carWashId={carWashId} initialServiceId={serviceId ?? undefined} />;
}
