/*
  # Create upsert function for guest riders

  1. New Functions
    - `upsert_guest_rider` - Safely handles guest rider creation/update to avoid duplicate email conflicts
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for upsert operation
    - Returns both the record and a flag indicating if it's new or existing
  
  3. Purpose
    - Prevents duplicate key violations when guest users book multiple rides
    - Updates existing guest rider info if email already exists
    - Provides clean interface for guest booking flow
*/

-- Create a function to upsert a guest rider
CREATE OR REPLACE FUNCTION public.upsert_guest_rider(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT
) RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  created_at timestamptz,
  updated_at timestamptz,
  is_new boolean
) AS $$
DECLARE
  v_id uuid;
  v_is_new boolean;
BEGIN
  -- First try to find existing guest rider
  SELECT guest_riders.id INTO v_id FROM public.guest_riders WHERE email = p_email LIMIT 1;
  
  v_is_new := v_id IS NULL;
  
  IF v_is_new THEN
    -- Insert new record
    INSERT INTO public.guest_riders (name, email, phone)
    VALUES (p_name, p_email, p_phone)
    RETURNING guest_riders.id INTO v_id;
  ELSE
    -- Update existing record
    UPDATE public.guest_riders 
    SET name = p_name, phone = p_phone, updated_at = now()
    WHERE guest_riders.id = v_id;
  END IF;
  
  -- Return the record
  RETURN QUERY
  SELECT 
    guest_riders.id, 
    guest_riders.name, 
    guest_riders.email, 
    guest_riders.phone, 
    guest_riders.created_at, 
    guest_riders.updated_at,
    v_is_new
  FROM public.guest_riders
  WHERE guest_riders.id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;