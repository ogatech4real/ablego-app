/*
  # Storage Buckets and Policies

  1. Storage Buckets
    - `vehicle-docs` - Vehicle photos, licenses, insurance documents
    - `support-ids` - DBS checks, certifications, ID documents

  2. Security Policies
    - Users can upload their own files only
    - Admins can read/verify all documents
    - Public read access for verified vehicle photos only

  3. File Organization
    - Files organized by user ID and document type
    - Automatic file validation and size limits
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'vehicle-docs',
    'vehicle-docs',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'support-ids',
    'support-ids', 
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- Vehicle Documents Storage Policies
CREATE POLICY "Users can upload their own vehicle documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own vehicle documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vehicle-docs' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can update their own vehicle documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicle-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own vehicle documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicle-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can access all vehicle documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'vehicle-docs' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Support Worker ID Documents Storage Policies
CREATE POLICY "Support workers can upload their own ID documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'support-ids' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'support_worker'
    )
  );

CREATE POLICY "Support workers can view their own ID documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'support-ids' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  );

CREATE POLICY "Support workers can update their own ID documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'support-ids' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'support_worker'
    )
  );

CREATE POLICY "Support workers can delete their own ID documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'support-ids' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'support_worker'
    )
  );

CREATE POLICY "Admins can access all support ID documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'support-ids' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Public access for verified vehicle photos only
CREATE POLICY "Public can view verified vehicle photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'vehicle-docs' AND
    (storage.foldername(name))[2] = 'photos' AND
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.driver_id::text = (storage.foldername(name))[1]
      AND vehicles.verified = true
      AND vehicles.is_active = true
    )
  );