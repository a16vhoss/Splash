'use client';

import { useState } from 'react';

interface RatingFormDetailedProps {
  appointmentId: string;
  carWashId: string;
  carWashName: string;
  serviceName: string;
  fecha: string;
  onSuccess: () => void;
}

function StarRow({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-modal border border-border">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-xl transition-colors ${star <= value ? 'text-warning' : 'text-border hover:text-warning/50'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function RatingFormDetailed({ appointmentId, carWashId, carWashName, serviceName, fecha, onSuccess }: RatingFormDetailedProps) {
  const [servicio, setServicio] = useState(0);
  const [limpieza, setLimpieza] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [valor, setValor] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const overallRating = servicio && limpieza && tiempo && valor
    ? Math.round((servicio + limpieza + tiempo + valor) / 4)
    : 0;

  async function handleSubmit() {
    if (!servicio || !limpieza || !tiempo || !valor) {
      setError('Califica todas las categorías');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/appointments/' + appointmentId + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_wash_id: carWashId,
          rating: overallRating,
          rating_servicio: servicio,
          rating_limpieza: limpieza,
          rating_tiempo: tiempo,
          rating_valor: valor,
          comentario: comentario || null,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al enviar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-extrabold text-foreground">¿Cómo estuvo tu visita?</h2>
        <p className="text-sm text-muted-foreground mt-1">{carWashName} · {serviceName} · {fecha}</p>
      </div>

      <div className="space-y-3 mb-5">
        <StarRow label="Servicio" description="Atención y amabilidad del personal" value={servicio} onChange={setServicio} />
        <StarRow label="Limpieza" description="Calidad del lavado" value={limpieza} onChange={setLimpieza} />
        <StarRow label="Tiempo" description="Rapidez y puntualidad" value={tiempo} onChange={setTiempo} />
        <StarRow label="Valor" description="Relación calidad-precio" value={valor} onChange={setValor} />
      </div>

      <div className="bg-white rounded-modal border border-border p-3 mb-5">
        <label className="text-sm font-semibold text-foreground mb-1 block">Comentario (opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Cuéntanos tu experiencia..."
          className="w-full text-sm text-foreground bg-muted/50 rounded-card p-3 border-none outline-none resize-none h-20 placeholder:text-muted-foreground"
        />
      </div>

      {error && <p className="text-xs text-destructive text-center mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || overallRating === 0}
        className="w-full py-3 rounded-card bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar calificación'}
      </button>
    </div>
  );
}
