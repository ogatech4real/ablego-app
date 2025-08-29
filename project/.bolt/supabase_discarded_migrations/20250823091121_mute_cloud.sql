/*
  # Sync Admin User IDs Between Auth and Database

  This script fixes the ID mismatch between Supabase Auth and our database tables.
  It updates our database records to match the auth user ID.

  ## What this does:
  1. Gets the actual auth user ID for admin@ablego.co.uk
  2. Updates users table with correct auth ID
  3. Updates profiles table with correct auth ID
  4. Verifies the sync worked correctly

  ## Run this after:
  - Creating admin user in Supabase Auth dashboard
  - Getting ID mismatch error in verification
*/

-- Step 1: Get the auth user ID (this will show in logs)
DO $$
DECLARE
  auth_user_id uuid;
  old_users_id uuid;
  old_profiles_id uuid;
BEGIN
  -- Get the auth user ID from auth.users (requires service role)
  -- Since we can't directly query auth.users from here, we'll use a different approach
  
  RAISE NOTICE '=== ADMIN ID SYNC PROCESS ===';
  RAISE NOTICE 'Looking for existing admin records...';
  
  -- Get current database IDs
  SELECT id INTO old_users_id FROM users WHERE email = 'admin@ablego.co.uk';
  SELECT id INTO old_profiles_id FROM profiles WHERE email = 'admin@ablego.co.uk';
  
  IF old_users_id IS NOT NULL THEN
    RAISE NOTICE 'Found users record with ID: %', old_users_id;
  ELSE
    RAISE NOTICE 'No users record found for admin@ablego.co.uk';
  END IF;
  
  IF old_profiles_id IS NOT NULL THEN
    RAISE NOTICE 'Found profiles record with ID: %', old_profiles_id;
  ELSE
    RAISE NOTICE 'No profiles record found for admin@ablego.co.uk';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MANUAL STEP REQUIRED ===';
  RAISE NOTICE 'Go to Supabase Auth dashboard and find the UUID for admin@ablego.co.uk';
  RAISE NOTICE 'Then run the update script below with that UUID';
  RAISE NOTICE '';
END $$;

-- Step 2: Manual update template (replace YOUR-AUTH-UUID-HERE with actual auth UUID)
-- UNCOMMENT AND UPDATE THE LINES BELOW AFTER GETTING THE AUTH UUID

/*
-- Replace YOUR-AUTH-UUID-HERE with the actual auth user UUID
DO $$
DECLARE
  new_auth_id uuid := 'YOUR-AUTH-UUID-HERE'; -- REPLACE THIS
  old_users_id uuid;
  old_profiles_id uuid;
BEGIN
  RAISE NOTICE '=== UPDATING ADMIN IDS ===';
  RAISE NOTICE 'New auth ID: %', new_auth_id;
  
  -- Get old IDs for reference
  SELECT id INTO old_users_id FROM users WHERE email = 'admin@ablego.co.uk';
  SELECT id INTO old_profiles_id FROM profiles WHERE email = 'admin@ablego.co.uk';
  
  -- Update users table
  UPDATE users 
  SET id = new_auth_id,
      updated_at = now()
  WHERE email = 'admin@ablego.co.uk';
  
  RAISE NOTICE 'Updated users table: % → %', old_users_id, new_auth_id;
  
  -- Update profiles table
  UPDATE profiles 
  SET id = new_auth_id,
      updated_at = now()
  WHERE email = 'admin@ablego.co.uk';
  
  RAISE NOTICE 'Updated profiles table: % → %', old_profiles_id, new_auth_id;
  
  RAISE NOTICE '=== SYNC COMPLETE ===';
  RAISE NOTICE 'Admin user should now work correctly!';
END $$;
*/

-- Step 3: Verification query (run this after the update)
-- This will show if the sync worked
SELECT 
  'Verification Results' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = 'admin@ablego.co.uk' 
      AND u.role = 'admin'
      AND p.is_verified = true
    ) THEN '✅ Database records synced correctly'
    ELSE '❌ Still have issues - check IDs'
  END as result;

-- Show current state for debugging
SELECT 
  'Current State' as info,
  u.id as users_id,
  u.email,
  u.role,
  p.id as profiles_id,
  p.name,
  p.is_verified
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@ablego.co.uk';