/*
  # Create Admin User Script

  This script creates a complete admin user for AbleGo with proper database records.
  Run this in Supabase SQL Editor, then manually create the auth user.

  ## Steps:
  1. Creates admin user in users table
  2. Creates corresponding profile
  3. Provides verification queries
  4. Shows next steps for Supabase Auth setup

  ## Important:
  - Copy the generated UUID from step 1
  - Use EXACT same UUID when creating auth user in Supabase Dashboard
  - Ensure email is confirmed in auth dashboard
*/

-- Step 1: Create admin user record and capture the ID
DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@ablego.co.uk';
    admin_name text := 'AbleGo Admin';
BEGIN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Display the generated ID (you'll need this for Supabase Auth)
    RAISE NOTICE '=== ADMIN USER CREATION ===';
    RAISE NOTICE 'Generated Admin User ID: %', admin_user_id;
    RAISE NOTICE 'Admin Email: %', admin_email;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Copy this UUID and use it when creating the auth user!';
    RAISE NOTICE '';
    
    -- Create user record
    INSERT INTO users (id, email, role, created_at) 
    VALUES (
        admin_user_id,
        admin_email,
        'admin',
        now()
    );
    
    RAISE NOTICE '✅ Step 1: Admin user created in users table';
    
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
    
    RAISE NOTICE '✅ Step 2: Admin profile created in profiles table';
    RAISE NOTICE '';
    
    -- Verification queries
    RAISE NOTICE '=== VERIFICATION QUERIES ===';
    RAISE NOTICE 'Run these to verify the admin user was created correctly:';
    RAISE NOTICE '';
    RAISE NOTICE 'SELECT id, email, role FROM users WHERE email = ''%'';', admin_email;
    RAISE NOTICE 'SELECT id, email, name FROM profiles WHERE email = ''%'';', admin_email;
    RAISE NOTICE '';
    
    -- Next steps
    RAISE NOTICE '=== NEXT STEPS ===';
    RAISE NOTICE '1. Copy the Admin User ID above: %', admin_user_id;
    RAISE NOTICE '2. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '3. Click "Add User"';
    RAISE NOTICE '4. Email: %', admin_email;
    RAISE NOTICE '5. Password: [Create a secure password]';
    RAISE NOTICE '6. User ID: %', admin_user_id;
    RAISE NOTICE '7. Email Confirmed: ✅ CHECK THIS BOX';
    RAISE NOTICE '8. User Metadata: {"role": "admin"}';
    RAISE NOTICE '9. Click "Create User"';
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING ===';
    RAISE NOTICE 'After creation, test by:';
    RAISE NOTICE '1. Go to /login';
    RAISE NOTICE '2. Sign in with admin@ablego.co.uk and your password';
    RAISE NOTICE '3. Look for "Admin" button in navbar';
    RAISE NOTICE '4. Click "Admin" to access dashboard';
    
END $$;

-- Verification: Check if admin user was created successfully
SELECT 
    'users table' as table_name,
    id,
    email,
    role,
    created_at
FROM users 
WHERE email = 'admin@ablego.co.uk'

UNION ALL

SELECT 
    'profiles table' as table_name,
    id,
    email,
    name as role,
    created_at
FROM profiles 
WHERE email = 'admin@ablego.co.uk';

-- Additional verification: Check for any existing admin users
SELECT 
    'Existing admin users' as info,
    u.email,
    u.role,
    p.name,
    CASE 
        WHEN u.id = p.id THEN '✅ IDs Match'
        ELSE '❌ ID Mismatch'
    END as id_status
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.role = 'admin';