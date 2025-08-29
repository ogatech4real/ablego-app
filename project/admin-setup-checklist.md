# AbleGo Admin Setup Checklist

## 🎯 **Complete Admin Creation Process**

### **Step 1: Run Database Script**
1. Open **Supabase Dashboard → SQL Editor**
2. Copy and paste the `create_admin_user.sql` script
3. Click **"Run"**
4. **📋 COPY THE GENERATED UUID** from the output logs
5. Verify the success messages

### **Step 2: Create Auth User**
1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add User"** or **"Invite User"**
3. Fill in the form:
   ```
   Email: admin@ablego.co.uk
   Password: [Create secure password - save this!]
   User ID: [PASTE THE UUID FROM STEP 1]
   Email Confirmed: ✅ CHECK THIS BOX
   User Metadata: {"role": "admin"}
   ```
4. Click **"Create User"**

### **Step 3: Verify Creation**
Run these queries in SQL Editor to verify:

```sql
-- Check all admin records exist
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  u.id as users_id,
  u.role as users_role,
  p.id as profiles_id,
  p.name as profile_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id  
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@ablego.co.uk';
```

**Expected Result:**
- ✅ All IDs should be identical
- ✅ `users_role` should be 'admin'
- ✅ `email_confirmed_at` should have a timestamp
- ✅ `profile_name` should be 'AbleGo Admin'

### **Step 4: Test Login**
1. Go to your app: `/login`
2. Sign in with:
   - Email: `admin@ablego.co.uk`
   - Password: [The password you created]
3. After login, check for:
   - ✅ "Admin" button in navbar
   - ✅ Can access `/dashboard/admin`
   - ✅ Can see admin dashboard with stats

## 🔧 **Troubleshooting**

### **If Login Fails:**
```sql
-- Check auth user exists and is confirmed
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@ablego.co.uk';
```

### **If "Admin" Button Missing:**
```sql
-- Check role in users table
SELECT id, email, role FROM users WHERE email = 'admin@ablego.co.uk';

-- Check profile exists
SELECT id, email, name FROM profiles WHERE email = 'admin@ablego.co.uk';
```

### **If Access Denied:**
```sql
-- Check ID matching
SELECT 
  CASE 
    WHEN u.id = p.id THEN '✅ IDs Match'
    ELSE '❌ ID Mismatch - This is the problem!'
  END as status,
  u.id as users_id,
  p.id as profiles_id
FROM users u
LEFT JOIN profiles p ON u.email = p.email
WHERE u.email = 'admin@ablego.co.uk';
```

## 🚨 **Common Mistakes to Avoid**

1. **❌ Different UUIDs**: Auth ID ≠ Database ID
2. **❌ Unconfirmed Email**: Must check "Email Confirmed" box
3. **❌ Wrong Role**: Must be exactly 'admin' (lowercase)
4. **❌ Missing Profile**: Must have profile record
5. **❌ Typo in Email**: Must be exact match

## 🎉 **Success Indicators**

### **Database Level:**
- ✅ User exists in `users` table with role 'admin'
- ✅ Profile exists in `profiles` table with same ID
- ✅ Auth user exists with confirmed email

### **Application Level:**
- ✅ Can sign in successfully
- ✅ "Admin" button appears in navbar
- ✅ Can access admin dashboard
- ✅ Can see booking management features
- ✅ Can promote other users to admin

## 📞 **If Still Having Issues**

Run the diagnostic script:
```sql
-- Complete admin user diagnostic
SELECT 
  'Auth User' as source,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'admin@ablego.co.uk'

UNION ALL

SELECT 
  'Users Table' as source,
  id,
  email,
  (role = 'admin')::text as email_confirmed
FROM users 
WHERE email = 'admin@ablego.co.uk'

UNION ALL

SELECT 
  'Profiles Table' as source,
  id,
  email,
  is_verified::text as email_confirmed
FROM profiles 
WHERE email = 'admin@ablego.co.uk';
```

This should show you exactly where the issue is if the admin creation fails.