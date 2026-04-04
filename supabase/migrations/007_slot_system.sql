-- 007_slot_system.sql
-- Slot-based booking system: configurable capacity per hour/day

-- Add slot duration to car_washes (default 60 minutes)
ALTER TABLE car_washes
  ADD COLUMN IF NOT EXISTS slot_duration_min INTEGER DEFAULT 60;

-- Slot capacities: how many cars can be served per hour per day
CREATE TABLE IF NOT EXISTS slot_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora TIME NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 1 CHECK (capacidad >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(car_wash_id, dia_semana, hora)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_slot_capacities_lookup
  ON slot_capacities(car_wash_id, dia_semana);

-- RLS
ALTER TABLE slot_capacities ENABLE ROW LEVEL SECURITY;

-- Public read (clients need to see availability)
CREATE POLICY "slot_capacities_select" ON slot_capacities
  FOR SELECT USING (true);

-- wash_admin can manage their own car wash slots
CREATE POLICY "slot_capacities_insert" ON slot_capacities
  FOR INSERT WITH CHECK (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

CREATE POLICY "slot_capacities_update" ON slot_capacities
  FOR UPDATE USING (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

CREATE POLICY "slot_capacities_delete" ON slot_capacities
  FOR DELETE USING (
    car_wash_id IN (SELECT id FROM car_washes WHERE owner_id = auth.uid())
  );

-- Make estacion nullable (no longer auto-assigned)
ALTER TABLE appointments ALTER COLUMN estacion DROP NOT NULL;
