/*
  # Fix auth.users table NULL string columns

  This migration fixes NULL values in auth.users table columns that are causing
  "converting NULL to string is unsupported" errors during authentication.

  1. Updates all string columns that might have NULL values
  2. Sets them to empty strings to prevent scan errors
  3. Focuses on the admin user that's causing login issues
*/

-- Fix all potential NULL string columns in auth.users table for the admin user
UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  banned_until = NULL,
  deleted_at = NULL
WHERE email = 'admin@ablego.co.uk';

-- Also fix any other users that might have the same issue
UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
WHERE 
  email_change IS NULL 
  OR phone_change IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR phone_change_token IS NULL 
  OR recovery_token IS NULL;

-- Verify the fix worked
SELECT 
  'AUTH COLUMNS FIXED' as status,
  email,
  CASE 
    WHEN email_change IS NULL THEN '❌ email_change still NULL'
    WHEN phone_change IS NULL THEN '❌ phone_change still NULL'
    WHEN email_change_token_new IS NULL THEN '❌ email_change_token_new still NULL'
    WHEN email_change_token_current IS NULL THEN '❌ email_change_token_current still NULL'
    WHEN phone_change_token IS NULL THEN '❌ phone_change_token still NULL'
    WHEN recovery_token IS NULL THEN '❌ recovery_token still NULL'
    ELSE '✅ All columns fixed'
  END as column_status
FROM auth.users 
WHERE email = 'admin@ablego.co.uk';