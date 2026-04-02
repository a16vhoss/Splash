-- ============================================================
-- Splash — Initial Schema Migration
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('client', 'wash_admin', 'super_admin');
CREATE TYPE appointment_status AS ENUM ('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE notif_type AS ENUM ('reminder', 'confirmation', 'cancellation', 'review_request');
CREATE TYPE sub_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');

-- ============================================================
-- TABLES
-- ============================================================

-- 1. users
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  nombre        TEXT,
  telefono      TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'client',
  auth_provider TEXT,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. car_washes
CREATE TABLE car_washes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  nombre              TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  descripcion         TEXT,
  direccion           TEXT,
  latitud             DECIMAL(10, 7),
  longitud            DECIMAL(10, 7),
  telefono            TEXT,
  logo_url            TEXT,
  cover_url           TEXT,
  rating_promedio     DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  total_reviews       INTEGER NOT NULL DEFAULT 0,
  num_estaciones      INTEGER NOT NULL DEFAULT 1 CHECK (num_estaciones > 0),
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  verificado          BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id  TEXT,
  subscription_status sub_status NOT NULL DEFAULT 'trial',
  subscription_plan   TEXT,
  trial_ends_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. services
CREATE TABLE services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id  UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio       DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
  duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
  orden        INTEGER NOT NULL DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. business_hours
CREATE TABLE business_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id   UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  dia_semana    SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_apertura TIME,
  hora_cierre   TIME,
  cerrado       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (car_wash_id, dia_semana)
);

-- 5. appointments
CREATE TABLE appointments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  car_wash_id          UUID NOT NULL REFERENCES car_washes(id) ON DELETE RESTRICT,
  service_id           UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  estacion             INTEGER NOT NULL CHECK (estacion > 0),
  fecha                DATE NOT NULL,
  hora_inicio          TIME NOT NULL,
  hora_fin             TIME NOT NULL,
  estado               appointment_status NOT NULL DEFAULT 'confirmed',
  precio_cobrado       DECIMAL(10, 2),
  notas_cliente        TEXT,
  notas_admin          TEXT,
  cancelado_por        UUID REFERENCES users(id) ON DELETE SET NULL,
  motivo_cancelacion   TEXT,
  recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. reviews
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  car_wash_id    UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. notifications
CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  tipo           notif_type NOT NULL,
  titulo         TEXT NOT NULL,
  mensaje        TEXT NOT NULL,
  leida          BOOLEAN NOT NULL DEFAULT FALSE,
  push_enviado   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. subscriptions
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id             UUID NOT NULL REFERENCES car_washes(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT NOT NULL UNIQUE,
  plan                    TEXT NOT NULL,
  status                  sub_status NOT NULL,
  current_period_start    TIMESTAMPTZ NOT NULL,
  current_period_end      TIMESTAMPTZ NOT NULL,
  cancel_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_activo ON users(activo);

-- car_washes
CREATE INDEX idx_car_washes_owner_id ON car_washes(owner_id);
CREATE INDEX idx_car_washes_activo ON car_washes(activo);
CREATE INDEX idx_car_washes_location ON car_washes(latitud, longitud);
CREATE INDEX idx_car_washes_slug ON car_washes(slug);
CREATE INDEX idx_car_washes_subscription_status ON car_washes(subscription_status);

-- services
CREATE INDEX idx_services_car_wash_id ON services(car_wash_id);
CREATE INDEX idx_services_activo ON services(activo);
CREATE INDEX idx_services_orden ON services(car_wash_id, orden);

-- business_hours
CREATE INDEX idx_business_hours_car_wash_id ON business_hours(car_wash_id);

-- appointments
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_car_wash_id ON appointments(car_wash_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_appointments_fecha ON appointments(fecha);
CREATE INDEX idx_appointments_estado ON appointments(estado);
CREATE INDEX idx_appointments_schedule ON appointments(car_wash_id, fecha, estacion);

-- reviews
CREATE INDEX idx_reviews_car_wash_id ON reviews(car_wash_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_leida ON notifications(user_id, leida);

-- subscriptions
CREATE INDEX idx_subscriptions_car_wash_id ON subscriptions(car_wash_id);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Generic updated_at updater
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate car wash rating after each review
CREATE OR REPLACE FUNCTION update_car_wash_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE car_washes
  SET
    rating_promedio = (
      SELECT ROUND(AVG(rating)::NUMERIC, 1)
      FROM reviews
      WHERE car_wash_id = NEW.car_wash_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE car_wash_id = NEW.car_wash_id
    )
  WHERE id = NEW.car_wash_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_car_washes_updated_at
  BEFORE UPDATE ON car_washes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_update_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_car_wash_rating();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_washes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;

-- ---- users ----
CREATE POLICY "users: self select"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: self update"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ---- car_washes ----
CREATE POLICY "car_washes: public read"
  ON car_washes FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "car_washes: owner insert"
  ON car_washes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "car_washes: owner update"
  ON car_washes FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "car_washes: owner delete"
  ON car_washes FOR DELETE
  USING (auth.uid() = owner_id);

-- ---- services ----
CREATE POLICY "services: public read"
  ON services FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "services: owner insert"
  ON services FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

CREATE POLICY "services: owner update"
  ON services FOR UPDATE
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

CREATE POLICY "services: owner delete"
  ON services FOR DELETE
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

-- ---- business_hours ----
CREATE POLICY "business_hours: public read"
  ON business_hours FOR SELECT
  USING (TRUE);

CREATE POLICY "business_hours: owner insert"
  ON business_hours FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

CREATE POLICY "business_hours: owner update"
  ON business_hours FOR UPDATE
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

CREATE POLICY "business_hours: owner delete"
  ON business_hours FOR DELETE
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

-- ---- appointments ----
CREATE POLICY "appointments: client sees own"
  ON appointments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "appointments: admin sees own car_wash"
  ON appointments FOR SELECT
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

CREATE POLICY "appointments: client insert own"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "appointments: admin update"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );

-- ---- reviews ----
CREATE POLICY "reviews: public read"
  ON reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "reviews: client insert own"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- ---- notifications ----
CREATE POLICY "notifications: self select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: self update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- subscriptions ----
CREATE POLICY "subscriptions: car_wash owner only"
  ON subscriptions FOR SELECT
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );
