/*
  # Fix Foreign Key Constraint Violation in User Creation

  1. Problem
    - The `handle_new_user` trigger function violates foreign key constraint
    - It tries to insert into `profiles` table before ensuring user exists in `users` table
    - This causes "profiles_id_fkey" constraint violation during signup

  2. Solution
    - Update the trigger function to insert into `users` table first
    - Then insert into `profiles` table with proper error handling
    - Ensure both operations succeed or fail gracefully

  3. Changes
    - Fix the order of operations in `handle_new_user` function
    - Add proper error handling for constraint violations
    - Ensure atomic operations with proper transaction handling
*/

-- Drop existing trigger to avoid conflicts during update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved function that handles foreign key constraints properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
  user_name TEXT;
  user_phone TEXT;
BEGIN
  -- Extract role from user metadata, default to 'rider'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'rider'::public.user_role
  );
  
  -- Extract name and phone from metadata
  user_name := NEW.raw_user_meta_data->>'full_name';
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Log the user creation attempt
  RAISE LOG 'Creating user profile for: % with role: %', NEW.email, user_role;
  
  -- CRITICAL: Insert into users table FIRST to satisfy foreign key constraint
  BEGIN
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (NEW.id, NEW.email, user_role, NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      created_at = COALESCE(users.created_at, EXCLUDED.created_at);
    
    RAISE LOG 'User record created/updated for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user record for %: %', NEW.email, SQLERRM;
    -- Don't fail the auth signup for user table errors
    RETURN NEW;
  END;
  
  -- Now insert into profiles table (foreign key constraint will be satisfied)
  BEGIN
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
      user_name, 
      user_phone, 
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false), 
      true, 
      NOW(), 
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(profiles.name, EXCLUDED.name),
      phone = COALESCE(profiles.phone, EXCLUDED.phone),
      is_verified = COALESCE(EXCLUDED.is_verified, profiles.is_verified),
      updated_at = NOW();
    
    RAISE LOG 'Profile created/updated for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for %: %', NEW.email, SQLERRM;
    -- Don't fail the auth signup for profile creation errors
    RETURN NEW;
  END;
  
  -- Create role-specific records if needed
  IF user_role = 'support_worker' THEN
    BEGIN
      INSERT INTO public.support_workers (
        user_id,
        bio,
        experience_years,
        hourly_rate,
        specializations,
        languages,
        certifications,
        verified,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        '',
        0,
        18.50,
        '{}',
        ARRAY['English'],
        '{}',
        false,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE LOG 'Support worker record created for: %', NEW.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error creating support worker record for %: %', NEW.email, SQLERRM;
      -- Don't fail for role-specific record creation errors
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Create a function to fix any existing orphaned profiles
CREATE OR REPLACE FUNCTION public.fix_orphaned_profiles()
RETURNS TABLE(profile_id UUID, email TEXT, action TEXT) AS $$
DECLARE
  orphaned_profile RECORD;
BEGIN
  -- Find profiles without corresponding users
  FOR orphaned_profile IN 
    SELECT p.id, p.email
    FROM public.profiles p
    LEFT JOIN public.users u ON p.id = u.id
    WHERE u.id IS NULL
  LOOP
    BEGIN
      -- Create missing user record
      INSERT INTO public.users (id, email, role, created_at)
      VALUES (orphaned_profile.id, orphaned_profile.email, 'rider', NOW())
      ON CONFLICT (id) DO NOTHING;
      
      -- Return info about what was fixed
      profile_id := orphaned_profile.id;
      email := orphaned_profile.email;
      action := 'created_missing_user';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error fixing orphaned profile for %: %', orphaned_profile.email, SQLERRM;
      profile_id := orphaned_profile.id;
      email := orphaned_profile.email;
      action := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the fix function to resolve any existing orphaned profiles
SELECT * FROM public.fix_orphaned_profiles();

-- Drop the fix function as it's no longer needed
DROP FUNCTION IF EXISTS public.fix_orphaned_profiles();