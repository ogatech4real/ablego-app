-- =====================================================
-- FIX PAYMENT SYSTEM MIGRATION
-- This migration fixes ONLY the critical issues causing:
-- 1. "failed to create booking" error on /booking page
-- 2. "Failed to load payment analytics" error on admin dashboard
-- =====================================================

-- =====================================================
-- CREATE MISSING PAYMENT TABLES
-- =====================================================

-- Create payment_transactions table (CRITICAL for payment analytics)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID,
    amount_gbp DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'GBP',
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    gateway_response JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_splits table (CRITICAL for payment analytics)
CREATE TABLE IF NOT EXISTS payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_transaction_id UUID,
    recipient_type TEXT NOT NULL,
    recipient_id UUID,
    amount_gbp DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to guest_riders table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_riders' AND column_name = 'name') THEN
        ALTER TABLE guest_riders ADD COLUMN name TEXT DEFAULT 'Guest Rider';
    END IF;
END $$;

-- Add missing columns to guest_bookings table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lat') THEN
        ALTER TABLE guest_bookings ADD COLUMN pickup_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lng') THEN
        ALTER TABLE guest_bookings ADD COLUMN pickup_lng DECIMAL(11,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'pickup_postcode') THEN
        ALTER TABLE guest_bookings ADD COLUMN pickup_postcode TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'pickup_place_id') THEN
        ALTER TABLE guest_bookings ADD COLUMN pickup_place_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lat') THEN
        ALTER TABLE guest_bookings ADD COLUMN dropoff_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lng') THEN
        ALTER TABLE guest_bookings ADD COLUMN dropoff_lng DECIMAL(11,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_postcode') THEN
        ALTER TABLE guest_bookings ADD COLUMN dropoff_postcode TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_place_id') THEN
        ALTER TABLE guest_bookings ADD COLUMN dropoff_place_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_time') THEN
        ALTER TABLE guest_bookings ADD COLUMN dropoff_time TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'vehicle_features') THEN
        ALTER TABLE guest_bookings ADD COLUMN vehicle_features TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'booking_type') THEN
        ALTER TABLE guest_bookings ADD COLUMN booking_type TEXT DEFAULT 'on_demand';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'lead_time_hours') THEN
        ALTER TABLE guest_bookings ADD COLUMN lead_time_hours INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'time_multiplier') THEN
        ALTER TABLE guest_bookings ADD COLUMN time_multiplier DECIMAL(5,2) DEFAULT 1.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'booking_type_discount') THEN
        ALTER TABLE guest_bookings ADD COLUMN booking_type_discount DECIMAL(5,2) DEFAULT 0.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'notes') THEN
        ALTER TABLE guest_bookings ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_bookings' AND column_name = 'account_linked_at') THEN
        ALTER TABLE guest_bookings ADD COLUMN account_linked_at TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- CREATE ESSENTIAL INDEXES
-- =====================================================

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processed_at ON payment_transactions(processed_at);

-- Payment splits indexes
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment_transaction_id ON payment_splits(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_recipient_id ON payment_splits(recipient_id);

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE LOG 'Payment system fix migration completed successfully';
    RAISE LOG 'Created payment_transactions table for payment analytics';
    RAISE LOG 'Created payment_splits table for payment analytics';
    RAISE LOG 'Added missing coordinate columns to guest_bookings';
    RAISE LOG 'Added missing columns to guest_riders';
    RAISE LOG 'Payment system should now work properly';
    RAISE LOG 'Admin dashboard analytics should now load correctly';
END $$;
