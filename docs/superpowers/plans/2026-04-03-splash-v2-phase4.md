# Splash v2 — Phase 4: Stripe Connect Online Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable car wash owners to accept online payments via Stripe Connect, with platform commission, Stripe Checkout for clients, and automatic refunds on cancellation.

**Architecture:** Stripe Connect Express accounts for each car wash. Onboarding via Stripe's hosted flow. Payments via Checkout Sessions with `payment_intent_data.transfer_data` for destination charges. Webhooks handle payment confirmation. Refunds triggered on cancellation if paid online.

**Tech Stack:** Stripe SDK (already installed), Next.js API routes, Supabase.

---

### Task 1: Database migration for Stripe Connect

**Files:**
- Create: `supabase/migrations/006_stripe_connect.sql`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/006_stripe_connect.sql`:

```sql
-- Phase 4: Stripe Connect for online payments

-- Stripe Connect account for car washes
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- Stripe payment reference on appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Add 'pago_en_linea' to the metodos_pago options
-- (no constraint change needed — metodos_pago is TEXT[])
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/006_stripe_connect.sql
git commit -m "feat: add Stripe Connect DB columns (stripe_account_id, stripe_payment_id)"
```

---

### Task 2: Stripe Connect onboarding API

**Files:**
- Create: `apps/web/src/app/api/stripe/connect/route.ts`
- Create: `apps/web/src/app/api/stripe/connect/callback/route.ts`

- [ ] **Step 1: Create Connect onboarding endpoint**

Create `apps/web/src/app/api/stripe/connect/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, stripe_account_id, nombre')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) return NextResponse.json({ error: 'No se encontro el autolavado' }, { status: 404 });

  let accountId = carWash.stripe_account_id;

  // Create Express account if not exists
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: carWash.nombre,
      },
    });

    accountId = account.id;

    await supabase
      .from('car_washes')
      .update({ stripe_account_id: accountId })
      .eq('id', carWash.id);
  }

  // Create onboarding link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/admin/configuracion?stripe=refresh`,
    return_url: `${appUrl}/api/stripe/connect/callback?account_id=${accountId}`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
```

- [ ] **Step 2: Create Connect callback endpoint**

Create `apps/web/src/app/api/stripe/connect/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('account_id');
  if (!accountId) return NextResponse.redirect(new URL('/admin/configuracion?stripe=error', req.url));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if account is fully onboarded
  const account = await stripe.accounts.retrieve(accountId);
  const isComplete = account.charges_enabled && account.payouts_enabled;

  await supabase
    .from('car_washes')
    .update({ stripe_onboarding_complete: isComplete })
    .eq('stripe_account_id', accountId);

  // Also add 'pago_en_linea' to metodos_pago if onboarding complete
  if (isComplete) {
    const { data: carWash } = await supabase
      .from('car_washes')
      .select('metodos_pago')
      .eq('stripe_account_id', accountId)
      .single();

    const methods = carWash?.metodos_pago ?? ['efectivo'];
    if (!methods.includes('pago_en_linea')) {
      methods.push('pago_en_linea');
      await supabase
        .from('car_washes')
        .update({ metodos_pago: methods })
        .eq('stripe_account_id', accountId);
    }
  }

  const redirectUrl = isComplete
    ? '/admin/configuracion?stripe=success'
    : '/admin/configuracion?stripe=incomplete';

  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
```

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/stripe/connect/route.ts apps/web/src/app/api/stripe/connect/callback/route.ts
git commit -m "feat: add Stripe Connect onboarding and callback endpoints"
```

---

### Task 3: Stripe Checkout for online payments

