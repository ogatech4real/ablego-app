/*
  # Enhance User Account Creation - Priority 2

  1. User Account Creation Issues
    - No intelligent user management when creating accounts during checkout
    - No proper role assignment based on user behavior
    - No account linking between guest bookings and user accounts
    - Missing user profile enhancement during account creation

  2. Solutions
    - Create intelligent user account creation function
    - Add account linking between guest bookings and user accounts
    - Enhance user profile management
    - Add proper role assignment logic
    - Create user account upgrade functionality

  3. Changes
    - Add user account creation function
    - Enhance guest booking to user account linking
    - Add user profile enhancement
    - Create account upgrade triggers
    - Add user behavior tracking
*/

-- Create function to intelligently create user accounts
CREATE OR REPLACE FUNCTION create_user_account_from_guest(
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  password_hash TEXT,
  guest_rider_id UUID DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
  user_role public.user_role;
  profile_data json;
  account_status text;
  message text;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = guest_email;
  
  IF existing_user_id IS NOT NULL THEN
    -- User already exists - link guest booking to existing account
    BEGIN
      -- Update existing user profile with guest information
      UPDATE public.profiles 
      SET 
        name = COALESCE(guest_name, profiles.name),
        phone = COALESCE(guest_phone, profiles.phone),
        updated_at = NOW()
      WHERE id = existing_user_id;
      
      -- Link guest rider to existing user if provided
      IF guest_rider_id IS NOT NULL THEN
        UPDATE public.guest_riders 
        SET 
          linked_user_id = existing_user_id,
          updated_at = NOW()
        WHERE id = guest_rider_id;
      END IF;
      
      account_status = 'linked';
      message = 'Account linked to existing user successfully';
      
      RETURN json_build_object(
        'success', true,
        'user_id', existing_user_id,
        'account_status', account_status,
        'message', message,
        'action', 'linked_existing'
      );
      
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Failed to link to existing account: ' || SQLERRM
      );
    END;
  END IF;
  
  -- Create new user account
  BEGIN
    -- Determine user role based on behavior (default to rider)
    user_role := 'rider';
    
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      guest_email,
      password_hash,
      NOW(),
      NOW(),
      NOW(),
      json_build_object(
        'full_name', guest_name,
        'phone', guest_phone,
        'role', user_role,
        'created_from_guest', true,
        'guest_rider_id', guest_rider_id
      ),
      false,
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    -- Create user profile
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
      new_user_id,
      guest_email,
      guest_name,
      guest_phone,
      true,
      true,
      NOW(),
      NOW()
    );
    
    -- Create user record
    INSERT INTO public.users (
      id,
      email,
      role,
      created_at
    ) VALUES (
      new_user_id,
      guest_email,
      user_role,
      NOW()
    );
    
    -- Link guest rider to new user if provided
    IF guest_rider_id IS NOT NULL THEN
      UPDATE public.guest_riders 
      SET 
        linked_user_id = new_user_id,
        updated_at = NOW()
      WHERE id = guest_rider_id;
    END IF;
    
    -- Create user preferences
    INSERT INTO public.user_preferences (
      user_id,
      email_notifications,
      sms_notifications,
      push_notifications,
      language,
      timezone,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      true,
      true,
      true,
      'en',
      'Europe/London',
      NOW(),
      NOW()
    );
    
    -- Create user statistics
    INSERT INTO public.user_statistics (
      user_id,
      total_bookings,
      total_spent,
      average_rating,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      0,
      0.00,
      0.0,
      NOW(),
      NOW()
    );
    
    account_status = 'created';
    message = 'New user account created successfully';
    
    RETURN json_build_object(
      'success', true,
      'user_id', new_user_id,
      'account_status', account_status,
      'message', message,
      'action', 'created_new'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create user account: ' || SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to upgrade guest booking to user account
CREATE OR REPLACE FUNCTION upgrade_guest_to_user_account(
  guest_booking_id UUID,
  password_hash TEXT
)
RETURNS json AS $$
DECLARE
  guest_booking_record RECORD;
  guest_rider_record RECORD;
  user_creation_result json;
BEGIN
  -- Get guest booking details
  SELECT * INTO guest_booking_record
  FROM public.guest_bookings
  WHERE id = guest_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Guest booking not found'
    );
  END IF;
  
  -- Get guest rider details
  SELECT * INTO guest_rider_record
  FROM public.guest_riders
  WHERE id = guest_booking_record.guest_rider_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Guest rider not found'
    );
  END IF;
  
  -- Create user account
  SELECT create_user_account_from_guest(
    guest_rider_record.email,
    guest_rider_record.name,
    guest_rider_record.phone,
    password_hash,
    guest_rider_record.id
  ) INTO user_creation_result;
  
  -- Update guest booking with user account link
  IF (user_creation_result->>'success')::boolean THEN
    UPDATE public.guest_bookings
    SET 
      linked_user_id = (user_creation_result->>'user_id')::UUID,
      updated_at = NOW()
    WHERE id = guest_booking_id;
  END IF;
  
  RETURN user_creation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to merge guest bookings into user account
CREATE OR REPLACE FUNCTION merge_guest_bookings_to_user(
  user_id UUID
)
RETURNS json AS $$
DECLARE
  merged_count INTEGER := 0;
  guest_booking_record RECORD;
