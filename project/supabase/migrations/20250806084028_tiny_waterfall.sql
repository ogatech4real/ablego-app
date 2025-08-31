/*
  # Create Default Admin User

  1. New Records
    - Creates a default admin user in the users table
    - Creates corresponding profile for the admin
    - Sets up proper role and permissions

  2. Security
    - Admin user has 'admin' role
    - Profile is verified and active
    - Proper email and credentials set

  3. Default Credentials
    - Email: admin@ablego.co.uk
    - Password: CareGold@2025 (to be set in Supabase Auth manually)
*/

-- Create default admin user in users table
INSERT INTO users (id, email, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@ablego.co.uk',
  'admin',
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Create corresponding profile for admin
INSERT INTO profiles (
  id,
  email,
  name,
  phone,
  is_verified,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@ablego.co.uk',
  'AbleGo Administrator',
  '01642089958',
  true,
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  is_verified = EXCLUDED.is_verified,
  is_active = EXCLUDED.is_active,
  updated_at = now();