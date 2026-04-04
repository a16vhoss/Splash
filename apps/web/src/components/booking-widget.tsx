'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  nombre: string;
  precio: number;
  duracion_min: number;
  es_complementario: boolean;
}

interface Slot {
  time: string;
  capacidad: number;
  ocupados: number;
  disponibles: number;
}

interface BookingWidgetProps {
  carWashId: string;
  services: Service[];
  carWashName: string;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function getNext14Days() {
  const result: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

export function BookingWidget({ carWashId, services, carWashName: _carWashName }: BookingWidgetProps) {
  const router = useRouter();
  const mainServices = services.filter((s) => !s.es_complementario);
  const extras = services.filter((s) => s.es_complementario);

  const [selectedService, setSelectedService] = useState<string>(mainServices[0]?.id || '');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === selectedService);
  const extraServices = extras.filter((e) => selectedExtras.includes(e.id));
  const total = (service?.precio || 0) + extraServices.reduce((sum, e) => sum + e.precio, 0);

  useEffect(() => {
    if (!selectedService || !fecha) return;
    setLoading(true);
    setSelectedSlot(null);
    const s = services.find((sv) => sv.id === selectedService);
    const duration = s?.duracion_min || 60;

    fetch(`/api/availability?car_wash_id=${carWashId}&fecha=${fecha}&duracion=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) setSlots(data.slots.filter((sl: Slot) => sl.disponibles > 0));
        else setSlots([]);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [selectedService, fecha, carWashId, services]);

  function handleBook() {
    if (!selectedSlot || !selectedService) return;
    const params = new URLSearchParams({
      car_wash_id: carWashId,
      service_id: selectedService,
      fecha,
      hora: selectedSlot,
    });
    if (selectedExtras.length > 0) {
      params.set('extras', selectedExtras.join(','));
    }
    router.push(`/agendar?${params.toString()}`);
  }

  function toggleExtra(id: string) {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  return (
    <div className="bg-white rounded-modal p-5 shadow-modal sticky top-6">
      <h3 className="text-base font-bold text-foreground mb-4">Reservar cita</h3>

      {/* Service selector */}
      <div className="mb-3">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1">Servicio</label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="w-full bg-muted rounded-card px-3 py-2.5 text-sm text-foreground border-none outline-none"
        >
          {mainServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} — ${Number(s.precio).toLocaleString('es-MX')}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="mb-3">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1">Fecha</label>
        <select
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full bg-muted rounded-card px-3 py-2.5 text-sm text-foreground border-none outline-none"
        >
          {getNext14Days().map((d) => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
        </select>
      </div>

      {/* Time slots */}
      <div className="mb-3">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1">Hora disponible</label>
        {loading ? (
          <div className="text-xs text-muted-foreground py-2">Cargando horarios...</div>
        ) : slots.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot.time)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                  selectedSlot === slot.time
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-2">Sin horarios disponibles para esta fecha</div>
        )}
      </div>

      {/* Extras */}
      {extras.length > 0 && (
        <div className="mb-4">
          <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide mb-1">Extras</label>
          <div className="space-y-1.5">
            {extras.map((extra) => (
              <label
                key={extra.id}
                className="flex items-center gap-2 text-xs text-foreground bg-muted/50 p-2 rounded-card cursor-pointer hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(extra.id)}
                  onChange={() => toggleExtra(extra.id)}
                  className="accent-accent"
                />
                {extra.nombre} (+${Number(extra.precio).toLocaleString('es-MX')})
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center py-3 border-t border-border mb-3">
        <span className="text-sm font-semibold text-foreground">Total</span>
        <span className="text-xl font-extrabold text-accent">${Number(total).toLocaleString('es-MX')} MXN</span>
      </div>

      {/* CTA */}
      <button
        onClick={handleBook}
        disabled={!selectedSlot}
        className="w-full py-3 rounded-card bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirmar reserva
      </button>
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        Cancelacion gratis hasta 2 horas antes
      </p>
    </div>
  );
}
