/*
  # Fix Missing Profile Record

  1. Problem
    - User successfully authenticated with ID: a4fd8dea-5aa9-4e8c-9848-746e42bc60ae
    - Profile record missing for this user ID
    - Causing 500 error when app tries to fetch profile

  2. Solution
    - Create profile record for the authenticated user
    - Ensure users table record exists
    - Set proper admin role and verification status
*/

-- First, check if this is our admin user by email
DO $$
DECLARE
    auth_user_email TEXT;
    auth_user_id UUID := 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
BEGIN
    -- Get email from auth.users
    SELECT email INTO auth_user_email
    FROM auth.users 
    WHERE id = auth_user_id;
    
    RAISE NOTICE 'Found auth user: % with email: %', auth_user_id, COALESCE(auth_user_email, 'NO EMAIL FOUND');
    
    -- If this is the admin user, create the missing records
    IF auth_user_email = 'admin@ablego.co.uk' THEN
        -- Ensure users table record exists
        INSERT INTO users (id, email, role, created_at)
        VALUES (auth_user_id, auth_user_email, 'admin'::user_role, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = 'admin'::user_role;
        
        RAISE NOTICE '✅ Users table record ensured for admin';
        
        -- Create profile record
        INSERT INTO profiles (id, email, name, is_verified, is_active, created_at, updated_at)
        VALUES (auth_user_id, auth_user_email, 'AbleGo Admin', true, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = 'AbleGo Admin',
            is_verified = true,
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Profile record created/updated for admin';
        
    ELSE
        -- For any other authenticated user, create basic profile
        INSERT INTO profiles (id, email, name, is_verified, is_active, created_at, updated_at)
        VALUES (auth_user_id, COALESCE(auth_user_email, 'unknown@example.com'), 'User', true, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, profiles.email),
            is_verified = true,
            is_active = true,
            updated_at = NOW();
        
        -- Ensure users table record
        INSERT INTO users (id, email, role, created_at)
        VALUES (auth_user_id, COALESCE(auth_user_email, 'unknown@example.com'), 'rider'::user_role, NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email;
        
        RAISE NOTICE '✅ Profile and users records created for user: %', auth_user_email;
    END IF;
    
END $$;

-- Verify the fix worked
SELECT 
    'VERIFICATION' as status,
    u.id as user_id,
    u.email as user_email,
    u.role as user_role,
    p.id as profile_id,
    p.name as profile_name,
    p.is_verified as profile_verified
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';