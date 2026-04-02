# Splash v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Splash, a SaaS marketplace connecting clients with car washes via mobile app (React Native) and admin panel (Next.js).

**Architecture:** Turborepo monorepo with three workspaces: apps/web (Next.js 14 App Router for admin + super admin panel), apps/mobile (Expo React Native for client app), packages/shared (TypeScript types, Zod validations, constants). Supabase handles auth, database, storage, realtime, and edge functions. Stripe for business subscriptions only.

**Tech Stack:** TypeScript, Next.js 14 (App Router), React Native (Expo), Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions), Tailwind CSS, shadcn/ui, Stripe, Google Maps SDK, Turborepo

**Design System (AI-HOSS Calibrated — Intensity 6/10 BOLD):**
- Font: Plus Jakarta Sans (weights: 400, 600, 700, 800)
- Primary: #0284C7 | Primary Light: #0EA5E9 | Accent/Success: #059669
- Background: #F8FAFC | Foreground: #0F172A | Card: #FFFFFF
- Muted: #F1F5F9 | Muted FG: #64748B | Border: #E2E8F0
- Warning: #F59E0B | Destructive: #DC2626 | Ring: #0284C7
- Radius: 4px inputs, 8px cards, 12px modals, 999px pills

---

## File Structure Map

```
splash/
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
│
├── apps/
│   ├── web/                                # Next.js 14 App Router
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.local.example
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx              # Root layout + fonts + providers
│   │   │   │   ├── page.tsx                # Landing page (redirect or marketing)
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   │       └── page.tsx        # Admin login
│   │   │   │   ├── (admin)/
│   │   │   │   │   ├── layout.tsx          # Admin layout (sidebar + topbar)
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── citas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── servicios/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── reportes/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── config/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (super)/
│   │   │   │   │   ├── layout.tsx          # Super admin layout
│   │   │   │   │   ├── negocios/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── planes/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── metricas/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── api/
│   │   │   │       ├── appointments/
│   │   │   │       │   └── route.ts
│   │   │   │       ├── webhooks/
│   │   │   │       │   └── stripe/
│   │   │   │       │       └── route.ts
│   │   │   │       └── availability/
│   │   │   │           └── route.ts
│   │   │   ├── components/
│   │   │   │   ├── ui/                     # shadcn/ui components
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── topbar.tsx
│   │   │   │   ├── metric-card.tsx
│   │   │   │   ├── appointments-table.tsx
│   │   │   │   ├── services-list.tsx
│   │   │   │   ├── business-hours-table.tsx
│   │   │   │   ├── revenue-chart.tsx
│   │   │   │   └── rating-summary.tsx
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts           # Browser client
│   │   │   │   │   ├── server.ts           # Server client (RSC)
│   │   │   │   │   └── middleware.ts        # Auth middleware helper
│   │   │   │   └── utils.ts                # cn() helper
│   │   │   └── middleware.ts               # Next.js middleware (auth + roles)
│   │
│   └── mobile/                             # Expo React Native
│       ├── package.json
│       ├── app.json
│       ├── tsconfig.json
│       ├── App.tsx
│       ├── src/
│       │   ├── navigation/
│       │   │   ├── index.tsx               # Root navigator
│       │   │   ├── AuthStack.tsx
│       │   │   └── MainTabs.tsx
│       │   ├── screens/
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── RegisterScreen.tsx
│       │   │   ├── HomeScreen.tsx
│       │   │   ├── WashProfileScreen.tsx
│       │   │   ├── ScheduleScreen.tsx
│       │   │   ├── ConfirmationScreen.tsx
│       │   │   ├── AppointmentsScreen.tsx
│       │   │   ├── RatingScreen.tsx
│       │   │   └── ProfileScreen.tsx
│       │   ├── components/
│       │   │   ├── WashCard.tsx
│       │   │   ├── ServiceCard.tsx
│       │   │   ├── TimeSlotGrid.tsx
│       │   │   ├── AppointmentCard.tsx
│       │   │   ├── StarRating.tsx
│       │   │   └── MapMarker.tsx
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useLocation.ts
│       │   │   ├── useAppointments.ts
│       │   │   └── useNotifications.ts
│       │   ├── services/
│       │   │   ├── supabase.ts             # Supabase client for RN
│       │   │   ├── auth.ts
│       │   │   ├── carWashes.ts
│       │   │   ├── appointments.ts
│       │   │   └── reviews.ts
│       │   ├── theme/
│       │   │   └── index.ts                # Design tokens
│       │   └── utils/
│       │       └── formatting.ts
│
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/
│       │   │   ├── index.ts
│       │   │   ├── user.ts
│       │   │   ├── car-wash.ts
│       │   │   ├── service.ts
│       │   │   ├── appointment.ts
│       │   │   ├── review.ts
│       │   │   ├── notification.ts
│       │   │   └── subscription.ts
│       │   ├── validations/
│       │   │   ├── index.ts
│       │   │   ├── user.ts
│       │   │   ├── appointment.ts
│       │   │   ├── service.ts
│       │   │   ├── review.ts
│       │   │   └── business-hours.ts
│       │   └── constants/
│       │       ├── index.ts
│       │       ├── enums.ts
│       │       └── plans.ts
│
└── supabase/
    ├── config.toml
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Phase 1: Foundation

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`
- Create: `apps/mobile/package.json`, `apps/mobile/tsconfig.json`, `apps/mobile/app.json`, `apps/mobile/App.tsx`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "splash",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "dev:web": "turbo dev --filter=@splash/web",
    "dev:mobile": "turbo dev --filter=@splash/mobile"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "npm@10.0.0"
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.next/
dist/
.turbo/
.env
.env.local
*.tsbuildinfo
.expo/
ios/
android/
```

- [ ] **Step 5: Create .env.example**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Create packages/shared/package.json**

```json
{
  "name": "@splash/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "echo 'no linter configured'"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 7: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 8: Create packages/shared/src/index.ts**

```typescript
export * from './types';
export * from './validations';
export * from './constants';
```

- [ ] **Step 9: Initialize Next.js app (apps/web)**

Run:
```bash
cd apps/web && npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Then update `apps/web/package.json` name to `@splash/web` and add `@splash/shared` dependency:

```json
{
  "name": "@splash/web",
  "dependencies": {
    "@splash/shared": "*"
  }
}
```

- [ ] **Step 10: Create apps/web/tsconfig.json overrides**

Ensure `tsconfig.json` in apps/web extends the base:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 11: Initialize Expo app (apps/mobile)**

Run:
```bash
cd apps/mobile && npx create-expo-app@latest . --template blank-typescript
```

Then update `apps/mobile/package.json`:
```json
{
  "name": "@splash/mobile",
  "dependencies": {
    "@splash/shared": "*"
  }
}
```

- [ ] **Step 12: Install root dependencies and verify**

Run:
```bash
cd /path/to/splash && npm install
npx turbo build --dry-run
```

Expected: no errors, all 3 workspaces detected.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Turborepo monorepo with web, mobile, and shared packages"
```

---

### Task 2: Shared Package — Types, Validations, Constants

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/car-wash.ts`
- Create: `packages/shared/src/types/service.ts`
- Create: `packages/shared/src/types/appointment.ts`
- Create: `packages/shared/src/types/review.ts`
- Create: `packages/shared/src/types/notification.ts`
- Create: `packages/shared/src/types/subscription.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/enums.ts`
- Create: `packages/shared/src/constants/plans.ts`
- Create: `packages/shared/src/constants/index.ts`
- Create: `packages/shared/src/validations/user.ts`
- Create: `packages/shared/src/validations/appointment.ts`
- Create: `packages/shared/src/validations/service.ts`
- Create: `packages/shared/src/validations/review.ts`
- Create: `packages/shared/src/validations/business-hours.ts`
- Create: `packages/shared/src/validations/index.ts`

- [ ] **Step 1: Create enums**

File: `packages/shared/src/constants/enums.ts`
```typescript
export const UserRole = {
  CLIENT: 'client',
  WASH_ADMIN: 'wash_admin',
  SUPER_ADMIN: 'super_admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AppointmentStatus = {
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const NotifType = {
  REMINDER: 'reminder',
  CONFIRMATION: 'confirmation',
  CANCELLATION: 'cancellation',
  REVIEW_REQUEST: 'review_request',
} as const;
export type NotifType = (typeof NotifType)[keyof typeof NotifType];

export const SubStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
} as const;
export type SubStatus = (typeof SubStatus)[keyof typeof SubStatus];
```

- [ ] **Step 2: Create subscription plans constant**

File: `packages/shared/src/constants/plans.ts`
```typescript
export const SUBSCRIPTION_PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    priceMXN: 499,
    maxEstaciones: 1,
    features: ['Servicios ilimitados', '1 estacion de lavado', 'Panel de administracion'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMXN: 999,
    maxEstaciones: 5,
    features: ['Servicios ilimitados', 'Hasta 5 estaciones', 'Reportes avanzados', 'Panel de administracion'],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMXN: 1999,
    maxEstaciones: Infinity,
    features: ['Servicios ilimitados', 'Estaciones ilimitadas', 'Reportes avanzados', 'Soporte prioritario'],
  },
] as const;

export const TRIAL_DAYS = 14;
export const SLOT_DURATION_MIN = 30;
export const CANCELLATION_HOURS_LIMIT = 2;
export const REMINDER_HOURS_BEFORE = 2;
export const REVIEW_REQUEST_HOURS_AFTER = 1;
```

- [ ] **Step 3: Create constants index**

File: `packages/shared/src/constants/index.ts`
```typescript
export * from './enums';
export * from './plans';
```

- [ ] **Step 4: Create type definitions**

File: `packages/shared/src/types/user.ts`
```typescript
import type { UserRole } from '../constants/enums';

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  avatar_url: string | null;
  role: UserRole;
  auth_provider: 'email' | 'google' | 'apple';
  activo: boolean;
  created_at: string;
  updated_at: string;
}
```

File: `packages/shared/src/types/car-wash.ts`
```typescript
import type { SubStatus } from '../constants/enums';