**Files:**
- Create: `apps/web/src/app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create checkout session endpoint**

Create `apps/web/src/app/api/stripe/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENT = 10;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { appointment_id } = body;

  if (!appointment_id) {
    return NextResponse.json({ error: 'appointment_id requerido' }, { status: 400 });
  }

  // Fetch appointment with car wash
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, precio_cobrado, precio_total, estado, estado_pago, car_wash_id, car_washes!car_wash_id(nombre, stripe_account_id, stripe_onboarding_complete), services!service_id(nombre)')
    .eq('id', appointment_id)
    .eq('client_id', user.id)
    .single() as { data: any };

  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (appointment.estado === 'cancelled') {
    return NextResponse.json({ error: 'La cita esta cancelada' }, { status: 400 });
  }

  if (appointment.estado_pago === 'pagado') {
    return NextResponse.json({ error: 'La cita ya fue pagada' }, { status: 400 });
  }

  const carWash = appointment.car_washes;
  if (!carWash?.stripe_account_id || !carWash.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Este autolavado no acepta pagos en linea' }, { status: 400 });
  }

  const totalAmount = (appointment.precio_total ?? appointment.precio_cobrado) * 100; // Convert to centavos
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT / 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    currency: 'mxn',
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${appointment.services?.nombre ?? 'Servicio'} en ${carWash.nombre}`,
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: carWash.stripe_account_id,
      },
    },
    metadata: {
      appointment_id: appointment.id,
    },
    success_url: `${appUrl}/mis-citas?payment=success`,
    cancel_url: `${appUrl}/mis-citas?payment=cancelled`,
  });

  // Save checkout session ID on appointment
  await supabase
    .from('appointments')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', appointment.id);

  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/stripe/checkout/route.ts
git commit -m "feat: add Stripe Checkout session creation for online payments"
```

---

### Task 4: Webhook handler for payment events

**Files:**
- Modify: `apps/web/src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add payment event handling to existing webhook**

Read `apps/web/src/app/api/webhooks/stripe/route.ts`. Add handling for these events alongside the existing subscription events:

- `checkout.session.completed` (for appointment payments — check metadata for appointment_id)
- `charge.refunded` (for refund tracking)

In the existing switch statement, add:

```typescript
    // --- Appointment payment events ---
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is an appointment payment (has appointment_id metadata)
      if (session.metadata?.appointment_id) {
        const appointmentId = session.metadata.appointment_id;
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

        await supabase
          .from('appointments')
          .update({
            estado_pago: 'pagado',
            stripe_payment_id: paymentIntentId,
            stripe_checkout_session_id: session.id,
          })
          .eq('id', appointmentId);

        break;
      }

      // Existing subscription handling...
      // (keep the existing checkout.session.completed code for subscriptions here,
      //  wrapped in an else block or after the break above)
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

      if (paymentIntentId) {
        await supabase
          .from('appointments')
          .update({ estado_pago: 'reembolsado' })
          .eq('stripe_payment_id', paymentIntentId);
      }
      break;
    }
```

**Important:** The existing `checkout.session.completed` handler is for subscriptions. You need to differentiate by checking `session.metadata.appointment_id`. If present, it's an appointment payment. If not, it's a subscription checkout — keep the existing logic.

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/webhooks/stripe/route.ts
git commit -m "feat: handle appointment payment and refund webhooks in Stripe handler"
```

---

### Task 5: Refund on cancellation

**Files:**
- Modify: `apps/web/src/app/api/appointments/[id]/cancel/route.ts`

- [ ] **Step 1: Add Stripe refund logic to cancellation**

Read `apps/web/src/app/api/appointments/[id]/cancel/route.ts`. After the appointment is updated to 'cancelled', add refund logic:

1. Add import at top:
```typescript
import Stripe from 'stripe';
```

2. After the update to `estado: 'cancelled'`, add:
```typescript
  // Refund if paid online
  if (appointment.estado_pago === 'pagado' && appointment.stripe_payment_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.refunds.create({
        payment_intent: appointment.stripe_payment_id,
      });

      await supabase
        .from('appointments')
        .update({ estado_pago: 'reembolsado' })
        .eq('id', params.id);
    } catch (err) {
      console.error('[stripe] Refund failed:', err);
      // Don't block cancellation if refund fails
    }
  }
```

