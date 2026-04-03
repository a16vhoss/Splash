# Splash v2 — Phase 1: Quick Wins (UX & Bugs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom tab bar navigation for client and admin on mobile, implement a toast notification system for user feedback, and add detail fields to services.

**Architecture:** Four independent features that can be built sequentially. The toast system is a shared provider at the root layout level. Bottom tab bars are layout-level components that replace mobile hamburger menu (client) and sidebar (admin). Service detail fields require a DB migration and form updates.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4, Supabase (PostgreSQL), React Server Components + Client Components, Zod validation.

---

### Task 1: Toast notification system

**Files:**
- Create: `apps/web/src/components/toast.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create the toast provider and component**

Create `apps/web/src/components/toast.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const colors: Record<ToastType, string> = {
    success: 'bg-accent text-white',
    error: 'bg-destructive text-white',
    info: 'bg-primary text-white',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-md:left-4 max-md:right-4 max-md:items-center">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${colors[toast.type]} rounded-card px-4 py-3 text-sm font-semibold shadow-modal animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Add ToastProvider to root layout**

Modify `apps/web/src/app/layout.tsx`. Change the body content from:

```tsx
<body className="font-sans antialiased">{children}</body>
```

to:

```tsx
<body className="font-sans antialiased">
  <ToastProvider>{children}</ToastProvider>
</body>
```

Add the import at the top:

```tsx
import { ToastProvider } from '@/components/toast';
```

- [ ] **Step 3: Verify dev server starts without errors**

Run: `cd apps/web && npm run dev`
Expected: Server starts on port 3000, no compilation errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/toast.tsx apps/web/src/app/layout.tsx
git commit -m "feat: add toast notification system with context provider"
```

---

### Task 2: Wire toasts to service actions

The service actions use Server Actions with `revalidatePath`. Since Server Actions don't return values to the UI easily, we need to convert the services page forms to client-side handlers that call the actions and show toasts.

**Files:**
- Create: `apps/web/src/app/admin/servicios/service-form.tsx`
- Create: `apps/web/src/app/admin/servicios/service-table.tsx`
- Modify: `apps/web/src/app/admin/servicios/page.tsx`
- Modify: `apps/web/src/app/admin/servicios/hours-form.tsx`

- [ ] **Step 1: Create client-side service form with toast**

Create `apps/web/src/app/admin/servicios/service-form.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { createService } from './actions';

export function ServiceForm() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createService(formData);
        toast('Servicio creado');
      } catch (e: any) {
        toast(e.message ?? 'Error al crear servicio', 'error');
      }
    });
  }

  return (
    <form action={handleSubmit} className="rounded-card bg-card p-6 shadow-card">
      <p className="mb-4 text-sm font-semibold text-muted-foreground">Agregar servicio</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</label>
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={150}
            placeholder="Lavado basico"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Precio ($)</label>
          <input
            name="precio"
            type="number"
            required
            min={1}
            step="0.01"
            placeholder="150.00"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Duracion (min)</label>
          <input
            name="duracion_min"
            type="number"
            required
            min={15}
            max={480}
            placeholder="30"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {isPending ? 'Agregando...' : 'Agregar servicio'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create client-side service table with toast**

Create `apps/web/src/app/admin/servicios/service-table.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { deleteService, toggleService } from './actions';

interface Service {
  id: string;
  nombre: string;
  precio: number;
  duracion_min: number;
  activo: boolean;
}

export function ServiceTable({ services }: { services: Service[] }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      try {
        await toggleService(id, activo);
        toast(activo ? 'Servicio activado' : 'Servicio desactivado');
      } catch {
        toast('Error al actualizar servicio', 'error');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteService(id);
        toast('Servicio eliminado');
      } catch {
        toast('Error al eliminar servicio', 'error');
      }
    });
  }

  if (services.length === 0) {
    return (
      <div className="rounded-card bg-card shadow-card">
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No hay servicios registrados
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Nombre</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Duracion</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-3 font-medium text-foreground">{svc.nombre}</td>
                <td className="px-6 py-3 text-muted-foreground">${(svc.precio ?? 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-muted-foreground">{svc.duracion_min} min</td>
                <td className="px-6 py-3">
                  <span
                    className={
                      svc.activo
                        ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                        : 'rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                    }
                  >
                    {svc.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(svc.id, !svc.activo)}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {svc.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(svc.id)}
                      className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update services page to use new client components**

Modify `apps/web/src/app/admin/servicios/page.tsx`. Replace the entire file with:

```tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { HoursForm } from './hours-form';
import { ServiceForm } from './service-form';
import { ServiceTable } from './service-table';

export default async function ServiciosPage() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, num_estaciones')
    .eq('owner_id', user.id)
    .single() as { data: any };

  let services: any[] = [];
  let businessHours: any[] = [];

  if (carWash) {
    const { data: svcs } = await supabase
      .from('services')
      .select('id, nombre, precio, duracion_min, activo, orden')
      .eq('car_wash_id', carWash.id)
      .order('orden', { ascending: true }) as { data: any[] | null };
    services = svcs ?? [];

    const { data: bh } = await supabase
      .from('business_hours')
      .select('dia_semana, hora_apertura, hora_cierre, cerrado')
      .eq('car_wash_id', carWash.id) as { data: any[] | null };
    businessHours = bh ?? [];
  }

  const hoursByDay = Object.fromEntries(businessHours.map((bh: any) => [bh.dia_semana, bh]));
  const numEstaciones = carWash?.num_estaciones ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Servicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona tus servicios, horarios y estaciones</p>
      </div>

      {/* ── Servicios ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Mis servicios</h3>
        <ServiceForm />
        <ServiceTable services={services} />
      </section>

      {/* ── Horario de operacion ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Horario de operacion</h3>
        <div className="rounded-card bg-card shadow-card">
          <HoursForm hoursByDay={hoursByDay} />
        </div>
      </section>

      {/* ── Estaciones de lavado ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Estaciones de lavado</h3>
        <div className="rounded-card bg-card p-6 shadow-card">
          <p className="mb-4 text-sm text-muted-foreground">
            Total de estaciones:{' '}
            <span className="font-semibold text-foreground">{numEstaciones}</span>
          </p>
          {numEstaciones > 0 ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: numEstaciones }, (_, i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-card border-2 border-primary bg-primary/5"
                >
                  <span className="text-xs font-bold text-primary">E{i + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay estaciones configuradas</p>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add toast to hours form**

Modify `apps/web/src/app/admin/servicios/hours-form.tsx`. Replace the entire file with:

```tsx
'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { saveBusinessHours } from './actions';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

interface HoursFormProps {
  hoursByDay: Record<number, { hora_apertura?: string; hora_cierre?: string; cerrado?: boolean }>;
}

export function HoursForm({ hoursByDay }: HoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveBusinessHours(formData);
        toast('Horarios guardados correctamente');
      } catch {
        toast('Error al guardar horarios', 'error');
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Dia</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Apertura</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cierre</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, i) => {
              const bh = hoursByDay[i];
              return (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{day}</td>
                  <td className="px-6 py-3">
                    <input
                      type="time"
                      name={`apertura_${i}`}
                      defaultValue={bh?.hora_apertura?.slice(0, 5) ?? '09:00'}
                      className="rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="time"
                      name={`cierre_${i}`}
                      defaultValue={bh?.hora_cierre?.slice(0, 5) ?? '18:00'}
                      className="rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      name={`cerrado_${i}`}
                      defaultChecked={bh?.cerrado ?? false}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end px-6 pb-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {isPending ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Verify dev server starts and navigate to admin/servicios**

Run: `cd apps/web && npm run dev`
Expected: No compilation errors. Navigate to `http://localhost:3000/admin/servicios` — form and table should render. Creating/deleting/toggling services should show toast notifications.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/admin/servicios/service-form.tsx apps/web/src/app/admin/servicios/service-table.tsx apps/web/src/app/admin/servicios/page.tsx apps/web/src/app/admin/servicios/hours-form.tsx
git commit -m "feat: wire toast notifications to service and hours actions"
```

---

### Task 3: Wire toasts to client pages (mis-citas, calificar)

**Files:**
- Modify: `apps/web/src/app/(client)/mis-citas/page.tsx`
- Modify: `apps/web/src/app/(client)/calificar/[id]/page.tsx`

- [ ] **Step 1: Add toast to mis-citas cancel flow**

Modify `apps/web/src/app/(client)/mis-citas/page.tsx`. Add import at the top (after other imports):

```tsx
import { useToast } from '@/components/toast';
```

Inside `MisCitasPage()`, add after `const supabase = createClient();`:

```tsx
const toast = useToast();
```

In the `handleCancel` function, replace the success/error handling. Change:

```tsx
    if (res.ok) {
      loadAppointments();
    } else {
      const data = await res.json();
      alert(data.error ?? 'Error al cancelar');
    }
```

to:

```tsx
    if (res.ok) {
      toast('Cita cancelada');
      loadAppointments();
    } else {
      const data = await res.json();
      toast(data.error ?? 'Error al cancelar', 'error');
    }
```

- [ ] **Step 2: Add toast to calificar success flow**

Modify `apps/web/src/app/(client)/calificar/[id]/page.tsx`. Add import at the top (after other imports):

```tsx
import { useToast } from '@/components/toast';
```

Inside `CalificarPage()`, add after `const supabase = createClient();`:

```tsx
const toast = useToast();
```

Before `router.push('/mis-citas');` (the success redirect), add:

```tsx
    toast('Evaluacion enviada, gracias');
```

- [ ] **Step 3: Verify both pages work**

Run: `cd apps/web && npm run dev`
Expected: Navigate to `/mis-citas` — cancelling shows toast. Navigate to `/calificar/{id}` — submitting rating shows toast before redirect.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(client\)/mis-citas/page.tsx apps/web/src/app/\(client\)/calificar/\[id\]/page.tsx
git commit -m "feat: add toast feedback to cancel and rating flows"
```

---

### Task 4: Client bottom tab bar

**Files:**
- Create: `apps/web/src/components/bottom-tab-bar.tsx`
- Modify: `apps/web/src/app/(client)/layout.tsx`
- Modify: `apps/web/src/components/navbar.tsx`

- [ ] **Step 1: Create the bottom tab bar component**

Create `apps/web/src/components/bottom-tab-bar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  {
    label: 'Inicio',
    href: '/autolavados',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Agendar',
    href: '/agendar',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </svg>
    ),
  },
  {
    label: 'Mis Citas',
    href: '/mis-citas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Cuenta',
    href: '/perfil',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
```

- [ ] **Step 2: Add bottom tab bar to client layout**

Modify `apps/web/src/app/(client)/layout.tsx`. Replace the entire file with:

```tsx
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { BottomTabBar } from '@/components/bottom-tab-bar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0"><Suspense>{children}</Suspense></main>
      <div className="hidden md:block"><Footer /></div>
      <BottomTabBar />
    </div>
  );
}
```

Note: `pb-20 md:pb-0` adds bottom padding on mobile so content isn't hidden behind the tab bar. Footer is hidden on mobile since the tab bar replaces it.

- [ ] **Step 3: Hide navbar mobile hamburger on client routes**

Modify `apps/web/src/components/navbar.tsx`. The mobile hamburger button and mobile menu are only needed when the bottom tab bar isn't present. Since the navbar is shared, we hide the hamburger on mobile by checking if the user is on a client route.

In the navbar component, find the mobile hamburger button:

```tsx
        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
```

The bottom tab bar already handles mobile navigation for client routes. The hamburger should still show for non-client routes (e.g., `/autolavados` public pages that don't have the tab bar). No changes needed to navbar since the tab bar and hamburger serve different route groups.

Skip this step — the navbar hamburger is only used on pages without the bottom tab bar (public pages like `/` and `/autolavados`). The client layout already has the tab bar.

- [ ] **Step 4: Verify on mobile viewport**

Run: `cd apps/web && npm run dev`
Expected: Open Chrome DevTools → toggle device toolbar (mobile viewport). Navigate to `/mis-citas` or `/perfil`. Bottom tab bar should appear at the bottom with 4 tabs. Active tab should highlight in primary blue. On desktop viewport (>768px), the tab bar should be hidden.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/bottom-tab-bar.tsx apps/web/src/app/\(client\)/layout.tsx
git commit -m "feat: add client bottom tab bar for mobile navigation"
```

---

### Task 5: Admin bottom tab bar

**Files:**
- Create: `apps/web/src/components/admin-tab-bar.tsx`
- Modify: `apps/web/src/app/admin/layout.tsx`
- Modify: `apps/web/src/components/sidebar.tsx`

- [ ] **Step 1: Create admin tab bar with "Mas" sheet**

Create `apps/web/src/components/admin-tab-bar.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const tabs = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Citas',
    href: '/admin/citas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Servicios',
    href: '/admin/servicios',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const moreItems = [
  { label: 'Reportes', href: '/admin/reportes' },
  { label: 'Suscripcion', href: '/admin/suscripcion' },
];

export function AdminTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isMoreActive = moreItems.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  return (
    <>
      {/* Backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* Bottom sheet */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-modal bg-white border-t border-border shadow-modal px-4 py-4 space-y-1 md:hidden">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowMore(false)}
              className={cn(
                'block rounded-card px-4 py-3 text-sm font-semibold transition-colors',
                pathname === item.href ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          ))}
          <hr className="my-2 border-border" />
          <button
            onClick={handleLogout}
            className="block w-full text-left rounded-card px-4 py-3 text-sm font-semibold text-destructive hover:bg-muted"
          >
            Cerrar sesion
          </button>
        </div>
      )}

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {tab.icon}
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
              isMoreActive || showMore ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="text-[10px] font-semibold">Mas</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Hide sidebar on mobile and add admin tab bar to layout**

