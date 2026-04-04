# Booking System Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace station-based booking with configurable slot capacity per hour/day, add a 4-step client wizard, and enable admin manual booking.

**Architecture:** New `slot_capacities` table stores capacity per car_wash/day/hour. Availability API reads from this table instead of counting stations. Client booking wizard replaces the current service-dependent page. Admin gets a "Nueva cita" button in the citas panel.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), Tailwind CSS, Zod, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-03-booking-system-design.md`

---

### Task 1: Database Migration — Slot System

**Files:**
- Create: `supabase/migrations/007_slot_system.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 007_slot_system.sql
-- Slot-based booking system: configurable capacity per hour/day

-- Add slot duration to car_washes (default 60 minutes)
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS slot_duration_min INTEGER DEFAULT 60;

-- Slot capacities: how many cars can be served per hour per day
CREATE TABLE IF NOT EXISTS slot_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora TIME NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 1 CHECK (capacidad >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(car_wash_id, dia_semana, hora)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_slot_capacities_lookup
  ON slot_capacities(car_wash_id, dia_semana);

-- RLS
ALTER TABLE slot_capacities ENABLE ROW LEVEL SECURITY;

-- Public read (clients need to see availability)
CREATE POLICY "slot_capacities_select" ON slot_capacities
  FOR SELECT USING (true);

-- wash_admin can manage their own car wash slots
CREATE POLICY "slot_capacities_insert" ON slot_capacities
  FOR INSERT WITH CHECK (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

CREATE POLICY "slot_capacities_update" ON slot_capacities
  FOR UPDATE USING (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

CREATE POLICY "slot_capacities_delete" ON slot_capacities
  FOR DELETE USING (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

-- Make estacion nullable (no longer auto-assigned)
ALTER TABLE appointments ALTER COLUMN estacion DROP NOT NULL;
```

- [ ] **Step 2: Apply the migration to Supabase**

Run the migration via the Supabase dashboard or CLI. Verify:
- `car_washes` has `slot_duration_min` column
- `slot_capacities` table exists with RLS policies
- `appointments.estacion` is nullable

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/007_slot_system.sql
git commit -m "feat: add slot_capacities table and slot_duration_min column"
```

---

### Task 2: Admin — Slot Configuration UI

**Files:**
- Create: `apps/web/src/components/slot-config.tsx`
- Modify: `apps/web/src/app/admin/configuracion/config-form.tsx`
- Modify: `apps/web/src/app/admin/configuracion/actions.ts`
- Modify: `apps/web/src/app/admin/configuracion/page.tsx`

- [ ] **Step 1: Create the SlotConfig component**

Create `apps/web/src/components/slot-config.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

interface SlotCapacity {
  hora: string;
  capacidad: number;
}

interface BusinessHour {
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  cerrado: boolean;
}

interface SlotConfigProps {
  carWashId: string;
  slotDurationMin: number;
  businessHours: BusinessHour[];
  initialCapacities: { dia_semana: number; hora: string; capacidad: number }[];
}

function generateSlots(open: string, close: string, durationMin: number): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;

  for (let t = openMin; t + durationMin <= closeMin; t += durationMin) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

export function SlotConfig({ carWashId, slotDurationMin, businessHours, initialCapacities }: SlotConfigProps) {
  const [selectedDay, setSelectedDay] = useState(1); // Lunes
  const [duration, setDuration] = useState(slotDurationMin);
  const [capacities, setCapacities] = useState<Record<string, SlotCapacity[]>>(() => {
    const map: Record<string, SlotCapacity[]> = {};
    for (let d = 0; d <= 6; d++) {
      const bh = businessHours.find((h) => h.dia_semana === d);
      if (!bh || bh.cerrado) { map[d] = []; continue; }
      const slotTimes = generateSlots(bh.hora_apertura, bh.hora_cierre, slotDurationMin);
      map[d] = slotTimes.map((hora) => {
        const existing = initialCapacities.find((c) => c.dia_semana === d && c.hora === hora + ':00');
        return { hora, capacidad: existing?.capacidad ?? 0 };
      });
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const bh = businessHours.find((h) => h.dia_semana === selectedDay);
  const isClosed = !bh || bh.cerrado;
  const daySlots = capacities[selectedDay] ?? [];

  function updateCapacity(hora: string, value: number) {
    setCapacities((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((s) =>
        s.hora === hora ? { ...s, capacidad: Math.max(0, value) } : s
      ),
    }));
  }

  function regenerateSlots(newDuration: number) {
    setDuration(newDuration);
    const newCaps: Record<string, SlotCapacity[]> = {};
    for (let d = 0; d <= 6; d++) {
      const dayBh = businessHours.find((h) => h.dia_semana === d);
      if (!dayBh || dayBh.cerrado) { newCaps[d] = []; continue; }
      const slotTimes = generateSlots(dayBh.hora_apertura, dayBh.hora_cierre, newDuration);
      newCaps[d] = slotTimes.map((hora) => {
        const existing = capacities[d]?.find((c) => c.hora === hora);
        return { hora, capacidad: existing?.capacidad ?? 0 };
      });
    }
    setCapacities(newCaps);
  }

  function copyToAllDays() {
    const source = capacities[selectedDay];
    if (!source.length) return;
    setCapacities((prev) => {
      const next = { ...prev };
      for (let d = 0; d <= 6; d++) {
        if (d === selectedDay) continue;
        const dayBh = businessHours.find((h) => h.dia_semana === d);
        if (!dayBh || dayBh.cerrado) continue;
        const slotTimes = generateSlots(dayBh.hora_apertura, dayBh.hora_cierre, duration);
        next[d] = slotTimes.map((hora) => {
          const match = source.find((s) => s.hora === hora);
          return { hora, capacidad: match?.capacidad ?? 0 };
        });
      }
      return next;
    });
    toast('Capacidad copiada a todos los dias');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const allCapacities: { dia_semana: number; hora: string; capacidad: number }[] = [];
      for (let d = 0; d <= 6; d++) {
        (capacities[d] ?? []).forEach((s) => {
          if (s.capacidad > 0) {
            allCapacities.push({ dia_semana: d, hora: s.hora, capacidad: s.capacidad });
          }
        });
      }

      const res = await fetch('/api/admin/slot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_wash_id: carWashId,
          slot_duration_min: duration,
          capacities: allCapacities,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? 'Error al guardar', 'error');
      } else {
        toast('Configuracion de horarios guardada');
      }
    } catch {
      toast('Error al guardar', 'error');
    }
    setSaving(false);
  }

  return (
    <section className="rounded-card bg-card p-6 shadow-card space-y-6">
      <h3 className="text-base font-semibold text-foreground">Configuracion de horarios</h3>

      {/* Slot duration */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Duracion del slot</label>
        <select
          value={duration}
          onChange={(e) => regenerateSlots(Number(e.target.value))}
          className="rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>{d} minutos</option>
          ))}
        </select>
      </div>

      {/* Day tabs */}
      <div className="flex flex-wrap gap-1">
        {DAY_NAMES.map((name, i) => {
          const dayBh = businessHours.find((h) => h.dia_semana === i);
          const closed = !dayBh || dayBh.cerrado;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedDay === i
                  ? 'bg-primary text-white'
                  : closed
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground bg-muted'
              }`}
              disabled={closed}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Capacity table */}
      {isClosed ? (
        <p className="text-sm text-muted-foreground">Cerrado este dia</p>
      ) : daySlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay slots para este horario</p>
      ) : (
        <div className="rounded-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Hora</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Capacidad (carros)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {daySlots.map((slot) => (
                <tr key={slot.hora} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono font-semibold text-foreground">{slot.hora}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={slot.capacidad}
                      onChange={(e) => updateCapacity(slot.hora, parseInt(e.target.value) || 0)}
                      className="w-20 rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-input bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </button>
        {!isClosed && daySlots.length > 0 && (
          <button
            type="button"
            onClick={copyToAllDays}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Copiar a todos los dias
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the admin slot-config API endpoint**

Create `apps/web/src/app/api/admin/slot-config/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json();
  const { car_wash_id, slot_duration_min, capacities } = body;

  if (!car_wash_id || !slot_duration_min || !Array.isArray(capacities)) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
  }

  // Verify ownership
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('id', car_wash_id)
    .eq('owner_id', user.id)
    .single();

  if (!carWash) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Update slot duration
  await supabase
    .from('car_washes')
    .update({ slot_duration_min })
    .eq('id', car_wash_id);

  // Delete existing capacities and insert new ones
  await supabase
    .from('slot_capacities')
    .delete()
    .eq('car_wash_id', car_wash_id);

  if (capacities.length > 0) {
    const rows = capacities.map((c: { dia_semana: number; hora: string; capacidad: number }) => ({
      car_wash_id,
      dia_semana: c.dia_semana,
      hora: c.hora + ':00', // TIME format HH:MM:SS
      capacidad: c.capacidad,
    }));

    const { error: insertError } = await supabase
      .from('slot_capacities')
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Update config page to pass business hours and slot data**

Modify `apps/web/src/app/admin/configuracion/page.tsx` — add queries for business_hours and slot_capacities, pass them to a new `SlotConfig` component:

```tsx
export const dynamic = 'force-dynamic';

import { getAdminCarWash } from '@/lib/admin-car-wash';
import { createServerSupabase } from '@/lib/supabase/server';
import { ConfigForm } from './config-form';
import { SlotConfig } from '@/components/slot-config';

export default async function ConfiguracionPage() {
  const carWash = await getAdminCarWash('id, metodos_pago, whatsapp, latitud, longitud, stripe_account_id, stripe_onboarding_complete, slot_duration_min') as any;

  if (!carWash) return <p className="text-muted-foreground">No se encontro tu autolavado.</p>;

  const supabase = await createServerSupabase();

  const [{ data: businessHours }, { data: slotCapacities }] = await Promise.all([
    supabase.from('business_hours').select('dia_semana, hora_apertura, hora_cierre, cerrado').eq('car_wash_id', carWash.id).order('dia_semana'),
    supabase.from('slot_capacities').select('dia_semana, hora, capacidad').eq('car_wash_id', carWash.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuracion</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configura tu autolavado</p>
      </div>
      <SlotConfig
        carWashId={carWash.id}
        slotDurationMin={carWash.slot_duration_min ?? 60}
        businessHours={businessHours ?? []}
        initialCapacities={slotCapacities ?? []}
      />
      <ConfigForm carWash={carWash} />
    </div>
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
cd apps/web && npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/slot-config.tsx apps/web/src/app/api/admin/slot-config/route.ts apps/web/src/app/admin/configuracion/page.tsx
git commit -m "feat: add slot capacity configuration UI and API for admin"
```

---

### Task 3: Availability API — Slot-Based Calculation

**Files:**
- Modify: `apps/web/src/app/api/availability/route.ts`

- [ ] **Step 1: Rewrite the availability endpoint**

Replace entire contents of `apps/web/src/app/api/availability/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const car_wash_id = searchParams.get('car_wash_id');
  const fecha = searchParams.get('fecha');

  if (!car_wash_id || !fecha) {
    return NextResponse.json(
      { error: 'car_wash_id y fecha son requeridos' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  // 1. Get car wash slot duration
  const { data: carWash, error: cwError } = await supabase
    .from('car_washes')
    .select('slot_duration_min')
    .eq('id', car_wash_id)
    .single();

  if (cwError || !carWash) {
    return NextResponse.json({ error: 'Car wash no encontrado' }, { status: 404 });
  }

  const slotDuration = carWash.slot_duration_min ?? 60;

  // 2. Get day of week
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();

  // 3. Get business hours for that day
  const { data: businessHours } = await supabase
    .from('business_hours')
    .select('hora_apertura, hora_cierre, cerrado')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek)
    .single();

  if (!businessHours) {
    return NextResponse.json({ slots: [], closed: true, slot_duration_min: slotDuration });
  }

  if (businessHours.cerrado) {
    return NextResponse.json({ slots: [], closed: true, slot_duration_min: slotDuration });
  }

  // 4. Get slot capacities for that day
  const { data: slotCapacities } = await supabase
    .from('slot_capacities')
    .select('hora, capacidad')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek);

  const capacityMap = new Map<string, number>();
  (slotCapacities ?? []).forEach((sc: any) => {
    // hora comes as "HH:MM:SS", normalize to "HH:MM"
    const hora = sc.hora.slice(0, 5);
    capacityMap.set(hora, sc.capacidad);
  });

  // 5. Get existing appointments for that date (non-cancelled)
  const { data: appointments } = await supabase
    .from('appointments')
    .select('hora_inicio')
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelled","no_show")');

  // Count appointments per slot
  const occupiedMap = new Map<string, number>();
  (appointments ?? []).forEach((apt: any) => {
    const hora = apt.hora_inicio.slice(0, 5);
    occupiedMap.set(hora, (occupiedMap.get(hora) ?? 0) + 1);
  });

  // 6. Generate slots from business hours
  const [oh, om] = businessHours.hora_apertura.split(':').map(Number);
  const [ch, cm] = businessHours.hora_cierre.split(':').map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;

  const slots = [];
  for (let t = openMin; t + slotDuration <= closeMin; t += slotDuration) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const capacidad = capacityMap.get(time) ?? 0;
    const ocupados = occupiedMap.get(time) ?? 0;
    const disponibles = Math.max(0, capacidad - ocupados);

    slots.push({ time, capacidad, ocupados, disponibles });
  }

  return NextResponse.json({ slots, closed: false, slot_duration_min: slotDuration });
}
```

- [ ] **Step 2: Build and verify**

```bash
cd apps/web && npx next build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/availability/route.ts
git commit -m "feat: rewrite availability API to use slot capacities"
```

---

### Task 4: Appointments API — Slot-Based Validation

**Files:**
- Modify: `apps/web/src/app/api/appointments/route.ts`
- Modify: `packages/shared/src/validations/appointment.ts`

- [ ] **Step 1: Update the appointment validation schema**

Modify `packages/shared/src/validations/appointment.ts` — make `metodo_pago` exclude `pago_en_linea` for now:

```ts
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  car_wash_id: z.string().uuid(),
  service_id: z.string().uuid(),
  fecha: z.string().date(),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  notas_cliente: z.string().max(500).optional(),
  servicios_complementarios: z.array(z.string().uuid()).optional(),
  metodo_pago: z.enum(['efectivo', 'tarjeta_sitio', 'transferencia']).optional(),
});

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  motivo_cancelacion: z.string().min(1, 'Motivo requerido').max(500),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
```

- [ ] **Step 2: Rewrite the appointments POST handler**

Replace entire contents of `apps/web/src/app/api/appointments/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAppointmentSchema, NotifType, SubStatus } from '@splash/shared';
import { sendBookingConfirmationClient, sendBookingConfirmationAdmin } from '@/lib/email';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { car_wash_id, service_id, fecha, hora_inicio, notas_cliente } = parsed.data;

  // 3. Get service
  const { data: service } = await supabase
    .from('services')
    .select('nombre, duracion_min, precio, activo')
    .eq('id', service_id)
    .single();

  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  if (!service.activo) return NextResponse.json({ error: 'Servicio no disponible' }, { status: 422 });

  // 4. Get complementary services
  let complementaryServices: any[] = [];
  let totalPrice = service.precio;

  if (parsed.data.servicios_complementarios?.length) {
    const { data: compServices } = await supabase
      .from('services')
      .select('id, nombre, precio, duracion_min')
      .in('id', parsed.data.servicios_complementarios)
      .eq('car_wash_id', car_wash_id)
      .eq('es_complementario', true)
      .eq('activo', true);

    if (compServices) {
      complementaryServices = compServices;
      totalPrice += compServices.reduce((sum: number, s: any) => sum + s.precio, 0);
    }
  }

  // 5. Get car wash
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('nombre, direccion, activo, verificado, subscription_status, owner_id, slot_duration_min')
    .eq('id', car_wash_id)
    .single();

  if (!carWash) return NextResponse.json({ error: 'Car wash no encontrado' }, { status: 404 });
  if (!carWash.activo || !carWash.verificado) return NextResponse.json({ error: 'Car wash no disponible' }, { status: 422 });

  const validStatuses: string[] = [SubStatus.ACTIVE, SubStatus.TRIAL];
  if (!validStatuses.includes(carWash.subscription_status)) {
    return NextResponse.json({ error: 'Car wash no disponible' }, { status: 422 });
  }

  // 6. Check slot capacity
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();

  const { data: slotCapacity } = await supabase
    .from('slot_capacities')
    .select('capacidad')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek)
    .eq('hora', hora_inicio + ':00')
    .single();

  const capacidad = slotCapacity?.capacidad ?? 0;
  if (capacidad === 0) {
    return NextResponse.json({ error: 'Horario no disponible' }, { status: 409 });
  }

  // 7. Count existing appointments in this slot
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .eq('hora_inicio', hora_inicio)
    .not('estado', 'in', '("cancelled","no_show")');

  if ((count ?? 0) >= capacidad) {
    return NextResponse.json({ error: 'Horario ya no disponible' }, { status: 409 });
  }

  // 8. Calculate hora_fin using slot duration
  const slotDuration = carWash.slot_duration_min ?? 60;
  const hora_fin = minutesToTime(timeToMinutes(hora_inicio) + slotDuration);

  // 9. Insert appointment
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      car_wash_id,
      service_id,
      client_id: user.id,
      fecha,
      hora_inicio,
      hora_fin,
      precio_cobrado: totalPrice,
      precio_total: totalPrice,
      servicios_complementarios: complementaryServices.length > 0
        ? complementaryServices.map((s: any) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracion_min: s.duracion_min }))
        : null,
      estado: 'confirmed',
      metodo_pago: parsed.data.metodo_pago ?? null,
      estado_pago: 'pendiente',
      notas_cliente: notas_cliente ?? null,
    })
    .select()
    .single();

  if (insertError || !appointment) {
    return NextResponse.json({ error: insertError?.message ?? 'Error al crear cita' }, { status: 500 });
  }

  // 10. Create notifications
  const notifications = [
    {
      user_id: user.id,
      appointment_id: appointment.id,
      tipo: NotifType.CONFIRMATION,
      titulo: 'Cita confirmada',
      mensaje: `Tu cita para el ${fecha} a las ${hora_inicio} ha sido confirmada.`,
      leida: false,
    },
    {
      user_id: carWash.owner_id,
      appointment_id: appointment.id,
      tipo: NotifType.CONFIRMATION,
      titulo: 'Nueva cita',
      mensaje: `Nueva cita el ${fecha} a las ${hora_inicio}.`,
      leida: false,
    },
  ];

  await supabase.from('notifications').insert(notifications);

  // 11. Send emails (fire-and-forget)
  const { data: clientUser } = await supabase.from('users').select('email, nombre').eq('id', user.id).single();
  const { data: ownerUser } = await supabase.from('users').select('email').eq('id', carWash.owner_id).single();

  if (clientUser?.email) {
    sendBookingConfirmationClient(clientUser.email, {
      carWashName: carWash.nombre,
      serviceName: service.nombre,
      fecha,
      hora: hora_inicio,
      precio: String(totalPrice),
      direccion: carWash.direccion ?? '',
    });
  }

  if (ownerUser?.email) {
    sendBookingConfirmationAdmin(ownerUser.email, {
      clientName: clientUser?.nombre ?? 'Cliente',
      serviceName: service.nombre,
      fecha,
      hora: hora_inicio,
      precio: String(totalPrice),
    });
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
```

- [ ] **Step 3: Build and verify**

```bash
cd apps/web && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/validations/appointment.ts apps/web/src/app/api/appointments/route.ts
git commit -m "feat: rewrite appointments API to use slot capacity validation"
```

---

### Task 5: Booking Wizard — Client-Side

**Files:**
- Create: `apps/web/src/components/booking-wizard.tsx`
- Modify: `apps/web/src/app/(client)/agendar/page.tsx`

- [ ] **Step 1: Create the BookingWizard component**

Create `apps/web/src/components/booking-wizard.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STEPS = ['Servicio', 'Fecha', 'Hora', 'Confirmar'];

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo (pago en sitio)',
  tarjeta_sitio: 'Tarjeta (pago en sitio)',
  transferencia: 'Transferencia bancaria',
};