export interface CarWash {
  id: string;
  owner_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string | null;
  logo_url: string | null;
  cover_url: string | null;
  rating_promedio: number;
  total_reviews: number;
  num_estaciones: number;
  activo: boolean;
  verificado: boolean;
  stripe_customer_id: string | null;
  subscription_status: SubStatus;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}
```

File: `packages/shared/src/types/service.ts`
```typescript
export interface Service {
  id: string;
  car_wash_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  orden: number;
  activo: boolean;
  created_at: string;
}
```

File: `packages/shared/src/types/appointment.ts`
```typescript
import type { AppointmentStatus } from '../constants/enums';

export interface Appointment {
  id: string;
  client_id: string;
  car_wash_id: string;
  service_id: string;
  estacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: AppointmentStatus;
  precio_cobrado: number;
  notas_cliente: string | null;
  notas_admin: string | null;
  cancelado_por: string | null;
  motivo_cancelacion: string | null;
  recordatorio_enviado: boolean;
  created_at: string;
  updated_at: string;
}
```

File: `packages/shared/src/types/review.ts`
```typescript
export interface Review {
  id: string;
  appointment_id: string;
  client_id: string;
  car_wash_id: string;
  rating: number;
  comentario: string | null;
  created_at: string;
}
```

File: `packages/shared/src/types/notification.ts`
```typescript
import type { NotifType } from '../constants/enums';

export interface Notification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  tipo: NotifType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  push_enviado: boolean;
  created_at: string;
}
```

File: `packages/shared/src/types/subscription.ts`
```typescript
import type { SubStatus } from '../constants/enums';

export interface Subscription {
  id: string;
  car_wash_id: string;
  stripe_subscription_id: string;
  plan: string;
  status: SubStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  created_at: string;
}
```

File: `packages/shared/src/types/index.ts`
```typescript
export type { User } from './user';
export type { CarWash } from './car-wash';
export type { Service } from './service';
export type { Appointment } from './appointment';
export type { Review } from './review';
export type { Notification } from './notification';
export type { Subscription } from './subscription';

export interface BusinessHours {
  id: string;
  car_wash_id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  cerrado: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  estaciones_libres: number;
}
```

- [ ] **Step 5: Create Zod validation schemas**

File: `packages/shared/src/validations/user.ts`
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Ingresa tu password'),
});

export const updateProfileSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  telefono: z.string().regex(/^\+?[0-9]{10,15}$/, 'Telefono invalido').optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

File: `packages/shared/src/validations/appointment.ts`
```typescript
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  car_wash_id: z.string().uuid(),
  service_id: z.string().uuid(),
  fecha: z.string().date(),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm'),
  notas_cliente: z.string().max(500).optional(),
});

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  motivo_cancelacion: z.string().min(1, 'Motivo requerido').max(500),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
```

File: `packages/shared/src/validations/service.ts`
```typescript
import { z } from 'zod';

export const serviceSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres').max(150),
  descripcion: z.string().max(1000).optional().nullable(),
  precio: z.number().positive('El precio debe ser mayor a 0').max(99999),
  duracion_min: z.number().int().min(15, 'Minimo 15 minutos').max(480, 'Maximo 8 horas'),
  activo: z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
```

File: `packages/shared/src/validations/review.ts`
```typescript
import { z } from 'zod';

export const reviewSchema = z.object({
  appointment_id: z.string().uuid(),
  rating: z.number().int().min(1, 'Minimo 1 estrella').max(5, 'Maximo 5 estrellas'),
  comentario: z.string().max(1000).optional().nullable(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
```

File: `packages/shared/src/validations/business-hours.ts`
```typescript
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const businessHoursSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_apertura: z.string().regex(timeRegex, 'Formato HH:mm'),
  hora_cierre: z.string().regex(timeRegex, 'Formato HH:mm'),
  cerrado: z.boolean(),
}).refine(
  (data) => data.cerrado || data.hora_cierre > data.hora_apertura,
  { message: 'La hora de cierre debe ser mayor a la de apertura', path: ['hora_cierre'] }
);

export const weekScheduleSchema = z.array(businessHoursSchema).length(7);

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;
```

File: `packages/shared/src/validations/index.ts`
```typescript
export * from './user';
export * from './appointment';
export * from './service';
export * from './review';
export * from './business-hours';
```

- [ ] **Step 6: Verify types compile**

Run:
```bash
cd packages/shared && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared types, Zod validations, and constants"
```

---

### Task 3: Supabase Schema & Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/config.toml`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create supabase config**

File: `supabase/config.toml`
```toml
[project]
id = "splash"

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback", "exp://localhost:8081"]
jwt_expiry = 3600

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"

[auth.external.apple]
enabled = true
client_id = "env(APPLE_CLIENT_ID)"
secret = "env(APPLE_CLIENT_SECRET)"
```

- [ ] **Step 2: Create initial migration**

File: `supabase/migrations/001_initial_schema.sql`
```sql
-- Enums
CREATE TYPE user_role AS ENUM ('client', 'wash_admin', 'super_admin');
CREATE TYPE appointment_status AS ENUM ('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE notif_type AS ENUM ('reminder', 'confirmation', 'cancellation', 'review_request');
CREATE TYPE sub_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  auth_provider VARCHAR(20) DEFAULT 'email',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Car Washes
CREATE TABLE car_washes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10,7) NOT NULL,
  longitud DECIMAL(10,7) NOT NULL,
  telefono VARCHAR(20),
  logo_url TEXT,
  cover_url TEXT,
  rating_promedio DECIMAL(2,1) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  num_estaciones INT DEFAULT 1 CHECK (num_estaciones > 0),
  activo BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(100),
  subscription_status sub_status DEFAULT 'trial',
  subscription_plan VARCHAR(50),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
  duracion_min INT NOT NULL CHECK (duracion_min > 0),
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business Hours
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_apertura TIME NOT NULL,
  hora_cierre TIME NOT NULL,
  cerrado BOOLEAN DEFAULT false,
  UNIQUE(car_wash_id, dia_semana)
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id),
  service_id UUID NOT NULL REFERENCES services(id),
  estacion INT NOT NULL CHECK (estacion > 0),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado appointment_status DEFAULT 'confirmed',
  precio_cobrado DECIMAL(10,2) NOT NULL,
  notas_cliente TEXT,
  notas_admin TEXT,
  cancelado_por UUID REFERENCES users(id),
  motivo_cancelacion TEXT,
  recordatorio_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id),
  client_id UUID NOT NULL REFERENCES users(id),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  tipo notif_type NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  push_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id),
  stripe_subscription_id VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status sub_status NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_car_washes_location ON car_washes(latitud, longitud);
CREATE INDEX idx_car_washes_owner ON car_washes(owner_id);
CREATE INDEX idx_car_washes_active ON car_washes(activo, verificado, subscription_status);
CREATE INDEX idx_services_car_wash ON services(car_wash_id, activo);
CREATE INDEX idx_appointments_client ON appointments(client_id, fecha);
CREATE INDEX idx_appointments_car_wash ON appointments(car_wash_id, fecha);
CREATE INDEX idx_appointments_schedule ON appointments(car_wash_id, fecha, hora_inicio, hora_fin, estado);
CREATE INDEX idx_reviews_car_wash ON reviews(car_wash_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, leida);
CREATE INDEX idx_business_hours_car_wash ON business_hours(car_wash_id);

-- Trigger: update_timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_car_washes_timestamp BEFORE UPDATE ON car_washes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_timestamp BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: update_rating on review insert
CREATE OR REPLACE FUNCTION update_car_wash_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE car_washes SET
    rating_promedio = (SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0.0) FROM reviews WHERE car_wash_id = NEW.car_wash_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE car_wash_id = NEW.car_wash_id)
  WHERE id = NEW.car_wash_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_car_wash_rating();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_washes ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users
CREATE POLICY users_select_self ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_self ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: car_washes (public read, owner write)
CREATE POLICY car_washes_select ON car_washes FOR SELECT USING (true);
CREATE POLICY car_washes_insert ON car_washes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY car_washes_update ON car_washes FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY car_washes_delete ON car_washes FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies: services (public read, owner write)
CREATE POLICY services_select ON services FOR SELECT USING (true);
CREATE POLICY services_insert ON services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
CREATE POLICY services_update ON services FOR UPDATE
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
CREATE POLICY services_delete ON services FOR DELETE
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));

-- RLS Policies: business_hours (public read, owner write)
CREATE POLICY hours_select ON business_hours FOR SELECT USING (true);
CREATE POLICY hours_insert ON business_hours FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
CREATE POLICY hours_update ON business_hours FOR UPDATE
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));

-- RLS Policies: appointments
CREATE POLICY appointments_select_client ON appointments FOR SELECT
  USING (auth.uid() = client_id);
CREATE POLICY appointments_select_admin ON appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
CREATE POLICY appointments_insert_client ON appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY appointments_update_admin ON appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));

-- RLS Policies: reviews (public read, client write)
CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- RLS Policies: notifications (self only)
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: subscriptions (owner only)
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
```

- [ ] **Step 3: Create seed data**

File: `supabase/seed.sql`
```sql
-- NOTE: Seed data requires manually created auth users first.
-- Run this after creating test users via Supabase dashboard or auth API.
-- Replace UUIDs with actual auth.users IDs.

-- Example seed (update UUIDs after creating auth users):
-- INSERT INTO users (id, email, nombre, role) VALUES
--   ('uuid-admin-1', 'admin@test.com', 'Carlos Admin', 'wash_admin'),
--   ('uuid-client-1', 'cliente@test.com', 'Maria Cliente', 'client'),
--   ('uuid-super-1', 'super@splash.mx', 'Super Admin', 'super_admin');

-- INSERT INTO car_washes (id, owner_id, nombre, slug, direccion, latitud, longitud, verificado, subscription_status, trial_ends_at) VALUES
--   ('uuid-cw-1', 'uuid-admin-1', 'AutoSpa Premium', 'autospa-premium', 'Av. Reforma 222, CDMX', 19.4326, -99.1332, true, 'active', null);

-- INSERT INTO services (car_wash_id, nombre, precio, duracion_min, orden) VALUES
--   ('uuid-cw-1', 'Lavado Express', 99.00, 30, 1),
--   ('uuid-cw-1', 'Lavado Completo', 199.00, 60, 2),
--   ('uuid-cw-1', 'Detailing Premium', 499.00, 120, 3);

-- INSERT INTO business_hours (car_wash_id, dia_semana, hora_apertura, hora_cierre, cerrado) VALUES
--   ('uuid-cw-1', 0, '09:00', '14:00', false),
--   ('uuid-cw-1', 1, '08:00', '18:00', false),
--   ('uuid-cw-1', 2, '08:00', '18:00', false),
--   ('uuid-cw-1', 3, '08:00', '18:00', false),
--   ('uuid-cw-1', 4, '08:00', '18:00', false),
--   ('uuid-cw-1', 5, '08:00', '18:00', false),
--   ('uuid-cw-1', 6, '08:00', '15:00', false);
```

- [ ] **Step 4: Apply migration to Supabase**

Run:
```bash
npx supabase db push
```
Or apply via Supabase dashboard SQL editor by copying the migration file content.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with tables, RLS, triggers, and indexes"
```

---

### Task 4: Web — Supabase Client + Auth + Middleware

**Files:**
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/middleware.ts`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/app/(auth)/login/actions.ts`

- [ ] **Step 1: Install Supabase dependencies**

Run:
```bash
cd apps/web && npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create browser Supabase client**

File: `apps/web/src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create server Supabase client**

File: `apps/web/src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Create middleware Supabase helper**

File: `apps/web/src/lib/supabase/middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Get user role from our users table
  let userRole: string | null = null;
  let subscriptionStatus: string | null = null;

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = userData?.role ?? null;

    if (userRole === 'wash_admin') {
      const { data: cwData } = await supabase
        .from('car_washes')
        .select('subscription_status, trial_ends_at')
        .eq('owner_id', user.id)
        .single();
      subscriptionStatus = cwData?.subscription_status ?? null;

      // Check trial expiration
      if (subscriptionStatus === 'trial' && cwData?.trial_ends_at) {
        const trialEnd = new Date(cwData.trial_ends_at);
        if (trialEnd < new Date()) {
          subscriptionStatus = 'past_due';
        }
      }
    }
  }

  const path = request.nextUrl.pathname;

  // No session -> redirect to login (except login page itself)
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Logged in on login page -> redirect to dashboard
  if (user && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = userRole === 'super_admin' ? '/super/metricas' : '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // Client role trying to access admin -> block
  if (userRole === 'client' && (path.startsWith('/admin') || path.startsWith('/super'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // wash_admin trying to access super -> block
  if (userRole === 'wash_admin' && path.startsWith('/super')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // Subscription check for wash_admin
  if (userRole === 'wash_admin' && path.startsWith('/admin') && path !== '/admin/suscripcion') {
    if (subscriptionStatus === 'past_due' || subscriptionStatus === 'cancelled') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/suscripcion';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 5: Create Next.js middleware**

File: `apps/web/src/middleware.ts`
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 6: Create login server actions**

File: `apps/web/src/app/(auth)/login/actions.ts`
```typescript
'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { loginSchema } from '@splash/shared';

export async function loginAction(formData: FormData) {
  const supabase = await createServerSupabase();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Email o password incorrectos' };
  }

  redirect('/admin/dashboard');
}
```

- [ ] **Step 7: Create login page**

File: `apps/web/src/app/(auth)/login/page.tsx`
```tsx
'use client';

