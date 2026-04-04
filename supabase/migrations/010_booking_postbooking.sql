-- 010_booking_postbooking.sql
-- Phase 3: Availability alerts and booking enhancements

-- Availability alerts (Notify Me)
CREATE TABLE IF NOT EXISTS availability_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  canal TEXT[] DEFAULT '{email}',
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON availability_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Client notes on appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notas_cliente TEXT;
