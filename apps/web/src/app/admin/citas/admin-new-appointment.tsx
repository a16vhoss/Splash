'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/toast';

interface Service {
  id: string;
  nombre: string;
}

interface Props {
  carWashId: string;
  services: Service[];
}

interface AvailabilitySlot {
  time: string;
  disponibles: number;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminNewAppointment({ carWashId, services }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form state
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [fecha, setFecha] = useState(todayString());
  const [hora, setHora] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Availability
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!open || !fecha) return;

    setLoadingSlots(true);
    setHora('');
    setSlots([]);

    fetch(`/api/availability?car_wash_id=${carWashId}&fecha=${fecha}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.closed) {
          setSlots([]);
        } else {
          const available = (data.slots as AvailabilitySlot[]).filter((s) => s.disponibles > 0);
          setSlots(available);
          if (available.length > 0) setHora(available[0].time);
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [open, fecha, carWashId]);

  function handleOpen() {
    setOpen(true);
    setServiceId(services[0]?.id ?? '');
    setFecha(todayString());
    setClienteNombre('');
    setMetodoPago('efectivo');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hora) {
      toast('Selecciona un horario', 'error');
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_wash_id: carWashId,
          service_id: serviceId,
          fecha,
          hora_inicio: hora,
          cliente_nombre: clienteNombre.trim() || undefined,
          metodo_pago: metodoPago,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? 'Error al crear cita', 'error');
        return;
      }

      toast('Cita creada');
      setOpen(false);
      router.refresh();
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setIsPending(false);
    }
  }

  const inputCls =
    'w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60';
  const labelCls = 'mb-1 block text-xs font-semibold text-muted-foreground';

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        + Nueva cita
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-card bg-card p-6 shadow-modal">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Nueva cita (walk-in)</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service */}
              <div>
                <label className={labelCls}>Servicio</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  required
                  className={inputCls}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>

              {/* Time */}
              <div>
                <label className={labelCls}>Hora</label>
                {loadingSlots ? (
                  <p className="text-xs text-muted-foreground">Cargando horarios...</p>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin horarios disponibles para esta fecha</p>
                ) : (
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                    className={inputCls}
                  >
                    {slots.map((s) => (
                      <option key={s.time} value={s.time}>
                        {s.time} ({s.disponibles} disponible{s.disponibles !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Client name */}
              <div>
                <label className={labelCls}>Nombre del cliente (opcional)</label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Juan García"
                  maxLength={150}
                  className={inputCls}
                />
              </div>

              {/* Payment method */}
              <div>
                <label className={labelCls}>Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className={inputCls}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_sitio">Tarjeta en sitio</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-input border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || slots.length === 0}
                  className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  {isPending ? 'Creando...' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
