/*
  # Create Admin User - admin@ablego.co.uk
  
  This migration creates or updates the admin user with full privileges:
  - Creates user in auth.users if not exists
  - Updates user metadata and role
  - Creates/updates profile in public.profiles
  - Ensures admin role is properly assigned
  - Sets up all necessary permissions
  
  Admin credentials:
  - Email: admin@ablego.co.uk
  - Password: CareGold17
  - Role: admin
*/

-- Function to create or update admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@ablego.co.uk';
  admin_password text := 'CareGold17';
  admin_name text := 'AbleGo Admin';
  app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb;
  user_meta jsonb := jsonb_build_object('full_name', admin_name, 'role', 'admin');
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- If not found in auth.users, check public.users
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE email = admin_email;
  END IF;
  
  IF admin_user_id IS NULL THEN
    -- Create new admin user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- instance_id
      uuid_generate_v4(), -- id
      'authenticated', -- aud
      'authenticated', -- role
      admin_email, -- email
      crypt(admin_password, gen_salt('bf')), -- encrypted_password
      now(), -- email_confirmed_at
      NULL, -- recovery_sent_at
      now(), -- last_sign_in_at
             app_meta, -- raw_app_meta_data
       user_meta, -- raw_user_meta_data
      now(), -- created_at
      now(), -- updated_at
      '', -- confirmation_token
      '', -- email_change
      '', -- email_change_token_new
      '' -- recovery_token
    ) RETURNING id INTO admin_user_id;
    
    RAISE LOG 'Created new admin user with ID: %', admin_user_id;
  ELSE
    -- Update existing admin user
    UPDATE auth.users SET
      raw_app_meta_data = app_meta,
      raw_user_meta_data = user_meta,
      email_confirmed_at = now(),
      last_sign_in_at = now(),
      updated_at = now()
    WHERE id = admin_user_id;
    
    RAISE LOG 'Updated existing admin user with ID: %', admin_user_id;
  END IF;
  
  -- Ensure admin user exists in public.users table
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (admin_user_id, admin_email, 'admin', now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = 'admin',
    created_at = COALESCE(users.created_at, EXCLUDED.created_at);
  
  -- Ensure admin profile exists in public.profiles table
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    address,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    medical_notes,
    accessibility_requirements,
    profile_image_url,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    admin_email,
    admin_name,
    NULL, -- phone
    NULL, -- address
    NULL, -- date_of_birth
    NULL, -- emergency_contact_name
    NULL, -- emergency_contact_phone
    NULL, -- medical_notes
    '{}', -- accessibility_requirements
    NULL, -- profile_image_url
    true, -- is_verified
    true, -- is_active
    now(), -- created_at
    now()  -- updated_at
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    is_verified = true,
    is_active = true,
    updated_at = now();
  
  RAISE LOG 'Admin user setup completed successfully for: %', admin_email;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating admin user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the admin user creation
SELECT create_admin_user();

-- Clean up the function
DROP FUNCTION create_admin_user();

-- Verify admin user was created/updated
DO $$
DECLARE
  admin_count integer;
  profile_count integer;
BEGIN
  -- Check auth.users
  SELECT COUNT(*) INTO admin_count 
  FROM auth.users 
  WHERE email = 'admin@ablego.co.uk' 
  AND raw_app_meta_data->>'role' = 'admin';
  
  -- Check public.users
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE email = 'admin@ablego.co.uk' 
  AND role = 'admin';
  
  -- Check public.profiles
  SELECT COUNT(*) INTO profile_count 
  FROM public.profiles 
  WHERE email = 'admin@ablego.co.uk' 
  AND is_verified = true 
  AND is_active = true;
  
  RAISE LOG 'Admin user verification: auth.users=%s, public.users=%s, public.profiles=%s', 
    admin_count, admin_count, profile_count;
    
  IF admin_count = 0 OR profile_count = 0 THEN
    RAISE EXCEPTION 'Admin user setup verification failed';
  END IF;
END $$;

-- Grant additional admin permissions if needed
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create admin-specific RLS policies for full access
DO $$
BEGIN
  -- Drop existing admin policies if they exist
  DROP POLICY IF EXISTS "Admin full access" ON users;
  DROP POLICY IF EXISTS "Admin full access" ON profiles;
  DROP POLICY IF EXISTS "Admin full access" ON bookings;
  DROP POLICY IF EXISTS "Admin full access" ON guest_bookings;
  DROP POLICY IF EXISTS "Admin full access" ON vehicles;
  DROP POLICY IF EXISTS "Admin full access" ON support_workers;
  DROP POLICY IF EXISTS "Admin full access" ON driver_applications;
  DROP POLICY IF EXISTS "Admin full access" ON support_worker_applications;
  DROP POLICY IF EXISTS "Admin full access" ON trip_logs;
  DROP POLICY IF EXISTS "Admin full access" ON payment_transactions;
  DROP POLICY IF EXISTS "Admin full access" ON admin_email_notifications;
  DROP POLICY IF EXISTS "Admin full access" ON newsletter_subscribers;
  
  -- Create comprehensive admin policies
  CREATE POLICY "Admin full access" ON users
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON profiles
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON bookings
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON guest_bookings
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON vehicles
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON support_workers
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON driver_applications
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON support_worker_applications
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON trip_logs
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON payment_transactions
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON admin_email_notifications
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admin full access" ON newsletter_subscribers
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  RAISE LOG 'Admin policies created successfully';
END $$;

-- Final verification and completion message
DO $$
BEGIN
  RAISE LOG '✅ Admin user setup completed successfully!';
  RAISE LOG '📧 Email: admin@ablego.co.uk';
  RAISE LOG '🔑 Password: ***********';
  RAISE LOG '👑 Role: admin';
  RAISE LOG '🚀 Ready to access /dashboard/admin';
  RAISE LOG '';
  RAISE LOG '🔒 Security Notes:';
  RAISE LOG '   - User is fully verified and active';
  RAISE LOG '   - Admin role assigned in both auth.users and public.users';
  RAISE LOG '   - Profile created with admin privileges';
  RAISE LOG '   - All RLS policies configured for admin access';
  RAISE LOG '   - Can access all protected admin routes';
END $$;
