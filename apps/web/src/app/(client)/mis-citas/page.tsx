
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppointmentCard } from '@/components/appointment-card';

export default function MisCitasPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const supabase = createClient();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*, car_washes!car_wash_id(nombre), services!service_id(nombre)')
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false })
      .limit(50);
    setAppointments(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAppointments(); }, []);

  async function handleCancel(id: string) {
    const motivo = prompt('Motivo de cancelacion:');
    if (!motivo) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ motivo_cancelacion: motivo }),
    });

    if (res.ok) {
      loadAppointments();
    } else {
      const data = await res.json();
      alert(data.error ?? 'Error al cancelar');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Mis Citas</h1>

      {success && (
        <div className="rounded-card bg-accent/10 border border-accent/20 px-4 py-3 mb-6">
          <p className="text-sm text-accent font-semibold">Cita agendada exitosamente. Recuerda que el pago es en sitio.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No tienes citas aun.</p>
          <a href="/autolavados" className="text-sm text-primary hover:underline mt-2 inline-block">Buscar autolavados</a>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