import { useState } from 'react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Splash</h1>
          <p className="text-sm text-muted-foreground">Panel de administracion</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-[4px] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-[4px] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[8px] bg-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/ apps/web/src/middleware.ts apps/web/src/app/\(auth\)/
git commit -m "feat: add Supabase auth, role-based middleware, and login page"
```

---

### Task 5: Web — Design System + Tailwind + Layout

**Files:**
- Create: `apps/web/tailwind.config.ts` (overwrite)
- Create: `apps/web/src/lib/utils.ts`
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/globals.css` (overwrite)
- Create: `apps/web/src/components/sidebar.tsx`
- Create: `apps/web/src/components/topbar.tsx`
- Create: `apps/web/src/app/(admin)/layout.tsx`

- [ ] **Step 1: Install shadcn/ui and Plus Jakarta Sans**

Run:
```bash
cd apps/web && npx shadcn@latest init -d
npm install @next/font
```

- [ ] **Step 2: Configure Tailwind with Splash design tokens**

File: `apps/web/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        primary: {
          DEFAULT: '#0284C7',
          light: '#0EA5E9',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#059669',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        border: '#E2E8F0',
        ring: '#0284C7',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#0F172A',
          foreground: '#FFFFFF',
          muted: '#1E293B',
          accent: '#0284C7',
        },
      },
      borderRadius: {
        input: '4px',
        card: '8px',
        modal: '12px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        modal: '0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

- [ ] **Step 3: Create globals.css**

File: `apps/web/src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Create utils**

File: `apps/web/src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Configure root layout with Plus Jakarta Sans**

File: `apps/web/src/app/layout.tsx`
```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Splash — Panel Admin',
  description: 'Gestiona tu autolavado con Splash',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Create Sidebar component**

File: `apps/web/src/components/sidebar.tsx`
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'grid' },
  { label: 'Citas', href: '/admin/citas', icon: 'calendar' },
  { label: 'Servicios', href: '/admin/servicios', icon: 'wrench' },
  { label: 'Reportes', href: '/admin/reportes', icon: 'chart' },
];

