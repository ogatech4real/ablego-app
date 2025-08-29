/*
  # Fix handle_new_user function - Role column error

  1. Problem
    - The trigger function is trying to access 'role' column in 'profiles' table
    - But 'role' column exists in 'users' table, not 'profiles' table
    - This causes "column role of relation profiles does not exist" error

  2. Solution
    - Update the trigger function to not reference role in profiles
    - Role is managed in the users table
    - Profiles table contains user details, users table contains role

  3. Changes
    - Remove role reference from profiles insert
    - Simplify the trigger function
    - Ensure proper error handling
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create the corrected function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table (without role - role is in users table)
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();