Modify `apps/web/src/components/sidebar.tsx`. Change the aside className from:

```tsx
<aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0">
```

to:

```tsx
<aside className="hidden md:flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0">
```

- [ ] **Step 3: Update admin layout**

Modify `apps/web/src/app/admin/layout.tsx`. Replace the entire file with:

```tsx
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { AdminTabBar } from '@/components/admin-tab-bar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
```

Note: `pb-20 md:pb-6` prevents content from hiding behind the tab bar on mobile. `p-4 md:p-6` slightly reduces padding on mobile.

- [ ] **Step 4: Verify on mobile viewport**

Run: `cd apps/web && npm run dev`
Expected: Open Chrome DevTools mobile viewport. Navigate to `/admin/dashboard`. Sidebar should be hidden. Bottom tab bar with Dashboard, Citas, Servicios, Mas should appear. Tapping "Mas" opens bottom sheet with Reportes, Suscripcion, and Cerrar sesion. On desktop viewport, sidebar appears and tab bar is hidden.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin-tab-bar.tsx apps/web/src/components/sidebar.tsx apps/web/src/app/admin/layout.tsx
git commit -m "feat: add admin bottom tab bar for mobile with Mas sheet and logout"
```

---

### Task 6: Service detail fields — database migration

**Files:**
- Create: `supabase/migrations/003_service_details.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/003_service_details.sql`:

```sql
-- Add detail fields to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'lavado'
    CHECK (categoria IN ('lavado', 'detailing', 'otro')),
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;
```

- [ ] **Step 2: Run migration against Supabase**

Run the migration via Supabase Dashboard SQL editor or CLI:

```bash
# If using Supabase CLI:
npx supabase db push
# Or run the SQL manually in Supabase Dashboard → SQL Editor
```

Expected: Migration completes successfully. The `services` table now has `descripcion`, `categoria`, and `imagen_url` columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_service_details.sql
git commit -m "feat: add service detail columns (descripcion, categoria, imagen_url)"
```

