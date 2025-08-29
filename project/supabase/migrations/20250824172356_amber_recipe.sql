/*
  # Fix guest_riders RLS policies for anonymous access

  1. Security Changes
    - Drop existing restrictive policies that block anonymous access
    - Add permissive policies for anonymous users to create and update guest rider records
    - Maintain security by allowing only basic guest rider operations

  2. New Policies
    - Allow anonymous INSERT for guest rider creation
    - Allow anonymous UPDATE for guest rider updates (needed for upsert)
    - Allow anonymous SELECT for guest rider data retrieval
*/

-- Drop existing policies that may be blocking anonymous access
DROP POLICY IF EXISTS "Allow anonymous insert for guest riders" ON guest_riders;
DROP POLICY IF EXISTS "Allow anonymous select for guest riders" ON guest_riders;
DROP POLICY IF EXISTS "Allow anonymous update for guest riders" ON guest_riders;
DROP POLICY IF EXISTS "Anyone can create guest rider records" ON guest_riders;

-- Create new permissive policies for anonymous users
CREATE POLICY "Anonymous can insert guest riders"
  ON guest_riders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous can update guest riders"
  ON guest_riders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous can select guest riders"
  ON guest_riders
  FOR SELECT
  TO anon
  USING (true);

-- Also allow authenticated users (for admin access)
CREATE POLICY "Authenticated can access guest riders"
  ON guest_riders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);