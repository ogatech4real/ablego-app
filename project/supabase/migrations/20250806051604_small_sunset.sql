/*
  # Fix signup foreign key constraint violation

  1. Problem
    - The `handle_new_user` trigger tries to insert into `profiles` table
    - But the `profiles_id_fkey` constraint requires the user to exist in `users` table first
    - The trigger runs before the user is inserted into `users` table

  2. Solution
    - Update the trigger function to insert into `users` table first
    - Then insert into `profiles` table
    - Handle any conflicts gracefully

  3. Changes
    - Modify `handle_new_user` function to ensure proper order
    - Add error handling for constraint violations
    - Ensure both tables are populated correctly
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to fix the foreign key issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- First, insert into users table to satisfy foreign key constraint
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role;

  -- Then insert into profiles table
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    is_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE profiles.is_verified END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also update the email confirmation handler to be more robust
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Update profile verification status when email is confirmed
  UPDATE public.profiles
  SET 
    is_verified = true,
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the confirmation
    RAISE WARNING 'Error in handle_email_confirmation: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the email confirmation trigger exists
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_confirmation();