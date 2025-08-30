/*
  # Complete Database Rebuild - All Tables from Code Analysis
  
  This migration rebuilds ALL database tables based on comprehensive analysis
  of all forms, components, and database interactions across the entire project.
  
  Tables identified from code analysis:
  - Core: users, profiles, guest_riders, guest_bookings
  - Booking: bookings, stops, booking_access_tokens, booking_assignments
  - Service: vehicles, support_workers, driver_applications, support_worker_applications
  - Trip: trip_logs, trip_tracking, pricing_logs
  - Payment: payment_transactions, payment_splits, earnings_summary
  - Communication: notifications, admin_email_notifications, email_templates, newsletter_subscribers
  - Additional: certifications, vehicle_insurance
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS vehicle_insurance CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS earnings_summary CASCADE;
DROP TABLE IF EXISTS payment_splits CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS trip_tracking CASCADE;
DROP TABLE IF EXISTS pricing_logs CASCADE;
DROP TABLE IF EXISTS trip_logs CASCADE;
DROP TABLE IF EXISTS booking_assignments CASCADE;
DROP TABLE IF EXISTS booking_access_tokens CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS guest_bookings CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS support_worker_applications CASCADE;
DROP TABLE IF EXISTS driver_applications CASCADE;
DROP TABLE IF EXISTS support_workers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS admin_email_notifications CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS guest_riders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS email_delivery_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS email_type CASCADE;
DROP TYPE IF EXISTS email_status CASCADE;

-- Create all enum types
CREATE TYPE user_role AS ENUM ('rider', 'driver', 'support_worker', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('booking_request', 'trip_update', 'payment', 'system', 'emergency');
CREATE TYPE email_delivery_status AS ENUM ('pending', 'processing', 'sent', 'delivered', 'failed', 'bounced', 'retry_scheduled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE email_type AS ENUM ('booking_invoice', 'payment_receipt', 'driver_assignment', 'trip_update', 'trip_completion', 'admin_notification', 'system_alert');
CREATE TYPE email_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced');

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Core users table (minimal auth data)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'rider',
  created_at timestamptz DEFAULT now()
);

-- Extended profiles table
CREATE TABLE profiles (
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

-- Guest riders table (for non-registered users)
CREATE TABLE guest_riders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linked_user_id uuid REFERENCES users(id),
  account_created_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- ============================================================================
-- BOOKING SYSTEM TABLES
-- ============================================================================

-- Registered user bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  support_workers_count integer DEFAULT 0 CHECK (support_workers_count >= 0 AND support_workers_count <= 4),
  fare_estimate decimal(10,2) NOT NULL,
  booking_type text DEFAULT 'scheduled',
  lead_time_hours numeric(6,2) DEFAULT 0,
  time_multiplier numeric(4,2) DEFAULT 1.0,
  booking_type_discount numeric(8,2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  special_requirements text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guest bookings table
CREATE TABLE guest_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_rider_id uuid NOT NULL REFERENCES guest_riders(id) ON DELETE CASCADE,
  linked_user_id uuid REFERENCES users(id),
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
  support_workers_count integer DEFAULT 0 CHECK (support_workers_count >= 0 AND support_workers_count <= 4),
  fare_estimate numeric(10,2) NOT NULL,
  booking_type text DEFAULT 'scheduled',
  lead_time_hours numeric(6,2) DEFAULT 0,
  time_multiplier numeric(4,2) DEFAULT 1.0,
  booking_type_discount numeric(8,2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  special_requirements text,
  notes text,
  payment_method text DEFAULT 'cash_bank',
  account_linked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stops table (linked to bookings)
CREATE TABLE stops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  order_index integer NOT NULL CHECK (order_index >= 0),
  stop_address text NOT NULL,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, order_index)
);

-- Booking access tokens table
CREATE TABLE booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_booking_id uuid NOT NULL REFERENCES guest_bookings(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Booking assignments table
CREATE TABLE booking_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('user', 'guest')),
  driver_id uuid REFERENCES users(id),
  support_worker_ids uuid[] DEFAULT '{}',
  assigned_by uuid REFERENCES users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SERVICE PROVIDER TABLES
-- ============================================================================

-- Vehicles table
CREATE TABLE vehicles (
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
  stripe_account_id text,
  stripe_account_status text DEFAULT 'pending',
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support workers table
CREATE TABLE support_workers (
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
  stripe_account_id text,
  stripe_account_status text DEFAULT 'pending',
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Driver applications table
CREATE TABLE driver_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  address text,
  license_number text NOT NULL,
  license_expiry_date date NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL,
  license_plate text NOT NULL,
  vehicle_color text NOT NULL,
  years_of_experience integer DEFAULT 0,
  motivation text,
  application_type text DEFAULT 'driver' CHECK (application_type = 'driver'),
  status application_status DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support worker applications table
CREATE TABLE support_worker_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  address text,
  experience_years integer DEFAULT 0,
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{"English"}',
  desired_hourly_rate decimal(6,2) DEFAULT 18.50,
  motivation text,
  application_type text DEFAULT 'support_worker' CHECK (application_type = 'support_worker'),
  status application_status DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TRIP MANAGEMENT TABLES
-- ============================================================================

-- Trip logs table
CREATE TABLE trip_logs (
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

-- Trip tracking table
CREATE TABLE trip_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL REFERENCES trip_logs(id) ON DELETE CASCADE,
  lat decimal(10,8) NOT NULL,
  lng decimal(11,8) NOT NULL,
  speed_mph decimal(5,2),
  heading decimal(5,2),
  accuracy_meters decimal(6,2),
  timestamp timestamptz DEFAULT now()
);

-- Pricing logs table
CREATE TABLE pricing_logs (
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

-- ============================================================================
-- PAYMENT SYSTEM TABLES
-- ============================================================================

-- Payment transactions table
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('user', 'guest')),
  amount_gbp decimal(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  status payment_status DEFAULT 'pending',
  payment_method text NOT NULL,
  stripe_payment_intent_id text,
  transaction_fee decimal(8,2) DEFAULT 0,
  net_amount decimal(10,2),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Payment splits table
CREATE TABLE payment_splits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_transaction_id uuid NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('driver', 'support_worker', 'platform')),
  recipient_id uuid,
  amount_gbp decimal(10,2) NOT NULL,
  percentage decimal(5,2) NOT NULL,
  stripe_transfer_id text,
  transferred_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Earnings summary table
CREATE TABLE earnings_summary (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_earnings decimal(10,2) NOT NULL,
  total_trips integer NOT NULL,
  total_hours decimal(6,2),
  platform_fees decimal(8,2) DEFAULT 0,
  net_earnings decimal(10,2) NOT NULL,
  paid_out boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
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

-- Admin email notifications table
CREATE TABLE admin_email_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  booking_id uuid,
  notification_type text DEFAULT 'system',
  email_type email_type DEFAULT 'admin_notification',
  email_status email_status DEFAULT 'queued',
  priority integer DEFAULT 3,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  delivery_status email_delivery_status DEFAULT 'pending',
  delivery_error text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  last_retry_at timestamptz,
  processing_attempts integer DEFAULT 0,
  delivery_status_details jsonb DEFAULT '{}',
  template_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email templates table
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name text UNIQUE NOT NULL,
  email_type email_type NOT NULL,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  variables jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'website',
  preferences jsonb DEFAULT '{"marketing": true, "updates": true, "stories": true}',
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ADDITIONAL TABLES
-- ============================================================================

-- Certifications table
CREATE TABLE certifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_worker_id uuid NOT NULL REFERENCES support_workers(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  certification_name text NOT NULL,
  issuing_organization text,
  issue_date date,
  expiry_date date,
  certificate_url text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Vehicle insurance table
CREATE TABLE vehicle_insurance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  insurance_provider text NOT NULL,
  policy_number text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  coverage_type text NOT NULL,
  document_url text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and profile indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_guest_riders_email ON guest_riders(email);

-- Booking indexes
CREATE INDEX idx_bookings_rider_id ON bookings(rider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_time ON bookings(pickup_time);
CREATE INDEX idx_bookings_pickup_coords ON bookings(pickup_lat, pickup_lng);
CREATE INDEX idx_bookings_dropoff_coords ON bookings(dropoff_lat, dropoff_lng);
CREATE INDEX idx_bookings_pickup_postcode ON bookings(pickup_postcode);
CREATE INDEX idx_bookings_dropoff_postcode ON bookings(dropoff_postcode);

CREATE INDEX idx_guest_bookings_guest_rider_id ON guest_bookings(guest_rider_id);
CREATE INDEX idx_guest_bookings_status ON guest_bookings(status);
CREATE INDEX idx_guest_bookings_pickup_time ON guest_bookings(pickup_time);
CREATE INDEX idx_guest_bookings_pickup_coords ON guest_bookings(pickup_lat, pickup_lng);
CREATE INDEX idx_guest_bookings_dropoff_coords ON guest_bookings(dropoff_lat, dropoff_lng);
CREATE INDEX idx_guest_bookings_pickup_postcode ON guest_bookings(pickup_postcode);
CREATE INDEX idx_guest_bookings_dropoff_postcode ON guest_bookings(dropoff_postcode);

-- Stops and tokens indexes
CREATE INDEX idx_stops_booking_id ON stops(booking_id);
CREATE INDEX idx_booking_access_tokens_token ON booking_access_tokens(token);
CREATE INDEX idx_booking_access_tokens_expires ON booking_access_tokens(expires_at);

-- Service provider indexes
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_location ON vehicles(current_location_lat, current_location_lng);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

CREATE INDEX idx_support_workers_user_id ON support_workers(user_id);
CREATE INDEX idx_support_workers_location ON support_workers(current_location_lat, current_location_lng);

-- Application indexes
CREATE INDEX idx_driver_applications_email ON driver_applications(email);
CREATE INDEX idx_driver_applications_status ON driver_applications(status);
CREATE INDEX idx_support_worker_applications_email ON support_worker_applications(email);
CREATE INDEX idx_support_worker_applications_status ON support_worker_applications(status);

-- Trip indexes
CREATE INDEX idx_trip_logs_booking_id ON trip_logs(booking_id);
CREATE INDEX idx_trip_logs_driver_id ON trip_logs(driver_id);
CREATE INDEX idx_trip_tracking_trip_id ON trip_tracking(trip_id);
CREATE INDEX idx_trip_tracking_timestamp ON trip_tracking(timestamp);

-- Payment indexes
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_splits_transaction_id ON payment_splits(payment_transaction_id);
CREATE INDEX idx_earnings_summary_user_id ON earnings_summary(user_id);
CREATE INDEX idx_earnings_summary_period ON earnings_summary(period_start, period_end);

-- Communication indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent ON notifications(sent);
CREATE INDEX idx_admin_email_notifications_sent_status ON admin_email_notifications(sent, delivery_status);
CREATE INDEX idx_admin_email_notifications_retry ON admin_email_notifications(retry_count, last_retry_at);
CREATE INDEX idx_admin_email_notifications_created_at ON admin_email_notifications(created_at);
CREATE INDEX idx_admin_email_notifications_notification_type ON admin_email_notifications(notification_type);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_insurance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users table policies
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

-- Profiles table policies
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

-- Guest riders policies
CREATE POLICY "Anyone can create guest rider records"
  ON guest_riders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest riders can read own data via email"
  ON guest_riders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Bookings policies
CREATE POLICY "Riders can read own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Riders can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Riders can update own bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Admins can access all bookings" ON bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Guest bookings policies
CREATE POLICY "Anyone can create guest bookings"
  ON guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest bookings readable via token"
  ON guest_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can access all guest bookings"
  ON guest_bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Booking access tokens policies
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

-- Admin email notifications policies
CREATE POLICY "Admin can manage email notifications"
  ON admin_email_notifications
  FOR ALL
  TO authenticated
  USING (true);

-- Newsletter subscribers policies
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can manage own subscription"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to anon and authenticated roles
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON guest_riders TO anon, authenticated;
GRANT ALL ON bookings TO anon, authenticated;
GRANT ALL ON guest_bookings TO anon, authenticated;
GRANT ALL ON stops TO anon, authenticated;
GRANT ALL ON booking_access_tokens TO anon, authenticated;
GRANT ALL ON booking_assignments TO anon, authenticated;
GRANT ALL ON vehicles TO anon, authenticated;
GRANT ALL ON support_workers TO anon, authenticated;
GRANT ALL ON driver_applications TO anon, authenticated;
GRANT ALL ON support_worker_applications TO anon, authenticated;
GRANT ALL ON trip_logs TO anon, authenticated;
GRANT ALL ON trip_tracking TO anon, authenticated;
GRANT ALL ON pricing_logs TO anon, authenticated;
GRANT ALL ON payment_transactions TO anon, authenticated;
GRANT ALL ON payment_splits TO anon, authenticated;
GRANT ALL ON earnings_summary TO anon, authenticated;
GRANT ALL ON notifications TO anon, authenticated;
GRANT ALL ON admin_email_notifications TO anon, authenticated;
GRANT ALL ON email_templates TO anon, authenticated;
GRANT ALL ON newsletter_subscribers TO anon, authenticated;
GRANT ALL ON certifications TO anon, authenticated;
GRANT ALL ON vehicle_insurance TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role;

  -- Insert into profiles table
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    phone, 
    is_verified, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    true, 
    NOW(), 
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    phone = COALESCE(profiles.phone, EXCLUDED.phone),
    is_verified = COALESCE(EXCLUDED.is_verified, profiles.is_verified),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger email processing
CREATE OR REPLACE FUNCTION trigger_email_queue_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new emails that are not sent
  IF NEW.sent = false AND NEW.delivery_status = 'pending' THEN
    -- Call the process-email-queue function asynchronously
    PERFORM net.http_post(
      url := 'https://myutbivamzrfccoljilo.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json',
        'X-Client-Info', 'supabase-js/2.0.0'
      ),
      body := '{}'
    );
    
    -- Log the trigger
    RAISE LOG 'Email processing triggered for email ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error triggering email processing: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS trigger_email_queue_processing ON admin_email_notifications;
CREATE TRIGGER trigger_email_queue_processing
  AFTER INSERT ON admin_email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_queue_processing();

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_riders_updated_at ON guest_riders;
CREATE TRIGGER update_guest_riders_updated_at
  BEFORE UPDATE ON guest_riders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_bookings_updated_at ON guest_bookings;
CREATE TRIGGER update_guest_bookings_updated_at
  BEFORE UPDATE ON guest_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT FUNCTION PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_email_queue_processing() TO authenticated;

-- ============================================================================
-- LOG COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE LOG 'Complete database rebuild completed successfully';
  RAISE LOG 'Created all tables: users, profiles, guest_riders, guest_bookings, bookings, stops, booking_access_tokens, booking_assignments, vehicles, support_workers, driver_applications, support_worker_applications, trip_logs, trip_tracking, pricing_logs, payment_transactions, payment_splits, earnings_summary, notifications, admin_email_notifications, email_templates, newsletter_subscribers, certifications, vehicle_insurance';
  RAISE LOG 'RLS policies and indexes created';
  RAISE LOG 'Functions and triggers configured';
  RAISE LOG 'Permissions granted to anon and authenticated roles';
END $$;
