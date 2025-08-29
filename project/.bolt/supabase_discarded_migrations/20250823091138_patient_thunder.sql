/*
  # Complete Admin Sync Script
  
  Use this script AFTER you have:
  1. Created admin user in Supabase Auth dashboard
  2. Copied the auth user UUID
  
  Replace the UUID below with your actual auth user UUID.
*/

-- STEP 1: Replace this UUID with your actual auth user UUID from Supabase Auth dashboard
-- Go to Authentication → Users → Find admin@ablego.co.uk → Copy the ID
DO $$
DECLARE
  -- 🚨 REPLACE THIS UUID WITH YOUR ACTUAL AUTH USER UUID 🚨
  auth_user_uuid uuid := '00000000-0000-0000-0000-000000000000'; -- CHANGE THIS!
  
  old_users_id uuid;
  old_profiles_id uuid;
  update_count int;
BEGIN
  -- Validate the UUID was changed
  IF auth_user_uuid = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'You must replace the auth_user_uuid with your actual auth user UUID from Supabase Auth dashboard!';
  END IF;
  
  RAISE NOTICE '=== SYNCING ADMIN USER IDS ===';
  RAISE NOTICE 'Target auth UUID: %', auth_user_uuid;
  
  -- Get current database IDs
  SELECT id INTO old_users_id FROM users WHERE email = 'admin@ablego.co.uk';
  SELECT id INTO old_profiles_id FROM profiles WHERE email = 'admin@ablego.co.uk';
  
  RAISE NOTICE 'Current users ID: %', COALESCE(old_users_id::text, 'NOT FOUND');
  RAISE NOTICE 'Current profiles ID: %', COALESCE(old_profiles_id::text, 'NOT FOUND');
  
  -- Update users table
  IF old_users_id IS NOT NULL THEN
    UPDATE users 
    SET id = auth_user_uuid,
        updated_at = now()
    WHERE email = 'admin@ablego.co.uk';
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated users table (% rows affected)', update_count;
  ELSE
    -- Create users record if it doesn't exist
    INSERT INTO users (id, email, role, created_at)
    VALUES (auth_user_uuid, 'admin@ablego.co.uk', 'admin', now());
    RAISE NOTICE '✅ Created new users record';
  END IF;
  
  -- Update profiles table
  IF old_profiles_id IS NOT NULL THEN
    UPDATE profiles 
    SET id = auth_user_uuid,
        updated_at = now()
    WHERE email = 'admin@ablego.co.uk';
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated profiles table (% rows affected)', update_count;
  ELSE
    -- Create profiles record if it doesn't exist
    INSERT INTO profiles (id, email, name, is_verified, is_active, created_at, updated_at)
    VALUES (auth_user_uuid, 'admin@ablego.co.uk', 'AbleGo Admin', true, true, now(), now());
    RAISE NOTICE '✅ Created new profiles record';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SYNC COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'Admin user should now work correctly!';
  RAISE NOTICE 'Test by logging in at /login with admin@ablego.co.uk';
  
END $$;

-- Verification query - run this to confirm everything worked
SELECT 
  '=== FINAL VERIFICATION ===' as status,
  u.id as users_id,
  u.email,
  u.role as users_role,
  p.id as profiles_id,
  p.name as profile_name,
  p.is_verified,
  CASE 
    WHEN u.id = p.id THEN '✅ IDs Match - SUCCESS!'
    ELSE '❌ IDs Still Mismatch'
  END as sync_status
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@ablego.co.uk';

-- Show what the auth check will see
SELECT 
  'Auth Check Simulation' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE email = 'admin@ablego.co.uk' 
      AND role = 'admin'
    ) THEN '✅ Admin role found'
    ELSE '❌ Admin role missing'
  END as role_check,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = 'admin@ablego.co.uk' 
      AND is_verified = true
    ) THEN '✅ Profile verified'
    ELSE '❌ Profile not verified'
  END as profile_check;