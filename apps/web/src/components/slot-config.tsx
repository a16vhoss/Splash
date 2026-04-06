'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

const SLOT_DURATIONS = [30, 45, 60, 90, 120] as const;
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

interface BusinessHour {
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  cerrado: boolean;
}

interface CapacityEntry {
  dia_semana: number;
  hora: string;
  capacidad: number;
}

interface SlotConfigProps {
  carWashId: string;
  slotDurationMin: number;
  numEstaciones: number;
  businessHours: BusinessHour[];
  initialCapacities: CapacityEntry[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(apertura: string, cierre: string, durationMin: number): string[] {
  const start = timeToMinutes(apertura);
  const end = timeToMinutes(cierre);
  const slots: string[] = [];
  for (let t = start; t + durationMin <= end; t += durationMin) {
    slots.push(minutesToHHMM(t));
  }
  return slots;
}

type CapacityMap = Record<number, Record<string, number>>;

function buildCapacityMap(capacities: CapacityEntry[]): CapacityMap {
  const map: CapacityMap = {};
  for (const entry of capacities) {
    if (!map[entry.dia_semana]) map[entry.dia_semana] = {};
    // normalize hora to HH:MM (strip seconds if present)
    const hora = entry.hora.slice(0, 5);
    map[entry.dia_semana][hora] = entry.capacidad;
  }
  return map;
}

export function SlotConfig({ carWashId, slotDurationMin, numEstaciones, businessHours, initialCapacities }: SlotConfigProps) {
  const toast = useToast();
  const [duration, setDuration] = useState<number>(slotDurationMin);
  const [activeDay, setActiveDay] = useState<number>(() => {
    const firstOpen = businessHours.find((bh) => !bh.cerrado);
    return firstOpen?.dia_semana ?? 0;
  });
  const [capacities, setCapacities] = useState<CapacityMap>(() => buildCapacityMap(initialCapacities));
  const [saving, setSaving] = useState(false);

  const openDays = new Set(businessHours.filter((bh) => !bh.cerrado).map((bh) => bh.dia_semana));

  function getBusinessHour(dia: number): BusinessHour | undefined {
    return businessHours.find((bh) => bh.dia_semana === dia);
  }

  function getSlotsForDay(dia: number): string[] {
    const bh = getBusinessHour(dia);
    if (!bh || bh.cerrado) return [];
    return generateSlots(bh.hora_apertura, bh.hora_cierre, duration);
  }

  function getCapacity(dia: number, hora: string): number {
    return capacities[dia]?.[hora] ?? numEstaciones;
  }

  function setCapacity(dia: number, hora: string, value: number) {
    setCapacities((prev) => ({
      ...prev,
      [dia]: {
        ...(prev[dia] ?? {}),
        [hora]: value,
      },
    }));
  }

  function handleDurationChange(newDuration: number) {
    setDuration(newDuration);
    // Rebuild capacity map: keep existing values where hora matches, default 1 otherwise
    setCapacities((prev) => {
      const next: CapacityMap = {};
      for (const bh of businessHours) {
        if (bh.cerrado) continue;
        const slots = generateSlots(bh.hora_apertura, bh.hora_cierre, newDuration);
        next[bh.dia_semana] = {};
        for (const slot of slots) {
          next[bh.dia_semana][slot] = prev[bh.dia_semana]?.[slot] ?? numEstaciones;
        }
      }
      return next;
    });
  }

  function handleCopyToAll() {
    const sourceSlots = getSlotsForDay(activeDay);
    if (sourceSlots.length === 0) return;
    setCapacities((prev) => {
      const next: CapacityMap = { ...prev };
      for (const bh of businessHours) {
        if (bh.cerrado || bh.dia_semana === activeDay) continue;
        const targetSlots = generateSlots(bh.hora_apertura, bh.hora_cierre, duration);
        next[bh.dia_semana] = {};
        for (const slot of targetSlots) {
          // Use matching hour from source if available, else numEstaciones
          next[bh.dia_semana][slot] = prev[activeDay]?.[slot] ?? numEstaciones;
        }
      }
      return next;
    });
    toast('Capacidades copiadas a todos los dias');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const flatCapacities: CapacityEntry[] = [];
      for (const [diaStr, slots] of Object.entries(capacities)) {
        const dia = Number(diaStr);
        for (const [hora, capacidad] of Object.entries(slots)) {
          flatCapacities.push({ dia_semana: dia, hora, capacidad });
        }
      }

      const res = await fetch('/api/admin/slot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_wash_id: carWashId,
          slot_duration_min: duration,
          capacities: flatCapacities,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? 'Error al guardar', 'error');
      } else {
        toast('Configuracion de slots guardada');
      }
    } catch {
      toast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  const activeDaySlots = getSlotsForDay(activeDay);

  return (
    <section className="rounded-card bg-card p-6 shadow-card space-y-5">
      <h3 className="text-base font-semibold text-foreground">Capacidad por turno</h3>

      {/* Duration selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">Duracion del turno:</label>
        <select
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          className="rounded-input border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SLOT_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} min
            </option>
          ))}
        </select>
      </div>

      {/* Day tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {DAY_NAMES.map((name, dia) => {
          const closed = !openDays.has(dia);
          const isActive = activeDay === dia;
          return (
            <button
              key={dia}
              type="button"
              disabled={closed}
              onClick={() => setActiveDay(dia)}
              className={[
                'px-3 py-2 text-xs font-semibold rounded-t transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : closed
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {name}
              {closed && <span className="ml-1 text-[10px]">(cerrado)</span>}
            </button>
          );
        })}
      </div>

      {/* Slot table */}
      {activeDaySlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este dia esta cerrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-6 text-left text-xs font-semibold text-muted-foreground">Horario</th>
                <th className="py-2 text-left text-xs font-semibold text-muted-foreground">Capacidad maxima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeDaySlots.map((hora) => (
                <tr key={hora}>
                  <td className="py-2 pr-6 font-medium text-foreground">{hora}</td>
                  <td className="py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={getCapacity(activeDay, hora)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        if (raw === '') { setCapacity(activeDay, hora, 0); return; }
                        const num = parseInt(raw, 10);
                        setCapacity(activeDay, hora, num > numEstaciones ? numEstaciones : num);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-20 rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleCopyToAll}
          disabled={activeDaySlots.length === 0}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        >
          Copiar a todos los dias
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-input bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar turnos'}
        </button>
      </div>
    </section>
  );
}
