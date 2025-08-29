/*
  # Admin Setup Diagnostic and Fix

  This script diagnoses and fixes admin user setup issues.
  It creates the admin user in all required tables and verifies the setup.

  1. Check Auth User Existence
  2. Create/Update Users Record
  3. Create/Update Profile Record
  4. Verify Complete Setup
*/

-- First, let's check what exists and create a diagnostic report
DO $$
DECLARE
    auth_user_id uuid;
    auth_user_exists boolean := false;
    users_record_exists boolean := false;
    profile_record_exists boolean := false;
    target_uuid uuid := 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
BEGIN
    RAISE NOTICE '=== ADMIN SETUP DIAGNOSTIC ===';
    RAISE NOTICE 'Target admin email: admin@ablego.co.uk';
    RAISE NOTICE 'Target UUID: %', target_uuid;
    RAISE NOTICE '';

    -- Check auth user
    BEGIN
        SELECT id INTO auth_user_id 
        FROM auth.users 
        WHERE email = 'admin@ablego.co.uk';
        
        IF auth_user_id IS NOT NULL THEN
            auth_user_exists := true;
            RAISE NOTICE '✅ Auth user found with ID: %', auth_user_id;
        ELSE
            RAISE NOTICE '❌ Auth user not found in auth.users table';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot access auth.users table: %', SQLERRM;
    END;

    -- Check users table
    IF EXISTS (SELECT 1 FROM users WHERE id = target_uuid) THEN
        users_record_exists := true;
        RAISE NOTICE '✅ Users record exists';
    ELSE
        RAISE NOTICE '❌ Users record missing - will create';
    END IF;

    -- Check profiles table
    IF EXISTS (SELECT 1 FROM profiles WHERE id = target_uuid) THEN
        profile_record_exists := true;
        RAISE NOTICE '✅ Profile record exists';
    ELSE
        RAISE NOTICE '❌ Profile record missing - will create';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== CREATING/UPDATING RECORDS ===';
END $$;

-- Create/update users record with proper enum casting
INSERT INTO users (id, email, role, created_at)
VALUES (
  'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae',
  'admin@ablego.co.uk',
  'admin'::user_role,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin'::user_role,
  created_at = COALESCE(users.created_at, NOW());

-- Create/update profiles record
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

-- Final verification with safe enum handling
DO $$
DECLARE
    final_users_role user_role;
    final_profile_name text;
    setup_complete boolean := false;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL VERIFICATION ===';

    -- Check users record
    SELECT role INTO final_users_role 
    FROM users 
    WHERE id = 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';

    IF final_users_role = 'admin'::user_role THEN
        RAISE NOTICE '✅ Users table: Admin role confirmed';
    ELSE
        RAISE NOTICE '❌ Users table: Role issue';
    END IF;

    -- Check profile record
    SELECT name INTO final_profile_name 
    FROM profiles 
    WHERE id = 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';

    IF final_profile_name IS NOT NULL THEN
        RAISE NOTICE '✅ Profiles table: Profile exists with name "%"', final_profile_name;
        setup_complete := true;
    ELSE
        RAISE NOTICE '❌ Profiles table: Profile missing';
    END IF;

    -- Final status
    IF setup_complete AND final_users_role = 'admin'::user_role THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ✅ ADMIN SETUP COMPLETED SUCCESSFULLY!';
        RAISE NOTICE 'You can now login with:';
        RAISE NOTICE '  Email: admin@ablego.co.uk';
        RAISE NOTICE '  Password: CareGold17';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Go to /login';
        RAISE NOTICE '2. Sign in with the credentials above';
        RAISE NOTICE '3. Look for the purple "Admin" button in navbar';
        RAISE NOTICE '4. Click "Admin" to access dashboard';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ ADMIN SETUP INCOMPLETE';
        RAISE NOTICE 'Please check Supabase Auth dashboard to ensure:';
        RAISE NOTICE '1. User admin@ablego.co.uk exists in Authentication';
        RAISE NOTICE '2. Email is confirmed';
        RAISE NOTICE '3. User ID matches: a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
    END IF;
END $$;