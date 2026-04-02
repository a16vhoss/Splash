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
| Payments | Stripe (subscriptions for wash businesses) |
| Deployment | Vercel (web), Expo (mobile) |

## Architecture

### Authentication & Middleware

Middleware at `apps/web/src/middleware.ts` handles auth:
- Refreshes Supabase session from cookies on every request
- Public paths: `/`, `/autolavados/**`, `/login`, `/api/**`
- Redirects unauthenticated users to `/login`
- Role-based routing after login

Supabase clients are created differently per context:
- **RSC/Server Actions:** `createServerSupabase()` from `lib/supabase/server.ts` (uses cookies)
- **Client components:** `createClient()` from `lib/supabase/client.ts`
- **API routes:** Also use server client via cookies

### Route Groups (apps/web/src/app)

- `(auth)/` — Login, register (unified page with mode switching)
- `(client)/` — Booking (`agendar`), appointments (`mis-citas`), ratings (`calificar`), profile (`perfil`)
- `admin/` — Dashboard, appointments (`citas`), services (`servicios`), reports (`reportes`)
- `super/` — Platform-level admin: businesses (`negocios`), metrics (`metricas`)
- `autolavados/` — Public listing and detail pages (by slug)
- `api/` — REST endpoints for appointments, availability, Stripe webhooks

### API Routes

- `POST /api/appointments` — Create booking (validates availability, auto-assigns station)
- `GET /api/availability?car_wash_id=...&fecha=...&duracion=...` — Available time slots
- `POST /api/appointments/[id]/cancel` — Cancel appointment
- `POST /api/webhooks/stripe` — Subscription lifecycle events

### Database

Schema in `supabase/migrations/001_initial_schema.sql`. Key tables: `users`, `car_washes`, `services`, `business_hours`, `appointments`, `reviews`, `notifications`, `subscriptions`. RLS policies enforce role-based access. Spanish column names throughout (e.g., `nombre`, `fecha`, `hora_inicio`, `dia_semana`, `precio_cobrado`, `estacion`).

### Shared Package

`packages/shared/src/` exports types, Zod validation schemas, and constants (enums, subscription plans). Both web and mobile import from `@splash/shared`.

## Key Conventions

- **Spanish domain language:** Routes, DB columns, and UI text are in Spanish. Keep this consistent.
- **Server Components by default:** Pages are RSC unless they need interactivity (`'use client'`).
- **`force-dynamic` export:** Used on pages that need fresh data on every request.
- **No ORM:** All database access goes through the Supabase JS SDK directly.
- **Path alias:** `@/*` maps to `apps/web/src/*` in the web app.
- **Station-based scheduling:** Car washes have `num_estaciones` (station count). The booking API assigns appointments to specific stations to handle concurrent capacity.

## Environment Variables

See `.env.example` for the full list. Required for web dev:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin access
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Payments
- `NEXT_PUBLIC_APP_URL` — App base URL
