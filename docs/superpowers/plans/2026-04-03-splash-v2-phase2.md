# Splash v2 — Phase 2: Medium Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Maps integration for nearby car washes, in-app notification center, complementary services, WhatsApp contact, and add-to-calendar after booking.

**Architecture:** Five features built sequentially. DB migrations first (Task 1), then independent UI features (Tasks 2-8). The notification center needs API endpoints. Complementary services modifies the booking flow. Map and WhatsApp are display-only additions. Calendar export is a pure client-side utility.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4, Supabase, `@react-google-maps/api`, Zod, iCalendar format.

---

### Task 1: Database migrations for Phase 2

**Files:**
- Create: `supabase/migrations/004_phase2_features.sql`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/004_phase2_features.sql`:

```sql
-- Phase 2: WhatsApp, complementary services

-- WhatsApp contact for car washes
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Complementary services flag
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS es_complementario BOOLEAN DEFAULT false;

-- Complementary services on appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS servicios_complementarios JSONB,
  ADD COLUMN IF NOT EXISTS precio_total INTEGER;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/004_phase2_features.sql
git commit -m "feat: add phase 2 DB columns (whatsapp, es_complementario, precio_total)"
```

---

### Task 2: Install Google Maps dependency

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install the package**

```bash
cd apps/web && npm install @react-google-maps/api
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json ../../package-lock.json
git commit -m "feat: add @react-google-maps/api dependency"
```

Note: The root `package-lock.json` may also change with workspaces.

---

### Task 3: Google Maps on autolavados listing

**Files:**
- Create: `apps/web/src/components/car-wash-map.tsx`
- Modify: `apps/web/src/app/autolavados/page.tsx`

- [ ] **Step 1: Create the map component**

Create `apps/web/src/components/car-wash-map.tsx`:

```tsx
'use client';

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

interface CarWashMarker {
  id: string;
  nombre: string;
  slug: string;
  latitud: number;
  longitud: number;
  calificacion_promedio: number;
}

interface CarWashMapProps {
  carWashes: CarWashMarker[];
  userLocation: { lat: number; lng: number } | null;
  onMarkerClick?: (slug: string) => void;
}

const containerStyle = { width: '100%', height: '300px' };

const defaultCenter = { lat: 20.6597, lng: -103.3496 }; // Guadalajara