---

### Task 7: Service detail fields — shared schema and UI

**Files:**
- Modify: `packages/shared/src/validations/service.ts`
- Modify: `apps/web/src/app/admin/servicios/service-form.tsx`
- Modify: `apps/web/src/app/admin/servicios/actions.ts`
- Modify: `apps/web/src/app/admin/servicios/page.tsx`
- Modify: `apps/web/src/app/admin/servicios/service-table.tsx`

- [ ] **Step 1: Update shared Zod schema**

Modify `packages/shared/src/validations/service.ts`. Replace the entire file with:

```typescript
import { z } from 'zod';

export const serviceSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  descripcion: z.string().max(1000).optional().nullable(),
  precio: z.number().positive('El precio debe ser mayor a 0').max(99999),
  duracion_min: z.number().int().min(15, 'Minimo 15 minutos').max(480, 'Maximo 8 horas'),
  categoria: z.enum(['lavado', 'detailing', 'otro']).default('lavado'),
  activo: z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
```

- [ ] **Step 2: Update createService action to handle new fields**

Modify `apps/web/src/app/admin/servicios/actions.ts`. In the `createService` function, update the `raw` object. Change:

```typescript
  const raw = {
    nombre: formData.get('nombre') as string,
    descripcion: (formData.get('descripcion') as string) || null,
    precio: parseFloat(formData.get('precio') as string),
    duracion_min: parseInt(formData.get('duracion_min') as string, 10),
    activo: true,
  };
```

