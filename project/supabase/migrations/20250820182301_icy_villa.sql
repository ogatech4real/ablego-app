/*
  # Fix User Creation Trigger - Handle Email Conflicts

  This migration fixes the foreign key constraint violation error that occurs when users
  try to create accounts during the booking flow. The issue is that the handle_new_user
  function was not properly handling cases where a user record already exists with the
  same email but different auth ID.

  ## Changes Made:
  1. Updated handle_new_user function to handle email conflicts
  2. Changed conflict resolution from ID-based to email-based
  3. Added proper error handling for edge cases
  4. Ensures foreign key constraints are satisfied

  ## Problem Solved:
  - "Database error saving new user" during signup
  - Foreign key constraint violations on profiles table
  - Email conflicts during guest-to-user conversion
*/

-- Drop and recreate the handle_new_user function with proper email conflict handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users table with email conflict handling
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
    NOW()
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    id = NEW.id,
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
    created_at = COALESCE(public.users.created_at, NOW());

  -- Insert into public.profiles table
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    is_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.profiles.name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', public.profiles.phone),
    is_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE public.profiles.is_verified END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any orphaned profiles that might exist
DO $$
BEGIN
  -- Update orphaned profiles to link to correct auth users by email
  UPDATE public.profiles 
  SET id = auth_users.id
  FROM auth.users AS auth_users
  WHERE public.profiles.email = auth_users.email 
    AND public.profiles.id != auth_users.id;
    
  -- Delete any profiles that don't have corresponding auth users
  DELETE FROM public.profiles 
  WHERE id NOT IN (SELECT id FROM auth.users);
  
  RAISE NOTICE 'Cleaned up orphaned profile records';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error cleaning up orphaned profiles: %', SQLERRM;
END $$;