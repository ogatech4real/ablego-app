/*
  # Create missing admin tables and views

  1. New Tables
    - `driver_applications` - Store driver application submissions
    - `support_worker_applications` - Store support worker application submissions
    
  2. New Views
    - `dashboard_overview` - Aggregated dashboard statistics
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for admin access
*/

-- Create driver applications table
CREATE TABLE IF NOT EXISTS driver_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create support worker applications table
CREATE TABLE IF NOT EXISTS support_worker_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  address text,
  experience_years integer DEFAULT 0,
  desired_hourly_rate numeric(6,2) DEFAULT 18.50,
  specializations text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  languages text[] DEFAULT '{English}',
  bio text,
  motivation text,
  application_type text DEFAULT 'support_worker' CHECK (application_type = 'support_worker'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_worker_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for driver applications
CREATE POLICY "Admins can access all driver applications"
  ON driver_applications
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@ablego.co.uk')
  WITH CHECK (auth.email() = 'admin@ablego.co.uk');

CREATE POLICY "Anyone can submit driver applications"
  ON driver_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policies for support worker applications
CREATE POLICY "Admins can access all support worker applications"
  ON support_worker_applications
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@ablego.co.uk')
  WITH CHECK (auth.email() = 'admin@ablego.co.uk');

CREATE POLICY "Anyone can submit support worker applications"
  ON support_worker_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create dashboard overview view
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT
  -- User counts
  (SELECT COUNT(*) FROM users WHERE role = 'rider') as total_riders,
  (SELECT COUNT(*) FROM users WHERE role = 'driver') as total_drivers,
  (SELECT COUNT(*) FROM users WHERE role = 'support_worker') as total_support_workers,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
  
  -- Booking counts
  (SELECT COUNT(*) FROM bookings WHERE created_at >= date_trunc('month', CURRENT_DATE)) as month_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'in_progress') as active_trips,
  (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed_bookings,
  
  -- Revenue (mock data for now)
  (SELECT COALESCE(SUM(fare_estimate), 0) FROM bookings WHERE created_at >= date_trunc('month', CURRENT_DATE) AND status = 'completed') as month_revenue,
  
  -- Vehicle counts
  (SELECT COUNT(*) FROM vehicles WHERE is_active = true) as active_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE verified = false) as unverified_vehicles,
  
  -- Support worker counts
  (SELECT COUNT(*) FROM support_workers WHERE is_active = true) as active_support_workers,
  (SELECT COUNT(*) FROM support_workers WHERE verified = false) as unverified_support_workers,
  
  -- Application counts
  (SELECT COUNT(*) FROM driver_applications WHERE status = 'pending') as pending_driver_applications,
  (SELECT COUNT(*) FROM support_worker_applications WHERE status = 'pending') as pending_support_worker_applications;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_submitted_at ON driver_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_support_worker_applications_status ON support_worker_applications(status);
CREATE INDEX IF NOT EXISTS idx_support_worker_applications_submitted_at ON support_worker_applications(submitted_at);

-- Add triggers for updated_at
CREATE TRIGGER update_driver_applications_updated_at
  BEFORE UPDATE ON driver_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_worker_applications_updated_at
  BEFORE UPDATE ON support_worker_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();