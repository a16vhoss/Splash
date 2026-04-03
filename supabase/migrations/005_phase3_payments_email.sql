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
