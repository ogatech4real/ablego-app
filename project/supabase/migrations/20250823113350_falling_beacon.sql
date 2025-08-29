/*
  # Fix Auth Users Table Schema Issue

  This migration fixes the "email_change" column NULL value issue that's preventing login.
  The error occurs when Supabase auth tries to scan the users table but encounters NULL values
  in string columns that can't be converted.

  ## Changes Made
  1. Update NULL email_change values to empty strings
  2. Update NULL phone_change values to empty strings  
  3. Ensure admin user has proper auth record
*/

-- Fix NULL values in auth.users table that are causing scan errors
UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, '')
WHERE 
  email_change IS NULL 
  OR phone_change IS NULL;

-- Ensure admin user exists in auth.users with proper values
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  email_change,
  phone_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae',
  'admin@ablego.co.uk',
  crypt('CareGold17', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "full_name": "AbleGo Admin"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
  email_change = '',
  phone_change = '',
  raw_user_meta_data = '{"role": "admin", "full_name": "AbleGo Admin"}',
  updated_at = NOW();

-- Ensure users table record exists
INSERT INTO users (id, email, role, created_at)
VALUES (
  'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae',
  'admin@ablego.co.uk',
  'admin'::user_role,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin'::user_role;

-- Ensure profiles table record exists
INSERT INTO profiles (id, email, name, is_verified, is_active, created_at, updated_at)
VALUES (
  'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae',
  'admin@ablego.co.uk',
  'AbleGo Admin',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = 'AbleGo Admin',
  is_verified = true,
  is_active = true,
  updated_at = NOW();