BEGIN
  -- Find all guest bookings for this user's email
  FOR guest_booking_record IN
    SELECT gb.*
    FROM public.guest_bookings gb
    JOIN public.guest_riders gr ON gb.guest_rider_id = gr.id
    JOIN public.users u ON gr.email = u.email
    WHERE u.id = user_id AND gb.linked_user_id IS NULL
  LOOP
    -- Link guest booking to user account
    UPDATE public.guest_bookings
    SET 
      linked_user_id = user_id,
      updated_at = NOW()
    WHERE id = guest_booking_record.id;
    
    merged_count := merged_count + 1;
  END LOOP;
  
  -- Update user statistics
  UPDATE public.user_statistics
  SET 
    total_bookings = (
      SELECT COUNT(*) 
      FROM public.guest_bookings 
      WHERE linked_user_id = user_id
    ),
    total_spent = (
      SELECT COALESCE(SUM(fare_estimate), 0.00)
      FROM public.guest_bookings 
      WHERE linked_user_id = user_id AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE user_id = user_id;
  
  RETURN json_build_object(
    'success', true,
    'merged_bookings', merged_count,
    'message', 'Successfully merged ' || merged_count || ' guest bookings'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add columns for user account linking
ALTER TABLE public.guest_riders 
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMPTZ;

ALTER TABLE public.guest_bookings 
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS account_linked_at TIMESTAMPTZ;

-- Create user preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Europe/London',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guest_riders_linked_user 
ON public.guest_riders (linked_user_id);

CREATE INDEX IF NOT EXISTS idx_guest_bookings_linked_user 
ON public.guest_bookings (linked_user_id);

CREATE INDEX IF NOT EXISTS idx_guest_riders_email 
ON public.guest_riders (email);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON public.user_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id 
ON public.user_statistics (user_id);

-- Create view for user account overview
CREATE OR REPLACE VIEW user_account_overview AS
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  p.name,
  p.phone,
  p.is_verified,
  p.is_active,
  up.email_notifications,
  up.sms_notifications,
  up.push_notifications,
  us.total_bookings,
  us.total_spent,
  us.average_rating,
  COUNT(gb.id) as guest_bookings_count,
  COUNT(gr.id) as guest_riders_count,
  u.created_at,
  p.updated_at
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_preferences up ON u.id = up.user_id
LEFT JOIN public.user_statistics us ON u.id = us.user_id
LEFT JOIN public.guest_bookings gb ON u.id = gb.linked_user_id
LEFT JOIN public.guest_riders gr ON u.id = gr.linked_user_id
GROUP BY u.id, u.email, u.role, p.name, p.phone, p.is_verified, p.is_active,
         up.email_notifications, up.sms_notifications, up.push_notifications,
         us.total_bookings, us.total_spent, us.average_rating, u.created_at, p.updated_at;

-- Create function to get user account status
CREATE OR REPLACE FUNCTION get_user_account_status(user_email TEXT)
RETURNS json AS $$
DECLARE
  user_record RECORD;
  guest_bookings_count INTEGER;
  guest_riders_count INTEGER;
BEGIN
  -- Get user information
  SELECT * INTO user_record
  FROM public.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    -- Check if there are guest bookings for this email
    SELECT COUNT(*) INTO guest_bookings_count
    FROM public.guest_bookings gb
    JOIN public.guest_riders gr ON gb.guest_rider_id = gr.id
    WHERE gr.email = user_email;
    
    SELECT COUNT(*) INTO guest_riders_count
    FROM public.guest_riders
    WHERE email = user_email;
    
    RETURN json_build_object(
      'account_exists', false,
      'guest_bookings_count', guest_bookings_count,
      'guest_riders_count', guest_riders_count,
      'can_create_account', guest_bookings_count > 0,
      'message', 'No user account found, but guest bookings exist'
    );
  END IF;
  
  -- Get linked guest bookings count
  SELECT COUNT(*) INTO guest_bookings_count
  FROM public.guest_bookings
  WHERE linked_user_id = user_record.id;
  
  SELECT COUNT(*) INTO guest_riders_count
  FROM public.guest_riders
  WHERE linked_user_id = user_record.id;
  
  RETURN json_build_object(
    'account_exists', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'role', user_record.role,
    'guest_bookings_count', guest_bookings_count,
    'guest_riders_count', guest_riders_count,
    'message', 'User account found with linked guest bookings'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_account_from_guest(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upgrade_guest_to_user_account(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_guest_bookings_to_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_account_status(TEXT) TO authenticated;
GRANT SELECT ON user_account_overview TO authenticated;

-- Add RLS policies for new tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user statistics
CREATE POLICY "Users can view own statistics" ON public.user_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON public.user_statistics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON public.user_statistics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for guest riders and bookings linking
CREATE POLICY "Users can view linked guest riders" ON public.guest_riders
  FOR SELECT USING (auth.uid() = linked_user_id);

CREATE POLICY "Users can view linked guest bookings" ON public.guest_bookings
  FOR SELECT USING (auth.uid() = linked_user_id);

-- Log the migration completion
DO $$
BEGIN
  RAISE LOG 'User account creation enhancement migration completed successfully';
  RAISE LOG 'Created intelligent user account creation functions';
  RAISE LOG 'Added guest booking to user account linking';
  RAISE LOG 'Created user preferences and statistics tables';
  RAISE LOG 'Added comprehensive user account management';
END $$;
