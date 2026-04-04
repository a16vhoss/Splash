# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Splash** is a multi-platform SaaS for car wash booking (autolavados). It serves three user roles: `client` (books washes), `wash_admin` (manages a car wash business), and `super_admin` (platform admin). The domain language is Spanish — database columns, UI labels, and route names use Spanish terms.

## Monorepo Structure

Turborepo workspaces with three packages:

- **apps/web** — Next.js 14 App Router (main product). Admin panel, client booking, public landing/listing pages.
- **apps/mobile** — Expo React Native (secondary, not yet production). Mirrors web features.
- **packages/shared** — Zod schemas, TypeScript types, and constants shared across apps.

## Common Commands

```bash
# Development
npm run dev:web          # Start Next.js dev server (port 3000)
npm run dev:mobile       # Start Expo dev server
npm run dev              # Start all workspaces

# Build & checks
npm run build            # Build all workspaces (turbo)
npm run lint             # Lint all workspaces
npm run type-check       # TypeScript check all workspaces

# Testing (from apps/web/)
cd apps/web && npx playwright test              # Run all E2E tests
cd apps/web && npx playwright test --ui         # Interactive test runner
cd apps/web && npx playwright test e2e/admin    # Run a specific test file/dir

# Single workspace
npx turbo dev --filter=@splash/web
npx turbo build --filter=@splash/shared
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router, React 18 |
| Mobile | Expo, React Native, React Navigation |
| Styling | Tailwind CSS 3.4 with custom design tokens |
| Auth | Supabase Auth (email + Google/Apple OAuth) |
| Database | PostgreSQL via Supabase (no ORM, direct SDK queries) |
| Validation | Zod (shared package) |
| Payments | Stripe (subscriptions + Connect for online payments) |
| Email | Resend (transactional emails) |
| Deployment | Vercel (web), Expo (mobile) |

## Architecture

### Authentication & Middleware

Middleware at `apps/web/src/middleware.ts` handles auth:
- Refreshes Supabase session from cookies on every request
- Public paths: `/`, `/autolavados/**`, `/login`, `/api/**`
- Redirects unauthenticated users to `/login`
- Role-based routing after login (`super_admin` → `/super/metricas`, `wash_admin` → `/admin/dashboard`, `client` → `/`)
- Role authorization: `client` blocked from `/admin` and `/super`; `wash_admin` blocked from `/super`
- Subscription gate: `wash_admin` accessing `/admin` paths (except `/admin/suscripcion`) gets redirected if subscription is expired or in trial

Supabase clients are created differently per context:
- **RSC/Server Actions:** `createServerSupabase()` from `lib/supabase/server.ts` (uses cookies)
- **Client components:** `createClient()` from `lib/supabase/client.ts`
- **API routes:** Also use server client via cookies

### Route Groups (apps/web/src/app)

- `(auth)/` — Login, register (unified page with mode switching)
- `(client)/` — Booking (`agendar`), appointments (`mis-citas`), ratings (`calificar`), profile (`perfil`)
- `admin/` — Dashboard, appointments (`citas`), services (`servicios`), reports (`reportes`), config (`configuracion` — Stripe Connect onboarding, payment methods, WhatsApp, location)
- `super/` — Platform-level admin: businesses (`negocios`), metrics (`metricas`)
- `autolavados/` — Public listing and detail pages (by slug)
- `api/` — REST endpoints for appointments, availability, Stripe webhooks

### API Routes

- `POST /api/appointments` — Create booking (validates availability, auto-assigns station)
- `GET /api/availability?car_wash_id=...&fecha=...&duracion=...` — Available time slots
- `POST /api/appointments/[id]/cancel` — Cancel appointment (auto-refunds online payments)
- `POST /api/stripe/checkout` — Creates Stripe Checkout session for online payment
- `POST /api/stripe/connect` — Creates/retrieves Stripe Connect Express account, generates onboarding link
- `POST /api/stripe/connect/callback` — Stripe Connect onboarding callback
- `POST /api/webhooks/stripe` — Subscription lifecycle + payment events

### Database

Schema in `supabase/migrations/001_initial_schema.sql`. Key tables: `users`, `car_washes`, `services`, `business_hours`, `appointments`, `reviews`, `notifications`, `subscriptions`. RLS policies enforce role-based access. Spanish column names throughout (e.g., `nombre`, `fecha`, `hora_inicio`, `dia_semana`, `precio_cobrado`, `estacion`).

### Shared Package

`packages/shared/src/` exports types, Zod validation schemas, and constants. Both web and mobile import from `@splash/shared`.

Key constants in `packages/shared/src/constants/plans.ts`:
- `SUBSCRIPTION_PLANS`: Basico (MXN$499), Pro (MXN$999), Premium (MXN$1999)
- `TRIAL_DAYS`: 14, `SLOT_DURATION_MIN`: 30, `CANCELLATION_HOURS_LIMIT`: 2
- Enums: `UserRole`, `AppointmentStatus`, `NotifType`, `SubStatus`

## Key Conventions

- **Spanish domain language:** Routes, DB columns, and UI text are in Spanish. Keep this consistent.
- **Server Components by default:** Pages are RSC unless they need interactivity (`'use client'`).
- **`force-dynamic` export:** Used on pages that need fresh data on every request.
- **No ORM:** All database access goes through the Supabase JS SDK directly.
- **Path alias:** `@/*` maps to `apps/web/src/*` in the web app.
- **Station-based scheduling:** Car washes have `num_estaciones` (station count). The booking API assigns appointments to specific stations to handle concurrent capacity.
- **ESLint:** `@typescript-eslint/no-explicit-any` is off; unused vars with leading underscore (`_foo`) are allowed.
- **Design tokens:** Primary `#0284C7`, accent `#059669`, font `Plus Jakarta Sans`. Defined in `apps/web/tailwind.config.ts`.

### E2E Testing

Playwright tests live in `apps/web/e2e/`. Tests run sequentially (1 worker, 30s timeout) with dependency chains: `setup` → `public, admin, client` → `admin-round2, client-round2` → `admin-round3, client-relogin` → `client-round3`. The setup phase registers test users and saves auth state to `.auth/` for subsequent projects. Test data fixtures are in `e2e/fixtures/test-data.ts`. Shortcut scripts: `npm run test:e2e` and `npm run test:e2e:ui` (from apps/web).

### Payments Architecture

Two Stripe integrations:
- **Subscriptions:** Wash businesses pay platform fees via Stripe Subscriptions (Basico/Pro/Premium plans)
- **Stripe Connect (Express):** Wash businesses onboard via `/admin/configuracion` to accept online client payments. Country: MX, capabilities: card_payments + transfers.

Appointment payment tracking: `metodo_pago` (efectivo/tarjeta/transferencia/en_linea), `estado_pago` (pendiente/pagado/reembolsado). Car washes store accepted `metodos_pago` as an array.

### Database Migrations

Migrations in `supabase/migrations/`:
- `001_initial_schema.sql` — Full schema (8 tables, enums, triggers, RLS policies, indexes)
- `002_client_cancel_policy.sql` — RLS policy for client appointment cancellation
- `003_service_details.sql` — Phase 2 service features
- `004_phase2_features.sql` — Phase 2 features
- `005_phase3_payments_email.sql` — Payment methods, payment state on appointments, email tracking
- `006_stripe_connect.sql` — Stripe Connect columns on car_washes and appointments
- `seed.sql` — Seed data

## Environment Variables

See `.env.example` for the full list. Required for web dev:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin access
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Payments
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Maps integration
- `NEXT_PUBLIC_APP_URL` — App base URL
- `RESEND_API_KEY` — Transactional email via Resend
- `CRON_SECRET` — Cron job authentication
