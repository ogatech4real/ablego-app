/*
  # Test Admin Login Flow
  
  This script simulates the login flow to identify any database issues
*/

DO $$
DECLARE
    auth_user_id uuid := 'a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
    admin_email text := 'admin@ablego.co.uk';
    user_record RECORD;
    profile_record RECORD;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN LOGIN FLOW ===';
    
    -- Step 1: Check auth user (simulates auth.getUser())
    IF EXISTS(SELECT 1 FROM auth.users WHERE id = auth_user_id AND email = admin_email) THEN
        RAISE NOTICE '✅ Step 1: Auth user found';
    ELSE
        RAISE NOTICE '❌ Step 1: Auth user not found';
        RETURN;
    END IF;
    
    -- Step 2: Check users table (simulates useAuth hook)
    SELECT * INTO user_record FROM users WHERE id = auth_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Step 2: Users record found - Role: %', user_record.role;
        IF user_record.role = 'admin' THEN
            RAISE NOTICE '✅ Step 2a: Admin role confirmed';
        ELSE
            RAISE NOTICE '❌ Step 2a: Wrong role: % (should be admin)', user_record.role;
        END IF;
    ELSE
        RAISE NOTICE '❌ Step 2: Users record not found';
        RETURN;
    END IF;
    
    -- Step 3: Check profile (simulates db.getProfile())
    SELECT * INTO profile_record FROM profiles WHERE id = auth_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Step 3: Profile found - Name: %, Verified: %', profile_record.name, profile_record.is_verified;
        IF profile_record.is_verified THEN
            RAISE NOTICE '✅ Step 3a: Profile is verified';
        ELSE
            RAISE NOTICE '❌ Step 3a: Profile not verified';
        END IF;
    ELSE
        RAISE NOTICE '❌ Step 3: Profile not found';
        RETURN;
    END IF;
    
    -- Step 4: Test admin access (simulates AdminRoute component)
    IF user_record.role = 'admin' AND profile_record.is_verified THEN
        RAISE NOTICE '✅ Step 4: Admin access should work';
        RAISE NOTICE '✅ LOGIN FLOW TEST PASSED - Admin should be able to login';
    ELSE
        RAISE NOTICE '❌ Step 4: Admin access will fail';
        RAISE NOTICE 'User role: %, Profile verified: %', user_record.role, profile_record.is_verified;
    END IF;
    
    -- Step 5: Check RLS policies
    RAISE NOTICE '=== CHECKING RLS POLICIES ===';
    
    -- Test if admin can read users
    IF EXISTS(
        SELECT 1 FROM users 
        WHERE id = auth_user_id 
        AND role = 'admin'
    ) THEN
        RAISE NOTICE '✅ RLS: Admin can access users table';
    ELSE
        RAISE NOTICE '❌ RLS: Admin cannot access users table';
    END IF;
    
    -- Test if admin can read profiles  
    IF EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = auth_user_id
    ) THEN
        RAISE NOTICE '✅ RLS: Admin can access profiles table';
    ELSE
        RAISE NOTICE '❌ RLS: Admin cannot access profiles table';
    END IF;
    
    RAISE NOTICE '=== TEST COMPLETED ===';
    
END $$;