export function CarWashMap({ carWashes, userLocation, onMarkerClick }: CarWashMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (carWashes.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      carWashes.forEach((cw) => bounds.extend({ lat: cw.latitud, lng: cw.longitud }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds);
    }
    setMap(map);
  }, [carWashes, userLocation]);

  if (!isLoaded) {
    return <div className="w-full h-[300px] rounded-card bg-muted animate-pulse" />;
  }

  const center = userLocation ?? (carWashes.length > 0
    ? { lat: carWashes[0].latitud, lng: carWashes[0].longitud }
    : defaultCenter);

  return (
    <div className="rounded-card overflow-hidden shadow-card">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12} onLoad={onLoad}>
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0284C7',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            title="Tu ubicacion"
          />
        )}
        {carWashes.map((cw) => (
          <MarkerF
            key={cw.id}
            position={{ lat: cw.latitud, lng: cw.longitud }}
            title={cw.nombre}
            onClick={() => onMarkerClick?.(cw.slug)}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
```

- [ ] **Step 2: Create a client wrapper for the autolavados page with geolocation**

The autolavados listing page is a server component. We need a client component that handles geolocation and renders the map. Create `apps/web/src/app/autolavados/autolavados-client.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { CarWashMap } from '@/components/car-wash-map';

interface CarWash {
  id: string;
  nombre: string;
  slug: string;
  latitud: number | null;
  longitud: number | null;
  calificacion_promedio: number;
  direccion: string | null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function AutolavadosMap({ carWashes }: { carWashes: CarWash[] }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedWashes, setSortedWashes] = useState(carWashes);
  const [locating, setLocating] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        const sorted = [...carWashes]
          .filter((cw) => cw.latitud != null && cw.longitud != null)
          .sort((a, b) =>
            haversineDistance(loc.lat, loc.lng, a.latitud!, a.longitud!) -
            haversineDistance(loc.lat, loc.lng, b.latitud!, b.longitud!)
          );
        const withoutCoords = carWashes.filter((cw) => cw.latitud == null || cw.longitud == null);
        setSortedWashes([...sorted, ...withoutCoords]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const mappable = carWashes.filter((cw) => cw.latitud != null && cw.longitud != null) as Array<CarWash & { latitud: number; longitud: number }>;

  function handleMarkerClick(slug: string) {
    const el = document.getElementById(`wash-${slug}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <>
      {mappable.length > 0 && (
        <div className="mb-6">
          <CarWashMap
            carWashes={mappable}
            userLocation={userLocation}
            onMarkerClick={handleMarkerClick}
          />
          <div className="mt-3 flex justify-center">
            <button
              onClick={requestLocation}
              disabled={locating}
              className="flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
              {locating ? 'Buscando...' : userLocation ? 'Actualizar ubicacion' : 'Usar mi ubicacion'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export { type CarWash };
```

- [ ] **Step 3: Update autolavados page to include map and pass slug IDs**

Modify `apps/web/src/app/autolavados/page.tsx`. The current page queries car washes and renders WashCard components. We need to:

1. Add `latitud, longitud` to the select query
2. Import and render `AutolavadosMap` above the grid
3. Add `id={`wash-${cw.slug}`}` to each WashCard wrapper for scroll-to

The current select is:
```tsx
.select('id, nombre, slug, direccion, logo_url, calificacion_promedio, num_resenas')
```

Change to:
```tsx
.select('id, nombre, slug, direccion, logo_url, calificacion_promedio, num_resenas, latitud, longitud')
```

Add import at the top:
```tsx
import { AutolavadosMap } from './autolavados-client';
```

In the JSX, add the map component right before the grid of wash cards. The current structure has:
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

Add before it:
```tsx
<AutolavadosMap carWashes={carWashes} />
```

Wrap each WashCard in the grid with an id for scroll targeting:
```tsx
<div key={cw.slug} id={`wash-${cw.slug}`}>
  <WashCard carWash={cw} />
</div>
```

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/car-wash-map.tsx apps/web/src/app/autolavados/autolavados-client.tsx apps/web/src/app/autolavados/page.tsx
git commit -m "feat: add Google Maps with nearby car washes and geolocation"
```

---

### Task 4: WhatsApp button and "Como llegar" on car wash detail

**Files:**
- Modify: `apps/web/src/app/autolavados/[slug]/page.tsx`

- [ ] **Step 1: Add whatsapp and latitud/longitud to the detail page query**

In `apps/web/src/app/autolavados/[slug]/page.tsx`, find the car wash select query and add `whatsapp, latitud, longitud` to the fields. The current select is something like:
```tsx
.select('id, nombre, slug, descripcion, direccion, logo_url, calificacion_promedio, num_resenas, num_estaciones, verificado')
```

Change to include:
```tsx
.select('id, nombre, slug, descripcion, direccion, logo_url, calificacion_promedio, num_resenas, num_estaciones, verificado, whatsapp, latitud, longitud')
```

- [ ] **Step 2: Add WhatsApp button and "Como llegar" link in the detail page**

In the car wash detail header section (after the address or rating), add these two action buttons:

```tsx
{/* Action buttons */}
<div className="flex flex-wrap gap-3 mt-4">
  {carWash.latitud && carWash.longitud && (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${carWash.latitud},${carWash.longitud}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
      Como llegar
    </a>
  )}
  {carWash.whatsapp && (
    <a
      href={`https://wa.me/${carWash.whatsapp}?text=${encodeURIComponent('Hola, vi su autolavado en Splash')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-card bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.685-1.228A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.316 0-4.47-.756-6.209-2.034l-.346-.27-3.587.94.957-3.496-.296-.47A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      WhatsApp
    </a>
  )}
</div>
```

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/autolavados/[slug]/page.tsx"
git commit -m "feat: add WhatsApp button and Como llegar link to car wash detail"
```

---

### Task 5: Notification center — API endpoints

**Files:**
- Create: `apps/web/src/app/api/notifications/route.ts`
- Create: `apps/web/src/app/api/notifications/[id]/route.ts`
- Create: `apps/web/src/app/api/notifications/read-all/route.ts`

- [ ] **Step 1: Create GET notifications endpoint**

Create `apps/web/src/app/api/notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data, error } = await supabase
    .from('notifications')
    .select('id, tipo, titulo, mensaje, leida, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
```

- [ ] **Step 2: Create PATCH single notification endpoint**

Create `apps/web/src/app/api/notifications/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { error } = await supabase
    .from('notifications')
    .update({ leida: true })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create PATCH read-all endpoint**

Create `apps/web/src/app/api/notifications/read-all/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { error } = await supabase
    .from('notifications')
    .update({ leida: true })
    .eq('user_id', user.id)
    .eq('leida', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/notifications/route.ts apps/web/src/app/api/notifications/\[id\]/route.ts apps/web/src/app/api/notifications/read-all/route.ts
git commit -m "feat: add notification API endpoints (list, mark-read, read-all)"
```

---

### Task 6: Notification bell component and UI

**Files:**
- Create: `apps/web/src/components/notification-bell.tsx`
- Modify: `apps/web/src/components/navbar.tsx`

- [ ] **Step 1: Create the notification bell component**

Create `apps/web/src/components/notification-bell.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  confirmation: '✓',
  cancellation: '✕',
  reminder: '⏰',
  review_request: '⭐',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-card border border-border shadow-modal z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">
                Marcar todas como leidas
              </button>
            )}
          </div>
          {loading && notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.leida ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{typeIcons[n.tipo] ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${!n.leida ? 'font-bold' : 'font-medium'} text-foreground truncate`}>
                        {n.titulo}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensaje}</p>
                  </div>
                  {!n.leida && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add notification bell to navbar**

Modify `apps/web/src/components/navbar.tsx`. Add import at top:
```tsx
import { NotificationBell } from '@/components/notification-bell';
```

In the desktop right side section, find where the user dropdown begins (the `{user ? (` block inside `<div className="hidden md:flex items-center gap-3">`). Add the notification bell right before the user dropdown button:

Before:
```tsx
          {user ? (
            <div className="relative">
              <button
```

After:
```tsx
          {user ? (
            <>
            <NotificationBell />
            <div className="relative">
              <button
```

And close the fragment after the dropdown div. Find the closing `</div>` of the user dropdown `<div className="relative">` and the `) : (` that leads to the login button. Change:
```tsx
            </div>
          ) : (
```
to:
```tsx
            </div>
            </>
          ) : (
```

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/notification-bell.tsx apps/web/src/components/navbar.tsx
git commit -m "feat: add notification bell with dropdown to navbar"
```

---

### Task 7: Complementary services — schema and admin UI

**Files:**
- Modify: `packages/shared/src/validations/service.ts`
- Modify: `apps/web/src/app/admin/servicios/actions.ts`
- Modify: `apps/web/src/app/admin/servicios/service-form.tsx`
- Modify: `apps/web/src/app/admin/servicios/service-table.tsx`
- Modify: `apps/web/src/app/admin/servicios/page.tsx`

- [ ] **Step 1: Add es_complementario to Zod schema**

Modify `packages/shared/src/validations/service.ts`. Add `es_complementario` to the schema. Change to:

```typescript
import { z } from 'zod';

export const serviceSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  descripcion: z.string().max(1000).optional().nullable(),
  precio: z.number().positive('El precio debe ser mayor a 0').max(99999),
  duracion_min: z.number().int().min(15, 'Minimo 15 minutos').max(480, 'Maximo 8 horas'),
  categoria: z.enum(['lavado', 'detailing', 'otro']).default('lavado'),
  es_complementario: z.boolean().default(false),
  activo: z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
```

- [ ] **Step 2: Update createService action**

In `apps/web/src/app/admin/servicios/actions.ts`, in the `createService` function's `raw` object, add:

```typescript
    es_complementario: formData.get('es_complementario') === 'on',
```

- [ ] **Step 3: Add checkbox to service form**

In `apps/web/src/app/admin/servicios/service-form.tsx`, find the second grid row (`grid-cols-1 gap-4 sm:grid-cols-2 mt-4`) and add a third column by changing it to `sm:grid-cols-3`. Then add a new field after the descripcion input:

```tsx
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="es_complementario"
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-xs font-semibold text-muted-foreground">Es complementario (add-on)</span>
          </label>
        </div>
```

- [ ] **Step 4: Update service table to show complementario badge**

In `apps/web/src/app/admin/servicios/service-table.tsx`:

1. Add `es_complementario: boolean;` to the `Service` interface.

2. In the nombre cell, after the descripcion display, add a badge:

```tsx
                  {svc.es_complementario && (
                    <span className="inline-block mt-1 rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Complementario
                    </span>
                  )}
```

- [ ] **Step 5: Update services page query and organize by type**

In `apps/web/src/app/admin/servicios/page.tsx`, update the select query to include `es_complementario`:

```tsx
.select('id, nombre, descripcion, precio, duracion_min, categoria, es_complementario, activo, orden')
```

Split the services display into two sections. Replace the current services section with:

```tsx
      {/* ── Servicios ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Servicios base</h3>
        <ServiceForm />
        <ServiceTable services={services.filter((s: any) => !s.es_complementario)} />
      </section>

      {services.some((s: any) => s.es_complementario) && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Servicios complementarios</h3>
          <ServiceTable services={services.filter((s: any) => s.es_complementario)} />
        </section>
      )}
```

- [ ] **Step 6: Build and verify**

Run: `npx turbo build --filter=@splash/shared && cd apps/web && npx next build`

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/validations/service.ts apps/web/src/app/admin/servicios/actions.ts apps/web/src/app/admin/servicios/service-form.tsx apps/web/src/app/admin/servicios/service-table.tsx apps/web/src/app/admin/servicios/page.tsx
git commit -m "feat: add complementary services support to admin panel"
```

---

### Task 8: Complementary services — booking flow

**Files:**
- Modify: `apps/web/src/app/autolavados/[slug]/page.tsx`
- Modify: `apps/web/src/app/(client)/agendar/page.tsx`
- Modify: `apps/web/src/app/api/appointments/route.ts`
- Modify: `packages/shared/src/validations/appointment.ts`

- [ ] **Step 1: Update appointment validation schema**

In `packages/shared/src/validations/appointment.ts`, add `servicios_complementarios` to `createAppointmentSchema`:

```typescript
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  car_wash_id: z.string().uuid(),
  service_id: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  notas_cliente: z.string().max(500).optional(),
  servicios_complementarios: z.array(z.string().uuid()).optional(),
});

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  motivo_cancelacion: z.string().min(1).max(500),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
```

- [ ] **Step 2: Update appointments API to handle complementary services**

In `apps/web/src/app/api/appointments/route.ts`, after fetching the main service and before calculating end time, add logic to fetch and calculate complementary services:

After the line that fetches the service (something like `const { data: service } = await supabase.from('services')...`), add:

```typescript
  // Fetch complementary services if provided
  let complementaryServices: any[] = [];
  let totalDuration = service.duracion_min;
  let totalPrice = service.precio;

  if (body.servicios_complementarios?.length) {
    const { data: compServices } = await supabase
      .from('services')
      .select('id, nombre, precio, duracion_min')
      .in('id', body.servicios_complementarios)
      .eq('car_wash_id', body.car_wash_id)
      .eq('es_complementario', true)
      .eq('activo', true);

    if (compServices) {
      complementaryServices = compServices;
      totalDuration += compServices.reduce((sum: number, s: any) => sum + s.duracion_min, 0);
      totalPrice += compServices.reduce((sum: number, s: any) => sum + s.precio, 0);
    }
  }
```

Then update the end time calculation to use `totalDuration` instead of `service.duracion_min`.

In the appointment insert, add:
```typescript
    servicios_complementarios: complementaryServices.length > 0
      ? complementaryServices.map((s: any) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracion_min: s.duracion_min }))
      : null,
    precio_total: totalPrice,
```

And update `precio_cobrado` to use `totalPrice`:
```typescript
    precio_cobrado: totalPrice,
```

- [ ] **Step 3: Show complementary services on car wash detail page**

In `apps/web/src/app/autolavados/[slug]/page.tsx`, update the services query to include `es_complementario`:

```tsx
.select('id, nombre, descripcion, precio, duracion_min, activo, es_complementario')
```

Split the services display to show base services with their "Agendar" links, and list complementary services separately below:

```tsx
{/* Base services */}
{services.filter((s: any) => !s.es_complementario).map((service: any) => (
  // existing ServiceCard/link
))}

{/* Complementary services */}
{services.some((s: any) => s.es_complementario) && (
  <div className="mt-6">
    <h3 className="text-lg font-bold text-foreground mb-3">Servicios complementarios</h3>
    <p className="text-sm text-muted-foreground mb-3">Agrega extras al agendar tu cita</p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {services.filter((s: any) => s.es_complementario).map((svc: any) => (
        <div key={svc.id} className="rounded-card border border-border p-4">
          <div className="font-medium text-foreground">{svc.nombre}</div>
          {svc.descripcion && <p className="text-xs text-muted-foreground mt-1">{svc.descripcion}</p>}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-bold text-foreground">+${Number(svc.precio).toLocaleString('es-MX')}</span>
            <span className="text-muted-foreground">{svc.duracion_min} min</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 4: Add complementary service selection to booking page**

In `apps/web/src/app/(client)/agendar/page.tsx`, add state and UI for selecting complementary services:

1. Add state variables:
```tsx
const [complementaryServices, setComplementaryServices] = useState<any[]>([]);
const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
```

2. Fetch complementary services in the useEffect alongside the main service fetch:
```tsx
supabase.from('services').select('id, nombre, precio, duracion_min').eq('car_wash_id', carWashId).eq('es_complementario', true).eq('activo', true)
```

3. Add a checkbox section after the service summary card and before the time picker:
```tsx
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
```

4. Update the API call in `handleConfirm` to include selected extras:
```tsx
body: JSON.stringify({
  car_wash_id: carWashId,
  service_id: serviceId,
  fecha,
  hora_inicio: hora,
  servicios_complementarios: selectedExtras.length > 0 ? selectedExtras : undefined,
}),
```

- [ ] **Step 5: Build and verify**

Run: `npx turbo build --filter=@splash/shared && cd apps/web && npx next build`

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/validations/appointment.ts apps/web/src/app/api/appointments/route.ts "apps/web/src/app/autolavados/[slug]/page.tsx" "apps/web/src/app/(client)/agendar/page.tsx"
git commit -m "feat: add complementary services to booking flow"
```

---

### Task 9: Add to calendar (ICS export)

**Files:**
- Create: `apps/web/src/lib/calendar.ts`
- Modify: `apps/web/src/components/appointment-card.tsx`

- [ ] **Step 1: Create ICS generator utility**

Create `apps/web/src/lib/calendar.ts`:

```typescript
interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMin: number;
  location?: string;
  description?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatICSDate(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;
}

function addMinutes(date: string, time: string, minutes: number): string {
  const dt = new Date(`${date}T${time}:00`);
  dt.setMinutes(dt.getMinutes() + minutes);
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const h = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${y}${m}${d}T${h}${min}00`;
}

export function generateICS(event: CalendarEvent): string {
  const start = formatICSDate(event.date, event.startTime);
  const end = addMinutes(event.date, event.startTime, event.durationMin);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Splash//Car Wash Booking//ES',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DTSTAMP:${now}`,
    `UID:${crypto.randomUUID()}@splash.app`,
    `SUMMARY:${event.title}`,
  ];

  if (event.location) lines.push(`LOCATION:${event.location}`);
  if (event.description) lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(event: CalendarEvent): void {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cita-splash.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Add "Agregar al calendario" button to appointment card**

Modify `apps/web/src/components/appointment-card.tsx`. Add import at top:

```tsx
import { downloadICS } from '@/lib/calendar';
```

In the action buttons section (where "Calificar servicio" and "Cancelar cita" are shown), add a calendar button for `confirmed` and `in_progress` appointments:

After the existing cancel button block, add:

```tsx
{(appointment.estado === 'confirmed' || appointment.estado === 'in_progress') && (
  <button
    onClick={() => downloadICS({
      title: `Lavado en ${appointment.car_washes?.nombre ?? 'Autolavado'}`,
      date: appointment.fecha,
      startTime: appointment.hora_inicio?.slice(0, 5) ?? '09:00',
      durationMin: appointment.services?.duracion_min ?? 30,
      location: appointment.car_washes?.direccion ?? undefined,
      description: `Servicio: ${appointment.services?.nombre ?? ''}\nPrecio: $${appointment.precio_cobrado}`,
    })}
    className="text-xs font-semibold text-primary hover:underline"
  >
    Agregar al calendario
  </button>
)}
```

Also update the appointment card to fetch/show `duracion_min` and `direccion`. The card receives `appointment` as a prop — we need to make sure the parent query includes these fields.

- [ ] **Step 3: Update mis-citas query to include needed fields**

In `apps/web/src/app/(client)/mis-citas/page.tsx`, update the select query to include extra fields for the calendar export:

Change:
```tsx
.select('*, car_washes!car_wash_id(nombre), services!service_id(nombre)')
```

To:
```tsx
.select('*, car_washes!car_wash_id(nombre, direccion), services!service_id(nombre, duracion_min)')
```

- [ ] **Step 4: Build and verify**

Run: `cd apps/web && npx next build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/calendar.ts apps/web/src/components/appointment-card.tsx "apps/web/src/app/(client)/mis-citas/page.tsx"
git commit -m "feat: add ICS calendar export to appointment cards"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run build**

Run: `npm run build`

- [ ] **Step 4: Manual testing checklist**

1. Google Maps:
   - [ ] `/autolavados` shows map with markers for car washes with coordinates
   - [ ] "Usar mi ubicacion" button requests geolocation and sorts results
   - [ ] Clicking a marker scrolls to the corresponding card
   - [ ] `/autolavados/[slug]` shows "Como llegar" button (opens Google Maps)

2. WhatsApp:
   - [ ] Car wash detail shows green "WhatsApp" button if number configured
   - [ ] Button opens `wa.me` link with pre-filled message

3. Notifications:
   - [ ] Navbar shows bell icon with unread count badge
   - [ ] Clicking bell opens dropdown with notification list
   - [ ] Clicking notification marks it as read
   - [ ] "Marcar todas como leidas" works

4. Complementary services:
   - [ ] Admin can create service with "Es complementario" checkbox
   - [ ] Services page shows separate sections for base and complementary
   - [ ] Car wash detail shows complementary services section
   - [ ] Booking flow shows extras selection with running total
   - [ ] Booking API creates appointment with complementary data

5. Calendar:
   - [ ] Confirmed appointments show "Agregar al calendario" button
   - [ ] Button downloads .ics file
   - [ ] .ics file opens in calendar app with correct details
