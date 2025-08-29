/*
  # Fix Admin User Script
  
  Use this script if the admin user exists but has issues.
  This will clean up and recreate the admin user properly.
*/

-- === ADMIN USER CLEANUP AND FIX ===

DO $$
DECLARE
    auth_user_id uuid;
    admin_email text := 'admin@ablego.co.uk';
    admin_name text := 'AbleGo Admin';
BEGIN
    RAISE NOTICE '=== FIXING ADMIN USER ===';
    
    -- Get the auth user ID if it exists
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE '❌ No auth user found for %', admin_email;
        RAISE NOTICE 'You must create the auth user in Supabase Dashboard first';
        RAISE NOTICE 'Then run this script again';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found auth user with ID: %', auth_user_id;
    
    -- Clean up existing records (if any)
    DELETE FROM profiles WHERE email = admin_email;
    DELETE FROM users WHERE email = admin_email;
    
    RAISE NOTICE '🧹 Cleaned up existing database records';
    
    -- Create fresh users record
    INSERT INTO users (id, email, role, created_at) 
    VALUES (
        auth_user_id,
        admin_email,
        'admin',
        now()
    );
    
    RAISE NOTICE '✅ Created users record with ID: %', auth_user_id;
    
    -- Create fresh profile record
    INSERT INTO profiles (
        id, 
        email, 
        name, 
        is_verified, 
        is_active, 
        created_at, 
        updated_at
    ) VALUES (
        auth_user_id,
        admin_email,
        admin_name,
        true,
        true,
        now(),
        now()
    );
    
    RAISE NOTICE '✅ Created profile record with ID: %', auth_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '=== ADMIN USER FIXED ===';
    RAISE NOTICE 'Auth ID: %', auth_user_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'Status: Ready for login';
    RAISE NOTICE '';
    RAISE NOTICE 'Now test by signing in at /login';
    
END $$;

-- Verify the fix worked
SELECT 
  'VERIFICATION' as check_type,
  'Admin user should now work' as message;

SELECT 
  au.id as auth_id,
  u.id as users_id,
  p.id as profiles_id,
  u.role,
  p.is_verified,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users au
JOIN users u ON au.id = u.id
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@ablego.co.uk';