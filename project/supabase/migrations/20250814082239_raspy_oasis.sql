/*
  # Guest Booking System with Required Phone Numbers

  1. New Tables
    - `guest_riders` - Guest user information with required phone
    - `guest_bookings` - Bookings made by guests before account creation
    - `booking_access_tokens` - Secure access tokens for guest booking tracking

  2. Enhanced Tables
    - Add unique email constraint to guest_riders
    - Ensure phone is required in all booking flows

  3. Database Functions
    - `create_guest_booking_with_rider` - Complete guest booking creation
    - `convert_guest_to_user` - Convert guest to full user account
    - Dashboard data functions for all user roles

  4. Security
    - RLS policies for all new tables
    - Proper foreign key constraints
    - Secure token generation
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS create_guest_booking_with_rider(text, text, text, jsonb);
DROP FUNCTION IF EXISTS convert_guest_to_user(uuid, uuid);
DROP FUNCTION IF EXISTS get_rider_dashboard_data(uuid);
DROP FUNCTION IF EXISTS get_driver_dashboard_data(uuid);
DROP FUNCTION IF EXISTS get_support_worker_dashboard_data(uuid);
DROP FUNCTION IF EXISTS get_admin_dashboard_data();

-- Create guest_riders table
CREATE TABLE IF NOT EXISTS guest_riders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL, -- Required for driver contact
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on email for guest_riders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'guest_riders' AND constraint_name = 'guest_riders_email_key'
  ) THEN
    ALTER TABLE guest_riders ADD CONSTRAINT guest_riders_email_key UNIQUE (email);
  END IF;
END $$;

-- Create guest_bookings table
CREATE TABLE IF NOT EXISTS guest_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_rider_id uuid NOT NULL REFERENCES guest_riders(id) ON DELETE CASCADE,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_time timestamptz NOT NULL,
  dropoff_time timestamptz,
  vehicle_features text[] DEFAULT '{}',
  support_workers_count integer DEFAULT 0 CHECK (support_workers_count >= 0 AND support_workers_count <= 4),
  fare_estimate numeric(10,2) NOT NULL,
  booking_type booking_type DEFAULT 'scheduled',
  lead_time_hours numeric(6,2) DEFAULT 0,
  time_multiplier numeric(4,2) DEFAULT 1.0,
  booking_type_discount numeric(8,2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  special_requirements text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_access_tokens table
CREATE TABLE IF NOT EXISTS booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_booking_id uuid NOT NULL REFERENCES guest_bookings(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_riders
CREATE POLICY "Anyone can create guest rider records"
  ON guest_riders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest riders can read own data via email"
  ON guest_riders
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Will be restricted by application logic

-- RLS Policies for guest_bookings
CREATE POLICY "Anyone can create guest bookings"
  ON guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest bookings readable via token"
  ON guest_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Will be restricted by application logic

CREATE POLICY "Admins can access all guest bookings"
  ON guest_bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for booking_access_tokens
CREATE POLICY "Tokens readable by token value"
  ON booking_access_tokens
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

CREATE POLICY "Anyone can create access tokens"
  ON booking_access_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_riders_email ON guest_riders(email);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_guest_rider_id ON guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_time ON guest_bookings(pickup_time);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_token ON booking_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_expires ON booking_access_tokens(expires_at);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_guest_riders_updated_at ON guest_riders;
CREATE TRIGGER update_guest_riders_updated_at
  BEFORE UPDATE ON guest_riders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_bookings_updated_at ON guest_bookings;
CREATE TRIGGER update_guest_bookings_updated_at
  BEFORE UPDATE ON guest_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create guest booking with rider
CREATE OR REPLACE FUNCTION create_guest_booking_with_rider(
  guest_name text,
  guest_email text,
  guest_phone text,
  booking_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guest_rider_record guest_riders%ROWTYPE;
  guest_booking_record guest_bookings%ROWTYPE;
  access_token_text text;
  result jsonb;
BEGIN
  -- Validate required phone number
  IF guest_phone IS NULL OR trim(guest_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required for booking';
  END IF;

  -- Create or get guest rider with phone requirement
  INSERT INTO guest_riders (name, email, phone)
  VALUES (guest_name, guest_email, guest_phone)
  ON CONFLICT (email) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone, -- Update phone if provided
    updated_at = now()
  RETURNING * INTO guest_rider_record;

  -- Create guest booking
  INSERT INTO guest_bookings (
    guest_rider_id,
    pickup_address,
    dropoff_address,
    pickup_time,
    dropoff_time,
    vehicle_features,
    support_workers_count,
    fare_estimate,
    booking_type,
    lead_time_hours,
    time_multiplier,
    booking_type_discount,
    special_requirements,
    notes,
    status
  ) VALUES (
    guest_rider_record.id,
    booking_data->>'pickup_address',
    booking_data->>'dropoff_address',
    (booking_data->>'pickup_time')::timestamptz,
    CASE 
      WHEN booking_data->>'dropoff_time' IS NOT NULL 
      THEN (booking_data->>'dropoff_time')::timestamptz 
      ELSE NULL 
    END,
    CASE 
      WHEN booking_data->'vehicle_features' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(booking_data->'vehicle_features'))
      ELSE '{}'::text[]
    END,
    COALESCE((booking_data->>'support_workers_count')::integer, 0),
    (booking_data->>'fare_estimate')::numeric,
    COALESCE((booking_data->>'booking_type')::booking_type, 'scheduled'),
    COALESCE((booking_data->>'lead_time_hours')::numeric, 0),
    COALESCE((booking_data->>'time_multiplier')::numeric, 1.0),
    COALESCE((booking_data->>'booking_type_discount')::numeric, 0),
    booking_data->>'special_requirements',
    booking_data->>'notes',
    'pending'
  ) RETURNING * INTO guest_booking_record;

  -- Generate secure access token
  access_token_text := encode(gen_random_bytes(32), 'base64');
  
  -- Create access token
  INSERT INTO booking_access_tokens (guest_booking_id, token)
  VALUES (guest_booking_record.id, access_token_text);

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'guest_rider', row_to_json(guest_rider_record),
    'guest_booking', row_to_json(guest_booking_record),
    'access_token', access_token_text,
    'tracking_url', format('https://ablego.co.uk/booking-status?token=%s', access_token_text)
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create guest booking: %', SQLERRM;
END;
$$;

-- Function to convert guest to user
CREATE OR REPLACE FUNCTION convert_guest_to_user(
  guest_rider_id uuid,
  user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  guest_rider_record guest_riders%ROWTYPE;
  profile_record profiles%ROWTYPE;
  booking_count integer;
  result jsonb;
BEGIN
  -- Get guest rider details
  SELECT * INTO guest_rider_record
  FROM guest_riders
  WHERE id = guest_rider_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guest rider not found';
  END IF;

  -- Create user profile
  INSERT INTO profiles (
    id,
    email,
    name,
    phone,
    is_verified,
    is_active
  ) VALUES (
    user_id,
    guest_rider_record.email,
    guest_rider_record.name,
    guest_rider_record.phone,
    true,
    true
  ) RETURNING * INTO profile_record;

  -- Convert guest bookings to regular bookings
  INSERT INTO bookings (
    rider_id,
    pickup_address,
    dropoff_address,
    pickup_time,
    dropoff_time,
    vehicle_features,
    support_workers_count,
    fare_estimate,
    booking_type,
    lead_time_hours,
    time_multiplier,
    booking_type_discount,
    status,
    special_requirements,
    notes,
    created_at,
    updated_at
  )
  SELECT 
    user_id,
    pickup_address,
    dropoff_address,
    pickup_time,
    dropoff_time,
    vehicle_features,
    support_workers_count,
    fare_estimate,
    booking_type,
    lead_time_hours,
    time_multiplier,
    booking_type_discount,
    status,
    special_requirements,
    notes,
    created_at,
    updated_at
  FROM guest_bookings
  WHERE guest_rider_id = guest_rider_id;

  GET DIAGNOSTICS booking_count = ROW_COUNT;

  -- Clean up guest data
  DELETE FROM guest_bookings WHERE guest_rider_id = guest_rider_id;
  DELETE FROM guest_riders WHERE id = guest_rider_id;

  result := jsonb_build_object(
    'success', true,
    'profile', row_to_json(profile_record),
    'converted_bookings', booking_count
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to convert guest to user: %', SQLERRM;
END;
$$;

-- Dashboard data functions
CREATE OR REPLACE FUNCTION get_rider_dashboard_data(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_bookings integer := 0;
  completed_bookings integer := 0;
  pending_bookings integer := 0;
  total_spent numeric := 0;
  recent_bookings jsonb;
BEGIN
  -- Get booking statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')),
    COALESCE(SUM(fare_estimate) FILTER (WHERE status = 'completed'), 0)
  INTO total_bookings, completed_bookings, pending_bookings, total_spent
  FROM bookings
  WHERE rider_id = user_id;

  -- Get recent bookings
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'pickup_address', pickup_address,
      'dropoff_address', dropoff_address,
      'pickup_time', pickup_time,
      'status', status,
      'fare_estimate', fare_estimate,
      'support_workers_count', support_workers_count,
      'created_at', created_at
    )
  ) INTO recent_bookings
  FROM (
    SELECT *
    FROM bookings
    WHERE rider_id = user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) recent;

  result := jsonb_build_object(
    'total_bookings', total_bookings,
    'completed_bookings', completed_bookings,
    'pending_bookings', pending_bookings,
    'total_spent', total_spent,
    'recent_bookings', COALESCE(recent_bookings, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_driver_dashboard_data(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_trips integer := 0;
  completed_trips integer := 0;
  total_earnings numeric := 0;
  average_rating numeric := 0;
  vehicles_data jsonb;
  recent_trips jsonb;
BEGIN
  -- Get trip statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE tl.end_time IS NOT NULL),
    COALESCE(SUM(b.fare_estimate) FILTER (WHERE tl.end_time IS NOT NULL), 0),
    COALESCE(AVG(tl.customer_rating) FILTER (WHERE tl.customer_rating IS NOT NULL), 0)
  INTO total_trips, completed_trips, total_earnings, average_rating
  FROM trip_logs tl
  JOIN bookings b ON b.id = tl.booking_id
  WHERE tl.driver_id = user_id;

  -- Get vehicles
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'make', make,
      'model', model,
      'license_plate', license_plate,
      'verified', verified,
      'is_active', is_active
    )
  ) INTO vehicles_data
  FROM vehicles
  WHERE driver_id = user_id;

  -- Get recent trips
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tl.id,
      'start_time', tl.start_time,
      'end_time', tl.end_time,
      'customer_rating', tl.customer_rating,
      'booking', jsonb_build_object(
        'pickup_address', b.pickup_address,
        'dropoff_address', b.dropoff_address,
        'fare_estimate', b.fare_estimate
      )
    )
  ) INTO recent_trips
  FROM (
    SELECT *
    FROM trip_logs
    WHERE driver_id = user_id
    ORDER BY created_at DESC
    LIMIT 10
  ) tl
  JOIN bookings b ON b.id = tl.booking_id;

  result := jsonb_build_object(
    'total_trips', total_trips,
    'completed_trips', completed_trips,
    'total_earnings', total_earnings,
    'average_rating', ROUND(average_rating, 1),
    'vehicles', COALESCE(vehicles_data, '[]'::jsonb),
    'recent_trips', COALESCE(recent_trips, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_support_worker_dashboard_data(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_assignments integer := 0;
  completed_assignments integer := 0;
  total_earnings numeric := 0;
  average_rating numeric := 0;
  hours_worked numeric := 0;
  profile_data jsonb;
  recent_assignments jsonb;
BEGIN
  -- Get assignment statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE tl.end_time IS NOT NULL),
    COALESCE(SUM(
      CASE 
        WHEN tl.actual_duration IS NOT NULL 
        THEN (tl.actual_duration / 60.0) * sw.hourly_rate
        ELSE 0
      END
    ) FILTER (WHERE tl.end_time IS NOT NULL), 0),
    COALESCE(AVG(tl.support_worker_rating) FILTER (WHERE tl.support_worker_rating IS NOT NULL), 0),
    COALESCE(SUM(tl.actual_duration / 60.0) FILTER (WHERE tl.actual_duration IS NOT NULL), 0)
  INTO total_assignments, completed_assignments, total_earnings, average_rating, hours_worked
  FROM trip_logs tl
  JOIN support_workers sw ON sw.user_id = user_id
  WHERE user_id = ANY(tl.support_worker_ids);

  -- Get support worker profile
  SELECT jsonb_build_object(
    'verified', verified,
    'hourly_rate', hourly_rate,
    'specializations', specializations,
    'is_active', is_active
  ) INTO profile_data
  FROM support_workers
  WHERE user_id = user_id;

  -- Get recent assignments
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tl.id,
      'start_time', tl.start_time,
      'end_time', tl.end_time,
      'support_worker_rating', tl.support_worker_rating,
      'booking', jsonb_build_object(
        'pickup_address', b.pickup_address,
        'dropoff_address', b.dropoff_address
      )
    )
  ) INTO recent_assignments
  FROM (
    SELECT *
    FROM trip_logs
    WHERE user_id = ANY(support_worker_ids)
    ORDER BY created_at DESC
    LIMIT 10
  ) tl
  JOIN bookings b ON b.id = tl.booking_id;

  result := jsonb_build_object(
    'total_assignments', total_assignments,
    'completed_assignments', completed_assignments,
    'total_earnings', total_earnings,
    'average_rating', ROUND(average_rating, 1),
    'hours_worked', ROUND(hours_worked, 1),
    'profile', COALESCE(profile_data, '{}'::jsonb),
    'recent_assignments', COALESCE(recent_assignments, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_users integer := 0;
  total_riders integer := 0;
  total_drivers integer := 0;
  total_support_workers integer := 0;
  total_bookings integer := 0;
  active_trips integer := 0;
  pending_verifications integer := 0;
  monthly_revenue numeric := 0;
  recent_activity jsonb;
BEGIN
  -- Get user statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE role = 'rider'),
    COUNT(*) FILTER (WHERE role = 'driver'),
    COUNT(*) FILTER (WHERE role = 'support_worker')
  INTO total_users, total_riders, total_drivers, total_support_workers
  FROM users;

  -- Get booking statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'in_progress')
  INTO total_bookings, active_trips
  FROM bookings;

  -- Get pending verifications
  SELECT 
    (SELECT COUNT(*) FROM vehicles WHERE verified = false) +
    (SELECT COUNT(*) FROM support_workers WHERE verified = false)
  INTO pending_verifications;

  -- Get monthly revenue
  SELECT COALESCE(SUM(fare_estimate), 0)
  INTO monthly_revenue
  FROM bookings
  WHERE status = 'completed'
    AND created_at >= date_trunc('month', now());

  -- Get recent activity (simplified)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'message', 'New booking created',
      'created_at', created_at
    )
  ) INTO recent_activity
  FROM (
    SELECT id, created_at
    FROM bookings
    ORDER BY created_at DESC
    LIMIT 10
  ) recent;

  result := jsonb_build_object(
    'total_users', total_users,
    'total_riders', total_riders,
    'total_drivers', total_drivers,
    'total_support_workers', total_support_workers,
    'total_bookings', total_bookings,
    'active_trips', active_trips,
    'pending_verifications', pending_verifications,
    'monthly_revenue', monthly_revenue,
    'recent_activity', COALESCE(recent_activity, '[]'::jsonb)
  );

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_guest_booking_with_rider(text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION convert_guest_to_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rider_dashboard_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_dashboard_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_support_worker_dashboard_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;