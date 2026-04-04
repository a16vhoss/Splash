'use client';

import { useState } from 'react';

interface NotifyMeModalProps {
  carWashId: string;
  carWashName: string;
  serviceId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function NotifyMeModal({
  carWashId,
  carWashName,
  serviceId,
  fecha,
  horaInicio,
  horaFin,
  onClose,
  onSuccess,
}: NotifyMeModalProps) {
  const [canales, setCanales] = useState<string[]>(['email']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleCanal(canal: string) {
    setCanales((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]
    );
  }

  async function handleSubmit() {
    if (canales.length === 0) {
      setError('Selecciona al menos un canal');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/availability-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_wash_id: carWashId,
          service_id: serviceId,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          canal: canales,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError('Error al crear la alerta');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  const fechaFormatted = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-modal p-6 max-w-sm w-full shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-lg font-bold text-foreground">Sin horarios disponibles</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Te notificamos si se abre un espacio en <strong>{carWashName}</strong> para:
          </p>
          <p className="text-sm font-semibold text-foreground mt-1">
            {fechaFormatted} · {horaInicio} - {horaFin}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <label className={`flex-1 flex items-center gap-2 text-xs p-2.5 rounded-card border cursor-pointer transition-colors ${
            canales.includes('email') ? 'bg-primary/10 border-primary/30' : 'border-border'
          }`}>
            <input
              type="checkbox"
              checked={canales.includes('email')}
              onChange={() => toggleCanal('email')}
              className="accent-primary"
            />
            Email
          </label>
          <label className={`flex-1 flex items-center gap-2 text-xs p-2.5 rounded-card border cursor-pointer transition-colors ${
            canales.includes('push') ? 'bg-primary/10 border-primary/30' : 'border-border'
          }`}>
            <input
              type="checkbox"
              checked={canales.includes('push')}
              onChange={() => toggleCanal('push')}
              className="accent-primary"
            />
            Push
          </label>
        </div>

        {error && <p className="text-xs text-destructive mb-3 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 rounded-card bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Activando...' : 'Activar notificacion'}
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Tambien puedes elegir otro horario u otro autolavado
        </p>
      </div>
    </div>
  );
}
