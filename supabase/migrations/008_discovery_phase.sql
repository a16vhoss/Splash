-- 008_discovery_phase.sql
-- Phase 1: Discovery features

-- Service categories for "browse by service" section
ALTER TABLE services ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'general';

-- Photos array for car wash gallery
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