const iconMap: Record<string, React.ReactNode> = {
  grid: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  calendar: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
  wrench: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  chart: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="text-xl font-extrabold tracking-tight">Splash</span>
        <span className="text-xs font-semibold text-muted-foreground">Panel admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-semibold transition-colors duration-200',
                isActive
                  ? 'bg-sidebar-accent text-white'
                  : 'text-slate-400 hover:bg-sidebar-muted hover:text-white'
              )}
            >
              {iconMap[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-muted" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">Mi Autolavado</p>
            <p className="text-xs text-slate-400">Plan Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 7: Create Topbar component**

File: `apps/web/src/components/topbar.tsx`
```tsx
'use client';

import { usePathname } from 'next/navigation';

const titleMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/citas': 'Citas',
  '/admin/servicios': 'Servicios',
  '/admin/reportes': 'Reportes',
  '/admin/config': 'Configuracion',
};

export function Topbar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? 'Panel Admin';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <button
          className="relative rounded-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          aria-label="Notificaciones"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 8: Create Admin layout**

File: `apps/web/src/app/(admin)/layout.tsx`
```tsx
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create placeholder dashboard page**

File: `apps/web/src/app/(admin)/dashboard/page.tsx`
```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      <p className="text-muted-foreground">Bienvenido al panel de administracion de Splash.</p>
    </div>
  );
}
```

- [ ] **Step 10: Verify the dev server runs**

Run:
```bash
cd apps/web && npm run dev
```
Expected: Server starts on localhost:3000. Login page renders at /login. Admin layout visible at /admin/dashboard.

- [ ] **Step 11: Commit**

```bash
git add apps/web/
git commit -m "feat: add design system, Tailwind tokens, sidebar, topbar, and admin layout"
```

---

## Phase 2: Admin Panel (Web)

### Task 6: Dashboard Page — Metric Cards + Charts

**Files:**
- Create: `apps/web/src/components/metric-card.tsx`
- Create: `apps/web/src/app/(admin)/dashboard/page.tsx` (overwrite)

- [ ] **Step 1: Install chart library**

Run:
```bash
cd apps/web && npm install recharts
```

- [ ] **Step 2: Create MetricCard component**

File: `apps/web/src/components/metric-card.tsx`
```tsx
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="rounded-card bg-card p-6 shadow-card">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold',
              trend.positive ? 'text-accent' : 'text-destructive'
            )}
          >
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard page with real data queries**

File: `apps/web/src/app/(admin)/dashboard/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/metric-card';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get car wash for this admin
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, nombre, rating_promedio, total_reviews')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) return <p className="text-muted-foreground">No tienes un autolavado configurado.</p>;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Today's appointments
  const { count: citasHoy } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('car_wash_id', carWash.id)
    .eq('fecha', today)
    .neq('estado', 'cancelled');

  // Yesterday's appointments (for comparison)
  const { count: citasAyer } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('car_wash_id', carWash.id)
    .eq('fecha', yesterday)
    .neq('estado', 'cancelled');

  // Today's revenue
  const { data: revenueData } = await supabase
    .from('appointments')
    .select('precio_cobrado')
    .eq('car_wash_id', carWash.id)
    .eq('fecha', today)
    .eq('estado', 'completed');

  const ingresosHoy = revenueData?.reduce((sum, a) => sum + Number(a.precio_cobrado), 0) ?? 0;

  // Upcoming appointments
  const { data: proximas } = await supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, estado, precio_cobrado, estacion, users!client_id(nombre, avatar_url), services!service_id(nombre)')
    .eq('car_wash_id', carWash.id)
    .gte('fecha', today)
    .in('estado', ['confirmed', 'in_progress'])
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(10);

  const citaDiff = (citasHoy ?? 0) - (citasAyer ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Citas hoy"
          value={String(citasHoy ?? 0)}
          trend={citasAyer ? { value: `${citaDiff} vs ayer`, positive: citaDiff >= 0 } : undefined}
        />
        <MetricCard
          title="Ingresos hoy"
          value={`$${ingresosHoy.toLocaleString('es-MX')}`}
        />
        <MetricCard
          title="Calificacion"
          value={String(carWash.rating_promedio)}
          subtitle={`${carWash.total_reviews} resenas`}
        />
        <MetricCard
          title="Estatus"
          value="Activo"
          subtitle={carWash.nombre}
        />
      </div>

      {/* Upcoming appointments table */}
      <div className="rounded-card bg-card p-6 shadow-card">
        <h3 className="mb-4 text-sm font-bold text-foreground">Proximas citas</h3>
        {(!proximas || proximas.length === 0) ? (
          <p className="text-sm text-muted-foreground">No hay citas proximas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Servicio</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Hora</th>
                  <th className="pb-3 pr-4">Estacion</th>
                  <th className="pb-3 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proximas.map((cita: any) => (
                  <tr key={cita.id}>
                    <td className="py-3 pr-4 font-semibold">{(cita.users as any)?.nombre ?? 'Cliente'}</td>
                    <td className="py-3 pr-4">{(cita.services as any)?.nombre ?? '-'}</td>
                    <td className="py-3 pr-4">{cita.fecha}</td>
                    <td className="py-3 pr-4">{cita.hora_inicio}</td>
                    <td className="py-3 pr-4">{cita.estacion}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {cita.estado}
                      </span>
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

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add dashboard with metric cards and appointments table"
```

---

### Task 7: Citas Page — List View + Status Filters

**Files:**
- Create: `apps/web/src/components/appointments-table.tsx`
- Create: `apps/web/src/components/status-badge.tsx`
- Create: `apps/web/src/app/(admin)/citas/page.tsx`

- [ ] **Step 1: Create StatusBadge component**

File: `apps/web/src/components/status-badge.tsx`
```tsx
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@splash/shared';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-warning/10 text-warning',
  completed: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No show',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('rounded-pill px-2.5 py-0.5 text-xs font-semibold', statusStyles[status] ?? 'bg-muted text-muted-foreground')}>
      {statusLabels[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 2: Create Citas page with filter tabs**

File: `apps/web/src/app/(admin)/citas/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/status-badge';

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();
  if (!carWash) return null;

  let query = supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, hora_fin, estacion, estado, precio_cobrado, notas_cliente, users!client_id(nombre, avatar_url), services!service_id(nombre)')
    .eq('car_wash_id', carWash.id)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })
    .limit(50);

  if (params.estado && params.estado !== 'todas') {
    query = query.eq('estado', params.estado);
  }

  const { data: citas } = await query;

  const filters = [
    { label: 'Todas', value: 'todas' },
    { label: 'Confirmadas', value: 'confirmed' },
    { label: 'En progreso', value: 'in_progress' },
    { label: 'Completadas', value: 'completed' },
    { label: 'Canceladas', value: 'cancelled' },
  ];
  const activeFilter = params.estado ?? 'todas';

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <a
            key={f.value}
            href={`/admin/citas?estado=${f.value}`}
            className={`rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              activeFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-card bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estacion</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {citas?.map((cita: any) => (
                <tr key={cita.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <td className="px-4 py-3 font-semibold">{cita.hora_inicio}</td>
                  <td className="px-4 py-3">{(cita.users as any)?.nombre ?? '-'}</td>
                  <td className="px-4 py-3">{(cita.services as any)?.nombre ?? '-'}</td>
                  <td className="px-4 py-3">{cita.fecha}</td>
                  <td className="px-4 py-3">{cita.estacion}</td>
                  <td className="px-4 py-3">${Number(cita.precio_cobrado).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3"><StatusBadge status={cita.estado} /></td>
                </tr>
              ))}
              {(!citas || citas.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay citas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add citas page with status filters and appointments table"
```

---

### Task 8: Servicios Page — CRUD + Business Hours + Estaciones

**Files:**
- Create: `apps/web/src/app/(admin)/servicios/page.tsx`
- Create: `apps/web/src/app/(admin)/servicios/actions.ts`
- Create: `apps/web/src/components/services-list.tsx`
- Create: `apps/web/src/components/business-hours-table.tsx`

- [ ] **Step 1: Create server actions for services**

File: `apps/web/src/app/(admin)/servicios/actions.ts`
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { serviceSchema, businessHoursSchema } from '@splash/shared';

export async function createService(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: carWash } = await supabase
    .from('car_washes').select('id').eq('owner_id', user.id).single();
  if (!carWash) return { error: 'Sin autolavado' };

  const parsed = serviceSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion') || null,
    precio: Number(formData.get('precio')),
    duracion_min: Number(formData.get('duracion_min')),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.from('services').insert({
    car_wash_id: carWash.id,
    ...parsed.data,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/servicios');
  return { success: true };
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) return { error: error.message };
  revalidatePath('/admin/servicios');
  return { success: true };
}

export async function toggleService(serviceId: string, activo: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('services').update({ activo }).eq('id', serviceId);
  if (error) return { error: error.message };
  revalidatePath('/admin/servicios');
  return { success: true };
}

export async function updateBusinessHours(carWashId: string, hours: Array<{ dia_semana: number; hora_apertura: string; hora_cierre: string; cerrado: boolean }>) {
  const supabase = await createServerSupabase();

  // Delete existing and re-insert
  await supabase.from('business_hours').delete().eq('car_wash_id', carWashId);

  const { error } = await supabase.from('business_hours').insert(
    hours.map(h => ({ car_wash_id: carWashId, ...h }))
  );

  if (error) return { error: error.message };
  revalidatePath('/admin/servicios');
  return { success: true };
}

export async function updateEstaciones(numEstaciones: number) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  if (numEstaciones < 1) return { error: 'Minimo 1 estacion' };

  const { error } = await supabase
    .from('car_washes')
    .update({ num_estaciones: numEstaciones })
    .eq('owner_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/admin/servicios');
  return { success: true };
}
```

- [ ] **Step 2: Create Servicios page**

File: `apps/web/src/app/(admin)/servicios/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { createService, deleteService, toggleService } from './actions';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default async function ServiciosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, num_estaciones')
    .eq('owner_id', user.id)
    .single();
  if (!carWash) return null;

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('car_wash_id', carWash.id)
    .order('orden', { ascending: true });

  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('car_wash_id', carWash.id)
    .order('dia_semana', { ascending: true });

  return (
    <div className="space-y-8">
      {/* Services Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Servicios</h2>
        </div>

        {/* New service form */}
        <div className="rounded-card bg-card p-6 shadow-card">
          <h3 className="mb-4 text-sm font-bold text-foreground">Nuevo servicio</h3>
          <form action={createService} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input name="nombre" placeholder="Nombre del servicio" required
              className="rounded-input border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input name="precio" type="number" step="0.01" placeholder="Precio (MXN)" required
              className="rounded-input border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input name="duracion_min" type="number" placeholder="Duracion (min)" required
              className="rounded-input border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit"
              className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors duration-200">
              Agregar
            </button>
          </form>
        </div>

        {/* Services list */}
        <div className="rounded-card bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Duracion</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services?.map((s: any) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-semibold">{s.nombre}</td>
                  <td className="px-4 py-3">${Number(s.precio).toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3">{s.duracion_min} min</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${s.activo ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <form action={toggleService.bind(null, s.id, !s.activo)}>
                      <button className="text-xs text-primary hover:underline">
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                    <form action={deleteService.bind(null, s.id)}>
                      <button className="text-xs text-destructive hover:underline">Eliminar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Business Hours Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Horario de operacion</h2>
        <div className="rounded-card bg-card p-6 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Dia</th>
                <th className="pb-3 pr-4">Apertura</th>
                <th className="pb-3 pr-4">Cierre</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dayNames.map((day, i) => {
                const h = hours?.find((hr: any) => hr.dia_semana === i);
                return (
                  <tr key={i}>
                    <td className="py-3 pr-4 font-semibold">{day}</td>
                    <td className="py-3 pr-4">{h?.cerrado ? '-' : h?.hora_apertura ?? 'No configurado'}</td>
                    <td className="py-3 pr-4">{h?.cerrado ? '-' : h?.hora_cierre ?? 'No configurado'}</td>
                    <td className="py-3">
                      <span className={`text-xs font-semibold ${h?.cerrado ? 'text-destructive' : 'text-accent'}`}>
                        {h?.cerrado ? 'Cerrado' : h ? 'Abierto' : 'Sin configurar'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stations Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Estaciones de lavado</h2>
        <div className="rounded-card bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">
            Tu autolavado tiene <span className="font-bold text-foreground">{carWash.num_estaciones}</span> estacion(es) configurada(s).
          </p>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: carWash.num_estaciones }, (_, i) => (
              <div key={i} className="flex h-16 w-16 items-center justify-center rounded-card bg-accent/10 text-sm font-bold text-accent">
                E{i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add servicios page with CRUD, business hours, and stations"
```

---

### Task 9: Reportes Page

**Files:**
- Create: `apps/web/src/app/(admin)/reportes/page.tsx`
- Create: `apps/web/src/components/revenue-chart.tsx`
- Create: `apps/web/src/components/rating-summary.tsx`

- [ ] **Step 1: Create RevenueChart client component**

File: `apps/web/src/components/revenue-chart.tsx`
```tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{ label: string; ingresos: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString('es-MX')}`, 'Ingresos']}
            contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}
          />
          <Bar dataKey="ingresos" fill="#0284C7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create RatingSummary component**

File: `apps/web/src/components/rating-summary.tsx`
```tsx
interface RatingSummaryProps {
  promedio: number;
  total: number;
  distribution: Record<number, number>;
}

export function RatingSummary({ promedio, total, distribution }: RatingSummaryProps) {
  return (
    <div className="flex gap-8">
      <div className="text-center">
        <p className="text-5xl font-extrabold text-foreground">{promedio.toFixed(1)}</p>
        <div className="mt-1 flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill={star <= Math.round(promedio) ? '#F59E0B' : '#E2E8F0'} stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{total} resenas</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{star}</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Reportes page**

File: `apps/web/src/app/(admin)/reportes/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/metric-card';
import { RevenueChart } from '@/components/revenue-chart';
import { RatingSummary } from '@/components/rating-summary';

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const params = await searchParams;
  const periodo = params.periodo ?? 'mes';
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, rating_promedio, total_reviews')
    .eq('owner_id', user.id)
    .single();
  if (!carWash) return null;

  // Calculate date range
  const now = new Date();
  let startDate: string;
  if (periodo === 'hoy') startDate = now.toISOString().split('T')[0];
  else if (periodo === 'semana') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
  } else if (periodo === '6meses') {
    const d = new Date(now); d.setMonth(d.getMonth() - 6);
    startDate = d.toISOString().split('T')[0];
  } else if (periodo === 'ano') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
    startDate = d.toISOString().split('T')[0];
  } else {
    const d = new Date(now); d.setMonth(d.getMonth() - 1);
    startDate = d.toISOString().split('T')[0];
  }

  // Metrics
  const { data: completedAppts } = await supabase
    .from('appointments')
    .select('precio_cobrado, fecha')
    .eq('car_wash_id', carWash.id)
    .eq('estado', 'completed')
    .gte('fecha', startDate);

  const totalIngresos = completedAppts?.reduce((s, a) => s + Number(a.precio_cobrado), 0) ?? 0;
  const totalCitas = completedAppts?.length ?? 0;
  const ticketPromedio = totalCitas > 0 ? totalIngresos / totalCitas : 0;

  // Chart data — group by date
  const revenueByDate: Record<string, number> = {};
  completedAppts?.forEach((a: any) => {
    revenueByDate[a.fecha] = (revenueByDate[a.fecha] ?? 0) + Number(a.precio_cobrado);
  });
  const chartData = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ingresos]) => ({ label: date.slice(5), ingresos }));

  // Rating distribution
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('car_wash_id', carWash.id);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews?.forEach((r: any) => { distribution[r.rating] = (distribution[r.rating] ?? 0) + 1; });

  // Top services
  const { data: topServices } = await supabase
    .from('appointments')
    .select('services!service_id(nombre)')
    .eq('car_wash_id', carWash.id)
    .eq('estado', 'completed')
    .gte('fecha', startDate);

  const serviceCounts: Record<string, number> = {};
  topServices?.forEach((a: any) => {
    const name = (a.services as any)?.nombre ?? 'Otro';
    serviceCounts[name] = (serviceCounts[name] ?? 0) + 1;
  });
  const sortedServices = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a);
  const maxServiceCount = sortedServices[0]?.[1] ?? 1;

  const periodos = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Semana', value: 'semana' },
    { label: 'Mes', value: 'mes' },
    { label: '6 Meses', value: '6meses' },
    { label: 'Ano', value: 'ano' },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {periodos.map((p) => (
          <a key={p.value} href={`/admin/reportes?periodo=${p.value}`}
            className={`rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              periodo === p.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-border'
            }`}>
            {p.label}
          </a>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Ingresos totales" value={`$${totalIngresos.toLocaleString('es-MX')}`} />
        <MetricCard title="Total de citas" value={String(totalCitas)} />
        <MetricCard title="Ticket promedio" value={`$${ticketPromedio.toFixed(0)}`} />
      </div>

      {/* Revenue chart */}
      <div className="rounded-card bg-card p-6 shadow-card">
        <h3 className="mb-4 text-sm font-bold text-foreground">Ingresos</h3>
        {chartData.length > 0 ? (
          <RevenueChart data={chartData} />
        ) : (
          <p className="text-sm text-muted-foreground">Sin datos para este periodo.</p>
        )}
      </div>

      {/* Top services + Rating */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card bg-card p-6 shadow-card">
          <h3 className="mb-4 text-sm font-bold text-foreground">Servicios mas solicitados</h3>
          <div className="space-y-3">
            {sortedServices.map(([name, count]) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxServiceCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {sortedServices.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            )}
          </div>
        </div>

        <div className="rounded-card bg-card p-6 shadow-card">
          <h3 className="mb-4 text-sm font-bold text-foreground">Calificaciones</h3>
          <RatingSummary
            promedio={Number(carWash.rating_promedio)}
            total={carWash.total_reviews}
            distribution={distribution}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add reportes page with revenue chart, top services, and rating summary"
```

---

## Phase 3: API Routes (Availability + Appointments)

### Task 10: Availability API

**Files:**
- Create: `apps/web/src/app/api/availability/route.ts`

- [ ] **Step 1: Create availability endpoint**

File: `apps/web/src/app/api/availability/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { SLOT_DURATION_MIN } from '@splash/shared';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');
  const serviceId = searchParams.get('service_id');
  const fecha = searchParams.get('fecha');

  if (!carWashId || !serviceId || !fecha) {
    return NextResponse.json({ error: 'Parametros requeridos: car_wash_id, service_id, fecha' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Get service duration
  const { data: service } = await supabase
    .from('services')
    .select('duracion_min')
    .eq('id', serviceId)
    .single();

  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }

  // Get car wash stations
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('num_estaciones')
    .eq('id', carWashId)
    .single();

  if (!carWash) {
    return NextResponse.json({ error: 'Autolavado no encontrado' }, { status: 404 });
  }

  // Get business hours for this day of week
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();
  const { data: hours } = await supabase
    .from('business_hours')
    .select('hora_apertura, hora_cierre, cerrado')
    .eq('car_wash_id', carWashId)
    .eq('dia_semana', dayOfWeek)
    .single();

  if (!hours || hours.cerrado) {
    return NextResponse.json({ slots: [], closed: true });
  }

  // Get existing appointments for this date
  const { data: appointments } = await supabase
    .from('appointments')
    .select('hora_inicio, hora_fin, estacion')
    .eq('car_wash_id', carWashId)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelled","no_show")');

  // Generate time slots
  const slots: Array<{ time: string; available: boolean; estaciones_libres: number }> = [];
  const [openH, openM] = hours.hora_apertura.split(':').map(Number);
  const [closeH, closeM] = hours.hora_cierre.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  for (let t = openMinutes; t + service.duracion_min <= closeMinutes; t += SLOT_DURATION_MIN) {
    const slotStart = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    const slotEndMin = t + service.duracion_min;
    const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;

    // Count overlapping appointments
    const overlapping = (appointments ?? []).filter((a: any) =>
      a.hora_inicio < slotEnd && a.hora_fin > slotStart
    ).length;

    const estacionesLibres = carWash.num_estaciones - overlapping;

    slots.push({
      time: slotStart,
      available: estacionesLibres > 0,
      estaciones_libres: Math.max(0, estacionesLibres),
    });
  }

  return NextResponse.json({ slots, closed: false });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/api/
git commit -m "feat: add availability API with slot generation and overlap detection"
```

---

### Task 11: Appointments API (Create + Cancel)

**Files:**
- Create: `apps/web/src/app/api/appointments/route.ts`
- Create: `apps/web/src/app/api/appointments/[id]/cancel/route.ts`

- [ ] **Step 1: Create appointment creation endpoint**

File: `apps/web/src/app/api/appointments/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAppointmentSchema } from '@splash/shared';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { car_wash_id, service_id, fecha, hora_inicio, notas_cliente } = parsed.data;

  // Get service details
  const { data: service } = await supabase
    .from('services')
    .select('duracion_min, precio, activo')
    .eq('id', service_id)
    .single();

  if (!service || !service.activo) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 400 });
  }

  // Calculate hora_fin
  const [h, m] = hora_inicio.split(':').map(Number);
  const endMinutes = h * 60 + m + service.duracion_min;
  const hora_fin = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  // Get car wash stations count
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('num_estaciones, activo, verificado, subscription_status')
    .eq('id', car_wash_id)
    .single();

  if (!carWash || !carWash.activo || !carWash.verificado) {
    return NextResponse.json({ error: 'Autolavado no disponible' }, { status: 400 });
  }

  if (!['trial', 'active'].includes(carWash.subscription_status)) {
    return NextResponse.json({ error: 'Autolavado no disponible' }, { status: 400 });
  }

  // Find available station (check overlapping appointments)
  const { data: busyStations } = await supabase
    .from('appointments')
    .select('estacion')
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelled","no_show")')
    .lt('hora_inicio', hora_fin)
    .gt('hora_fin', hora_inicio);

  const busySet = new Set((busyStations ?? []).map((a: any) => a.estacion));
  let assignedStation: number | null = null;

  for (let i = 1; i <= carWash.num_estaciones; i++) {
    if (!busySet.has(i)) {
      assignedStation = i;
      break;
    }
  }

  if (assignedStation === null) {
    return NextResponse.json({ error: 'Horario ya no disponible. Selecciona otro horario.' }, { status: 409 });
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      car_wash_id,
      service_id,
      estacion: assignedStation,
      fecha,
      hora_inicio,
      hora_fin,
      precio_cobrado: service.precio,
      notas_cliente: notas_cliente ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 });
  }

  // Create confirmation notifications (for client and admin)
  const { data: cwOwner } = await supabase
    .from('car_washes')
    .select('owner_id, nombre')
    .eq('id', car_wash_id)
    .single();

  const notifTitle = `Cita confirmada para ${fecha} a las ${hora_inicio}`;
  const notifMessage = `Servicio en ${cwOwner?.nombre ?? 'autolavado'} el ${fecha} a las ${hora_inicio}. Pago en sitio.`;

  await supabase.from('notifications').insert([
    { user_id: user.id, appointment_id: appointment.id, tipo: 'confirmation', titulo: notifTitle, mensaje: notifMessage },
    { user_id: cwOwner!.owner_id, appointment_id: appointment.id, tipo: 'confirmation', titulo: `Nueva cita: ${fecha} ${hora_inicio}`, mensaje: `Un cliente agendo una cita para ${fecha} a las ${hora_inicio}.` },
  ]);

  return NextResponse.json({ appointment }, { status: 201 });
}
```

- [ ] **Step 2: Create cancel appointment endpoint**

File: `apps/web/src/app/api/appointments/[id]/cancel/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CANCELLATION_HOURS_LIMIT } from '@splash/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const motivo = body.motivo_cancelacion;

  // Get appointment
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, client_id, car_wash_id, fecha, hora_inicio, estado')
    .eq('id', id)
    .single();

  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (appointment.estado !== 'confirmed') {
    return NextResponse.json({ error: 'Solo se pueden cancelar citas confirmadas' }, { status: 400 });
  }

  const isClient = user.id === appointment.client_id;

  // Check if client is canceling with enough time
  if (isClient) {
    const appointmentTime = new Date(`${appointment.fecha}T${appointment.hora_inicio}`);
    const now = new Date();
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < CANCELLATION_HOURS_LIMIT) {
      return NextResponse.json({
        error: `Solo puedes cancelar con ${CANCELLATION_HOURS_LIMIT}+ horas de anticipacion`
      }, { status: 400 });
    }
  }

  // Cancel
  const { error } = await supabase
    .from('appointments')
    .update({
      estado: 'cancelled',
      cancelado_por: user.id,
      motivo_cancelacion: motivo || null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Error al cancelar' }, { status: 500 });
  }

  // Notify the other party
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('owner_id, nombre')
    .eq('id', appointment.car_wash_id)
    .single();

  const notifyUserId = isClient ? carWash!.owner_id : appointment.client_id;
  const cancellerName = isClient ? 'El cliente' : carWash?.nombre;

  await supabase.from('notifications').insert({
    user_id: notifyUserId,
    appointment_id: id,
    tipo: 'cancellation',
    titulo: `Cita cancelada: ${appointment.fecha} ${appointment.hora_inicio}`,
    mensaje: `${cancellerName} cancelo la cita del ${appointment.fecha} a las ${appointment.hora_inicio}.`,
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/
git commit -m "feat: add appointment creation and cancellation API routes"
```

---

## Phase 4: Mobile App (React Native / Expo)

### Task 12: Mobile — Theme + Supabase + Navigation Setup

**Files:**
- Create: `apps/mobile/src/theme/index.ts`
- Create: `apps/mobile/src/services/supabase.ts`
- Create: `apps/mobile/src/hooks/useAuth.ts`
- Create: `apps/mobile/src/navigation/index.tsx`
- Create: `apps/mobile/src/navigation/AuthStack.tsx`
- Create: `apps/mobile/src/navigation/MainTabs.tsx`
- Modify: `apps/mobile/App.tsx`

- [ ] **Step 1: Install mobile dependencies**

Run:
```bash
cd apps/mobile && npx expo install @supabase/supabase-js @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @expo-google-fonts/plus-jakarta-sans expo-font expo-secure-store react-native-url-polyfill
```

- [ ] **Step 2: Create theme tokens**

File: `apps/mobile/src/theme/index.ts`
```typescript
export const colors = {
  primary: '#0284C7',
  primaryLight: '#0EA5E9',
  accent: '#059669',
  background: '#F8FAFC',
  foreground: '#0F172A',
  card: '#FFFFFF',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
  destructive: '#DC2626',
  ring: '#0284C7',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  input: 4,
  card: 8,
  modal: 12,
  pill: 999,
};

export const typography = {
  display: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, lineHeight: 26 },
  subheading: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 22 },
  body: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 16 },
  button: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, letterSpacing: 0.5 },
} as const;
```

- [ ] **Step 3: Create Supabase client for React Native**

File: `apps/mobile/src/services/supabase.ts`
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Create useAuth hook**

File: `apps/mobile/src/hooks/useAuth.ts`
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@splash/shared';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    setUser(data as User | null);
    setLoading(false);
  }

  return { session, user, loading };
}
```