to:

```typescript
  const raw = {
    nombre: formData.get('nombre') as string,
    descripcion: (formData.get('descripcion') as string) || null,
    precio: parseFloat(formData.get('precio') as string),
    duracion_min: parseInt(formData.get('duracion_min') as string, 10),
    categoria: (formData.get('categoria') as string) || 'lavado',
    activo: true,
  };
```

- [ ] **Step 3: Add new fields to service form**

Modify `apps/web/src/app/admin/servicios/service-form.tsx`. Replace the grid inside the form (the `<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">` block) with:

```tsx
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</label>
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={150}
            placeholder="Lavado basico"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Precio ($)</label>
          <input
            name="precio"
            type="number"
            required
            min={1}
            step="0.01"
            placeholder="150.00"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Duracion (min)</label>
          <input
            name="duracion_min"
            type="number"
            required
            min={15}
            max={480}
            placeholder="30"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Categoria</label>
          <select
            name="categoria"
            defaultValue="lavado"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lavado">Lavado</option>
            <option value="detailing">Detailing</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Descripcion (opcional)</label>
          <input
            name="descripcion"
            maxLength={1000}
            placeholder="Describe el servicio..."
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
```

- [ ] **Step 4: Update service table to show new fields**

Modify `apps/web/src/app/admin/servicios/service-table.tsx`. Update the `Service` interface to include the new fields:

