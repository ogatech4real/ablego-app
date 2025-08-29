/*
  # Create Additional Admin User Script
  
  Use this to create additional admin users after the first one is working.
  Replace the email and name variables below.
*/

-- === CREATE ADDITIONAL ADMIN USER ===

DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'your-email@example.com'; -- 🔄 CHANGE THIS
    admin_name text := 'Your Name'; -- 🔄 CHANGE THIS
BEGIN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    RAISE NOTICE '=== CREATING ADDITIONAL ADMIN ===';
    RAISE NOTICE 'Generated Admin User ID: %', admin_user_id;
    RAISE NOTICE 'Admin Email: %', admin_email;
    RAISE NOTICE 'Admin Name: %', admin_name;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Copy this UUID for Supabase Auth!';
    RAISE NOTICE '';
    
    -- Create user record
    INSERT INTO users (id, email, role, created_at) 
    VALUES (
        admin_user_id,
        admin_email,
        'admin',
        now()
    );
    
    RAISE NOTICE '✅ Admin user created in users table';
    
    -- Create profile record
    INSERT INTO profiles (
        id, 
        email, 
        name, 
        is_verified, 
        is_active, 
        created_at, 
        updated_at
    ) VALUES (
        admin_user_id,
        admin_email,
        admin_name,
        true,
        true,
        now(),
        now()
    );
    
    RAISE NOTICE '✅ Admin profile created in profiles table';
    RAISE NOTICE '';
    RAISE NOTICE '=== NEXT STEPS ===';
    RAISE NOTICE '1. Copy this UUID: %', admin_user_id;
    RAISE NOTICE '2. Create auth user in Supabase Dashboard';
    RAISE NOTICE '3. Use email: %', admin_email;
    RAISE NOTICE '4. Use UUID: %', admin_user_id;
    RAISE NOTICE '5. Confirm email in auth dashboard';
    RAISE NOTICE '6. Test login at /login';
    
END $$;