- [ ] **Step 5: Create AuthStack navigator**

File: `apps/mobile/src/navigation/AuthStack.tsx`
```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 6: Create MainTabs navigator**

File: `apps/mobile/src/navigation/MainTabs.tsx`
```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WashProfileScreen from '../screens/WashProfileScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import RatingScreen from '../screens/RatingScreen';
import { colors } from '../theme';

export type MainStackParamList = {
  HomeTabs: undefined;
  WashProfile: { carWashId: string };
  Schedule: { carWashId: string; serviceId: string; serviceName: string; precio: number; duracionMin: number };
  Confirmation: { appointmentId: string };
  Rating: { appointmentId: string; carWashName: string; serviceName: string; fecha: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MainStackParamList>();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.white },
        tabBarLabelStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Citas" component={AppointmentsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="WashProfile" component={WashProfileScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 7: Create root navigator**

File: `apps/mobile/src/navigation/index.tsx`
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainStack from './MainTabs';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme';

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

- [ ] **Step 8: Update App.tsx entry point**

File: `apps/mobile/App.tsx`
```typescript
import { useCallback } from 'react';
import { View } from 'react-native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <RootNavigator />
    </View>
  );
}
```

- [ ] **Step 9: Create placeholder screens** (LoginScreen, RegisterScreen, HomeScreen, AppointmentsScreen, ProfileScreen, WashProfileScreen, ScheduleScreen, ConfirmationScreen, RatingScreen)

Create each with a minimal placeholder:

File: `apps/mobile/src/screens/LoginScreen.tsx`
```typescript
import { View, Text } from 'react-native';
export default function LoginScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Login</Text></View>;
}
```

(Repeat the same pattern for all 8 remaining screens, changing the component name and text.)

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/
git commit -m "feat: add mobile theme, Supabase client, auth hook, and navigation structure"
```

---

### Task 13: Mobile — Login/Register Screens

**Files:**
- Modify: `apps/mobile/src/screens/LoginScreen.tsx`
- Modify: `apps/mobile/src/screens/RegisterScreen.tsx`

- [ ] **Step 1: Implement LoginScreen**

File: `apps/mobile/src/screens/LoginScreen.tsx`
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthStack';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, typography } from '../theme';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Email o password incorrectos');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Splash</Text>
          <Text style={styles.subtitle}>Encuentra tu autolavado</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'INICIAR SESION'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>No tienes cuenta? <Text style={styles.linkBold}>Registrate</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { ...typography.display, color: colors.primary, fontSize: 36 },
  subtitle: { ...typography.body, color: colors.mutedForeground, marginTop: spacing.xs },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    color: colors.foreground,
  },
  error: { ...typography.caption, color: colors.destructive },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { ...typography.button, color: colors.white, textTransform: 'uppercase' },
  link: { alignItems: 'center', marginTop: spacing.md },
  linkText: { ...typography.body, color: colors.mutedForeground },
  linkBold: { color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
```

- [ ] **Step 2: Implement RegisterScreen**

File: `apps/mobile/src/screens/RegisterScreen.tsx`
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, typography } from '../theme';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (nombre.length < 2) { setError('Nombre muy corto'); return; }
    if (password.length < 8) { setError('Password: minimo 8 caracteres'); return; }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create user profile
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        nombre,
        role: 'client',
      });
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Splash</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor={colors.mutedForeground}
            value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.mutedForeground}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password (min. 8 caracteres)" placeholderTextColor={colors.mutedForeground}
            value={password} onChangeText={setPassword} secureTextEntry />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{loading ? 'Creando cuenta...' : 'REGISTRARSE'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
            <Text style={styles.linkText}>Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesion</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { ...typography.display, color: colors.primary, fontSize: 36 },
  subtitle: { ...typography.body, color: colors.mutedForeground, marginTop: spacing.xs },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    ...typography.body, color: colors.foreground,
  },
  error: { ...typography.caption, color: colors.destructive },
  button: { backgroundColor: colors.primary, borderRadius: radius.card, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { ...typography.button, color: colors.white, textTransform: 'uppercase' },
  link: { alignItems: 'center', marginTop: spacing.md },
  linkText: { ...typography.body, color: colors.mutedForeground },
  linkBold: { color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/screens/
git commit -m "feat: add login and register screens with Supabase auth"
```

---

### Task 14: Mobile — HomeScreen (Map + Car Wash List)

This is the core screen. Placeholder for Google Maps — use a list-first approach that can be enhanced with maps later.

**Files:**
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`
- Create: `apps/mobile/src/components/WashCard.tsx`
- Create: `apps/mobile/src/services/carWashes.ts`

- [ ] **Step 1: Create car washes service**

File: `apps/mobile/src/services/carWashes.ts`
```typescript
import { supabase } from './supabase';
import type { CarWash, Service } from '@splash/shared';

export async function fetchNearbyCarWashes(): Promise<CarWash[]> {
  const { data, error } = await supabase
    .from('car_washes')
    .select('*')
    .eq('activo', true)
    .eq('verificado', true)
    .in('subscription_status', ['trial', 'active'])
    .order('rating_promedio', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as CarWash[];
}

export async function fetchCarWashWithServices(id: string) {
  const { data: carWash } = await supabase
    .from('car_washes')
    .select('*')
    .eq('id', id)
    .single();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('car_wash_id', id)
    .eq('activo', true)
    .order('orden', { ascending: true });

  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('car_wash_id', id)
    .order('dia_semana', { ascending: true });

  return {
    carWash: carWash as CarWash | null,
    services: (services ?? []) as Service[],
    hours: hours ?? [],
  };
}
```

- [ ] **Step 2: Create WashCard component**

File: `apps/mobile/src/components/WashCard.tsx`
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CarWash } from '@splash/shared';
import { colors, spacing, radius, typography } from '../theme';

interface WashCardProps {
  carWash: CarWash;
  onPress: () => void;
}

export function WashCard({ carWash, onPress }: WashCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.logoPlaceholder}>
        <Text style={styles.logoText}>{carWash.nombre.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{carWash.nombre}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.rating}>{carWash.rating_promedio.toFixed(1)}</Text>
          <Text style={styles.reviews}>({carWash.total_reviews})</Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>{carWash.direccion}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  logoPlaceholder: {
    width: 48, height: 48, borderRadius: radius.card,
    backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { ...typography.heading, color: colors.primary },
  info: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  name: { ...typography.subheading, color: colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  star: { color: colors.warning, fontSize: 14 },
  rating: { ...typography.caption, color: colors.foreground, fontFamily: 'PlusJakartaSans_600SemiBold', marginLeft: 2 },
  reviews: { ...typography.caption, color: colors.mutedForeground, marginLeft: 4 },
  address: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
});
```

- [ ] **Step 3: Implement HomeScreen**

File: `apps/mobile/src/screens/HomeScreen.tsx`
```typescript
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainTabs';
import type { CarWash } from '@splash/shared';
import { fetchNearbyCarWashes } from '../services/carWashes';
import { WashCard } from '../components/WashCard';
import { colors, spacing, radius, typography } from '../theme';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [carWashes, setCarWashes] = useState<CarWash[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchNearbyCarWashes()
      .then(setCarWashes)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? carWashes.filter(cw => cw.nombre.toLowerCase().includes(search.toLowerCase()))
    : carWashes;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Cerca de ti</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar autolavado..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WashCard
              carWash={item}
              onPress={() => navigation.navigate('WashProfile', { carWashId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron autolavados.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  greeting: { ...typography.display, color: colors.foreground },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: 12,
    ...typography.body, color: colors.foreground,
  },
  list: { paddingHorizontal: spacing.lg },
  empty: { ...typography.body, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl },
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/
git commit -m "feat: add HomeScreen with car wash list and search"
```

---

### Task 15: Mobile — WashProfile + ScheduleScreen + ConfirmationScreen

**Files:**
- Modify: `apps/mobile/src/screens/WashProfileScreen.tsx`
- Modify: `apps/mobile/src/screens/ScheduleScreen.tsx`
- Modify: `apps/mobile/src/screens/ConfirmationScreen.tsx`
- Create: `apps/mobile/src/components/ServiceCard.tsx`
- Create: `apps/mobile/src/components/TimeSlotGrid.tsx`
- Create: `apps/mobile/src/services/appointments.ts`

This is the core 3-tap booking flow. Due to plan size, the full code for these screens follows the same pattern as previous screens. Key implementation points:

- [ ] **Step 1: Create appointments service**

File: `apps/mobile/src/services/appointments.ts`
```typescript
import { supabase } from './supabase';
import type { TimeSlot } from '@splash/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchAvailability(carWashId: string, serviceId: string, fecha: string): Promise<TimeSlot[]> {
  const res = await fetch(`${API_URL}/api/availability?car_wash_id=${carWashId}&service_id=${serviceId}&fecha=${fecha}`);
  const data = await res.json();
  return data.slots ?? [];
}

export async function createAppointment(input: {
  car_wash_id: string;
  service_id: string;
  fecha: string;
  hora_inicio: string;
  notas_cliente?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No autorizado');

  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Error al crear la cita');
  }

  return res.json();
}

export async function fetchMyAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, car_washes!car_wash_id(nombre, logo_url), services!service_id(nombre)')
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function cancelAppointment(id: string, motivo: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No autorizado');

  const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ motivo_cancelacion: motivo }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Error al cancelar');
  }
}
```

- [ ] **Step 2: Create ServiceCard component**

File: `apps/mobile/src/components/ServiceCard.tsx`
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Service } from '@splash/shared';
import { colors, spacing, radius, typography } from '../theme';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name}>{service.nombre}</Text>
        {service.descripcion && <Text style={styles.desc} numberOfLines={2}>{service.descripcion}</Text>}
        <Text style={styles.duration}>{service.duracion_min} min</Text>
      </View>
      <Text style={styles.price}>${service.precio.toLocaleString('es-MX')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.card,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  info: { flex: 1, marginRight: spacing.md },
  name: { ...typography.subheading, color: colors.foreground },
  desc: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
  duration: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  price: { ...typography.heading, color: colors.primary },
});
```

- [ ] **Step 3: Create TimeSlotGrid component**

File: `apps/mobile/src/components/TimeSlotGrid.tsx`
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TimeSlot } from '@splash/shared';
import { colors, spacing, radius, typography } from '../theme';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, selected, onSelect }: TimeSlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => (
        <TouchableOpacity
          key={slot.time}
          style={[
            styles.slot,
            slot.available ? styles.available : styles.unavailable,
            selected === slot.time && styles.selected,
          ]}
          onPress={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.slotText,
            !slot.available && styles.unavailableText,
            selected === slot.time && styles.selectedText,
          ]}>
            {slot.time}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radius.card, borderWidth: 1,
    minWidth: 72, alignItems: 'center',
  },
  available: { borderColor: colors.border, backgroundColor: colors.card },
  unavailable: { borderColor: colors.border, backgroundColor: colors.muted, opacity: 0.5 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary },
  slotText: { ...typography.body, color: colors.foreground, fontFamily: 'PlusJakartaSans_600SemiBold' },
  unavailableText: { color: colors.mutedForeground, textDecorationLine: 'line-through' },
  selectedText: { color: colors.white },
});
```

- [ ] **Step 4: Implement WashProfileScreen, ScheduleScreen, and ConfirmationScreen**

These follow the spec from sections 8.3, 8.4, and 8.5. Each screen uses the components and services created above. Implementation pattern is the same as HomeScreen — fetch data with useEffect, render with FlatList/ScrollView, navigate with `navigation.navigate()`.

Key navigation flow:
- WashProfileScreen: shows car wash details + services list. Tap service -> `navigation.navigate('Schedule', { carWashId, serviceId, serviceName, precio, duracionMin })`
- ScheduleScreen: date picker (horizontal ScrollView of next 7 days) + TimeSlotGrid. Tap confirm -> calls `createAppointment` -> `navigation.navigate('Confirmation', { appointmentId })`
- ConfirmationScreen: green check animation + summary card + "Ir a mis citas" button

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/
git commit -m "feat: add booking flow — WashProfile, Schedule, and Confirmation screens"
```

