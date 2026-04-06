-- Allow car wash owners to read ALL their services (including inactive)
-- The existing "services: public read" policy only shows activo=TRUE,
-- which prevents admins from seeing/managing deactivated services.
CREATE POLICY "services: owner read all"
  ON services FOR SELECT
  USING (
    auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)
  );
