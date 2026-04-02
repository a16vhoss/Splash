# Client Web Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the client-facing side to the existing Next.js web app — landing page, car wash browsing, booking flow, appointments management, and ratings.

**Architecture:** New route groups under `(client)` for authenticated client pages and public pages at root level. Middleware updated to allow public access to landing/browse/search routes. Reuses existing Supabase client, API routes, types, and design tokens.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Supabase, existing @splash/shared types and validations

---

## File Structure

```
apps/web/src/
├── app/
│   ├── page.tsx                          # Landing page (public)
│   ├── (auth)/login/                     # Login/Register (existing, add client mode)
│   ├── autolavados/
│   │   ├── page.tsx                      # Browse/search car washes (public)
│   │   └── [slug]/
│   │       └── page.tsx                  # Car wash profile + services (public)
│   ├── (client)/
│   │   ├── layout.tsx                    # Client layout (navbar + footer)
│   │   ├── agendar/
│   │   │   └── page.tsx                  # Booking: select date/time + confirm
│   │   ├── mis-citas/
│   │   │   └── page.tsx                  # My appointments list
│   │   ├── calificar/
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Rate a completed appointment
│   │   └── perfil/
│   │       └── page.tsx                  # Client profile + settings
│   ├── (admin)/...                       # Existing admin panel (unchanged)
│   └── (super)/...                       # Existing super admin (unchanged)
├── components/
│   ├── navbar.tsx                        # Public/client navbar
│   ├── footer.tsx                        # Site footer
│   ├── wash-card.tsx                     # Car wash card for listing
│   ├── service-card.tsx                  # Service card for wash profile
│   ├── time-slot-picker.tsx              # Date + time slot grid (client component)
│   ├── star-rating-input.tsx             # Interactive star rating (client component)
│   └── appointment-card.tsx              # Appointment card for mis-citas
```

---

## Task 1: Update Middleware for Public Routes

**Files:**
- Modify: `apps/web/src/lib/supabase/middleware.ts`
- Modify: `apps/web/src/app/(auth)/login/page.tsx`
- Modify: `apps/web/src/app/(auth)/login/actions.ts`

Update middleware so that:
- `/`, `/autolavados`, `/autolavados/[slug]` are PUBLIC (no auth required)
- `/agendar`, `/mis-citas`, `/calificar/*`, `/perfil` require auth (any role)
- `/admin/*` requires wash_admin or super_admin (existing)
- `/super/*` requires super_admin (existing)
- Logged-in clients on `/login` redirect to `/` instead of `/admin/dashboard`

Update login/register to support client registration (just email+password+name, role=client).

---

## Task 2: Navbar + Footer Components

**Files:**
- Create: `apps/web/src/components/navbar.tsx`
- Create: `apps/web/src/components/footer.tsx`

Navbar: Logo "Splash" left, links (Inicio, Autolavados), right side (Login button or user avatar+name dropdown with Mis Citas, Perfil, Cerrar sesion). Client component using useEffect to check auth state.

Footer: Simple footer with copyright and links.

---

## Task 3: Landing Page

**Files:**
- Modify: `apps/web/src/app/page.tsx`

Hero section: heading "Encuentra tu autolavado", subtitle, search input that navigates to /autolavados?q=search. Below: grid of top-rated car washes (server component querying Supabase). CTA "Ver todos los autolavados".

---

## Task 4: Browse Car Washes Page

**Files:**
- Create: `apps/web/src/app/autolavados/page.tsx`
- Create: `apps/web/src/components/wash-card.tsx`

Server component. Query car_washes where activo=true, verificado=true, subscription active/trial, has services. Support searchParams: q (search by name), rating (min rating filter). Display as grid of WashCard components. Each card links to /autolavados/[slug].

---

## Task 5: Car Wash Profile Page

**Files:**
- Create: `apps/web/src/app/autolavados/[slug]/page.tsx`
- Create: `apps/web/src/components/service-card.tsx`

Server component. Fetch car wash by slug with services, business_hours, reviews. Show: cover image/placeholder, name, rating stars, address, total reviews. Services list with name, description, duration, price, and "Agendar" button (links to /agendar?car_wash_id=X&service_id=Y). Business hours table. Recent reviews.

---

## Task 6: Booking Page (Agendar)

**Files:**
- Create: `apps/web/src/app/(client)/agendar/page.tsx`
- Create: `apps/web/src/components/time-slot-picker.tsx`
- Create: `apps/web/src/app/(client)/layout.tsx`

Client layout: Navbar + main + Footer.

Booking page (requires auth): reads car_wash_id and service_id from searchParams. Shows service summary. TimeSlotPicker: horizontal date selector (next 7 days) + grid of available time slots (calls /api/availability). Confirm button calls /api/appointments POST. On success redirect to /mis-citas with success toast/param.

---

## Task 7: My Appointments Page

**Files:**
- Create: `apps/web/src/app/(client)/mis-citas/page.tsx`
- Create: `apps/web/src/components/appointment-card.tsx`

Server component (force-dynamic). Query appointments for current user with joined car_wash and service names. Show as list of AppointmentCard. Each card shows: car wash name, service, date, time, price, status badge. Completed appointments show "Calificar" button. Confirmed appointments show "Cancelar" button (with confirmation dialog).

---

## Task 8: Rating Page

**Files:**
- Create: `apps/web/src/app/(client)/calificar/[id]/page.tsx`
- Create: `apps/web/src/components/star-rating-input.tsx`

Requires auth. Fetch appointment by ID, verify it belongs to current user and is completed. Show car wash name, service, date. StarRatingInput (1-5 interactive stars). Textarea for comment. Submit button inserts into reviews table. Redirect to /mis-citas on success.

---

## Task 9: Client Profile Page

**Files:**
- Create: `apps/web/src/app/(client)/perfil/page.tsx`

Requires auth. Show user info (name, email, avatar). Edit name/phone form. Logout button. Link to Mis Citas.

---

## Task 10: Build Verification + Push

- Run `npx turbo build --filter=@splash/web`
- Fix any errors
- Commit and push