---

### Task 16: Mobile — AppointmentsScreen + RatingScreen

**Files:**
- Modify: `apps/mobile/src/screens/AppointmentsScreen.tsx`
- Modify: `apps/mobile/src/screens/RatingScreen.tsx`
- Create: `apps/mobile/src/components/AppointmentCard.tsx`
- Create: `apps/mobile/src/components/StarRating.tsx`
- Create: `apps/mobile/src/services/reviews.ts`

- [ ] **Step 1: Create reviews service**

File: `apps/mobile/src/services/reviews.ts`
```typescript
import { supabase } from './supabase';

export async function submitReview(input: {
  appointment_id: string;
  rating: number;
  comentario?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data: appointment } = await supabase
    .from('appointments')
    .select('car_wash_id')
    .eq('id', input.appointment_id)
    .single();

  if (!appointment) throw new Error('Cita no encontrada');

  const { error } = await supabase.from('reviews').insert({
    appointment_id: input.appointment_id,
    client_id: user.id,
    car_wash_id: appointment.car_wash_id,
    rating: input.rating,
    comentario: input.comentario ?? null,
  });

  if (error) {
    if (error.code === '23505') throw new Error('Ya calificaste este servicio');
    throw error;
  }
}
```

- [ ] **Step 2: Create StarRating component**

