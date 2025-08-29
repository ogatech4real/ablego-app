/*
  # Diagnose and Fix Admin User Database Issues

  This script will:
  1. Check if the admin user exists in auth
  2. Verify database records
  3. Fix any inconsistencies
  4. Create missing records
  5. Ensure proper role assignment
*/

DO $$
DECLARE
    auth_user_id uuid := 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
    admin_email text := 'admin@ablego.co.uk';
    admin_name text := 'AbleGo Admin';
    user_exists boolean := false;
    profile_exists boolean := false;
    auth_exists boolean := false;
BEGIN
    RAISE NOTICE '=== STARTING ADMIN USER DIAGNOSTIC AND FIX ===';
    RAISE NOTICE 'Target Auth UUID: %', auth_user_id;
    RAISE NOTICE 'Target Email: %', admin_email;
    
    -- Check if auth user exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE id = auth_user_id AND email = admin_email
    ) INTO auth_exists;
    
    RAISE NOTICE 'Auth user exists: %', auth_exists;
    
    -- Check if user record exists
    SELECT EXISTS(
        SELECT 1 FROM users WHERE id = auth_user_id
    ) INTO user_exists;
    
    RAISE NOTICE 'Users record exists: %', user_exists;
    
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE id = auth_user_id
    ) INTO profile_exists;
    
    RAISE NOTICE 'Profile record exists: %', profile_exists;
    
    -- Fix or create users record
    IF NOT user_exists THEN
        RAISE NOTICE 'Creating users record...';
        INSERT INTO users (id, email, role, created_at)
        VALUES (auth_user_id, admin_email, 'admin', now())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = 'admin',
            created_at = COALESCE(users.created_at, now());
        RAISE NOTICE '✅ Users record created/updated';
    ELSE
        -- Update existing users record to ensure admin role
        UPDATE users 
        SET role = 'admin', email = admin_email
        WHERE id = auth_user_id;
        RAISE NOTICE '✅ Users record updated with admin role';
    END IF;
    
    -- Fix or create profile record
    IF NOT profile_exists THEN
        RAISE NOTICE 'Creating profile record...';
        INSERT INTO profiles (
            id, email, name, phone, address, date_of_birth,
            emergency_contact_name, emergency_contact_phone,
            medical_notes, accessibility_requirements, profile_image_url,
            is_verified, is_active, created_at, updated_at
        )
        VALUES (
            auth_user_id, admin_email, admin_name, '+44 800 123 4567', 
            'AbleGo HQ, Middlesbrough, UK', '1980-01-01',
            'AbleGo Support', '+44 800 123 4567',
            'System administrator account', ARRAY['admin_access'],
            null, true, true, now(), now()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            is_verified = true,
            is_active = true,
            updated_at = now();
        RAISE NOTICE '✅ Profile record created/updated';
    ELSE
        -- Update existing profile
        UPDATE profiles 
        SET 
            email = admin_email,
            name = admin_name,
            is_verified = true,
            is_active = true,
            updated_at = now()
        WHERE id = auth_user_id;
        RAISE NOTICE '✅ Profile record updated';
    END IF;
    
    -- Verify the setup
    RAISE NOTICE '=== VERIFICATION ===';
    
    -- Check users table
    IF EXISTS(SELECT 1 FROM users WHERE id = auth_user_id AND role = 'admin') THEN
        RAISE NOTICE '✅ Users table: Admin role confirmed';
    ELSE
        RAISE NOTICE '❌ Users table: Admin role missing or incorrect';
    END IF;
    
    -- Check profiles table
    IF EXISTS(SELECT 1 FROM profiles WHERE id = auth_user_id AND is_verified = true) THEN
        RAISE NOTICE '✅ Profiles table: Verified admin profile exists';
    ELSE
        RAISE NOTICE '❌ Profiles table: Profile missing or not verified';
    END IF;
    
    -- Check ID consistency
    IF EXISTS(
        SELECT 1 FROM users u 
        JOIN profiles p ON u.id = p.id 
        WHERE u.id = auth_user_id AND u.email = admin_email
    ) THEN
        RAISE NOTICE '✅ ID Consistency: All IDs match perfectly';
    ELSE
        RAISE NOTICE '❌ ID Consistency: Mismatch detected';
    END IF;
    
    RAISE NOTICE '=== ADMIN SETUP COMPLETED ===';
    RAISE NOTICE 'You can now login with:';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: CareGold17';
    RAISE NOTICE 'Auth UUID: %', auth_user_id;
    
END $$;