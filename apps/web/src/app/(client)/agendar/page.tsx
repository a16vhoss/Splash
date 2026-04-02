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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        car_wash_id: carWashId,
        service_id: serviceId,
        fecha,
        hora_inicio: hora,
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
