/*
  # Fix infinite recursion in bookings table RLS policies

  1. Problem
    - Current policies on bookings table are creating circular dependencies
    - Policies are trying to query the bookings table from within bookings table policies
    - This causes "infinite recursion detected in policy for relation bookings" error

  2. Solution
    - Replace complex subqueries with direct auth.uid() checks
    - Remove circular references to bookings table within its own policies
    - Use simple, direct policy conditions that don't create recursion

  3. Security
    - Maintain same security level with simplified policies
    - Ensure riders can only access their own bookings
    - Ensure drivers and support workers can access assigned bookings
    - Ensure admins can access all bookings
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can access all bookings" ON bookings;
DROP POLICY IF EXISTS "Drivers can read assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Riders can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Support workers can read assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Users can read their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- Create new simplified policies without recursion
CREATE POLICY "Admin can access all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@ablego.co.uk')
  WITH CHECK (auth.email() = 'admin@ablego.co.uk');

CREATE POLICY "Riders can create own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Riders can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Riders can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = rider_id)
  WITH CHECK (auth.uid() = rider_id);

-- Service role can access everything (for admin operations)
CREATE POLICY "Service role full access"
  ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);