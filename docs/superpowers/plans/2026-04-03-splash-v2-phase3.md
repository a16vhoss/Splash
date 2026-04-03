# Splash v2 — Phase 3: Email + Payment Methods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add transactional email via Resend (confirmation, cancellation, reminders, review requests), payment method configuration per car wash, payment method selection in booking, and manual payment tracking by admin.

**Architecture:** DB migration first, then Resend email integration (lib + API hooks + cron jobs), then payment method config (admin UI + booking flow + admin tracking). Stripe Connect online payments deferred to Phase 4.

**Tech Stack:** Next.js 14 App Router, Resend SDK, Vercel Cron Jobs, Supabase, Tailwind CSS, Zod.

**Note:** Stripe Connect (online payments) is intentionally excluded — deferred to Phase 4 when the Stripe Connect account is ready.

---

### Task 1: Database migration for Phase 3

**Files:**
- Create: `supabase/migrations/005_phase3_payments_email.sql`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/005_phase3_payments_email.sql`:

```sql
-- Phase 3: Payment methods and email tracking

-- Payment methods accepted by car wash
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS metodos_pago TEXT[] DEFAULT '{efectivo}';

-- Payment tracking on appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT,
  ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pendiente', 'pagado', 'reembolsado'));

-- Email tracking on notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/005_phase3_payments_email.sql
git commit -m "feat: add phase 3 DB columns (metodos_pago, estado_pago, email_enviado)"
```

---

### Task 2: Install Resend and set up email client

**Files:**
- Create: `apps/web/src/lib/email.ts`

- [ ] **Step 1: Install Resend**

```bash
cd apps/web && npm install resend
```

- [ ] **Step 2: Create email client and send functions**

Create `apps/web/src/lib/email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Splash <noreply@splash.app>';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY not set, skipping:', subject);
    return;
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] Failed to send:', subject, err);
  }
}