File: `apps/mobile/src/components/StarRating.tsx`
```typescript
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

interface StarRatingProps {
  rating: number;
  onRate: (value: number) => void;
}

export function StarRating({ rating, onRate }: StarRatingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && <Text style={styles.label}>{labels[rating]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm },
  star: { fontSize: 40, color: colors.border },
  starActive: { color: colors.warning },
  label: { ...typography.subheading, color: colors.foreground },
});
```

- [ ] **Step 3: Create AppointmentCard component**

File: `apps/mobile/src/components/AppointmentCard.tsx`
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

const statusColors: Record<string, string> = {
  confirmed: colors.primary,
  in_progress: colors.warning,
  completed: colors.accent,
  cancelled: colors.destructive,
  no_show: colors.mutedForeground,
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No show',
};

interface AppointmentCardProps {
  appointment: any;
  onRate?: () => void;
  onCancel?: () => void;
}

export function AppointmentCard({ appointment, onRate, onCancel }: AppointmentCardProps) {
  const statusColor = statusColors[appointment.estado] ?? colors.mutedForeground;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{appointment.car_washes?.nombre ?? 'Autolavado'}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '1A' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {statusLabels[appointment.estado] ?? appointment.estado}
          </Text>
        </View>
      </View>
      <Text style={styles.service}>{appointment.services?.nombre ?? '-'}</Text>
      <Text style={styles.details}>{appointment.fecha} · {appointment.hora_inicio} · ${Number(appointment.precio_cobrado).toLocaleString('es-MX')}</Text>

      {appointment.estado === 'completed' && onRate && (
        <TouchableOpacity style={styles.rateButton} onPress={onRate} activeOpacity={0.8}>
          <Text style={styles.rateButtonText}>Calificar servicio</Text>
        </TouchableOpacity>
      )}
      {appointment.estado === 'confirmed' && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancelar cita</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.md,
    marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.subheading, color: colors.foreground },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { ...typography.caption, fontFamily: 'PlusJakartaSans_600SemiBold' },
  service: { ...typography.body, color: colors.foreground, marginTop: 4 },
  details: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  rateButton: {
    marginTop: spacing.md, backgroundColor: colors.warning, borderRadius: radius.card,
    paddingVertical: 10, alignItems: 'center',
  },
  rateButtonText: { ...typography.button, color: colors.white },
  cancelButton: {
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.destructive, borderRadius: radius.card,
    paddingVertical: 10, alignItems: 'center',
  },
  cancelButtonText: { ...typography.button, color: colors.destructive },
});
```

- [ ] **Step 4: Implement AppointmentsScreen and RatingScreen following same patterns**

AppointmentsScreen uses `fetchMyAppointments()` + FlatList of AppointmentCard.
RatingScreen uses StarRating component + TextInput for comment + submit button calling `submitReview()`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/
git commit -m "feat: add appointments list, rating screen, and review submission"
```

