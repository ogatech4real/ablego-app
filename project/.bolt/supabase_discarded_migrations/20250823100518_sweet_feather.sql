/*
  # Create Admin User with Proper Authentication Setup

  This script creates a complete admin user with proper Supabase authentication,
  including the required provider_id and identity records.

  1. Creates auth user with email provider
  2. Creates identity record with proper provider_id
  3. Creates users table record
  4. Creates profiles table record
  5. Verifies all records are properly linked
*/

DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@ablego.co.uk';
  admin_password text := 'AbleGo2025!'; -- Change this to your desired password
  encrypted_password text;
BEGIN
  -- Generate UUID for admin user
  admin_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Creating admin user with ID: %', admin_user_id;
  RAISE NOTICE 'Admin email: %', admin_email;
  RAISE NOTICE 'IMPORTANT: Save this password: %', admin_password;

  -- Encrypt password (using Supabase's method)
  encrypted_password := crypt(admin_password, gen_salt('bf'));

  -- 1. Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role,
    is_super_admin,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    encrypted_password,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated',
    false,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin", "full_name": "AbleGo Admin"}'
  );

  -- 2. Create identity record with proper provider_id
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    email
  ) VALUES (
    gen_random_uuid(),
    admin_user_id,
    jsonb_build_object(
      'sub', admin_user_id::text,
      'email', admin_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    admin_user_id::text, -- This is the missing provider_id
    now(),
    now(),
    admin_email
  );

  -- 3. Create users table record
  INSERT INTO users (id, email, role, created_at) 
  VALUES (
    admin_user_id,
    admin_email,
    'admin',
    now()
  );

  -- 4. Create profiles table record
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
    'AbleGo Admin',
    true,
    true,
    now(),
    now()
  );

  -- 5. Create admin notification record
  INSERT INTO admin_email_notifications (
    recipient_email,
    subject,
    html_content,
    notification_type,
    sent,
    created_at
  ) VALUES (
    'admin@ablego.co.uk',
    'AbleGo Admin Account Created',
    '<h2>Admin Account Successfully Created</h2>
     <p>Your AbleGo admin account has been created with the following details:</p>
     <ul>
       <li><strong>Email:</strong> admin@ablego.co.uk</li>
       <li><strong>Password:</strong> ' || admin_password || '</li>
       <li><strong>Login URL:</strong> https://ablego.co.uk/login</li>
     </ul>
     <p>Please change your password after first login.</p>',
    'admin_account_created',
    false,
    now()
  );

  RAISE NOTICE '=== ADMIN USER CREATED SUCCESSFULLY ===';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: %', admin_password;
  RAISE NOTICE 'Login at: /login';
  RAISE NOTICE '=== SAVE THESE CREDENTIALS ===';

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Admin user already exists. Use fix_admin_user.sql to repair.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Admin creation failed: %', SQLERRM;
END $$;