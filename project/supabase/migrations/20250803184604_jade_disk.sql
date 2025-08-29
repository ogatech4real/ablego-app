/*
  # Email Confirmation Handler

  1. Function
    - `handle_email_confirmation` - Processes email confirmation and creates user profile
  
  2. Security
    - Ensures proper profile creation with correct role assignment
    - Handles edge cases for existing profiles
*/

-- Function to handle email confirmation and profile creation
CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if email is being confirmed (email_confirmed_at is being set)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Create profile with metadata from auth.users
      INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        is_verified,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        true,
        true,
        NOW(),
        NOW()
      );
      
      -- Update users table with correct role
      UPDATE public.users 
      SET role = COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role, 
        'rider'::user_role
      )
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();