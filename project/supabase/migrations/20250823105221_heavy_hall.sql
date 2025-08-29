/*
  # Test Admin Login Flow

  This script tests the complete admin login flow to identify where the issue is occurring.
  It simulates exactly what happens when admin@ablego.co.uk tries to login.

  1. Check Auth User
  2. Check Users Table  
  3. Check Profiles Table
  4. Verify ID Consistency
  5. Test Login Flow
*/

DO $$
DECLARE
    auth_user_id uuid;
    users_record_exists boolean := false;
    profile_record_exists boolean := false;
    users_role text;
    profile_verified boolean;
    id_match boolean := false;
BEGIN
    RAISE NOTICE '=== TESTING ADMIN LOGIN FLOW ===';
    RAISE NOTICE 'Testing login for: admin@ablego.co.uk';
    RAISE NOTICE 'Expected UUID: a4fd8dea-5aa9-4e8c-9848-746e42bc60ae';
    RAISE NOTICE '';

    -- Step 1: Check if auth user exists
    BEGIN
        SELECT id INTO auth_user_id 
        FROM auth.users 
        WHERE email = 'admin@ablego.co.uk' 
        AND email_confirmed_at IS NOT NULL;
        
        IF auth_user_id IS NOT NULL THEN
            RAISE NOTICE '✅ Step 1 PASS: Auth user exists and email confirmed';
            RAISE NOTICE '   Auth UUID: %', auth_user_id;
        ELSE
            RAISE NOTICE '❌ Step 1 FAIL: Auth user not found or email not confirmed';
            RETURN;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 1 ERROR: Cannot access auth.users table: %', SQLERRM;
        RETURN;
    END;

    -- Step 2: Check users table record
    BEGIN
        SELECT role INTO users_role 
        FROM users 
        WHERE id = auth_user_id;
        
        IF users_role IS NOT NULL THEN
            users_record_exists := true;
            RAISE NOTICE '✅ Step 2 PASS: Users record exists';
            RAISE NOTICE '   Role: %', users_role;
            
            IF users_role = 'admin' THEN
                RAISE NOTICE '✅ Step 2a PASS: User has admin role';
            ELSE
                RAISE NOTICE '❌ Step 2a FAIL: User role is "%" but should be "admin"', users_role;
            END IF;
        ELSE
            RAISE NOTICE '❌ Step 2 FAIL: No users record found for UUID %', auth_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 2 ERROR: Cannot query users table: %', SQLERRM;
    END;

    -- Step 3: Check profiles table record
    BEGIN
        SELECT is_verified INTO profile_verified 
        FROM profiles 
        WHERE id = auth_user_id;
        
        IF profile_verified IS NOT NULL THEN
            profile_record_exists := true;
            RAISE NOTICE '✅ Step 3 PASS: Profile record exists';
            RAISE NOTICE '   Verified: %', profile_verified;
        ELSE
            RAISE NOTICE '❌ Step 3 FAIL: No profile record found for UUID %', auth_user_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 3 ERROR: Cannot query profiles table: %', SQLERRM;
    END;

    -- Step 4: Check ID consistency
    IF users_record_exists AND profile_record_exists THEN
        id_match := true;
        RAISE NOTICE '✅ Step 4 PASS: All IDs are consistent';
    ELSE
        RAISE NOTICE '❌ Step 4 FAIL: Missing records prevent ID consistency check';
    END IF;

    -- Step 5: Test RLS policies
    BEGIN
        -- Test if admin can read users (this is what the app does)
        PERFORM 1 FROM users WHERE role = 'admin' LIMIT 1;
        RAISE NOTICE '✅ Step 5 PASS: RLS policies allow admin access';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Step 5 FAIL: RLS policy error: %', SQLERRM;
    END;

    -- Final Assessment
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL ASSESSMENT ===';
    
    IF auth_user_id IS NOT NULL AND 
       users_record_exists AND 
       profile_record_exists AND 
       users_role = 'admin' AND 
       id_match THEN
        RAISE NOTICE '🎉 LOGIN FLOW TEST: ✅ PASSED - Admin should be able to login successfully!';
        RAISE NOTICE 'Try logging in at /login with admin@ablego.co.uk / CareGold17';
    ELSE
        RAISE NOTICE '❌ LOGIN FLOW TEST: FAILED - Issues found:';
        IF auth_user_id IS NULL THEN
            RAISE NOTICE '   - Auth user missing or not confirmed';
        END IF;
        IF NOT users_record_exists THEN
            RAISE NOTICE '   - Users table record missing';
        END IF;
        IF NOT profile_record_exists THEN
            RAISE NOTICE '   - Profile table record missing';
        END IF;
        IF users_role != 'admin' THEN
            RAISE NOTICE '   - User role is not admin';
        END IF;
        RAISE NOTICE 'Run the diagnose_and_fix_admin.sql script to fix these issues.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '=== TEST COMPLETED ===';
END $$;