/*
  # Fix Users Table RLS Policy

  1. Security
    - Add missing INSERT policy for users table
    - Allow authenticated users to insert their own user record
    - This is needed for the profile creation flow

  The users table was missing an INSERT policy, causing 500 errors when
  the frontend tries to upsert user records during authentication.
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);