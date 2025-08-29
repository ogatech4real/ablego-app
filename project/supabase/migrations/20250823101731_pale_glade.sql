/*
  # Sync Existing Admin User with Database

  This script syncs the existing auth user a4fd8dea-5aa9-4e8c-9848-746e42bc60ae 
  with the database records to enable admin dashboard access.

  1. Updates/Creates users table record
  2. Updates/Creates profiles table record  
  3. Ensures proper admin role assignment
  4. Verifies all connections work
*/

DO $$
DECLARE
    auth_user_uuid uuid := 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
    admin_email text := 'admin@ablego.co.uk';
    existing_users_record record;
    existing_profiles_record record;
BEGIN
    RAISE NOTICE '=== SYNCING EXISTING ADMIN USER ===';
    RAISE NOTICE 'Auth UUID: %', auth_user_uuid;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE '';

    -- Check if users record exists
    SELECT * INTO existing_users_record FROM users WHERE id = auth_user_uuid;
    
    IF existing_users_record IS NULL THEN
        -- Create users record
        INSERT INTO users (id, email, role, created_at) 
        VALUES (
            auth_user_uuid,
            admin_email,
            'admin',
            now()
        );
        RAISE NOTICE '✅ Created users table record';
    ELSE
        -- Update existing users record
        UPDATE users 
        SET 
            email = admin_email,
            role = 'admin',
            created_at = COALESCE(created_at, now())
        WHERE id = auth_user_uuid;
        RAISE NOTICE '✅ Updated existing users table record';
    END IF;

    -- Check if profiles record exists
    SELECT * INTO existing_profiles_record FROM profiles WHERE id = auth_user_uuid;
    
    IF existing_profiles_record IS NULL THEN
        -- Create profiles record
        INSERT INTO profiles (
            id, 
            email, 
            name, 
            is_verified, 
            is_active, 
            created_at, 
            updated_at
        ) VALUES (
            auth_user_uuid,
            admin_email,
            'AbleGo Admin',
            true,
            true,
            now(),
            now()
        );
        RAISE NOTICE '✅ Created profiles table record';
    ELSE
        -- Update existing profiles record
        UPDATE profiles 
        SET 
            email = admin_email,
            name = COALESCE(name, 'AbleGo Admin'),
            is_verified = true,
            is_active = true,
            updated_at = now()
        WHERE id = auth_user_uuid;
        RAISE NOTICE '✅ Updated existing profiles table record';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION ===';
    
    -- Verify users table
    IF EXISTS (SELECT 1 FROM users WHERE id = auth_user_uuid AND role = 'admin') THEN
        RAISE NOTICE '✅ Users table: Admin role confirmed';
    ELSE
        RAISE NOTICE '❌ Users table: Admin role NOT found';
    END IF;
    
    -- Verify profiles table
    IF EXISTS (SELECT 1 FROM profiles WHERE id = auth_user_uuid AND is_verified = true) THEN
        RAISE NOTICE '✅ Profiles table: Verified admin profile confirmed';
    ELSE
        RAISE NOTICE '❌ Profiles table: Verified profile NOT found';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== SYNC COMPLETED ===';
    RAISE NOTICE 'Auth User UUID: %', auth_user_uuid;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: CareGold17';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 READY TO LOGIN!';
    RAISE NOTICE 'Go to /login and sign in with the credentials above';

END $$;