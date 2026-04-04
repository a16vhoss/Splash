# Phase 1: Discovery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign homepage and listing pages inspired by OpenTable — multi-field search bar, filter pills, horizontal wash cards with available slots, category grid, and improved map layout.

**Architecture:** Server Components for pages with client components for interactive search bar, filters, and map. Existing Supabase SDK pattern (no ORM). New components are self-contained and composable.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Supabase JS SDK, Google Maps

---

### Task 1: DB Migration — Add service categoria and car_washes.fotos

**Files:**
- Create: `supabase/migrations/008_discovery_phase.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 008_discovery_phase.sql
-- Phase 1: Discovery features

-- Service categories for "browse by service" section
ALTER TABLE services ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'general';

-- Photos array for car wash gallery
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/008_discovery_phase.sql
git commit -m "feat: add service categoria and car_washes.fotos columns"
```

---

### Task 2: Search Bar Component

**Files:**
- Create: `apps/web/src/components/search-bar.tsx`

- [ ] **Step 1: Create the search bar component**

This is a `'use client'` component with 4 fields: Fecha (date picker), Hora (time select), Vehículo (select), Zona (text input). Submits as form to `/autolavados` with query params.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'suv', label: 'SUV' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'moto', label: 'Moto' },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDefaultTime() {
  const now = new Date();
  const hour = now.getHours();
  const rounded = hour < 23 ? hour + 1 : hour;
  return `${String(rounded).padStart(2, '0')}:00`;
}

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface SearchBarProps {
  defaultQuery?: string;
  defaultFecha?: string;
  defaultHora?: string;
  defaultVehiculo?: string;
  variant?: 'hero' | 'compact';
}