```tsx
interface Service {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  categoria: string;
  activo: boolean;
}
```

In the table body, update the nombre cell to also show descripcion. Change:

```tsx
                <td className="px-6 py-3 font-medium text-foreground">{svc.nombre}</td>
```

to:

```tsx
                <td className="px-6 py-3">
                  <div className="font-medium text-foreground">{svc.nombre}</div>
                  {svc.descripcion && (
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{svc.descripcion}</div>
                  )}
                </td>
```

Add a Categoria column. In the `<thead>`, after the Duracion header, add:

```tsx
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Categoria</th>
```

In the `<tbody>`, after the duracion cell, add:

```tsx
                <td className="px-6 py-3 text-muted-foreground capitalize">{svc.categoria}</td>
```

- [ ] **Step 5: Update services page query to include new fields**

Modify `apps/web/src/app/admin/servicios/page.tsx`. In the services select query, change:

```tsx
      .select('id, nombre, precio, duracion_min, activo, orden')
```

to:

```tsx
      .select('id, nombre, descripcion, precio, duracion_min, categoria, activo, orden')
```

- [ ] **Step 6: Build shared package and verify**

Run: `npx turbo build --filter=@splash/shared && cd apps/web && npm run dev`
Expected: Shared package builds. Dev server starts. Navigate to `/admin/servicios` — form shows new Categoria select and Descripcion input. Table shows categoria column and descripcion under service name.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/validations/service.ts apps/web/src/app/admin/servicios/actions.ts apps/web/src/app/admin/servicios/service-form.tsx apps/web/src/app/admin/servicios/service-table.tsx apps/web/src/app/admin/servicios/page.tsx
git commit -m "feat: add categoria, descripcion fields to service management"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`
Expected: No TypeScript errors across all workspaces.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds for all workspaces.

- [ ] **Step 4: Manual testing checklist**

Open `http://localhost:3000` in Chrome DevTools with mobile viewport (~375px wide):

1. Navigate as a client:
   - [ ] Bottom tab bar visible with 4 tabs (Inicio, Agendar, Mis Citas, Cuenta)
   - [ ] Active tab highlights in primary blue
   - [ ] Footer hidden on mobile
   - [ ] Tab bar hidden on desktop
   - [ ] Navigation between tabs works

2. Navigate as admin (`/admin/dashboard`):
   - [ ] Sidebar hidden on mobile
   - [ ] Bottom tab bar visible with 4 tabs (Dashboard, Citas, Servicios, Mas)
   - [ ] "Mas" opens bottom sheet with Reportes, Suscripcion, Cerrar sesion
   - [ ] "Cerrar sesion" logs out and redirects
   - [ ] Sidebar visible on desktop, tab bar hidden

3. Test toasts:
   - [ ] Create service → "Servicio creado" toast
   - [ ] Delete service → "Servicio eliminado" toast
   - [ ] Toggle service → "Servicio activado/desactivado" toast
   - [ ] Save hours → "Horarios guardados correctamente" toast
   - [ ] Cancel appointment → "Cita cancelada" toast

4. Test service detail fields:
   - [ ] Form shows Categoria select and Descripcion input
   - [ ] Creating service with descripcion and categoria works
   - [ ] Table shows categoria column and descripcion below name
