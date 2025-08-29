/*
  # Admin User Diagnostic Queries
  
  Run these queries to diagnose admin user issues.
  Use these if admin@ablego.co.uk cannot access the admin dashboard.
*/

-- === COMPREHENSIVE ADMIN USER DIAGNOSTIC ===

-- 1. Check if admin user exists in all required tables
SELECT 
  'ADMIN USER EXISTENCE CHECK' as diagnostic_type,
  '' as details,
  '' as status,
  '' as action_needed;

-- Check auth.users table
SELECT 
  'Auth Users Table' as diagnostic_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'User exists in auth.users'
    ELSE '❌ User missing from auth.users'
  END as details,
  CASE 
    WHEN COUNT(*) > 0 AND email_confirmed_at IS NOT NULL THEN '✅ GOOD'
    WHEN COUNT(*) > 0 AND email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
    ELSE '❌ MISSING'
  END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'Create user in Supabase Auth Dashboard'
    WHEN email_confirmed_at IS NULL THEN 'Confirm email in Auth Dashboard'
    ELSE 'No action needed'
  END as action_needed
FROM auth.users 
WHERE email = 'admin@ablego.co.uk'
GROUP BY email_confirmed_at;

-- Check users table
SELECT 
  'Users Table' as diagnostic_type,
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('User exists with role: ', role)
    ELSE '❌ User missing from users table'
  END as details,
  CASE 
    WHEN COUNT(*) > 0 AND role = 'admin' THEN '✅ GOOD'
    WHEN COUNT(*) > 0 AND role != 'admin' THEN '⚠️ WRONG ROLE'
    ELSE '❌ MISSING'
  END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'Run: INSERT INTO users (id, email, role) VALUES (auth_user_id, admin@ablego.co.uk, admin)'
    WHEN role != 'admin' THEN 'Run: UPDATE users SET role = admin WHERE email = admin@ablego.co.uk'
    ELSE 'No action needed'
  END as action_needed
FROM users 
WHERE email = 'admin@ablego.co.uk'
GROUP BY role;

-- Check profiles table
SELECT 
  'Profiles Table' as diagnostic_type,
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('Profile exists: ', name)
    ELSE '❌ Profile missing from profiles table'
  END as details,
  CASE 
    WHEN COUNT(*) > 0 AND is_verified = true THEN '✅ GOOD'
    WHEN COUNT(*) > 0 AND is_verified = false THEN '⚠️ NOT VERIFIED'
    ELSE '❌ MISSING'
  END as status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'Run: INSERT INTO profiles (id, email, name, is_verified) VALUES (auth_user_id, admin@ablego.co.uk, Admin User, true)'
    WHEN is_verified = false THEN 'Run: UPDATE profiles SET is_verified = true WHERE email = admin@ablego.co.uk'
    ELSE 'No action needed'
  END as action_needed
FROM profiles 
WHERE email = 'admin@ablego.co.uk'
GROUP BY name, is_verified;

-- 2. Check ID consistency across tables
SELECT 
  'ID CONSISTENCY CHECK' as diagnostic_type,
  '' as details,
  '' as status,
  '' as action_needed;

SELECT 
  'ID Matching' as diagnostic_type,
  CONCAT(
    'Auth ID: ', COALESCE(au.id::text, 'MISSING'), 
    ' | Users ID: ', COALESCE(u.id::text, 'MISSING'),
    ' | Profiles ID: ', COALESCE(p.id::text, 'MISSING')
  ) as details,
  CASE 
    WHEN au.id = u.id AND u.id = p.id THEN '✅ ALL IDs MATCH'
    WHEN au.id IS NULL THEN '❌ NO AUTH USER'
    WHEN u.id IS NULL THEN '❌ NO USERS RECORD'
    WHEN p.id IS NULL THEN '❌ NO PROFILE RECORD'
    ELSE '❌ ID MISMATCH'
  END as status,
  CASE 
    WHEN au.id IS NULL THEN 'Create auth user in Supabase Dashboard'
    WHEN u.id IS NULL THEN 'Create users record with auth user ID'
    WHEN p.id IS NULL THEN 'Create profile record with auth user ID'
    WHEN NOT (au.id = u.id AND u.id = p.id) THEN 'Fix ID mismatches - delete and recreate with matching IDs'
    ELSE 'No action needed'
  END as action_needed
FROM auth.users au
FULL OUTER JOIN users u ON au.email = u.email
FULL OUTER JOIN profiles p ON au.email = p.email
WHERE COALESCE(au.email, u.email, p.email) = 'admin@ablego.co.uk';

-- 3. Check admin permissions
SELECT 
  'ADMIN PERMISSIONS CHECK' as diagnostic_type,
  '' as details,
  '' as status,
  '' as action_needed;

-- Test admin role check
SELECT 
  'Admin Role Check' as diagnostic_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = 'admin@ablego.co.uk' 
      AND u.role = 'admin'
      AND p.is_verified = true
    ) THEN 'Admin user properly configured'
    ELSE 'Admin user configuration incomplete'
  END as details,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = 'admin@ablego.co.uk' 
      AND u.role = 'admin'
      AND p.is_verified = true
    ) THEN '✅ READY FOR LOGIN'
    ELSE '❌ NOT READY'
  END as status,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = 'admin@ablego.co.uk' 
      AND u.role = 'admin'
      AND p.is_verified = true
    ) THEN 'Complete the missing steps above'
    ELSE 'Ready to test login'
  END as action_needed;

-- 4. Show current admin users
SELECT 
  'EXISTING ADMIN USERS' as diagnostic_type,
  '' as details,
  '' as status,
  '' as action_needed;

SELECT 
  'Current Admins' as diagnostic_type,
  CONCAT(COALESCE(p.name, 'No Name'), ' (', u.email, ')') as details,
  CASE 
    WHEN p.is_verified THEN '✅ VERIFIED'
    ELSE '⚠️ UNVERIFIED'
  END as status,
  'These users have admin access' as action_needed
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.role = 'admin'
ORDER BY u.created_at;

-- 5. Final summary
SELECT 
  'SUMMARY' as diagnostic_type,
  'Admin setup diagnostic complete' as details,
  'Check results above' as status,
  'Follow action_needed instructions for any ❌ or ⚠️ items' as action_needed;