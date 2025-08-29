/*
  # Final Admin Verification Script
  
  Run this after syncing to verify everything is working correctly.
*/

-- Complete admin user verification
SELECT 
  '=== ADMIN USER VERIFICATION ===' as status;

-- Check auth user exists (you'll need to verify this in Supabase Auth dashboard)
SELECT 
  'Auth User Check' as check_type,
  'Verify manually in Supabase Auth dashboard' as instruction,
  'admin@ablego.co.uk should exist with confirmed email' as expected_result;

-- Check users table
SELECT 
  'Users Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae' 
      AND email = 'admin@ablego.co.uk' 
      AND role = 'admin'
    ) THEN '✅ PASS: Admin user exists with correct role'
    ELSE '❌ FAIL: Admin user missing or wrong role'
  END as result;

-- Check profiles table  
SELECT 
  'Profiles Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae' 
      AND email = 'admin@ablego.co.uk' 
      AND is_verified = true
      AND is_active = true
    ) THEN '✅ PASS: Admin profile exists and verified'
    ELSE '❌ FAIL: Admin profile missing or not verified'
  END as result;

-- Check ID consistency
SELECT 
  'ID Consistency' as check_type,
  CASE 
    WHEN (
      SELECT COUNT(DISTINCT id) FROM (
        SELECT id FROM users WHERE email = 'admin@ablego.co.uk'
        UNION ALL
        SELECT id FROM profiles WHERE email = 'admin@ablego.co.uk'
      ) t
    ) = 1 THEN '✅ PASS: All IDs match'
    ELSE '❌ FAIL: ID mismatch between tables'
  END as result;

-- Show final admin details
SELECT 
  '=== FINAL ADMIN DETAILS ===' as status;

SELECT 
  u.id as user_id,
  u.email,
  u.role as users_role,
  p.name as profile_name,
  p.is_verified,
  p.is_active,
  u.created_at
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@ablego.co.uk';

SELECT 
  '=== LOGIN CREDENTIALS ===' as status;

SELECT 
  'admin@ablego.co.uk' as email,
  'CareGold17' as password,
  '/login' as login_url,
  'Look for purple "Admin" button in navbar after login' as next_step;