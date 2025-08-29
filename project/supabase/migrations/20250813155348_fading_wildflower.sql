/*
  # Fix User Profile Creation on Signup

  1. Database Functions
    - Enhanced `handle_new_user` trigger function to properly create user and profile records
    - Improved error handling and logging
    - Ensures both users and profiles tables are populated

  2. Trigger Updates
    - Updated trigger to fire on auth.users INSERT
    - Proper role assignment from user metadata
    - Fallback role assignment if none provided

  3. Profile Creation
    - Creates user record in users table with proper role
    - Creates corresponding profile record with user details
    - Handles duplicate prevention and error recovery
*/

-- Drop existing trigger and function to recreate with fixes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Enhanced function to handle user creation with better error handling
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
  
  BEGIN
    -- Insert into users table (with conflict handling)
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (NEW.id, NEW.email, user_role, NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      created_at = COALESCE(users.created_at, EXCLUDED.created_at);
    
    RAISE LOG 'User record created/updated for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating user record for %: %', NEW.email, SQLERRM;
    -- Continue to profile creation even if user insert fails
  END;
  
  BEGIN
    -- Insert into profiles table (with conflict handling)
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
    RAISE LOG 'Error creating profile for %: %', NEW.email, SQLERRM;
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
      RAISE LOG 'Error creating support worker record for %: %', NEW.email, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enhanced email confirmation handler
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if email_confirmed_at was just set (changed from NULL to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    RAISE LOG 'Email confirmed for user: %', NEW.email;
    
    BEGIN
      -- Update profile verification status
      UPDATE public.profiles 
      SET 
        is_verified = true,
        updated_at = NOW()
      WHERE id = NEW.id;
      
      RAISE LOG 'Profile verification updated for: %', NEW.email;
      
      -- Send welcome notification
      INSERT INTO public.notifications (
        user_id,
        message,
        type,
        data,
        created_at
      )
      VALUES (
        NEW.id,
        'Welcome to AbleGo! Your email has been confirmed and your account is now active.',
        'system',
        jsonb_build_object(
          'event', 'email_confirmed',
          'confirmed_at', NEW.email_confirmed_at
        ),
        NOW()
      );
      
      RAISE LOG 'Welcome notification sent to: %', NEW.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error in email confirmation handler for %: %', NEW.email, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate email confirmation trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON auth.users TO postgres, service_role;
GRANT SELECT ON auth.users TO anon, authenticated;

-- Ensure the functions have proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO postgres, service_role;

-- Create a manual function to fix existing users without profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(user_id UUID, email TEXT, action TEXT) AS $$
DECLARE
  auth_user RECORD;
  user_role public.user_role;
BEGIN
  -- Find auth users without corresponding profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Extract role from metadata
    user_role := COALESCE(
      (auth_user.raw_user_meta_data->>'role')::public.user_role,
      'rider'::public.user_role
    );
    
    BEGIN
      -- Create user record
      INSERT INTO public.users (id, email, role, created_at)
      VALUES (auth_user.id, auth_user.email, user_role, NOW())
      ON CONFLICT (id) DO NOTHING;
      
      -- Create profile record
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
        auth_user.id,
        auth_user.email,
        auth_user.raw_user_meta_data->>'full_name',
        auth_user.raw_user_meta_data->>'phone',
        auth_user.email_confirmed_at IS NOT NULL,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      
      -- Return info about what was created
      user_id := auth_user.id;
      email := auth_user.email;
      action := 'created';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error creating missing profile for %: %', auth_user.email, SQLERRM;
      user_id := auth_user.id;
      email := auth_user.email;
      action := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to fix existing users
SELECT * FROM public.create_missing_profiles();