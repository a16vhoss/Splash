-- Allow clients to update their own appointments (needed for cancellation)
CREATE POLICY "appointments: client update own"
  ON appointments FOR UPDATE
  USING (auth.uid() = client_id);
