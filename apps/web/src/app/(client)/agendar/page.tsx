
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TimeSlotPicker } from '@/components/time-slot-picker';

export default function AgendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const carWashId = searchParams.get('car_wash_id');
  const serviceId = searchParams.get('service_id');

  const [service, setService] = useState<any>(null);
  const [carWash, setCarWash] = useState<any>(null);
  const [complementaryServices, setComplementaryServices] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carWashId || !serviceId) return;
    Promise.all([
      supabase.from('services').select('nombre, precio, duracion_min').eq('id', serviceId).single(),
      supabase.from('car_washes').select('nombre, direccion').eq('id', carWashId).single(),
    ]).then(([sRes, cwRes]) => {
      setService(sRes.data);
      setCarWash(cwRes.data);
      setLoading(false);
    });
    supabase.from('services').select('id, nombre, precio, duracion_min').eq('car_wash_id', carWashId).eq('es_complementario', true).eq('activo', true).then(({ data }) => setComplementaryServices(data ?? []));
  }, [carWashId, serviceId]);

  async function handleConfirm(fecha: string, hora: string) {
    setBooking(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?redirect=/agendar?car_wash_id=${carWashId}&service_id=${serviceId}`);
      return;
    }

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_wash_id: carWashId,
        service_id: serviceId,
        fecha,
        hora_inicio: hora,
        servicios_complementarios: selectedExtras.length > 0 ? selectedExtras : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Error al agendar');
      setBooking(false);
      return;
    }

    router.push('/mis-citas?success=1');
  }

  if (!carWashId || !serviceId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Selecciona un servicio desde un autolavado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Agendar cita</h1>

      {/* Service summary */}
      <div className="rounded-card border border-border bg-white p-5 mb-8">
        <p className="text-sm text-muted-foreground">{carWash?.nombre}</p>
        <h2 className="text-lg font-bold text-foreground">{service?.nombre}</h2>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>{service?.duracion_min} min</span>
          <span className="font-bold text-foreground text-lg">${Number(service?.precio).toLocaleString('es-MX')}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{carWash?.direccion}</p>
        <p className="text-xs text-accent font-semibold mt-1">Pago en sitio</p>
      </div>

      {/* Complementary services */}
      {complementaryServices.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-3">Agrega extras</h3>
          <div className="space-y-2">
            {complementaryServices.map((extra: any) => (
              <label key={extra.id} className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={(e) => {
                    setSelectedExtras((prev) =>
                      e.target.checked ? [...prev, extra.id] : prev.filter((id) => id !== extra.id)
                    );
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{extra.nombre}</span>
                  <span className="text-xs text-muted-foreground ml-2">{extra.duracion_min} min</span>
                </div>
                <span className="text-sm font-bold text-foreground">+${Number(extra.precio).toLocaleString('es-MX')}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 text-right text-sm font-semibold text-foreground">
            Total: ${(Number(service?.precio ?? 0) + complementaryServices.filter((e: any) => selectedExtras.includes(e.id)).reduce((sum: number, e: any) => sum + e.precio, 0)).toLocaleString('es-MX')}
          </div>
        </div>
      )}

      {/* Time slot picker */}
      <h3 className="text-lg font-bold text-foreground mb-4">Selecciona fecha y hora</h3>
      <TimeSlotPicker
        carWashId={carWashId}
        serviceId={serviceId}
        onSelect={handleConfirm}
      />

      {error && (
        <div className="mt-4 rounded-card bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {booking && (
        <div className="mt-4 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