export async function sendBookingConfirmationClient(email: string, data: {
  carWashName: string;
  serviceName: string;
  fecha: string;
  hora: string;
  precio: number;
  direccion?: string;
}) {
  await sendEmail({
    to: email,
    subject: `Tu cita en ${data.carWashName} esta confirmada`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0284C7;">Cita confirmada</h2>
        <p>Tu cita ha sido agendada exitosamente.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748B;">Autolavado</td><td style="padding: 8px 0; font-weight: 600;">${data.carWashName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Servicio</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Hora</td><td style="padding: 8px 0; font-weight: 600;">${data.hora}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Precio</td><td style="padding: 8px 0; font-weight: 600;">$${data.precio.toLocaleString('es-MX')}</td></tr>
          ${data.direccion ? `<tr><td style="padding: 8px 0; color: #64748B;">Direccion</td><td style="padding: 8px 0;">${data.direccion}</td></tr>` : ''}
        </table>
        <p style="color: #64748B; font-size: 14px;">Recuerda llegar puntual a tu cita.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="color: #94A3B8; font-size: 12px;">Splash — Tu autolavado favorito</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationAdmin(email: string, data: {
  clientName: string;
  serviceName: string;
  fecha: string;
  hora: string;
  precio: number;
}) {
  await sendEmail({
    to: email,
    subject: `Nueva cita: ${data.clientName} - ${data.serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0284C7;">Nueva cita agendada</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748B;">Cliente</td><td style="padding: 8px 0; font-weight: 600;">${data.clientName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Servicio</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Hora</td><td style="padding: 8px 0; font-weight: 600;">${data.hora}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Precio</td><td style="padding: 8px 0; font-weight: 600;">$${data.precio.toLocaleString('es-MX')}</td></tr>
        </table>
        <p style="color: #64748B; font-size: 14px;">Revisa tu panel de administracion para mas detalles.</p>
      </div>
    `,
  });
}

export async function sendCancellationEmail(email: string, data: {
  carWashName: string;
  serviceName: string;
  fecha: string;
  hora: string;
  motivo?: string;
  isAdmin: boolean;
}) {
  const subject = data.isAdmin
    ? `Cita cancelada: ${data.serviceName} - ${data.fecha}`
    : `Tu cita en ${data.carWashName} ha sido cancelada`;

  await sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Cita cancelada</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748B;">Autolavado</td><td style="padding: 8px 0; font-weight: 600;">${data.carWashName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Servicio</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Hora</td><td style="padding: 8px 0; font-weight: 600;">${data.hora}</td></tr>
          ${data.motivo ? `<tr><td style="padding: 8px 0; color: #64748B;">Motivo</td><td style="padding: 8px 0;">${data.motivo}</td></tr>` : ''}
        </table>
      </div>
    `,
  });
}

export async function sendReminderEmail(email: string, data: {
  carWashName: string;
  serviceName: string;
  fecha: string;
  hora: string;
  direccion?: string;
}) {
  await sendEmail({
    to: email,
    subject: `Recordatorio: tu cita es en 2 horas`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0284C7;">Recordatorio de cita</h2>
        <p>Tu cita es en aproximadamente 2 horas.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748B;">Autolavado</td><td style="padding: 8px 0; font-weight: 600;">${data.carWashName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Servicio</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748B;">Hora</td><td style="padding: 8px 0; font-weight: 600;">${data.hora}</td></tr>
          ${data.direccion ? `<tr><td style="padding: 8px 0; color: #64748B;">Direccion</td><td style="padding: 8px 0;">${data.direccion}</td></tr>` : ''}
        </table>
        <p style="color: #64748B; font-size: 14px;">Recuerda llegar puntual.</p>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(email: string, data: {
  carWashName: string;
  serviceName: string;
  appointmentId: string;
  appUrl: string;
}) {
  await sendEmail({
    to: email,
    subject: `Como fue tu experiencia en ${data.carWashName}?`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0284C7;">Califica tu experiencia</h2>
        <p>Tu servicio de <strong>${data.serviceName}</strong> en <strong>${data.carWashName}</strong> ha sido completado.</p>
        <p>Nos encantaria saber como fue tu experiencia.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.appUrl}/calificar/${data.appointmentId}" style="background: #0284C7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Calificar servicio</a>
        </div>
        <p style="color: #94A3B8; font-size: 12px;">Splash — Tu autolavado favorito</p>
      </div>
    `,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json ../../package-lock.json apps/web/src/lib/email.ts
git commit -m "feat: add Resend email client with transactional email templates"
```

---

### Task 3: Send emails on booking and cancellation

**Files:**
- Modify: `apps/web/src/app/api/appointments/route.ts`
- Modify: `apps/web/src/app/api/appointments/[id]/cancel/route.ts`

- [ ] **Step 1: Add email sending to appointment creation**

Read `apps/web/src/app/api/appointments/route.ts`. After the notifications are created (near the end, before the return statement), add email sending. You'll need to:

1. Add import at top:
```typescript
import { sendBookingConfirmationClient, sendBookingConfirmationAdmin } from '@/lib/email';
```

2. Fetch client and owner emails. After the notifications insert block, add:
```typescript
  // Send confirmation emails
  const { data: clientUser } = await adminSupabase
    .from('users')
    .select('email, nombre')
    .eq('id', user.id)
    .single();

  const { data: ownerUser } = await adminSupabase
    .from('users')
    .select('email')
    .eq('id', carWash.owner_id)
    .single();

  if (clientUser?.email) {
    sendBookingConfirmationClient(clientUser.email, {
      carWashName: carWash.nombre,
      serviceName: service.nombre,
      fecha: body.fecha,
      hora: body.hora_inicio,
      precio: totalPrice,
      direccion: carWash.direccion ?? undefined,
    });
  }

  if (ownerUser?.email) {
    sendBookingConfirmationAdmin(ownerUser.email, {
      clientName: clientUser?.nombre ?? 'Cliente',
      serviceName: service.nombre,
      fecha: body.fecha,
      hora: body.hora_inicio,
      precio: totalPrice,
    });
  }
```

Note: Email sending is fire-and-forget (no await) to not block the response.

- [ ] **Step 2: Add email sending to cancellation**

Read `apps/web/src/app/api/appointments/[id]/cancel/route.ts`. After the notification insert, add email sending.

1. Add import at top:
```typescript
import { sendCancellationEmail } from '@/lib/email';
```

2. After the notification creation block, fetch emails and send. The cancel endpoint already has access to the appointment data. Add:
```typescript
  // Send cancellation emails
  const { data: clientUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', appointment.client_id)
    .single();

  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', carWash.owner_id)
    .single();

  const emailData = {
    carWashName: carWash.nombre,
    serviceName: appointment.services?.nombre ?? '',
    fecha: appointment.fecha,
    hora: appointment.hora_inicio?.slice(0, 5) ?? '',
    motivo: motivo_cancelacion ?? undefined,
  };

  if (clientUser?.email) {
    sendCancellationEmail(clientUser.email, { ...emailData, isAdmin: false });
  }
  if (ownerUser?.email) {
    sendCancellationEmail(ownerUser.email, { ...emailData, isAdmin: true });
  }
```

Note: You'll need to check what data is available in the cancel endpoint. The appointment may need the service name — check if the query includes it, and if not, fetch it.

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/appointments/route.ts apps/web/src/app/api/appointments/\[id\]/cancel/route.ts
git commit -m "feat: send confirmation and cancellation emails via Resend"
```

---

### Task 4: Cron jobs for reminders and review requests

**Files:**
- Create: `apps/web/src/app/api/cron/reminders/route.ts`
- Create: `apps/web/src/app/api/cron/review-requests/route.ts`
- Create: `apps/web/vercel.json`

- [ ] **Step 1: Create reminder cron endpoint**

Create `apps/web/src/app/api/cron/reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReminderEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find appointments in the next 2 hours that haven't been reminded
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const today = now.toISOString().split('T')[0];
  const twoHoursDate = twoHoursFromNow.toISOString().split('T')[0];

  const nowTime = now.toTimeString().slice(0, 5);
  const twoHoursTime = twoHoursFromNow.toTimeString().slice(0, 5);

  // Query appointments that are confirmed, happening in the next ~2 hours
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, fecha, hora_inicio, car_wash_id, car_washes!car_wash_id(nombre, direccion), services!service_id(nombre)')
    .eq('estado', 'confirmed')
    .eq('fecha', today)
    .gte('hora_inicio', nowTime)
    .lte('hora_inicio', twoHoursTime);

  if (!appointments?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const apt of appointments) {
    // Check if reminder notification already exists
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('tipo', 'reminder')
      .limit(1);

    if (existing?.length) continue;

    // Get client email
    const { data: client } = await supabase
      .from('users')
      .select('email')
      .eq('id', apt.client_id)
      .single();

    if (!client?.email) continue;

    // Create reminder notification
    await supabase.from('notifications').insert({
      user_id: apt.client_id,
      appointment_id: apt.id,
      tipo: 'reminder',
      titulo: 'Recordatorio de cita',
      mensaje: `Tu cita en ${(apt as any).car_washes?.nombre ?? 'el autolavado'} es en aproximadamente 2 horas`,
    });

    // Send email
    await sendReminderEmail(client.email, {
      carWashName: (apt as any).car_washes?.nombre ?? '',
      serviceName: (apt as any).services?.nombre ?? '',
      fecha: apt.fecha,
      hora: apt.hora_inicio?.slice(0, 5) ?? '',
      direccion: (apt as any).car_washes?.direccion ?? undefined,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
```

- [ ] **Step 2: Create review request cron endpoint**

Create `apps/web/src/app/api/cron/review-requests/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReviewRequestEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://splash.app';

  // Find appointments completed in the last 2 hours without a review request
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, car_wash_id, car_washes!car_wash_id(nombre), services!service_id(nombre)')
    .eq('estado', 'completed')
    .gte('updated_at', twoHoursAgo);

  if (!appointments?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const apt of appointments) {
    // Check if review request already sent
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('tipo', 'review_request')
      .limit(1);

    if (existing?.length) continue;

    // Check if review already exists
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('appointment_id', apt.id)
      .limit(1);

    if (review?.length) continue;

    const { data: client } = await supabase
      .from('users')
      .select('email')
      .eq('id', apt.client_id)
      .single();

    if (!client?.email) continue;

    // Create notification
    await supabase.from('notifications').insert({
      user_id: apt.client_id,
      appointment_id: apt.id,
      tipo: 'review_request',
      titulo: 'Califica tu experiencia',
      mensaje: `Como fue tu servicio en ${(apt as any).car_washes?.nombre ?? 'el autolavado'}?`,
    });

    // Send email
    await sendReviewRequestEmail(client.email, {
      carWashName: (apt as any).car_washes?.nombre ?? '',
      serviceName: (apt as any).services?.nombre ?? '',
      appointmentId: apt.id,
      appUrl,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
```

- [ ] **Step 3: Create vercel.json with cron configuration**

Create `apps/web/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/review-requests", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/cron/reminders/route.ts apps/web/src/app/api/cron/review-requests/route.ts apps/web/vercel.json
git commit -m "feat: add cron jobs for appointment reminders and review requests"
```

---

### Task 5: Payment methods — DB migration already done, update shared types

**Files:**
- Create: `packages/shared/src/constants/payment-methods.ts`
- Modify: `packages/shared/src/constants/index.ts`
- Modify: `packages/shared/src/validations/appointment.ts`

- [ ] **Step 1: Create payment methods constants**

Create `packages/shared/src/constants/payment-methods.ts`:

```typescript
export const PAYMENT_METHODS = {
  efectivo: 'Efectivo',
  tarjeta_sitio: 'Tarjeta en sitio',
  transferencia: 'Transferencia',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_STATUS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  reembolsado: 'Reembolsado',
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;
```

- [ ] **Step 2: Export from constants index**

Read and modify `packages/shared/src/constants/index.ts`. Add:

```typescript
export * from './payment-methods';
```

- [ ] **Step 3: Add metodo_pago to appointment validation**

Read and modify `packages/shared/src/validations/appointment.ts`. Add to `createAppointmentSchema`:

```typescript
  metodo_pago: z.enum(['efectivo', 'tarjeta_sitio', 'transferencia']).optional(),
```

- [ ] **Step 4: Build shared and commit**

Run: `npx turbo build --filter=@splash/shared`

```bash
git add packages/shared/src/constants/payment-methods.ts packages/shared/src/constants/index.ts packages/shared/src/validations/appointment.ts
git commit -m "feat: add payment method constants and validation"
```

---

### Task 6: Admin — configure payment methods for car wash

**Files:**
- Create: `apps/web/src/app/admin/configuracion/page.tsx`
- Create: `apps/web/src/app/admin/configuracion/actions.ts`
- Modify: `apps/web/src/components/sidebar.tsx`
- Modify: `apps/web/src/components/admin-tab-bar.tsx`

- [ ] **Step 1: Create admin configuration page**

Create `apps/web/src/app/admin/configuracion/page.tsx`:

```tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { ConfigForm } from './config-form';

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, metodos_pago, whatsapp, latitud, longitud')
    .eq('owner_id', user.id)
    .single() as { data: any };

  if (!carWash) return <p className="text-muted-foreground">No se encontro tu autolavado.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuracion</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configura tu autolavado</p>
      </div>
      <ConfigForm carWash={carWash} />
    </div>
  );
}
```

- [ ] **Step 2: Create config form client component**

Create `apps/web/src/app/admin/configuracion/config-form.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { saveConfig } from './actions';

const METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_sitio', label: 'Tarjeta en sitio' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
];

interface ConfigFormProps {
  carWash: {
    id: string;
    metodos_pago: string[] | null;
    whatsapp: string | null;
    latitud: number | null;
    longitud: number | null;
  };
}

export function ConfigForm({ carWash }: ConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveConfig(formData);
        toast('Configuracion guardada');
      } catch {
        toast('Error al guardar', 'error');
      }
    });
  }

  const currentMethods = carWash.metodos_pago ?? ['efectivo'];

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Payment methods */}
      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Metodos de pago aceptados</h3>
        <div className="space-y-3">
          {METHODS.map((method) => (
            <label key={method.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="metodos_pago"
                value={method.value}
                defaultChecked={currentMethods.includes(method.value)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">{method.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* WhatsApp */}
      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">WhatsApp</h3>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Numero con codigo de pais (ej: 5213312345678)</label>
          <input
            name="whatsapp"
            type="tel"
            defaultValue={carWash.whatsapp ?? ''}
            placeholder="5213312345678"
            className="w-full max-w-sm rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      {/* Location */}
      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Ubicacion</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Latitud</label>
            <input
              name="latitud"
              type="number"
              step="0.0000001"
              defaultValue={carWash.latitud ?? ''}
              placeholder="20.6597"
              className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Longitud</label>
            <input
              name="longitud"
              type="number"
              step="0.0000001"
              defaultValue={carWash.longitud ?? ''}
              placeholder="-103.3496"
              className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-input bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {isPending ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create server action for saving config**

Create `apps/web/src/app/admin/configuracion/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export async function saveConfig(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) throw new Error('No se encontro el autolavado');

  const metodos_pago = formData.getAll('metodos_pago') as string[];
  const whatsapp = (formData.get('whatsapp') as string) || null;
  const latitud = formData.get('latitud') ? parseFloat(formData.get('latitud') as string) : null;
  const longitud = formData.get('longitud') ? parseFloat(formData.get('longitud') as string) : null;

  await supabase
    .from('car_washes')
    .update({
      metodos_pago: metodos_pago.length > 0 ? metodos_pago : ['efectivo'],
      whatsapp,
      latitud,
      longitud,
    })
    .eq('id', carWash.id);

  revalidatePath('/admin/configuracion');
}
```

- [ ] **Step 4: Add Configuracion to sidebar navigation**

Read and modify `apps/web/src/components/sidebar.tsx`. Add a new nav item after Reportes:

```typescript
  {
    label: 'Configuracion',
    href: '/admin/configuracion',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
```

- [ ] **Step 5: Add Configuracion to admin tab bar "Mas" sheet**

Read and modify `apps/web/src/components/admin-tab-bar.tsx`. In the `moreItems` array, add Configuracion:

```typescript
const moreItems = [
  { label: 'Reportes', href: '/admin/reportes' },
  { label: 'Configuracion', href: '/admin/configuracion' },
  { label: 'Suscripcion', href: '/admin/suscripcion' },
];
```

- [ ] **Step 6: Build and verify**

Run: `cd apps/web && npx next build`

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/admin/configuracion/page.tsx apps/web/src/app/admin/configuracion/config-form.tsx apps/web/src/app/admin/configuracion/actions.ts apps/web/src/components/sidebar.tsx apps/web/src/components/admin-tab-bar.tsx
git commit -m "feat: add admin configuration page with payment methods, WhatsApp, and location"
```

---

### Task 7: Payment method selection in booking flow

**Files:**
- Modify: `apps/web/src/app/(client)/agendar/page.tsx`
- Modify: `apps/web/src/app/api/appointments/route.ts`

- [ ] **Step 1: Add payment method selection to booking page**

Read `apps/web/src/app/(client)/agendar/page.tsx`. Make these additions:

1. Add state for payment method:
```tsx
const [paymentMethod, setPaymentMethod] = useState<string>('');
const [availableMethods, setAvailableMethods] = useState<string[]>([]);
```

2. In the useEffect that fetches carWash data, also fetch `metodos_pago`. Update the carWash select to include `metodos_pago`:
```tsx
supabase.from('car_washes').select('nombre, direccion, metodos_pago').eq('id', carWashId).single()
```

Then set available methods:
```tsx
setAvailableMethods(cwRes.data?.metodos_pago ?? ['efectivo']);
```

3. After the complementary services section and before the time picker, add payment method selection:

```tsx
{availableMethods.length > 0 && (
  <div className="mb-8">
    <h3 className="text-lg font-bold text-foreground mb-3">Metodo de pago</h3>
    <div className="space-y-2">
      {availableMethods.map((method: string) => {
        const labels: Record<string, string> = {
          efectivo: 'Efectivo (pago en sitio)',
          tarjeta_sitio: 'Tarjeta (pago en sitio)',
          transferencia: 'Transferencia bancaria',
        };
        return (
          <label key={method} className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="metodo_pago"
              value={method}
              checked={paymentMethod === method}
              onChange={() => setPaymentMethod(method)}
              className="h-4 w-4 border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">{labels[method] ?? method}</span>
          </label>
        );
      })}
    </div>
  </div>
)}
```

4. Auto-select if there's only one method:
```tsx
// In useEffect, after setting availableMethods:
if ((cwRes.data?.metodos_pago ?? ['efectivo']).length === 1) {
  setPaymentMethod((cwRes.data?.metodos_pago ?? ['efectivo'])[0]);
}
```

5. Update handleConfirm to include payment method in the POST body:
```typescript
body: JSON.stringify({
  car_wash_id: carWashId,
  service_id: serviceId,
  fecha,
  hora_inicio: hora,
  servicios_complementarios: selectedExtras.length > 0 ? selectedExtras : undefined,
  metodo_pago: paymentMethod || undefined,
}),
```

6. Optionally disable the confirm button if no payment method is selected:
Add a check before confirming or show a validation message.

- [ ] **Step 2: Handle metodo_pago in appointments API**

Read `apps/web/src/app/api/appointments/route.ts`. In the appointment insert object, add:

```typescript
    metodo_pago: body.metodo_pago ?? null,
    estado_pago: 'pendiente',
```

- [ ] **Step 3: Build and verify**

Run: `npx turbo build --filter=@splash/shared && cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(client)/agendar/page.tsx" apps/web/src/app/api/appointments/route.ts
git commit -m "feat: add payment method selection to booking flow"
```

---

### Task 8: Admin — mark appointment as paid

**Files:**
- Modify: `apps/web/src/app/admin/citas/page.tsx`
- Create or modify: `apps/web/src/app/admin/citas/actions.ts`

- [ ] **Step 1: Add markAsPaid server action**

Read `apps/web/src/app/admin/citas/actions.ts` (if it exists). Add a new action:

```typescript
export async function markAsPaid(appointmentId: string) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase
    .from('appointments')
    .update({ estado_pago: 'pagado' })
    .eq('id', appointmentId);

  revalidatePath('/admin/citas');
}
```

- [ ] **Step 2: Update admin citas page to show payment status and mark-paid button**

Read `apps/web/src/app/admin/citas/page.tsx`. Make these additions:

1. Add `metodo_pago, estado_pago` to the appointments select query
2. Add a "Pago" column to the table showing `estado_pago` with a status badge
3. Add a "Marcar pagado" button for appointments where `estado_pago === 'pendiente'`

In the table header, add after the Precio column:
```tsx
<th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Pago</th>
```

In the table body, add after the precio cell:
```tsx
<td className="px-6 py-3">
  <div className="flex items-center gap-2">
    <span className={
      apt.estado_pago === 'pagado'
        ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
        : 'rounded-pill bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning'
    }>
      {apt.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
    </span>
    {apt.estado_pago === 'pendiente' && apt.estado !== 'cancelled' && (
      <form action={markAsPaid.bind(null, apt.id)}>
        <button type="submit" className="text-xs font-semibold text-primary hover:underline">
          Marcar pagado
        </button>
      </form>
    )}
  </div>
</td>
```

Also show `metodo_pago` label somewhere visible (e.g., as a small text under the price).

- [ ] **Step 3: Build and verify**

Run: `cd apps/web && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/citas/actions.ts apps/web/src/app/admin/citas/page.tsx
git commit -m "feat: add payment tracking and mark-as-paid to admin appointments"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run type-check**

Run: `npm run type-check`

- [ ] **Step 2: Run lint**

Run: `npm run lint`

- [ ] **Step 3: Run build**

Run: `npm run build`

- [ ] **Step 4: Manual testing checklist**

1. Email:
   - [ ] Booking creates appointment → confirmation emails sent (check Resend dashboard)
   - [ ] Cancellation → cancellation emails sent
   - [ ] Cron `/api/cron/reminders` returns `{ sent: N }` for upcoming appointments
   - [ ] Cron `/api/cron/review-requests` returns `{ sent: N }` for completed appointments

2. Payment methods:
   - [ ] Admin config page shows payment method checkboxes
   - [ ] Admin can save payment methods, WhatsApp, and location
   - [ ] Booking flow shows available payment methods as radio buttons
   - [ ] Payment method saved on appointment

3. Payment tracking:
   - [ ] Admin citas page shows "Pago" column with status badge
   - [ ] "Marcar pagado" button updates status to "Pagado"
   - [ ] Cancelled appointments don't show "Marcar pagado"

4. New env vars needed:
   - [ ] `RESEND_API_KEY` — Resend API key
   - [ ] `CRON_SECRET` — Secret for cron job auth
