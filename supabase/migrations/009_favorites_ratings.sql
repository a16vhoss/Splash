-- 009_favorites_ratings.sql
-- Phase 2: Favorites and detailed ratings

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, car_wash_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Detailed rating columns on reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_servicio SMALLINT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_limpieza SMALLINT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_tiempo SMALLINT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_valor SMALLINT;

-- Cached average ratings on car_washes
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS avg_rating_servicio NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS avg_rating_limpieza NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS avg_rating_tiempo NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS avg_rating_valor NUMERIC(2,1);
