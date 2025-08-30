/*
  # Add Coordinate Fields to Guest Bookings Table

  This migration adds coordinate and postcode fields to guest_bookings table
  to support Google Places Autocomplete integration.

  New fields:
  - pickup_lat, pickup_lng: Precise coordinates for pickup location
  - dropoff_lat, dropoff_lng: Precise coordinates for dropoff location  
  - pickup_postcode, dropoff_postcode: Extracted postcodes for UK-specific features
  - pickup_place_id, dropoff_place_id: Google Place IDs for future reference
*/

-- Add coordinate fields to guest_bookings table
DO $$
BEGIN
  -- Add pickup coordinates if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lat'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN pickup_lat DECIMAL(10,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_lng'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN pickup_lng DECIMAL(11,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lat'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN dropoff_lat DECIMAL(10,8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_lng'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN dropoff_lng DECIMAL(11,8);
  END IF;
  
  -- Add postcode fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_postcode'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN pickup_postcode TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_postcode'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN dropoff_postcode TEXT;
  END IF;
  
  -- Add Google Place ID fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'pickup_place_id'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN pickup_place_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'dropoff_place_id'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN dropoff_place_id TEXT;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_coords ON guest_bookings(pickup_lat, pickup_lng);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_dropoff_coords ON guest_bookings(dropoff_lat, dropoff_lng);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_postcode ON guest_bookings(pickup_postcode);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_dropoff_postcode ON guest_bookings(dropoff_postcode);

-- Add comments to document the new fields
COMMENT ON COLUMN guest_bookings.pickup_lat IS 'Latitude of pickup location from Google Places';
COMMENT ON COLUMN guest_bookings.pickup_lng IS 'Longitude of pickup location from Google Places';
COMMENT ON COLUMN guest_bookings.dropoff_lat IS 'Latitude of dropoff location from Google Places';
COMMENT ON COLUMN guest_bookings.dropoff_lng IS 'Longitude of dropoff location from Google Places';
COMMENT ON COLUMN guest_bookings.pickup_postcode IS 'Postcode extracted from pickup address';
COMMENT ON COLUMN guest_bookings.dropoff_postcode IS 'Postcode extracted from dropoff address';
COMMENT ON COLUMN guest_bookings.pickup_place_id IS 'Google Place ID for pickup location';
COMMENT ON COLUMN guest_bookings.dropoff_place_id IS 'Google Place ID for dropoff location';
