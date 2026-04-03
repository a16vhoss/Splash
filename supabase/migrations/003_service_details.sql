-- Add detail fields to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'lavado'
    CHECK (categoria IN ('lavado', 'detailing', 'otro')),
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;
