-- Fix Guest Bookings Tables - Production Database
-- This script ensures all required tables exist with proper structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create guest_riders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guest_riders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linked_user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guest_bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_rider_id uuid NOT NULL,
  linked_user_id uuid,
  pickup_address text NOT NULL,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  pickup_postcode text,
  pickup_place_id text,
  dropoff_address text NOT NULL,
  dropoff_lat decimal(10,8),
  dropoff_lng decimal(11,8),
  dropoff_postcode text,
  dropoff_place_id text,
  pickup_time timestamptz NOT NULL,
  dropoff_time timestamptz,
  vehicle_features text[] DEFAULT '{}',
  support_workers_count integer DEFAULT 0,
  fare_estimate numeric(10,2) NOT NULL,
  booking_type text DEFAULT 'scheduled',
  lead_time_hours numeric(6,2) DEFAULT 0,
  time_multiplier numeric(4,2) DEFAULT 1.0,
  booking_type_discount numeric(8,2) DEFAULT 0,
  status text DEFAULT 'pending',
  special_requirements text,
  notes text,
  payment_method text DEFAULT 'cash_bank',
  account_linked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_access_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_booking_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to guest_riders if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_riders' AND column_name = 'linked_user_id'
  ) THEN
    ALTER TABLE public.guest_riders ADD COLUMN linked_user_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_riders' AND column_name = 'account_created_at'
  ) THEN
    ALTER TABLE public.guest_riders ADD COLUMN account_created_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add missing columns to guest_bookings if they don't exist
DO $$
BEGIN
  -- Add linked_user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'linked_user_id'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN linked_user_id UUID;
  END IF;

  -- Add coordinate columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lat'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN pickup_lat DECIMAL(10,8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lng'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN pickup_lng DECIMAL(11,8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lat'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN dropoff_lat DECIMAL(10,8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lng'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN dropoff_lng DECIMAL(11,8);
  END IF;

  -- Add postcode columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_postcode'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN pickup_postcode TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_postcode'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN dropoff_postcode TEXT;
  END IF;

  -- Add Google Place ID columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_place_id'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN pickup_place_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_place_id'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN dropoff_place_id TEXT;
  END IF;

  -- Add account linking timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'account_linked_at'
  ) THEN
    ALTER TABLE public.guest_bookings ADD COLUMN account_linked_at TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can create guest rider records" ON public.guest_riders;
DROP POLICY IF EXISTS "Guest riders can read own data via email" ON public.guest_riders;
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON public.guest_bookings;
DROP POLICY IF EXISTS "Guest bookings readable via token" ON public.guest_bookings;
DROP POLICY IF EXISTS "Admins can access all guest bookings" ON public.guest_bookings;
DROP POLICY IF EXISTS "Tokens readable by token value" ON public.booking_access_tokens;
DROP POLICY IF EXISTS "Anyone can create access tokens" ON public.booking_access_tokens;

-- Create RLS policies for guest_riders
CREATE POLICY "Anyone can create guest rider records"
  ON public.guest_riders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest riders can read own data via email"
  ON public.guest_riders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create RLS policies for guest_bookings
CREATE POLICY "Anyone can create guest bookings"
  ON public.guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest bookings readable via token"
  ON public.guest_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can access all guest bookings"
  ON public.guest_bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create RLS policies for booking_access_tokens
CREATE POLICY "Tokens readable by token value"
  ON public.booking_access_tokens
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

CREATE POLICY "Anyone can create access tokens"
  ON public.booking_access_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_riders_email ON public.guest_riders(email);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_guest_rider_id ON public.guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON public.guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_time ON public.guest_bookings(pickup_time);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_token ON public.booking_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_expires ON public.booking_access_tokens(expires_at);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.guest_riders TO anon, authenticated;
GRANT ALL ON public.guest_bookings TO anon, authenticated;
GRANT ALL ON public.booking_access_tokens TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Guest bookings tables fix completed successfully';
  RAISE LOG 'All required tables have been created/updated';
  RAISE LOG 'RLS policies and indexes have been created';
  RAISE LOG 'Permissions have been granted to anon and authenticated roles';
END $$;
