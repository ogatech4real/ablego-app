/*
  # AbleGo Core Database Schema

  1. New Tables
    - `users` - Core user authentication data
    - `profiles` - Extended user profile information
    - `bookings` - Trip booking records with multi-stop support
    - `stops` - Individual stops within bookings
    - `support_workers` - Support worker profiles and certifications
    - `vehicles` - Vehicle registration and accessibility features
    - `trip_logs` - Completed trip records and analytics
    - `pricing_logs` - Fare calculations and breakdowns
    - `notifications` - User notification system

  2. Security
    - Enable RLS on all tables
    - Role-based access policies (rider, driver, support_worker, admin)
    - Users can only access their own data
    - Admins have full access

  3. Features
    - Multi-stop booking support
    - Real-time trip tracking
    - Comprehensive pricing system
    - Support worker verification
    - Vehicle accessibility ratings
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('rider', 'driver', 'support_worker', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('booking_request', 'trip_update', 'payment', 'system', 'emergency');

-- Core users table (minimal auth data)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'rider',
  created_at timestamptz DEFAULT now()
);

-- Extended profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  address text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  accessibility_requirements text[],
  profile_image_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_time timestamptz NOT NULL,
  dropoff_time timestamptz,
  vehicle_features text[] DEFAULT '{}',
  support_workers_count integer DEFAULT 0 CHECK (support_workers_count >= 0 AND support_workers_count <= 4),
  fare_estimate decimal(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  special_requirements text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stops table (linked to bookings)
CREATE TABLE IF NOT EXISTS stops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  order_index integer NOT NULL CHECK (order_index >= 0),
  stop_address text NOT NULL,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, order_index)
);

-- Support workers table
CREATE TABLE IF NOT EXISTS support_workers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  availability jsonb DEFAULT '{}',
  bio text,
  verified boolean DEFAULT false,
  certifications text[] DEFAULT '{}',
  dbs_uploaded boolean DEFAULT false,
  dbs_expiry_date date,
  hourly_rate decimal(6,2) DEFAULT 18.50,
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{"English"}',
  experience_years integer DEFAULT 0,
  current_location_lat decimal(10,8),
  current_location_lng decimal(11,8),
  last_location_update timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  license_plate text NOT NULL UNIQUE,
  color text NOT NULL,
  features text[] DEFAULT '{}',
  photo_url text,
  verified boolean DEFAULT false,
  accessible_rating integer DEFAULT 1 CHECK (accessible_rating >= 1 AND accessible_rating <= 5),
  insurance_uploaded boolean DEFAULT false,
  insurance_expiry_date date,
  mot_expiry_date date,
  passenger_capacity integer DEFAULT 4 CHECK (passenger_capacity >= 1 AND passenger_capacity <= 8),
  wheelchair_capacity integer DEFAULT 0 CHECK (wheelchair_capacity >= 0 AND wheelchair_capacity <= 2),
  current_location_lat decimal(10,8),
  current_location_lng decimal(11,8),
  last_location_update timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip logs table
CREATE TABLE IF NOT EXISTS trip_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES users(id),
  vehicle_id uuid REFERENCES vehicles(id),
  support_worker_ids uuid[] DEFAULT '{}',
  start_time timestamptz,
  end_time timestamptz,
  actual_duration integer, -- minutes
  actual_distance decimal(8,2), -- miles
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  dropoff_lat decimal(10,8),
  dropoff_lng decimal(11,8),
  route_data jsonb,
  driver_notes text,
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  driver_rating integer CHECK (driver_rating >= 1 AND driver_rating <= 5),
  support_worker_rating integer CHECK (support_worker_rating >= 1 AND support_worker_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Pricing logs table
CREATE TABLE IF NOT EXISTS pricing_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  calculated_fare decimal(10,2) NOT NULL,
  breakdown_json jsonb NOT NULL,
  peak_multiplier decimal(4,2) DEFAULT 1.0,
  duration_modifier decimal(4,2) DEFAULT 1.0,
  base_fare decimal(6,2) NOT NULL,
  distance_cost decimal(8,2) NOT NULL,
  vehicle_features_cost decimal(8,2) DEFAULT 0,
  support_workers_cost decimal(8,2) DEFAULT 0,
  peak_time_surcharge decimal(8,2) DEFAULT 0,
  is_estimated boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  data jsonb DEFAULT '{}',
  sent boolean DEFAULT false,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  read_at timestamptz
);

-- Additional tables for comprehensive functionality

-- Trip tracking for real-time location updates
CREATE TABLE IF NOT EXISTS trip_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_log_id uuid REFERENCES trip_logs(id) ON DELETE CASCADE,
  lat decimal(10,8) NOT NULL,
  lng decimal(11,8) NOT NULL,
  speed_mph decimal(5,2),
  heading decimal(5,2),
  accuracy_meters decimal(8,2),
  timestamp timestamptz DEFAULT now()
);

-- Support worker certifications
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_worker_id uuid NOT NULL REFERENCES support_workers(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  certification_name text NOT NULL,
  issuing_authority text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  certificate_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Vehicle insurance records
CREATE TABLE IF NOT EXISTS vehicle_insurance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  policy_number text NOT NULL,
  provider text NOT NULL,
  coverage_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  document_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  amount_gbp decimal(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_fee decimal(8,2),
  net_amount decimal(10,2),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_rider_id ON bookings(rider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_time ON bookings(pickup_time);
CREATE INDEX IF NOT EXISTS idx_stops_booking_id ON stops(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_booking_id ON trip_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_driver_id ON trip_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(current_location_lat, current_location_lng);
CREATE INDEX IF NOT EXISTS idx_support_workers_location ON support_workers(current_location_lat, current_location_lng);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for profiles table
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bookings table
CREATE POLICY "Riders can read own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Riders can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Riders can update own bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Drivers can read assigned bookings" ON bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_logs 
      WHERE trip_logs.booking_id = bookings.id 
      AND trip_logs.driver_id = auth.uid()
    )
  );

CREATE POLICY "Support workers can read assigned bookings" ON bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_logs 
      WHERE trip_logs.booking_id = bookings.id 
      AND auth.uid() = ANY(trip_logs.support_worker_ids)
    )
  );

CREATE POLICY "Admins can access all bookings" ON bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for stops table
CREATE POLICY "Users can read stops for their bookings" ON stops
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = stops.booking_id 
      AND (
        bookings.rider_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_logs 
          WHERE trip_logs.booking_id = bookings.id 
          AND (trip_logs.driver_id = auth.uid() OR auth.uid() = ANY(trip_logs.support_worker_ids))
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Riders can manage stops for their bookings" ON stops
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = stops.booking_id 
      AND bookings.rider_id = auth.uid()
    )
  );

-- RLS Policies for support_workers table
CREATE POLICY "Support workers can read own data" ON support_workers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Support workers can update own data" ON support_workers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Support workers can insert own data" ON support_workers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read verified support workers" ON support_workers
  FOR SELECT TO authenticated
  USING (verified = true AND is_active = true);

CREATE POLICY "Admins can access all support workers" ON support_workers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for vehicles table
CREATE POLICY "Drivers can read own vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can manage own vehicles" ON vehicles
  FOR ALL TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Public can read verified vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (verified = true AND is_active = true);

CREATE POLICY "Admins can access all vehicles" ON vehicles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for trip_logs table
CREATE POLICY "Users can read their trip logs" ON trip_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = trip_logs.booking_id 
      AND bookings.rider_id = auth.uid()
    ) OR
    auth.uid() = driver_id OR
    auth.uid() = ANY(support_worker_ids)
  );

CREATE POLICY "Drivers can update their trip logs" ON trip_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create trip logs" ON trip_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can access all trip logs" ON trip_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for pricing_logs table
CREATE POLICY "Users can read pricing for their bookings" ON pricing_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = pricing_logs.booking_id 
      AND (
        bookings.rider_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_logs 
          WHERE trip_logs.booking_id = bookings.id 
          AND (trip_logs.driver_id = auth.uid() OR auth.uid() = ANY(trip_logs.support_worker_ids))
        )
      )
    )
  );

CREATE POLICY "System can create pricing logs" ON pricing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can access all pricing logs" ON pricing_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can access all notifications" ON notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for trip_tracking table
CREATE POLICY "Users can read tracking for their trips" ON trip_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_logs 
      JOIN bookings ON bookings.id = trip_logs.booking_id
      WHERE trip_logs.id = trip_tracking.trip_log_id 
      AND (
        bookings.rider_id = auth.uid() OR
        trip_logs.driver_id = auth.uid() OR
        auth.uid() = ANY(trip_logs.support_worker_ids)
      )
    )
  );

CREATE POLICY "Drivers can create tracking data" ON trip_tracking
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_logs 
      WHERE trip_logs.id = trip_tracking.trip_log_id 
      AND trip_logs.driver_id = auth.uid()
    )
  );

-- RLS Policies for certifications table
CREATE POLICY "Support workers can read own certifications" ON certifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_workers 
      WHERE support_workers.id = certifications.support_worker_id 
      AND support_workers.user_id = auth.uid()
    )
  );

CREATE POLICY "Support workers can manage own certifications" ON certifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_workers 
      WHERE support_workers.id = certifications.support_worker_id 
      AND support_workers.user_id = auth.uid()
    )
  );

-- RLS Policies for vehicle_insurance table
CREATE POLICY "Drivers can read own vehicle insurance" ON vehicle_insurance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vehicle_insurance.vehicle_id 
      AND vehicles.driver_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can manage own vehicle insurance" ON vehicle_insurance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles 
      WHERE vehicles.id = vehicle_insurance.vehicle_id 
      AND vehicles.driver_id = auth.uid()
    )
  );

-- RLS Policies for payment_transactions table
CREATE POLICY "Users can read their payment transactions" ON payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payment_transactions.booking_id 
      AND bookings.rider_id = auth.uid()
    )
  );

CREATE POLICY "System can create payment transactions" ON payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can access all payment transactions" ON payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_support_workers_updated_at BEFORE UPDATE ON support_workers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();