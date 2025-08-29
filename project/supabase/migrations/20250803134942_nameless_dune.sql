/*
  # Add Time-Based Pricing Support to Bookings

  1. New Columns Added to Bookings Table
    - `booking_type` (enum): Classification of booking based on lead time
    - `lead_time_hours` (numeric): Hours between booking creation and pickup
    - `time_multiplier` (numeric): Multiplier applied for booking type pricing
    - `booking_type_discount` (numeric): Discount/surcharge amount in GBP

  2. New Enum Type
    - `booking_type`: 'on_demand', 'scheduled', 'advance'

  3. Updated Pricing Logs Table
    - Add `booking_type_discount` column to track time-based adjustments
    - Add `booking_type` column to store the classification
    - Add `lead_time_hours` column for audit purposes

  4. Security
    - Maintain existing RLS policies
    - No changes to access permissions
*/

-- Create booking_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type') THEN
    CREATE TYPE booking_type AS ENUM ('on_demand', 'scheduled', 'advance');
  END IF;
END $$;

-- Add new columns to bookings table
DO $$
BEGIN
  -- Add booking_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_type booking_type DEFAULT 'scheduled';
  END IF;

  -- Add lead_time_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'lead_time_hours'
  ) THEN
    ALTER TABLE bookings ADD COLUMN lead_time_hours numeric(6,2) DEFAULT 0;
  END IF;

  -- Add time_multiplier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'time_multiplier'
  ) THEN
    ALTER TABLE bookings ADD COLUMN time_multiplier numeric(4,2) DEFAULT 1.0;
  END IF;

  -- Add booking_type_discount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_type_discount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_type_discount numeric(8,2) DEFAULT 0;
  END IF;
END $$;

-- Update pricing_logs table to include booking type information
DO $$
BEGIN
  -- Add booking_type column to pricing_logs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_logs' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE pricing_logs ADD COLUMN booking_type booking_type DEFAULT 'scheduled';
  END IF;

  -- Add booking_type_discount column to pricing_logs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_logs' AND column_name = 'booking_type_discount'
  ) THEN
    ALTER TABLE pricing_logs ADD COLUMN booking_type_discount numeric(8,2) DEFAULT 0;
  END IF;

  -- Add lead_time_hours column to pricing_logs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_logs' AND column_name = 'lead_time_hours'
  ) THEN
    ALTER TABLE pricing_logs ADD COLUMN lead_time_hours numeric(6,2) DEFAULT 0;
  END IF;
END $$;

-- Add constraints for data integrity
DO $$
BEGIN
  -- Constraint for lead_time_hours (must be non-negative)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_lead_time_hours_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_lead_time_hours_check 
    CHECK (lead_time_hours >= 0 AND lead_time_hours <= 240); -- Max 10 days
  END IF;

  -- Constraint for time_multiplier (reasonable range)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'bookings' AND constraint_name = 'bookings_time_multiplier_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_time_multiplier_check 
    CHECK (time_multiplier >= 0.5 AND time_multiplier <= 2.0);
  END IF;
END $$;

-- Create index for efficient booking type queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bookings' AND indexname = 'idx_bookings_booking_type'
  ) THEN
    CREATE INDEX idx_bookings_booking_type ON bookings (booking_type);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bookings' AND indexname = 'idx_bookings_lead_time'
  ) THEN
    CREATE INDEX idx_bookings_lead_time ON bookings (lead_time_hours);
  END IF;
END $$;

-- Update existing bookings to have default values (for existing data)
UPDATE bookings 
SET 
  booking_type = 'scheduled',
  lead_time_hours = GREATEST(0, EXTRACT(EPOCH FROM (pickup_time - created_at)) / 3600),
  time_multiplier = 1.0,
  booking_type_discount = 0
WHERE booking_type IS NULL;

-- Update existing pricing_logs to have default values
UPDATE pricing_logs 
SET 
  booking_type = 'scheduled',
  booking_type_discount = 0,
  lead_time_hours = 0
WHERE booking_type IS NULL;

-- Add helpful comment
COMMENT ON COLUMN bookings.booking_type IS 'Classification based on lead time: on_demand (≤3h), scheduled (3-12h), advance (>12h)';
COMMENT ON COLUMN bookings.lead_time_hours IS 'Hours between booking creation and scheduled pickup time';
COMMENT ON COLUMN bookings.time_multiplier IS 'Pricing multiplier applied based on booking type';
COMMENT ON COLUMN bookings.booking_type_discount IS 'Discount or surcharge amount in GBP based on booking type';