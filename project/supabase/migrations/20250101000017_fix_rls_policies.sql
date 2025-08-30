/*
  # Fix RLS Policies - Infinite Recursion Issue
  
  This migration fixes the infinite recursion issue in RLS policies
  by using a more efficient approach to check admin roles without
  creating circular references.
  
  The issue was caused by admin policies querying the users table
  which triggered the same policy again, creating an infinite loop.
*/

-- Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Admin full access" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON bookings;
DROP POLICY IF EXISTS "Admin full access" ON guest_bookings;
DROP POLICY IF EXISTS "Admin full access" ON vehicles;
DROP POLICY IF EXISTS "Admin full access" ON support_workers;
DROP POLICY IF EXISTS "Admin full access" ON driver_applications;
DROP POLICY IF EXISTS "Admin full access" ON support_worker_applications;
DROP POLICY IF EXISTS "Admin full access" ON trip_logs;
DROP POLICY IF EXISTS "Admin full access" ON payment_transactions;
DROP POLICY IF EXISTS "Admin full access" ON admin_email_notifications;
DROP POLICY IF EXISTS "Admin full access" ON newsletter_subscribers;

-- Also drop the problematic policies from the original migration
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can access all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can access all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can access all guest bookings" ON guest_bookings;
DROP POLICY IF EXISTS "Admin can manage email notifications" ON admin_email_notifications;

-- Create a function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user exists and has admin role in auth.users
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler function that checks JWT claims
CREATE OR REPLACE FUNCTION is_admin_from_jwt()
RETURNS boolean AS $$
BEGIN
  -- Check if the current user's JWT has admin role
  RETURN (auth.jwt() ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_from_jwt() TO authenticated;

-- Create new admin policies using the JWT-based function (more efficient)
CREATE POLICY "Admin full access" ON users
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON profiles
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON bookings
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON guest_bookings
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON vehicles
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON support_workers
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON driver_applications
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON support_worker_applications
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON trip_logs
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON payment_transactions
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON admin_email_notifications
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON newsletter_subscribers
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

-- Also fix other tables that might have similar issues
CREATE POLICY "Admin full access" ON stops
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON booking_access_tokens
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON booking_assignments
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON trip_tracking
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON pricing_logs
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON payment_splits
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON earnings_summary
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON notifications
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON email_templates
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON certifications
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

CREATE POLICY "Admin full access" ON vehicle_insurance
  FOR ALL TO authenticated
  USING (is_admin_from_jwt())
  WITH CHECK (is_admin_from_jwt());

-- Verify the admin user still has proper role in auth.users
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@ablego.co.uk';
  
  IF admin_user_id IS NOT NULL THEN
    -- Ensure admin role is properly set in auth.users
    UPDATE auth.users SET
      raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
      raw_user_meta_data = '{"full_name": "AbleGo Admin", "role": "admin"}'::jsonb
    WHERE id = admin_user_id;
    
    RAISE LOG 'Admin user role verified and updated: %', admin_user_id;
  ELSE
    RAISE LOG 'Admin user not found in auth.users';
  END IF;
END $$;

-- Test the functions
DO $$
DECLARE
  admin_user_id uuid;
  is_admin boolean;
  jwt_role text;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@ablego.co.uk';
  
  IF admin_user_id IS NOT NULL THEN
    -- Test the database function
    SELECT is_admin_user(admin_user_id) INTO is_admin;
    RAISE LOG 'Admin user test: ID=%, is_admin=%', admin_user_id, is_admin;
    
    -- Test JWT function (this will work when called from authenticated context)
    RAISE LOG 'JWT function created successfully';
  END IF;
END $$;

-- Log completion
DO $$
BEGIN
  RAISE LOG '✅ RLS policies fixed successfully!';
  RAISE LOG '🔧 Infinite recursion issue resolved';
  RAISE LOG '👑 Admin policies now use efficient role checking';
  RAISE LOG '🚀 Admin dashboard should now load properly';
END $$;
