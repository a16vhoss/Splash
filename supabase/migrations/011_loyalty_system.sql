-- 011_loyalty_system.sql
-- Phase 4: Loyalty stamp card system

-- Loyalty cards (one per user per car wash)
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  stamps INT DEFAULT 0,
  stamps_required INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, car_wash_id)
);
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cards" ON loyalty_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Loyalty rewards
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'disponible',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days')
);
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rewards" ON loyalty_rewards
  FOR SELECT USING (
    loyalty_card_id IN (SELECT id FROM loyalty_cards WHERE user_id = auth.uid())
  );

-- Loyalty config on car_washes
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT false;
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS loyalty_stamps_required INT DEFAULT 10;
