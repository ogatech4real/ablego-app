/*
  Fix Schema Mismatches for Driver and Support Worker Applications
  This migration fixes column mismatches between Edge Functions and database tables
*/

-- Fix support_worker_applications table if missing id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_worker_applications'
      AND column_name = 'id'
  ) THEN
    ALTER TABLE support_worker_applications
      ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add driver_application_id to vehicles table for proper linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'driver_application_id'
  ) THEN
    ALTER TABLE vehicles
      ADD COLUMN driver_application_id uuid REFERENCES driver_applications(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_vehicles_driver_application_id ON vehicles(driver_application_id);
  END IF;
END $$;

-- Add support_worker_application_id to support_workers table for proper linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_workers'
      AND column_name = 'support_worker_application_id'
  ) THEN
    ALTER TABLE support_workers
      ADD COLUMN support_worker_application_id uuid REFERENCES support_worker_applications(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_support_workers_support_worker_application_id ON support_workers(support_worker_application_id);
  END IF;
END $$;

-- Add missing columns to vehicles table for insurance and registration details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'fuel_type'
  ) THEN
    ALTER TABLE vehicles
      ADD COLUMN fuel_type text DEFAULT 'petrol',
      ADD COLUMN transmission text DEFAULT 'manual',
      ADD COLUMN seats integer DEFAULT 4,
      ADD COLUMN insurance_provider text,
      ADD COLUMN insurance_policy_number text,
      ADD COLUMN registration_number text,
      ADD COLUMN is_verified boolean DEFAULT false,
      ADD COLUMN status text DEFAULT 'pending_verification';
  END IF;
END $$;

-- Update vehicles table to use registration_number instead of license_plate if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'registration_number'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'license_plate'
  ) THEN
    ALTER TABLE vehicles RENAME COLUMN license_plate TO registration_number;
  END IF;
END $$;

-- Add missing columns to support_workers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_workers'
      AND column_name = 'full_name'
  ) THEN
    ALTER TABLE support_workers
      ADD COLUMN full_name text,
      ADD COLUMN phone text,
      ADD COLUMN address text,
      ADD COLUMN experience text,
      ADD COLUMN preferred_hours text,
      ADD COLUMN is_verified boolean DEFAULT false,
      ADD COLUMN status text DEFAULT 'pending_verification';
  END IF;
END $$;

-- Update support_workers table to use correct column names
DO $$
BEGIN
  -- Rename verified to is_verified if needed
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_workers'
      AND column_name = 'verified'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_workers'
      AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE support_workers RENAME COLUMN verified TO is_verified;
  END IF;
END $$;

-- Ensure vehicles table has correct column names
DO $$
BEGIN
  -- Rename verified to is_verified if needed
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'verified'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vehicles'
      AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE vehicles RENAME COLUMN verified TO is_verified;
  END IF;
END $$;

-- Add user_id columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'driver_applications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE driver_applications
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_driver_applications_user_id ON driver_applications(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'support_worker_applications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE support_worker_applications
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_support_worker_applications_user_id ON support_worker_applications(user_id);
  END IF;
END $$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_support_worker_applications_status ON support_worker_applications(status);
-- Note: vehicles and support_workers user_id indexes will be created if the columns exist

-- Update RLS policies to allow Edge Functions to insert data
DROP POLICY IF EXISTS "Service role can insert driver applications" ON driver_applications;
CREATE POLICY "Service role can insert driver applications"
  ON driver_applications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert support worker applications" ON support_worker_applications;
CREATE POLICY "Service role can insert support worker applications"
  ON support_worker_applications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert vehicles" ON vehicles;
CREATE POLICY "Service role can insert vehicles"
  ON vehicles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert support workers" ON support_workers;
CREATE POLICY "Service role can insert support workers"
  ON support_workers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Migration completed
SELECT 'Schema mismatch fixes applied successfully' as status;
