/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies on users table are creating circular dependencies
    - Policies are trying to query the users table from within users table policies
    - This causes "infinite recursion detected in policy for relation 'users'" error

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that don't create circular dependencies
    - Use auth.uid() directly instead of querying users table
    - Separate admin access from regular user access

  3. New Policies
    - Users can read their own data using auth.uid()
    - Users can update their own data using auth.uid()
    - Users can insert their own data using auth.uid()
    - Admins get separate policy using auth.email() check
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new simplified policies that don't create recursion
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policy using email check instead of querying users table
CREATE POLICY "Admins can access all users"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin@ablego.co.uk')
  WITH CHECK (auth.email() = 'admin@ablego.co.uk');