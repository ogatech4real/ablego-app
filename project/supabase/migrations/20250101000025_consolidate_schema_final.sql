-- =====================================================
-- FINAL SCHEMA CONSOLIDATION MIGRATION
-- This migration consolidates all previous migrations
-- and ensures schema consistency
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

-- Guest bookings table
CREATE TABLE IF NOT EXISTS guest_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_rider_id UUID REFERENCES guest_riders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    support_workers_count INTEGER DEFAULT 0,
    special_requirements TEXT,
    fare_estimate DECIMAL(10,2),
    payment_method TEXT,
    status booking_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    linked_at TIMESTAMPTZ
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_time TIMESTAMPTZ NOT NULL,
    support_workers_count INTEGER DEFAULT 0,
    special_requirements TEXT,
    fare_estimate DECIMAL(10,2),
    payment_method TEXT,
    status booking_status DEFAULT 'pending',
    driver_id UUID,
    support_worker_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    stop_type TEXT NOT NULL, -- 'pickup', 'dropoff', 'waypoint'
    sequence_order INTEGER NOT NULL,
    estimated_time TIMESTAMPTZ,
    actual_time TIMESTAMPTZ,
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

-- Trip logs table
CREATE TABLE IF NOT EXISTS trip_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    driver_id UUID,
    support_worker_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    distance_km DECIMAL(8,2),
    fuel_consumption_l DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip tracking table
CREATE TABLE IF NOT EXISTS trip_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing logs table
CREATE TABLE IF NOT EXISTS pricing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    base_fare DECIMAL(10,2) NOT NULL,
    distance_multiplier DECIMAL(5,2),
    time_multiplier DECIMAL(5,2),
    support_worker_fee DECIMAL(10,2),
    total_fare DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'GBP',
    payment_method TEXT NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment splits table
CREATE TABLE IF NOT EXISTS payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL, -- 'driver', 'support_worker', 'platform'
    recipient_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Earnings summary table
CREATE TABLE IF NOT EXISTS earnings_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_earnings DECIMAL(10,2) NOT NULL,
    total_trips INTEGER NOT NULL,
    total_distance_km DECIMAL(8,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_number TEXT,
    document_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle insurance table
CREATE TABLE IF NOT EXISTS vehicle_insurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_amount DECIMAL(12,2),
    document_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
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

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_time ON bookings(pickup_time);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Guest bookings indexes
CREATE INDEX IF NOT EXISTS idx_guest_bookings_rider_id ON guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_user_id ON guest_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON guest_bookings(status);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_driver_apps_user_id ON driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_apps_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_support_apps_user_id ON support_worker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_apps_status ON support_worker_applications(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

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
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_workers ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can view own guest rider records" ON guest_riders;
CREATE POLICY "Users can view own guest rider records" ON guest_riders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guest_bookings 
            WHERE guest_bookings.guest_rider_id = guest_riders.id 
            AND guest_bookings.user_id = auth.uid()
        )
    );

-- Guest bookings policies
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON guest_bookings;
CREATE POLICY "Anyone can create guest bookings" ON guest_bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own guest bookings" ON guest_bookings;
CREATE POLICY "Users can view own guest bookings" ON guest_bookings
    FOR SELECT USING (
        user_id = auth.uid() OR 
        guest_rider_id IN (
            SELECT id FROM guest_riders 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (user_id = auth.uid());

-- Admin policies for all tables
DROP POLICY IF EXISTS "Admins have full access" ON users;
CREATE POLICY "Admins have full access" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Apply similar admin policies to other tables
-- (This is a simplified version - in production you'd want more granular policies)

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to sync user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
        NOW(),
        NOW()
    );
    
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- This function will be called by the Edge Function
    -- For now, just return a success message
    result := jsonb_build_object(
        'success', true,
        'message', 'Email queue processing initiated'
    );
    
    RETURN result;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_bookings_updated_at BEFORE UPDATE ON guest_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VIEWS
-- =====================================================

-- Dashboard overview view
CREATE OR REPLACE VIEW dashboard_overview AS
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
    SUM(CASE WHEN status = 'completed' THEN fare_estimate ELSE 0 END) as total_revenue
FROM bookings;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'booking' as type,
    id,
    user_id,
    status,
    created_at,
    pickup_address,
    dropoff_address
FROM bookings
UNION ALL
SELECT 
    'driver_application' as type,
    id,
    user_id,
    status::text,
    created_at,
    full_name as pickup_address,
    email as dropoff_address
FROM driver_applications
UNION ALL
SELECT 
    'support_worker_application' as type,
    id,
    user_id,
    status::text,
    created_at,
    full_name as pickup_address,
    email as dropoff_address
FROM support_worker_applications
ORDER BY created_at DESC;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default email configuration
INSERT INTO email_configuration (
    smtp_host, smtp_port, smtp_username, smtp_password,
    smtp_from_email, smtp_from_name, smtp_secure, is_active
) VALUES (
    'smtp.ionos.co.uk', 587, 'noreply@ablego.co.uk', 'your-password-here',
    'noreply@ablego.co.uk', 'AbleGo', false, true
) ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, variables) VALUES
('welcome_email', 'Welcome to AbleGo!', 
 '<h1>Welcome to AbleGo, {{name}}!</h1><p>Thank you for joining our community.</p>', 
 ARRAY['name']),
('booking_confirmation', 'Your booking is confirmed', 
 '<h1>Booking Confirmed</h1><p>Your journey from {{pickup}} to {{dropoff}} is confirmed.</p>', 
 ARRAY['pickup', 'dropoff'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT INSERT, UPDATE ON bookings TO authenticated;
GRANT INSERT, UPDATE ON guest_riders TO authenticated;
GRANT INSERT, UPDATE ON guest_bookings TO authenticated;
GRANT INSERT, UPDATE ON driver_applications TO authenticated;
GRANT INSERT, UPDATE ON support_worker_applications TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to anon users for guest operations
GRANT INSERT ON guest_riders TO anon;
GRANT INSERT ON guest_bookings TO anon;

COMMIT;