---

### Task 17: Mobile — ProfileScreen

**Files:**
- Modify: `apps/mobile/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Implement ProfileScreen with logout**

File: `apps/mobile/src/screens/ProfileScreen.tsx`
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { colors, spacing, radius, typography } from '../theme';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nombre?.charAt(0) ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.nombre ?? 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={styles.menu}>
        {['Editar perfil', 'Notificaciones', 'Seguridad'].map((item) => (
          <TouchableOpacity key={item} style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuText}>{item}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => supabase.auth.signOut()}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.display, color: colors.white },
  name: { ...typography.heading, color: colors.foreground, marginTop: spacing.md },
  email: { ...typography.body, color: colors.mutedForeground, marginTop: spacing.xs },
  menu: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.card,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  menuText: { ...typography.subheading, color: colors.foreground },
  chevron: { fontSize: 20, color: colors.mutedForeground },
  logoutButton: {
    marginHorizontal: spacing.lg, marginTop: spacing.xl,
    backgroundColor: colors.destructive, borderRadius: radius.card,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { ...typography.button, color: colors.white },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/screens/ProfileScreen.tsx
git commit -m "feat: add profile screen with user info and logout"
```

---

## Phase 5: Stripe Webhook + Super Admin

### Task 18: Stripe Webhook

**Files:**
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Install Stripe**

Run:
```bash
cd apps/web && npm install stripe
```

- [ ] **Step 2: Create Stripe webhook handler**

File: `apps/web/src/app/api/webhooks/stripe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const carWashId = session.metadata?.car_wash_id;
      const plan = session.metadata?.plan;
      if (!carWashId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await supabase.from('subscriptions').upsert({
        car_wash_id: carWashId,
        stripe_subscription_id: subscription.id,
        plan: plan ?? 'basico',
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' });

      await supabase.from('car_washes').update({
        subscription_status: 'active',
        subscription_plan: plan,
        stripe_customer_id: session.customer as string,
      }).eq('id', carWashId);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;

      await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', subId);

      const { data: sub } = await supabase.from('subscriptions').select('car_wash_id').eq('stripe_subscription_id', subId).single();
      if (sub) {
        await supabase.from('car_washes').update({ subscription_status: 'past_due' }).eq('id', sub.car_wash_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase.from('subscriptions').update({
        status: 'cancelled',
        cancel_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', subscription.id);

      const { data: sub } = await supabase.from('subscriptions').select('car_wash_id').eq('stripe_subscription_id', subscription.id).single();
      if (sub) {
        await supabase.from('car_washes').update({ subscription_status: 'cancelled' }).eq('id', sub.car_wash_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/webhooks/
git commit -m "feat: add Stripe webhook handler for subscription lifecycle"
```

---

### Task 19: Super Admin Pages

**Files:**
- Create: `apps/web/src/app/(super)/layout.tsx`
- Create: `apps/web/src/app/(super)/negocios/page.tsx`
- Create: `apps/web/src/app/(super)/metricas/page.tsx`

- [ ] **Step 1: Create super admin layout**

File: `apps/web/src/app/(super)/layout.tsx`
```tsx
import { Topbar } from '@/components/topbar';

const superNavItems = [
  { label: 'Negocios', href: '/super/negocios' },
  { label: 'Metricas', href: '/super/metricas' },
];

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border bg-foreground px-6">
        <div className="flex items-center gap-6">
          <span className="text-xl font-extrabold text-white">Splash <span className="text-xs font-semibold text-primary-light">Super Admin</span></span>
          <nav className="flex gap-4">
            {superNavItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors duration-200">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create Negocios (businesses) page**

File: `apps/web/src/app/(super)/negocios/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/status-badge';

export default async function NegociosPage() {
  const supabase = await createServerSupabase();

  const { data: carWashes } = await supabase
    .from('car_washes')
    .select('id, nombre, slug, direccion, verificado, activo, subscription_status, subscription_plan, rating_promedio, total_reviews, num_estaciones, created_at, users!owner_id(nombre, email)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Negocios ({carWashes?.length ?? 0})</h2>

      <div className="rounded-card bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Autolavado</th>
              <th className="px-4 py-3">Dueno</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estatus</th>
              <th className="px-4 py-3">Verificado</th>
              <th className="px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {carWashes?.map((cw: any) => (
              <tr key={cw.id} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-4 py-3 font-semibold">{cw.nombre}</td>
                <td className="px-4 py-3">{(cw.users as any)?.email ?? '-'}</td>
                <td className="px-4 py-3">{cw.subscription_plan ?? 'Trial'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${
                    cw.subscription_status === 'active' ? 'bg-accent/10 text-accent' :
                    cw.subscription_status === 'trial' ? 'bg-primary/10 text-primary' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {cw.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${cw.verificado ? 'text-accent' : 'text-warning'}`}>
                    {cw.verificado ? 'Si' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">{cw.rating_promedio} ({cw.total_reviews})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Metricas page**

File: `apps/web/src/app/(super)/metricas/page.tsx`
```tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/metric-card';

export default async function MetricasPage() {
  const supabase = await createServerSupabase();

  const { count: totalNegocios } = await supabase
    .from('car_washes').select('*', { count: 'exact', head: true }).eq('activo', true);

  const { count: negociosActivos } = await supabase
    .from('car_washes').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trial']);

  const { data: allCompleted } = await supabase
    .from('appointments').select('precio_cobrado').eq('estado', 'completed');
  const gmv = allCompleted?.reduce((s, a) => s + Number(a.precio_cobrado), 0) ?? 0;

  const { data: activeSubs } = await supabase
    .from('subscriptions').select('plan').eq('status', 'active');
  // Simplified MRR calculation
  const planPrices: Record<string, number> = { basico: 499, pro: 999, premium: 1999 };
  const mrr = activeSubs?.reduce((s, sub) => s + (planPrices[sub.plan] ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Metricas Globales</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total negocios" value={String(totalNegocios ?? 0)} />
        <MetricCard title="Negocios activos" value={String(negociosActivos ?? 0)} />
        <MetricCard title="GMV total" value={`$${gmv.toLocaleString('es-MX')}`} />
        <MetricCard title="MRR" value={`$${mrr.toLocaleString('es-MX')}`} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(super\)/
git commit -m "feat: add super admin pages — negocios list and global metrics"
```

---

## Phase 6: Final Integration

### Task 20: Verify Full Build + Final Commit

- [ ] **Step 1: Install all dependencies**

Run:
```bash
cd /path/to/splash && npm install
```

- [ ] **Step 2: Type check all packages**

Run:
```bash
npx turbo type-check
```
Expected: no TypeScript errors across all workspaces.

- [ ] **Step 3: Build web app**

Run:
```bash
npx turbo build --filter=@splash/web
```
Expected: successful Next.js build.

- [ ] **Step 4: Verify mobile app starts**

Run:
```bash
cd apps/mobile && npx expo start
```
Expected: Expo dev server starts. App loads on simulator/device.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify full build and type check across all workspaces"
```

---

## Summary

| Phase | Tasks | What it builds |
|-------|-------|---------------|
| 1: Foundation | 1-5 | Monorepo, types, DB schema, auth, design system |
| 2: Admin Panel | 6-9 | Dashboard, citas, servicios, reportes |
| 3: API Routes | 10-11 | Availability algorithm, appointment CRUD |
| 4: Mobile App | 12-17 | Navigation, auth, home, booking flow, ratings, profile |
| 5: Stripe + Super | 18-19 | Webhook handler, super admin pages |
| 6: Integration | 20 | Full build verification |