export function SearchBar({
  defaultQuery = '',
  defaultFecha,
  defaultHora,
  defaultVehiculo,
  variant = 'hero',
}: SearchBarProps) {
  const router = useRouter();
  const [fecha, setFecha] = useState(defaultFecha || getTodayStr());
  const [hora, setHora] = useState(defaultHora || getDefaultTime());
  const [vehiculo, setVehiculo] = useState(defaultVehiculo || 'sedan');
  const [zona, setZona] = useState(defaultQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (zona) params.set('q', zona);
    if (fecha) params.set('fecha', fecha);
    if (hora) params.set('hora', hora);
    if (vehiculo) params.set('vehiculo', vehiculo);
    router.push(`/autolavados?${params.toString()}`);
  }

  const isCompact = variant === 'compact';

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-modal shadow-modal flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 ${
        isCompact ? 'p-2' : 'p-3 md:p-2'
      } max-w-3xl w-full mx-auto`}
    >
      {/* Fecha */}
      <div className={`flex-1 px-3 py-2 ${!isCompact ? 'md:border-r border-border' : 'md:border-r border-border'}`}>
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={getTodayStr()}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        />
      </div>

      {/* Hora */}
      <div className="flex-1 px-3 py-2 md:border-r border-border">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Hora</label>
        <select
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        >
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Vehículo */}
      <div className="flex-1 px-3 py-2 md:border-r border-border">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Vehículo</label>
        <select
          value={vehiculo}
          onChange={(e) => setVehiculo(e.target.value)}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        >
          {VEHICLE_TYPES.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Zona */}
      <div className="flex-[2] px-3 py-2">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Zona</label>
        <input
          type="text"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          placeholder="Buscar por nombre o zona..."
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5 placeholder:text-muted-foreground"
        />
      </div>

      {/* Submit */}
      <div className="px-2 py-1">
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2.5 rounded-card bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors whitespace-nowrap"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/search-bar.tsx
git commit -m "feat: add multi-field search bar component"
```

---

### Task 3: Category Grid Component

**Files:**
- Create: `apps/web/src/components/category-grid.tsx`

- [ ] **Step 1: Create the category grid component**

```tsx
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'exterior', label: 'Lavado exterior', icon: '🧽' },
  { slug: 'completo', label: 'Lavado completo', icon: '✨' },
  { slug: 'detailing', label: 'Detailing', icon: '💎' },
  { slug: 'encerado', label: 'Encerado', icon: '🛡️' },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/autolavados?categoria=${cat.slug}`}
          className="flex flex-col items-center gap-2 rounded-modal bg-white border border-border p-5 hover:shadow-card-hover hover:border-primary/30 transition-all"
        >
          <span className="text-3xl">{cat.icon}</span>
          <span className="text-sm font-semibold text-foreground text-center">{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/category-grid.tsx
git commit -m "feat: add service category grid component"
```

---

### Task 4: Filter Pills Component

**Files:**
- Create: `apps/web/src/components/filter-pills.tsx`

- [ ] **Step 1: Create the filter pills component**

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const RATING_OPTIONS = [
  { value: '4', label: '★ 4+' },
  { value: '4.5', label: '★ 4.5+' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Mejor calificación' },
  { value: 'reviews', label: 'Más reseñas' },
  { value: 'name', label: 'Nombre A-Z' },
];

export function FilterPills() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/autolavados?${params.toString()}`);
  }

  const activeRating = searchParams.get('rating');
  const activeSort = searchParams.get('sort');
  const activeCategoria = searchParams.get('categoria');

  return (
    <div className="flex flex-wrap gap-2">
      {/* Rating filters */}
      {RATING_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggleParam('rating', opt.value)}
          className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-colors ${
            activeRating === opt.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-foreground border-border hover:border-primary/50'
          }`}
        >
          {opt.label}
        </button>
      ))}

      {/* Categoria filter - show active */}
      {activeCategoria && (
        <button
          onClick={() => toggleParam('categoria', activeCategoria)}
          className="px-3 py-1.5 rounded-pill text-xs font-semibold bg-primary text-white border border-primary"
        >
          {activeCategoria} ✕
        </button>
      )}

      {/* Sort */}
      <select
        value={activeSort || 'rating'}
        onChange={(e) => toggleParam('sort', e.target.value)}
        className="px-3 py-1.5 rounded-pill text-xs font-semibold border border-border bg-white text-foreground"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/filter-pills.tsx
git commit -m "feat: add filter pills component for listing page"
```

---

### Task 5: Horizontal Wash Card with Slots

**Files:**
- Create: `apps/web/src/components/wash-card-horizontal.tsx`

- [ ] **Step 1: Create the horizontal card component**

This card shows a car wash in horizontal layout with photo, details, social proof, and available time slots as clickable pills.

```tsx
import Link from 'next/link';

interface WashCardHorizontalProps {
  wash: {
    id: string;
    nombre: string;
    slug: string;
    direccion: string;
    rating_promedio: number;
    total_reviews: number;
    fotos: string[] | null;
    logo_url: string | null;
  };
  slots?: string[];
  citasHoy?: number;
}

export function WashCardHorizontal({ wash, slots, citasHoy }: WashCardHorizontalProps) {
  const fotos = wash.fotos ?? [];
  const heroPhoto = fotos[0] ?? null;

  return (
    <div className="bg-white rounded-modal border border-border overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col sm:flex-row">
      {/* Photo */}
      <Link href={`/autolavados/${wash.slug}`} className="sm:w-44 h-36 sm:h-auto flex-shrink-0 block">
        {heroPhoto ? (
          <img src={heroPhoto} alt={wash.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <span className="text-4xl font-extrabold text-white/80">{wash.nombre.charAt(0)}</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between">
          <Link href={`/autolavados/${wash.slug}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-base text-foreground">{wash.nombre}</h3>
          </Link>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="text-warning">★</span>{' '}
          <span className="font-semibold text-foreground">{Number(wash.rating_promedio).toFixed(1)}</span>
          {' · '}{wash.total_reviews} reseñas
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{wash.direccion}</p>

        {citasHoy != null && citasHoy > 0 && (
          <p className="text-xs text-accent font-semibold mt-1.5">{citasHoy} citas hoy</p>
        )}

        {/* Slots */}
        {slots && slots.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {slots.slice(0, 5).map((slot) => (
              <Link
                key={slot}
                href={`/agendar?car_wash_id=${wash.id}&fecha=${new Date().toISOString().split('T')[0]}&hora=${slot}`}
                className="px-3 py-1 rounded-pill bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
              >
                {slot}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <span className="px-3 py-1 rounded-pill bg-primary/10 text-primary text-xs font-semibold">
              🔔 Notificarme
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/wash-card-horizontal.tsx
git commit -m "feat: add horizontal wash card with time slot pills"
```

---

### Task 6: Redesign Homepage

**Files:**
- Modify: `apps/web/src/app/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the homepage**

The new homepage has: hero with search bar, "Mejor calificados" section with wash cards showing slots, "Cerca de ti" map section, and "Buscar por servicio" category grid.

```tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCard } from '@/components/wash-card';
import { SearchBar } from '@/components/search-bar';
import { CategoryGrid } from '@/components/category-grid';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const { data: topWashes } = await supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url, fotos')
    .eq('activo', true)
    .eq('verificado', true)
    .in('subscription_status', ['trial', 'active'])
    .order('rating_promedio', { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary to-accent py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Encuentra tu autolavado ideal
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/80 max-w-xl mx-auto">
              Reserva en segundos. Sin esperas.
            </p>
            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>
          </div>
        </section>

        {/* Mejor calificados */}
        <section className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Mejor calificados</h2>
            <Link href="/autolavados" className="text-sm font-semibold text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          {topWashes && topWashes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWashes.map((wash: any) => (
                <WashCard key={wash.id} wash={wash} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay autolavados disponibles aún.</p>
          )}
        </section>

        {/* Buscar por servicio */}
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <h2 className="text-xl font-bold text-foreground mb-6">Buscar por servicio</h2>
          <CategoryGrid />
        </section>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: redesign homepage with search bar, categories, and improved layout"
```

---

### Task 7: Redesign Listing Page with Filters and Two-Column Layout

**Files:**
- Modify: `apps/web/src/app/autolavados/page.tsx` (full rewrite)
- Modify: `apps/web/src/app/autolavados/autolavados-client.tsx` (update to new layout)

- [ ] **Step 1: Rewrite the listing page**

New layout: search refinement bar at top, filter pills below, two-column layout with horizontal cards on left and sticky map on right. Supports query params: `q`, `fecha`, `hora`, `vehiculo`, `rating`, `sort`, `categoria`.

```tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { WashCardHorizontal } from '@/components/wash-card-horizontal';
import { SearchBar } from '@/components/search-bar';
import { FilterPills } from '@/components/filter-pills';
import { ListingMapSection } from './listing-client';

export default async function AutolavadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    fecha?: string;
    hora?: string;
    vehiculo?: string;
    rating?: string;
    sort?: string;
    categoria?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();

  let query = supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, rating_promedio, total_reviews, logo_url, fotos, latitud, longitud')
    .eq('activo', true)
    .in('subscription_status', ['trial', 'active']);

  if (params.q) {
    query = query.or(`nombre.ilike.%${params.q}%,direccion.ilike.%${params.q}%`);
  }
  if (params.rating) {
    query = query.gte('rating_promedio', Number(params.rating));
  }

  // Sort
  const sort = params.sort || 'rating';
  if (sort === 'rating') query = query.order('rating_promedio', { ascending: false });
  else if (sort === 'reviews') query = query.order('total_reviews', { ascending: false });
  else if (sort === 'name') query = query.order('nombre', { ascending: true });
  else query = query.order('rating_promedio', { ascending: false });

  const { data: washes } = await query.limit(50);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Search refinement */}
        <div className="mb-4">
          <SearchBar
            variant="compact"
            defaultQuery={params.q}
            defaultFecha={params.fecha}
            defaultHora={params.hora}
            defaultVehiculo={params.vehiculo}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterPills />
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground mb-4">
          {washes?.length ?? 0} autolavados encontrados
          {params.q ? ` para "${params.q}"` : ''}
        </p>

        {washes && washes.length > 0 ? (
          <div className="flex gap-6">
            {/* Cards column */}
            <div className="flex-1 min-w-0 space-y-3">
              {washes.map((wash: any) => (
                <WashCardHorizontal key={wash.id} wash={wash} />
              ))}
            </div>

            {/* Map column - hidden on mobile */}
            <div className="hidden lg:block w-[400px] flex-shrink-0">
              <div className="sticky top-6">
                <ListingMapSection carWashes={washes} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No se encontraron autolavados.</p>
            {params.q && (
              <a href="/autolavados" className="text-sm text-primary hover:underline mt-2 inline-block">Ver todos</a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create listing-client.tsx (replaces autolavados-client.tsx)**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarWashMap } from '@/components/car-wash-map';

interface CarWash {
  id: string;
  nombre: string;
  slug: string;
  latitud: number | null;
  longitud: number | null;
  rating_promedio: number;
  direccion: string | null;
}

export function ListingMapSection({ carWashes }: { carWashes: CarWash[] }) {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const mappable = carWashes.filter((cw) => cw.latitud != null && cw.longitud != null) as Array<CarWash & { latitud: number; longitud: number }>;

  if (mappable.length === 0) return <div className="rounded-modal bg-muted h-80 flex items-center justify-center text-muted-foreground text-sm">Sin ubicaciones disponibles</div>;

  return (
    <div className="rounded-modal overflow-hidden h-[calc(100vh-180px)]">
      <CarWashMap
        carWashes={mappable}
        userLocation={userLocation}
        onMarkerClick={(slug) => router.push(`/autolavados/${slug}`)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/autolavados/page.tsx apps/web/src/app/autolavados/listing-client.tsx
git commit -m "feat: redesign listing page with filters, horizontal cards, and two-column map layout"
```

---

### Task 8: Update WashCard to show fotos

**Files:**
- Modify: `apps/web/src/components/wash-card.tsx`

- [ ] **Step 1: Update WashCard to support photos**

Update the interface to accept `fotos` and show a photo or gradient fallback at the top of the card.

```tsx
import Link from 'next/link';

interface WashCardProps {
  wash: {
    id: string;
    nombre: string;
    slug: string;
    direccion: string;
    rating_promedio: number;
    total_reviews: number;
    logo_url: string | null;
    fotos?: string[] | null;
  };
}

export function WashCard({ wash }: WashCardProps) {
  const fotos = wash.fotos ?? [];
  const heroPhoto = fotos[0] ?? null;

  return (
    <Link
      href={`/autolavados/${wash.slug}`}
      className="group block rounded-modal bg-white border border-border overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
    >
      {/* Photo or gradient */}
      <div className="h-32 relative">
        {heroPhoto ? (
          <img src={heroPhoto} alt={wash.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light" />
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
          {wash.nombre}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-warning text-sm">★</span>
          <span className="text-sm font-semibold text-foreground">{Number(wash.rating_promedio).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({wash.total_reviews} reseñas)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{wash.direccion}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/wash-card.tsx
git commit -m "feat: update WashCard with photo support and new card design"
```
