-- =====================================================
-- CLEAN SCHEMA FINAL MIGRATION
-- This migration creates a clean, working schema for AbleGo
-- Consolidates all necessary tables, columns, and relationships
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('rider', 'driver', 'support_worker', 'admin', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Booking statuses
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('booking_confirmation', 'booking_update', 'driver_assigned', 'support_worker_assigned', 'payment_received', 'system_alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment statuses
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application statuses
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'rider',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'rider',
    address TEXT,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    accessibility_requirements TEXT,
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest riders table
CREATE TABLE IF NOT EXISTS guest_riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    accessibility_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest bookings table (CRITICAL FOR PAYMENT SYSTEM)
CREATE TABLE IF NOT EXISTS guest_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_rider_id UUID REFERENCES guest_riders(id) ON DELETE CASCADE,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    pickup_postcode TEXT,
    pickup_place_id TEXT,
    dropoff_address TEXT NOT NULL,
    dropoff_lat DECIMAL(10,8),
    dropoff_lng DECIMAL(11,8),
    dropoff_postcode TEXT,
    dropoff_place_id TEXT,
    pickup_time TIMESTAMPTZ NOT NULL,
    dropoff_time TIMESTAMPTZ,
    vehicle_features TEXT[],
    support_workers_count INTEGER DEFAULT 0,
    fare_estimate DECIMAL(10,2),
    booking_type TEXT DEFAULT 'on_demand',
    lead_time_hours INTEGER DEFAULT 0,
    time_multiplier DECIMAL(5,2) DEFAULT 1.0,
    booking_type_discount DECIMAL(5,2) DEFAULT 0.0,
    special_requirements TEXT,
    notes TEXT,
    payment_method TEXT DEFAULT 'cash_bank',
    account_linked_at TIMESTAMPTZ,
    status booking_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking access tokens table (CRITICAL FOR PAYMENT SYSTEM)
CREATE TABLE IF NOT EXISTS booking_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_booking_id UUID REFERENCES guest_bookings(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES guest_bookings(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    stop_address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver applications table
CREATE TABLE IF NOT EXISTS driver_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    license_number TEXT NOT NULL,
    vehicle_registration TEXT NOT NULL,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    experience_years INTEGER,
    references TEXT[],
    status application_status DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support worker applications table
CREATE TABLE IF NOT EXISTS support_worker_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    bio TEXT NOT NULL,
    specializations TEXT[] NOT NULL,
    certifications TEXT[],
    experience_years INTEGER,
    references TEXT[],
    status application_status DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_application_id UUID REFERENCES driver_applications(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    color TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support workers table
CREATE TABLE IF NOT EXISTS support_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_worker_application_id UUID REFERENCES support_worker_applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[] NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email configuration table
CREATE TABLE IF NOT EXISTS email_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    smtp_from_email TEXT NOT NULL,
    smtp_from_name TEXT NOT NULL,
    smtp_secure BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin email notifications table
CREATE TABLE IF NOT EXISTS admin_email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    email_type TEXT NOT NULL,
    email_status TEXT DEFAULT 'queued',
    priority INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    last_retry_at TIMESTAMPTZ,
    delivery_status_details JSONB,
    booking_id UUID,
    template_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified);

-- Guest bookings indexes (CRITICAL FOR PAYMENT SYSTEM)
CREATE INDEX IF NOT EXISTS idx_guest_bookings_rider_id ON guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_user_id ON guest_bookings(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_payment_method ON guest_bookings(payment_method);

-- Booking access tokens indexes (CRITICAL FOR PAYMENT SYSTEM)
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_token ON booking_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_expires ON booking_access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_booking_id ON booking_access_tokens(guest_booking_id);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_driver_apps_user_id ON driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_apps_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_support_apps_user_id ON support_worker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_apps_status ON support_worker_applications(status);

-- Email notifications indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON admin_email_notifications(email_status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_priority ON admin_email_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON admin_email_notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Guest riders policies (anonymous access for booking)
DROP POLICY IF EXISTS "Anyone can create guest rider records" ON guest_riders;
CREATE POLICY "Anyone can create guest rider records" ON guest_riders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Guest riders readable by token" ON guest_riders;
CREATE POLICY "Guest riders readable by token" ON guest_riders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_access_tokens bat
            JOIN guest_bookings gb ON bat.guest_booking_id = gb.id
            WHERE gb.guest_rider_id = guest_riders.id
        )
    );

-- Guest bookings policies (anonymous access for booking)
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON guest_bookings;
CREATE POLICY "Anyone can create guest bookings" ON guest_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Guest bookings readable by token" ON guest_bookings;
CREATE POLICY "Guest bookings readable by token" ON guest_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_access_tokens bat
            WHERE bat.guest_booking_id = guest_bookings.id
        )
    );

-- Booking access tokens policies (anonymous access for tracking)
DROP POLICY IF EXISTS "Anyone can create access tokens" ON booking_access_tokens;
CREATE POLICY "Anyone can create access tokens" ON booking_access_tokens
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Tokens readable by token value" ON booking_access_tokens;
CREATE POLICY "Tokens readable by token value" ON booking_access_tokens
    FOR SELECT USING (true);

-- Stops policies
DROP POLICY IF EXISTS "Stops readable by booking token" ON stops;
CREATE POLICY "Stops readable by booking token" ON stops
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_access_tokens bat
            WHERE bat.guest_booking_id = stops.booking_id
        )
    );