3. Make sure the appointment query includes `estado_pago` and `stripe_payment_id`. Update the select query to include these fields if not already present.

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/appointments/\[id\]/cancel/route.ts
git commit -m "feat: auto-refund online payments on appointment cancellation"
```

---

### Task 6: Admin UI — Stripe Connect onboarding

**Files:**
- Modify: `apps/web/src/app/admin/configuracion/page.tsx`
- Modify: `apps/web/src/app/admin/configuracion/config-form.tsx`

- [ ] **Step 1: Update config page to pass Stripe status**

Read `apps/web/src/app/admin/configuracion/page.tsx`. Add `stripe_account_id, stripe_onboarding_complete` to the select query. Pass them to ConfigForm.

- [ ] **Step 2: Add Stripe Connect section to config form**

Read `apps/web/src/app/admin/configuracion/config-form.tsx`. Add a new section before the payment methods section:

```tsx
{/* Stripe Connect */}
<section className="rounded-card bg-card p-6 shadow-card">
  <h3 className="text-base font-semibold text-foreground mb-4">Pagos en linea</h3>
  {carWash.stripe_onboarding_complete ? (
    <div className="flex items-center gap-2">
      <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Conectado</span>
      <span className="text-sm text-muted-foreground">Tu cuenta de Stripe esta activa para recibir pagos en linea.</span>
    </div>
  ) : carWash.stripe_account_id ? (
    <div>
      <p className="text-sm text-warning font-semibold mb-3">Onboarding incompleto. Completa tu registro en Stripe.</p>
      <button
        type="button"
        onClick={handleStripeConnect}
        disabled={connectingStripe}
        className="rounded-card bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {connectingStripe ? 'Redirigiendo...' : 'Completar registro en Stripe'}
      </button>
    </div>
  ) : (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Conecta tu cuenta de Stripe para aceptar pagos con tarjeta en linea. Recibiras los pagos directamente en tu cuenta.</p>
      <button
        type="button"
        onClick={handleStripeConnect}
        disabled={connectingStripe}
        className="rounded-card bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {connectingStripe ? 'Redirigiendo...' : 'Conectar con Stripe'}
      </button>
    </div>
  )}
</section>
```

Add state and handler:
```tsx
const [connectingStripe, setConnectingStripe] = useState(false);

async function handleStripeConnect() {
  setConnectingStripe(true);
  try {
    const res = await fetch('/api/stripe/connect', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      toast(data.error ?? 'Error al conectar con Stripe', 'error');
      setConnectingStripe(false);
    }
  } catch {
    toast('Error al conectar con Stripe', 'error');
    setConnectingStripe(false);
  }
}
```

Also update the interface to include the new fields:
```tsx
interface ConfigFormProps {
  carWash: {
    id: string;
    metodos_pago: string[] | null;
    whatsapp: string | null;
    latitud: number | null;
    longitud: number | null;
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean;
  };
}
```

Add `useState` import if not present.

- [ ] **Step 3: Show toast based on Stripe callback query params**

In the config form, check for `?stripe=success` or `?stripe=error` query params and show appropriate toast on mount:

```tsx
import { useSearchParams } from 'next/navigation';

// Inside component:
const searchParams = useSearchParams();

useEffect(() => {
  const stripeStatus = searchParams.get('stripe');
  if (stripeStatus === 'success') toast('Cuenta de Stripe conectada exitosamente');
  if (stripeStatus === 'incomplete') toast('Registro de Stripe incompleto. Intenta de nuevo.', 'error');
  if (stripeStatus === 'error') toast('Error al conectar con Stripe', 'error');
}, []);
```

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/configuracion/page.tsx apps/web/src/app/admin/configuracion/config-form.tsx
git commit -m "feat: add Stripe Connect onboarding UI to admin config"
```

---

### Task 7: Client booking — online payment flow

**Files:**
- Modify: `apps/web/src/app/(client)/agendar/page.tsx`
- Modify: `apps/web/src/app/api/appointments/route.ts`

- [ ] **Step 1: Add 'pago_en_linea' label to booking page**

Read `apps/web/src/app/(client)/agendar/page.tsx`. In the payment method radio buttons section, add the label for `pago_en_linea`:

```tsx
const labels: Record<string, string> = {
  efectivo: 'Efectivo (pago en sitio)',
  tarjeta_sitio: 'Tarjeta (pago en sitio)',
  transferencia: 'Transferencia bancaria',
  pago_en_linea: 'Pagar ahora con tarjeta',
};
```

- [ ] **Step 2: Redirect to Stripe Checkout after booking if online payment**

In the `handleConfirm` function, after the appointment is created successfully, check if payment method is `pago_en_linea`. If so, create a Checkout Session and redirect:

Replace the success redirect:
```tsx
    // After successful appointment creation
    const appointmentData = await res.json();

    if (paymentMethod === 'pago_en_linea') {
      // Create Stripe Checkout session
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentData.id }),
      });

      const checkoutData = await checkoutRes.json();
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }
    }

    router.push('/mis-citas?success=1');
```

- [ ] **Step 3: Update appointment API to return appointment ID**

Read `apps/web/src/app/api/appointments/route.ts`. Make sure the response includes the appointment `id`. The current response should already return `NextResponse.json(appointment, { status: 201 })`. Verify the inserted appointment data includes `id`.

