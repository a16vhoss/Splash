
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { StarRatingInput } from '@/components/star-rating-input';
import { useToast } from '@/components/toast';

export default function CalificarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [appointment, setAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('appointments')
      .select('id, fecha, estado, car_wash_id, car_washes!car_wash_id(nombre), services!service_id(nombre)')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('No se pudo cargar la cita');
        } else {
          setAppointment(data);
        }
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Selecciona una calificacion'); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_id: id,
        car_wash_id: appointment.car_wash_id,
        rating,
        comentario: comentario || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al enviar calificacion');
      setSubmitting(false);
      return;
    }

    toast('Evaluacion enviada, gracias');
    router.push('/mis-citas');
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{error || 'No se encontro la cita.'}</p>
      </div>
    );
  }

  if (appointment.estado !== 'completed' && appointment.estado !== 'no_show') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Solo puedes calificar citas completadas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Califica tu experiencia</h1>

      <div className="rounded-card border border-border bg-white p-5 mb-8">
        <p className="font-bold text-foreground">{appointment.car_washes?.nombre}</p>
        <p className="text-sm text-muted-foreground">{appointment.services?.nombre} &middot; {appointment.fecha}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <StarRatingInput value={rating} onChange={setRating} />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Comentario (opcional)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuenta como fue tu experiencia..."
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 rounded-card border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {error && (
          <div className="rounded-card bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full py-3 rounded-card bg-primary text-white font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar calificacion'}
        </button>
      </form>
    </div>
  );
}
