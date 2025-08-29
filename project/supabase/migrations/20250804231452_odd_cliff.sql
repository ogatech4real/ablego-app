/*
  # Fix RLS Security Vulnerability

  1. Security Fix
    - Remove insecure RLS policy that references user_metadata
    - Replace with secure policy that references server-controlled users.role
    - Ensure admin access is properly controlled

  2. Changes
    - Drop existing "Admin users can access all profiles" policy
    - Create new secure admin access policy
    - Maintain existing user access policies

  3. Security Notes
    - user_metadata is editable by end users and should never be used in security contexts
    - Server-controlled users.role field provides proper authorization
    - This prevents privilege escalation attacks
*/

-- Drop the insecure policy that references user_metadata
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

-- Create secure admin access policy using server-controlled users.role
CREATE POLICY "Admins can access all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Verify other policies don't have similar issues
-- The following policies are secure as they use auth.uid() or server-controlled data:
-- - "Users can read own profile" (uses auth.uid())
-- - "Users can insert own profile" (uses auth.uid())
-- - "Users can update own profile" (uses auth.uid())
-- - "Service role can access all profiles" (uses service_role)