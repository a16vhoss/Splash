-- Add configurable reminder days to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS recordatorio_dias INTEGER DEFAULT NULL;
