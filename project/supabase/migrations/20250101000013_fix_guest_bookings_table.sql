/*
  # Fix Guest Bookings Table - Ensure All Required Columns Exist
  
  This migration ensures that the guest_bookings table exists with all
  required columns that the Edge Function expects.
*/

-- First, ensure the guest_bookings table exists with basic structure
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_rider_id uuid NOT NULL,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
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

-- Ensure guest_riders table exists
CREATE TABLE IF NOT EXISTS public.guest_riders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linked_user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- Ensure booking_access_tokens table exists
CREATE TABLE IF NOT EXISTS public.booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_booking_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Anyone can create guest rider records" ON public.guest_riders;
CREATE POLICY "Anyone can create guest rider records"
  ON public.guest_riders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create guest bookings" ON public.guest_bookings;
CREATE POLICY "Anyone can create guest bookings"
  ON public.guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create access tokens" ON public.booking_access_tokens;
CREATE POLICY "Anyone can create access tokens"
  ON public.booking_access_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guest_riders_email ON public.guest_riders(email);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_guest_rider_id ON public.guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON public.guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_token ON public.booking_access_tokens(token);

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Guest bookings table fix migration completed successfully';
  RAISE LOG 'All required columns have been added to guest_bookings table';
  RAISE LOG 'RLS policies and indexes have been created';
END $$;
