/*
  # Fix Profiles RLS Policies

  1. Security Changes
    - Drop existing problematic policies that reference users table
    - Create simple policies using auth.uid() directly
    - Enable proper access for authenticated users to their own profiles
    - Add admin access using auth.jwt() metadata
    - Add service role access for system operations

  2. Policy Structure
    - SELECT: Users can read their own profile using auth.uid()
    - INSERT: Users can create their own profile
    - UPDATE: Users can update their own profile
    - Admin access: Uses auth.jwt() metadata instead of table joins
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON profiles;

-- Create simple, direct policies using auth.uid()
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin access using JWT metadata (no table joins)
CREATE POLICY "Admin users can access all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- Service role access for system operations
CREATE POLICY "Service role can access all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);