-- Driver applications policies
DROP POLICY IF EXISTS "Users can manage own driver applications" ON driver_applications;
CREATE POLICY "Users can manage own driver applications" ON driver_applications
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all driver applications" ON driver_applications;
CREATE POLICY "Admins can view all driver applications" ON driver_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Support worker applications policies
DROP POLICY IF EXISTS "Users can manage own support worker applications" ON support_worker_applications;
CREATE POLICY "Users can manage own support worker applications" ON support_worker_applications
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all support worker applications" ON support_worker_applications;
CREATE POLICY "Admins can view all support worker applications" ON support_worker_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Vehicles policies
DROP POLICY IF EXISTS "Vehicles readable by driver application" ON vehicles;
CREATE POLICY "Vehicles readable by driver application" ON vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM driver_applications da
            JOIN profiles p ON da.user_id = p.id
            WHERE da.id = vehicles.driver_application_id
            AND (p.id = auth.uid() OR p.role = 'admin')
        )
    );

-- Support workers policies
DROP POLICY IF EXISTS "Support workers readable by application" ON support_workers;
CREATE POLICY "Support workers readable by application" ON support_workers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_worker_applications swa
            JOIN profiles p ON swa.user_id = p.id
            WHERE swa.id = support_workers.support_worker_application_id
            AND (p.id = auth.uid() OR p.role = 'admin')
        )
    );

-- Admin email notifications policies
DROP POLICY IF EXISTS "Admins can manage email notifications" ON admin_email_notifications;
CREATE POLICY "Admins can manage email notifications" ON admin_email_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Email configuration policies
DROP POLICY IF EXISTS "Admins can manage email configuration" ON email_configuration;
CREATE POLICY "Admins can manage email configuration" ON email_configuration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update updated_at column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Handle new user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'rider');
    
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'rider');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_bookings_updated_at ON guest_bookings;
CREATE TRIGGER update_guest_bookings_updated_at
    BEFORE UPDATE ON guest_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_applications_updated_at ON driver_applications;
CREATE TRIGGER update_driver_applications_updated_at
    BEFORE UPDATE ON driver_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_worker_applications_updated_at ON support_worker_applications;
CREATE TRIGGER update_support_worker_applications_updated_at
    BEFORE UPDATE ON support_worker_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Handle new user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default email configuration
INSERT INTO email_configuration (
    smtp_host, smtp_port, smtp_username, smtp_password, 
    smtp_from_email, smtp_from_name, smtp_secure
) VALUES (
    'smtp.ionos.co.uk', 587, 'hello@ablego.co.uk', 'your_password_here',
    'hello@ablego.co.uk', 'AbleGo', false
) ON CONFLICT DO NOTHING;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to anon and authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE LOG 'Clean schema migration completed successfully';
    RAISE LOG 'Created tables: users, profiles, guest_riders, guest_bookings, booking_access_tokens, stops, driver_applications, support_worker_applications, vehicles, support_workers, email_configuration, admin_email_notifications';
    RAISE LOG 'Applied RLS policies and created necessary indexes';
    RAISE LOG 'Payment system should now work properly';
END $$;
