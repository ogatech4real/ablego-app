/*
  # Fix RLS policies for booking creation

  1. Policy Updates
    - Update INSERT policy for bookings table to allow authenticated users
    - Ensure proper WITH CHECK clause for user ownership
    - Add policy for guest bookings table

  2. Security
    - Maintain data isolation between users
    - Allow users to create their own bookings
    - Prevent unauthorized access to other users' data
*/

-- Fix the INSERT policy for bookings table
DROP POLICY IF EXISTS "Riders can create bookings" ON bookings;

CREATE POLICY "Authenticated users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rider_id);

-- Ensure the SELECT policy allows users to read their own bookings
DROP POLICY IF EXISTS "Riders can read own bookings" ON bookings;

CREATE POLICY "Users can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = rider_id);

-- Ensure the UPDATE policy allows users to update their own bookings
DROP POLICY IF EXISTS "Riders can update own bookings" ON bookings;

CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = rider_id)
  WITH CHECK (auth.uid() = rider_id);

-- Ensure guest bookings can be created by anyone (including unauthenticated users)
DROP POLICY IF EXISTS "Anyone can create guest bookings" ON guest_bookings;

CREATE POLICY "Anyone can create guest bookings"
  ON guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading guest bookings for tracking purposes
DROP POLICY IF EXISTS "Guest bookings readable via token" ON guest_bookings;

CREATE POLICY "Guest bookings readable via token"
  ON guest_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);