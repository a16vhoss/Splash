-- Create car-wash-photos storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-wash-photos', 'car-wash-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload car wash photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'car-wash-photos'
    AND auth.role() = 'authenticated'
  );

-- Allow anyone to view car wash photos (public bucket)
CREATE POLICY "Car wash photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-wash-photos');

-- Allow authenticated users to update their photos
CREATE POLICY "Authenticated users can update car wash photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'car-wash-photos'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete car wash photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'car-wash-photos'
    AND auth.role() = 'authenticated'
  );