function getNextDays(count: number) {
  const names = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: d.toISOString().split('T')[0],
      label: d.getDate().toString(),
      dayName: names[d.getDay()],
      month: d.toLocaleString('es-MX', { month: 'short' }),
    });
  }
  return result;
}

interface Slot {
  time: string;
  capacidad: number;
  ocupados: number;
  disponibles: number;
}

interface BookingWizardProps {
  carWashId: string;
  initialServiceId?: string;
}

export function BookingWizard({ carWashId, initialServiceId }: BookingWizardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(initialServiceId ? 1 : 0);
  const [carWash, setCarWash] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [complementary, setComplementary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Slots
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [slotDuration, setSlotDuration] = useState(60);

  // Booking
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const dates = getNextDays(14);

  // Load car wash and services
  useEffect(() => {
    Promise.all([
      supabase.from('car_washes').select('nombre, direccion, metodos_pago').eq('id', carWashId).single(),
      supabase.from('services').select('id, nombre, descripcion, precio, duracion_min, es_complementario').eq('car_wash_id', carWashId).eq('activo', true).order('orden'),
    ]).then(([cwRes, svcRes]) => {
      setCarWash(cwRes.data);
      const allServices = svcRes.data ?? [];
      setServices(allServices.filter((s: any) => !s.es_complementario));
      setComplementary(allServices.filter((s: any) => s.es_complementario));

      const methods = (cwRes.data?.metodos_pago ?? ['efectivo']).filter((m: string) => m !== 'pago_en_linea');
      if (methods.length === 1) setPaymentMethod(methods[0]);

      // If initialServiceId, pre-select
      if (initialServiceId) {
        const svc = allServices.find((s: any) => s.id === initialServiceId);
        if (svc) setSelectedService(svc);
      }

      setLoading(false);
    });
  }, [carWashId]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime('');
    setClosed(false);
    fetch(`/api/availability?car_wash_id=${carWashId}&fecha=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setClosed(data.closed ?? false);
        setSlotDuration(data.slot_duration_min ?? 60);
        setSlotsLoading(false);
      })
      .catch(() => setSlotsLoading(false));
  }, [selectedDate, carWashId]);

  const totalPrice =
    (selectedService?.precio ?? 0) +
    complementary.filter((e) => selectedExtras.includes(e.id)).reduce((sum: number, e: any) => sum + e.precio, 0);

  const availableMethods = (carWash?.metodos_pago ?? ['efectivo']).filter((m: string) => m !== 'pago_en_linea');

  async function handleConfirm() {
    setBooking(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/login?redirect=/agendar?car_wash_id=${carWashId}`);
      return;
    }

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_wash_id: carWashId,
        service_id: selectedService.id,
        fecha: selectedDate,
        hora_inicio: selectedTime,
        servicios_complementarios: selectedExtras.length > 0 ? selectedExtras : undefined,
        metodo_pago: paymentMethod || undefined,
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                i === step
                  ? 'bg-primary text-white'
                  : i < step
                  ? 'bg-accent text-white cursor-pointer'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-accent' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Agendar cita</h1>
        <p className="text-sm text-muted-foreground">{carWash?.nombre} — {carWash?.direccion}</p>
      </div>

      {/* Step 0: Service selection */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">Selecciona un servicio</h2>
          {services.length === 0 ? (
            <p className="text-muted-foreground">No hay servicios disponibles.</p>
          ) : (
            services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => { setSelectedService(svc); setStep(1); }}
                className={`w-full text-left p-4 rounded-card border transition-colors ${
                  selectedService?.id === svc.id ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{svc.nombre}</h4>
                    {svc.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{svc.descripcion}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{svc.duracion_min} min</p>
                  </div>
                  <span className="text-lg font-bold text-foreground">${Number(svc.precio).toLocaleString('es-MX')}</span>
                </div>
              </button>
            ))
          )}

          {/* Extras */}
          {complementary.length > 0 && selectedService && (
            <div className="mt-6">
              <h3 className="text-base font-bold text-foreground mb-3">Agrega extras</h3>
              {complementary.map((extra) => (
                <label key={extra.id} className="flex items-center gap-3 rounded-card border border-border p-3 mb-2 cursor-pointer hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={selectedExtras.includes(extra.id)}
                    onChange={(e) => setSelectedExtras(e.target.checked ? [...selectedExtras, extra.id] : selectedExtras.filter((id) => id !== extra.id))}
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
          )}
        </div>
      )}

      {/* Step 1: Date selection */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Selecciona una fecha</h2>
          <div className="grid grid-cols-7 gap-2">
            {dates.map((d) => (
              <button
                key={d.date}
                onClick={() => { setSelectedDate(d.date); setStep(2); }}
                className={`flex flex-col items-center px-2 py-3 rounded-card border transition-colors ${
                  selectedDate === d.date
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{d.dayName}</span>
                <span className="text-lg font-bold">{d.label}</span>
                <span className="text-[10px] text-inherit opacity-70">{d.month}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Time selection */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Selecciona un horario</h2>
          {slotsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : closed ? (
            <p className="text-center text-muted-foreground py-8">Cerrado este dia</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay horarios configurados</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={slot.disponibles <= 0}
                  onClick={() => { setSelectedTime(slot.time); setStep(3); }}
                  className={`p-4 rounded-card border text-left transition-colors ${
                    slot.disponibles <= 0
                      ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                      : 'border-border bg-white hover:border-primary text-foreground'
                  }`}
                >
                  <span className="text-lg font-bold block">{slot.time}</span>
                  {slot.disponibles <= 0 ? (
                    <span className="text-xs text-muted-foreground">Lleno</span>
                  ) : (
                    <span className={`text-xs font-semibold ${slot.disponibles <= 2 ? 'text-warning' : 'text-accent'}`}>
                      {slot.disponibles} {slot.disponibles === 1 ? 'lugar' : 'lugares'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Confirma tu reserva</h2>

          <div className="rounded-card border border-border bg-white p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Servicio</span>
              <span className="font-semibold text-foreground">{selectedService?.nombre}</span>
            </div>
            {selectedExtras.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extras</span>
                <span className="font-semibold text-foreground">
                  {complementary.filter((e) => selectedExtras.includes(e.id)).map((e) => e.nombre).join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-semibold text-foreground">{selectedDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-semibold text-foreground">{selectedTime}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">${totalPrice.toLocaleString('es-MX')}</span>
            </div>
          </div>

          {/* Payment method */}
          {availableMethods.length > 1 && (
            <div>
              <h3 className="text-base font-bold text-foreground mb-3">Metodo de pago</h3>
              <div className="space-y-2">
                {availableMethods.map((method: string) => (
                  <label key={method} className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30">
                    <input
                      type="radio"
                      name="metodo_pago"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="h-4 w-4 border-border text-primary focus:ring-ring"
                    />
                    <span className="text-sm font-medium text-foreground">{PAYMENT_LABELS[method] ?? method}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-card bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={booking || (!paymentMethod && availableMethods.length > 1)}
            className="w-full py-3 rounded-card bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {booking ? 'Reservando...' : 'Confirmar reserva'}
          </button>
        </div>
      )}

      {/* Back button */}
      {step > 0 && step < 3 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-sm font-semibold text-primary hover:underline"
        >
          ← Volver
        </button>
      )}
      {step === 3 && (
        <button
          onClick={() => setStep(2)}
          className="mt-4 text-sm font-semibold text-primary hover:underline"
        >
          ← Cambiar horario
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the agendar page to use the wizard**

Replace entire contents of `apps/web/src/app/(client)/agendar/page.tsx`:

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { BookingWizard } from '@/components/booking-wizard';

export default function AgendarPage() {
  const searchParams = useSearchParams();
  const carWashId = searchParams.get('car_wash_id');
  const serviceId = searchParams.get('service_id');

  if (!carWashId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Selecciona un autolavado para agendar.</p>
      </div>
    );
  }

  return <BookingWizard carWashId={carWashId} initialServiceId={serviceId ?? undefined} />;
}
```

- [ ] **Step 3: Build and verify**

```bash
cd apps/web && npx next build
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/booking-wizard.tsx apps/web/src/app/\(client\)/agendar/page.tsx
git commit -m "feat: add 4-step booking wizard for client reservations"
```

---

### Task 6: Admin — Create Appointment Manually

**Files:**
- Create: `apps/web/src/app/api/admin/appointments/route.ts`
- Modify: `apps/web/src/app/admin/citas/page.tsx`
- Modify: `apps/web/src/app/admin/citas/actions.ts`

- [ ] **Step 1: Create the admin appointments API endpoint**

Create `apps/web/src/app/api/admin/appointments/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { NotifType } from '@splash/shared';

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verify user is wash_admin
  const { data: userRecord } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userRecord?.role !== 'wash_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { car_wash_id, service_id, fecha, hora_inicio, cliente_nombre, metodo_pago } = body;

  if (!car_wash_id || !service_id || !fecha || !hora_inicio) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  // Verify ownership
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, nombre, slot_duration_min, owner_id')
    .eq('id', car_wash_id)
    .eq('owner_id', user.id)
    .single();

  if (!carWash) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Get service
  const { data: service } = await supabase
    .from('services')
    .select('nombre, precio')
    .eq('id', service_id)
    .eq('car_wash_id', car_wash_id)
    .single();

  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  // Check capacity
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();
  const { data: slotCapacity } = await supabase
    .from('slot_capacities')
    .select('capacidad')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek)
    .eq('hora', hora_inicio + ':00')
    .single();

  const capacidad = slotCapacity?.capacidad ?? 0;

  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .eq('hora_inicio', hora_inicio)
    .not('estado', 'in', '("cancelled","no_show")');

  if ((count ?? 0) >= capacidad) {
    return NextResponse.json({ error: 'Horario lleno' }, { status: 409 });
  }

  const slotDuration = carWash.slot_duration_min ?? 60;
  const hora_fin = minutesToTime(timeToMinutes(hora_inicio) + slotDuration);

  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      car_wash_id,
      service_id,
      client_id: null, // walk-in
      fecha,
      hora_inicio,
      hora_fin,
      precio_cobrado: service.precio,
      precio_total: service.precio,
      estado: 'confirmed',
      metodo_pago: metodo_pago ?? 'efectivo',
      estado_pago: 'pendiente',
      notas_cliente: cliente_nombre ? `Walk-in: ${cliente_nombre}` : 'Walk-in',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Notification for admin
  await supabase.from('notifications').insert({
    user_id: user.id,
    appointment_id: appointment.id,
    tipo: NotifType.CONFIRMATION,
    titulo: 'Cita creada',
    mensaje: `Cita manual el ${fecha} a las ${hora_inicio}.`,
    leida: true,
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
```

- [ ] **Step 2: Add "Nueva cita" modal to admin citas page**

Replace entire contents of `apps/web/src/app/admin/citas/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { completeAppointment, markAsPaid } from './actions';
import { AdminNewAppointment } from './admin-new-appointment';

const FILTER_TABS = [
  { label: 'Todas', estado: undefined },
  { label: 'Confirmadas', estado: 'confirmed' },
  { label: 'En progreso', estado: 'in_progress' },
  { label: 'Completadas', estado: 'completed' },
  { label: 'Canceladas', estado: 'cancelled' },
];

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id') as any;

  let appointments: any[] = [];
  let services: any[] = [];

  if (carWash) {
    let query = supabase
      .from('appointments')
      .select('id, fecha, hora_inicio, estado, precio_cobrado, estacion, metodo_pago, estado_pago, notas_cliente, users!client_id(nombre), services!service_id(nombre)')
      .eq('car_wash_id', carWash.id)
      .order('fecha', { ascending: false })
      .limit(50);

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data } = await query as { data: any[] | null };
    appointments = data ?? [];

    const { data: svcData } = await supabase
      .from('services')
      .select('id, nombre')
      .eq('car_wash_id', carWash.id)
      .eq('activo', true)
      .eq('es_complementario', false)
      .order('orden');

    services = svcData ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Citas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gestion de citas de tu autolavado</p>
        </div>
        {carWash && services.length > 0 && (
          <AdminNewAppointment carWashId={carWash.id} services={services} />
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-card bg-muted p-1">
        {FILTER_TABS.map((tab) => {
          const isActive = (tab.estado ?? '') === (estado ?? '');
          const href = tab.estado ? `/admin/citas?estado=${tab.estado}` : '/admin/citas';
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-card bg-card shadow-card">
        {appointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No hay citas{estado ? ` con estado "${estado}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Hora</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Servicio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Pago</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      {apt.hora_inicio?.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3 font-medium text-foreground">
                      {apt.users?.nombre ?? (apt.notas_cliente?.startsWith('Walk-in:') ? apt.notas_cliente.replace('Walk-in: ', '') : 'Walk-in')}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {apt.services?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.fecha}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      ${(apt.precio_cobrado ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={
                          apt.estado_pago === 'pagado'
                            ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                            : 'rounded-pill bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning'
                        }>
                          {apt.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                        {apt.estado_pago !== 'pagado' && apt.estado !== 'cancelled' && (
                          <form action={markAsPaid.bind(null, apt.id)}>
                            <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                              Marcar pagado
                            </button>
                          </form>
                        )}
                      </div>
                      {apt.metodo_pago && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">{apt.metodo_pago}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={apt.estado} />
                    </td>
                    <td className="px-6 py-3">
                      {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                        <form action={completeAppointment.bind(null, apt.id)}>
                          <button
                            type="submit"
                            className="text-xs font-semibold text-accent hover:underline"
                          >
                            Completar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the AdminNewAppointment client component**

Create `apps/web/src/app/admin/citas/admin-new-appointment.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/toast';

interface Props {
  carWashId: string;
  services: { id: string; nombre: string }[];
}

interface Slot {
  time: string;
  disponibles: number;
}

export function AdminNewAppointment({ carWashId, services }: Props) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [clienteName, setClienteName] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!fecha) return;
    setSlotsLoading(true);
    setHora('');
    fetch(`/api/availability?car_wash_id=${carWashId}&fecha=${fecha}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots((data.slots ?? []).filter((s: Slot) => s.disponibles > 0));
        setSlotsLoading(false);
      })
      .catch(() => setSlotsLoading(false));
  }, [fecha, carWashId]);

  async function handleSubmit() {
    if (!serviceId || !fecha || !hora) return;
    setSaving(true);

    const res = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_wash_id: carWashId,
        service_id: serviceId,
        fecha,
        hora_inicio: hora,
        cliente_nombre: clienteName || undefined,
        metodo_pago: metodoPago,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast(data.error ?? 'Error al crear cita', 'error');
      setSaving(false);
      return;
    }

    toast('Cita creada');
    setOpen(false);
    setServiceId('');
    setFecha('');
    setHora('');
    setClienteName('');
    setSaving(false);
    router.refresh();
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        + Nueva cita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-modal shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Nueva cita</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Servicio</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Fecha</label>
              <input
                type="date"
                min={today}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {fecha && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Hora</label>
                {slotsLoading ? (
                  <p className="text-xs text-muted-foreground">Cargando...</p>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay horarios disponibles</p>
                ) : (
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona...</option>
                    {slots.map((s) => (
                      <option key={s.time} value={s.time}>{s.time} ({s.disponibles} lugares)</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Cliente (opcional)</label>
              <input
                type="text"
                value={clienteName}
                onChange={(e) => setClienteName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Metodo de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_sitio">Tarjeta en sitio</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || !serviceId || !fecha || !hora}
              className="w-full rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? 'Creando...' : 'Crear cita'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
cd apps/web && npx next build
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/admin/appointments/route.ts apps/web/src/app/admin/citas/page.tsx apps/web/src/app/admin/citas/admin-new-appointment.tsx
git commit -m "feat: add admin manual appointment creation with modal"
```

---

### Task 7: Update Public Page and Cleanup

**Files:**
- Modify: `apps/web/src/app/autolavados/[slug]/page.tsx`
- Modify: `packages/shared/src/constants/plans.ts`

- [ ] **Step 1: Fix the Reservar button link**

In `apps/web/src/app/autolavados/[slug]/page.tsx`, the Reservar link should always use just `car_wash_id` (service selection happens in the wizard):

Find the current Reservar `<Link>` block and replace its `href` with:

```tsx
href={`/agendar?car_wash_id=${carWash.id}`}
```

Remove the conditional logic around `services` for the href — keep it simple.

- [ ] **Step 2: Remove SLOT_DURATION_MIN from shared constants**

In `packages/shared/src/constants/plans.ts`, remove the line:

```ts
export const SLOT_DURATION_MIN = 30;
```

This is now configured per car wash via `slot_duration_min` column.

- [ ] **Step 3: Remove SLOT_DURATION_MIN import from availability route**

The old availability route imported `SLOT_DURATION_MIN` — verify this was removed in Task 3's rewrite. If any other file imports it, update those imports.

Run:
```bash
grep -r "SLOT_DURATION_MIN" apps/web/src/ packages/shared/src/
```

Remove any remaining references.

- [ ] **Step 4: Build and verify full project**

```bash
npm run build
```

Expected: All workspaces build successfully.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/autolavados/\[slug\]/page.tsx packages/shared/src/constants/plans.ts
git commit -m "fix: simplify Reservar link and remove deprecated SLOT_DURATION_MIN"
```

---

### Task 8: Deploy and Verify

- [ ] **Step 1: Push to remote**

```bash
git push origin main
```

- [ ] **Step 2: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 3: Verify on production**

1. Go to `/admin/configuracion` — verify slot config section appears
2. Configure slot capacities for at least one day
3. Go to a public autolavado page — click "Reservar"
4. Walk through the wizard: select service → date → time → confirm
5. Check `/admin/citas` — verify the new appointment appears
6. Test "Nueva cita" from admin panel

---

### Task 9: Apply Database Migration on Supabase

> **Note:** This task must be done before testing on production. It can be done in parallel with earlier tasks during local development.

- [ ] **Step 1: Apply migration**

Go to your Supabase project dashboard → SQL Editor. Paste and run the contents of `supabase/migrations/007_slot_system.sql`.

- [ ] **Step 2: Verify**

Run in SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'car_washes' AND column_name = 'slot_duration_min';
SELECT * FROM slot_capacities LIMIT 1;
SELECT is_nullable FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'estacion';
```

Expected:
- `slot_duration_min` exists as integer
- `slot_capacities` table exists (empty)
- `estacion` is nullable (YES)