- [ ] **Step 4: Add validation — only allow pago_en_linea if car wash has Stripe**

In the appointments API, after fetching the car wash, add validation:

```typescript
  if (body.metodo_pago === 'pago_en_linea') {
    if (!carWash.stripe_account_id || !carWash.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Este autolavado no acepta pagos en linea' },
        { status: 400 }
      );
    }
  }
```

Make sure the car wash query includes `stripe_account_id` and `stripe_onboarding_complete`.

- [ ] **Step 5: Update shared validation to include pago_en_linea**

In `packages/shared/src/validations/appointment.ts`, update the `metodo_pago` enum:

```typescript
metodo_pago: z.enum(['efectivo', 'tarjeta_sitio', 'transferencia', 'pago_en_linea']).optional(),
```

Also update `packages/shared/src/constants/payment-methods.ts`:

```typescript
export const PAYMENT_METHODS = {
  efectivo: 'Efectivo',
  tarjeta_sitio: 'Tarjeta en sitio',
  transferencia: 'Transferencia',
  pago_en_linea: 'Pago en linea',
} as const;
```

- [ ] **Step 6: Build and verify**

Run: `npx turbo build --filter=@splash/shared && cd apps/web && npx next build`

- [ ] **Step 7: Commit**

```bash
git add "apps/web/src/app/(client)/agendar/page.tsx" apps/web/src/app/api/appointments/route.ts packages/shared/src/validations/appointment.ts packages/shared/src/constants/payment-methods.ts
git commit -m "feat: add online payment flow with Stripe Checkout in booking"
```

---

### Task 8: Payment status in client mis-citas

**Files:**
- Modify: `apps/web/src/app/(client)/mis-citas/page.tsx`
- Modify: `apps/web/src/components/appointment-card.tsx`

- [ ] **Step 1: Show payment success message**

Read `apps/web/src/app/(client)/mis-citas/page.tsx`. Add handling for `?payment=success` query param:

```tsx
{searchParams.get('payment') === 'success' && (
  <div className="rounded-card bg-accent/10 border border-accent/20 px-4 py-3 mb-6">
    <p className="text-sm text-accent font-semibold">Pago realizado exitosamente.</p>
  </div>
)}
```

- [ ] **Step 2: Show payment status on appointment card**

Read `apps/web/src/components/appointment-card.tsx`. Add a payment badge showing status when payment method is `pago_en_linea`:

```tsx
{appointment.metodo_pago === 'pago_en_linea' && (
  <span className={
    appointment.estado_pago === 'pagado'
      ? 'rounded-pill bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent'
      : appointment.estado_pago === 'reembolsado'
        ? 'rounded-pill bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning'
        : 'rounded-pill bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground'
  }>
    {appointment.estado_pago === 'pagado' ? 'Pagado' : appointment.estado_pago === 'reembolsado' ? 'Reembolsado' : 'Pago pendiente'}
  </span>
)}
```

Also update the mis-citas query to include `metodo_pago, estado_pago` if not already there.

- [ ] **Step 3: Build and verify**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(client)/mis-citas/page.tsx" apps/web/src/components/appointment-card.tsx
git commit -m "feat: show payment status on appointment cards and payment success banner"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run build**

Run: `npm run build`

- [ ] **Step 4: Manual verification checklist**

1. Admin config:
   - [ ] "Pagos en linea" section shows "Conectar con Stripe" button
   - [ ] Clicking button redirects to Stripe onboarding
   - [ ] After onboarding, redirects back with success message
   - [ ] "pago_en_linea" auto-added to metodos_pago

2. Client booking:
   - [ ] If car wash has Stripe connected, "Pagar ahora con tarjeta" radio option appears
   - [ ] Selecting online payment and confirming redirects to Stripe Checkout
   - [ ] After payment, redirects to mis-citas with success message
   - [ ] Payment status shows "Pagado" on appointment card

3. Cancellation:
   - [ ] Cancelling a paid-online appointment triggers automatic refund
   - [ ] Status updates to "Reembolsado"

4. Webhook:
   - [ ] Payment confirmation updates appointment estado_pago
   - [ ] Refund events update appointment status

5. New env vars:
   - [ ] `STRIPE_SECRET_KEY` — already configured (test mode)
   - [ ] `STRIPE_WEBHOOK_SECRET` — needs to be configured for new events
