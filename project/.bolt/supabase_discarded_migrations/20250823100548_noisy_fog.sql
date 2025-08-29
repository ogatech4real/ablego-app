/*
  # Complete Admin Verification Script
  
  Run this after creating the admin user to verify everything is working correctly.
*/

-- 1. Check if admin user exists in all required tables
SELECT 
  '=== ADMIN USER VERIFICATION ===' as status;

-- 2. Verify auth.users record
SELECT 
  'AUTH USER CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = 'admin@ablego.co.uk' 
      AND email_confirmed_at IS NOT NULL
    ) THEN '✅ Auth user exists and confirmed'
    ELSE '❌ Auth user missing or not confirmed'
  END as result;

-- 3. Verify users table record
SELECT 
  'USERS TABLE CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE email = 'admin@ablego.co.uk' 
      AND role = 'admin'
    ) THEN '✅ Users record exists with admin role'
    ELSE '❌ Users record missing or wrong role'
  END as result;

-- 4. Verify profiles table record
SELECT 
  'PROFILES TABLE CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE email = 'admin@ablego.co.uk' 
      AND is_verified = true
    ) THEN '✅ Profile exists and verified'
    ELSE '❌ Profile missing or not verified'
  END as result;

-- 5. Check ID consistency
SELECT 
  'ID CONSISTENCY CHECK' as check_type,
  CASE 
    WHEN (
      SELECT au.id FROM auth.users au WHERE au.email = 'admin@ablego.co.uk'
    ) = (
      SELECT u.id FROM users u WHERE u.email = 'admin@ablego.co.uk'
    ) AND (
      SELECT u.id FROM users u WHERE u.email = 'admin@ablego.co.uk'
    ) = (
      SELECT p.id FROM profiles p WHERE p.email = 'admin@ablego.co.uk'
    ) THEN '✅ All IDs match perfectly'
    ELSE '❌ ID mismatch detected'
  END as result;

-- 6. Show complete admin record
SELECT 
  '=== COMPLETE ADMIN RECORD ===' as status;

SELECT 
  au.id as user_id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  u.role as users_role,
  p.name as profile_name,
  p.is_verified as profile_verified,
  p.is_active as profile_active
FROM auth.users au
LEFT JOIN users u ON au.id = u.id  
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@ablego.co.uk';

-- 7. Final status
SELECT 
  '=== FINAL STATUS ===' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM auth.users au
      JOIN users u ON au.id = u.id
      JOIN profiles p ON au.id = p.id
      WHERE au.email = 'admin@ablego.co.uk'
      AND au.email_confirmed_at IS NOT NULL
      AND u.role = 'admin'
      AND p.is_verified = true
    ) THEN '🎉 ADMIN SETUP COMPLETE - READY TO LOGIN!'
    ELSE '⚠️ SETUP INCOMPLETE - CHECK ERRORS ABOVE'
  END as final_result;