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
