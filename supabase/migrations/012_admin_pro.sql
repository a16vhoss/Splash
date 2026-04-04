-- 012_admin_pro.sql
-- Phase 5: Admin Pro features

-- Review replies
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS respuesta_admin TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS respuesta_fecha TIMESTAMPTZ;

-- Messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers mark read" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE INDEX idx_messages_car_wash ON messages(car_wash_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, leido);
