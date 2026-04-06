-- Allow clients to hide appointments from their history
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS oculta_cliente BOOLEAN DEFAULT FALSE;
