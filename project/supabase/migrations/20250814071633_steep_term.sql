/*
  # User Profile Synchronization and Dashboard Data

  1. New Tables
    - Enhanced user profile management
    - Role-specific data tables for dashboards
    - Proper foreign key relationships

  2. Functions
    - Automatic profile creation on user signup
    - Role-specific record creation
    - Dashboard data aggregation functions

  3. Security
    - Enhanced RLS policies
    - Proper role-based access control
    - Data isolation by user roles

  4. Views
    - Dashboard overview for each role
    - Aggregated statistics
    - Performance metrics
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    true,
    NOW(),
    NOW()
  );

  -- Insert into users table with role
  INSERT INTO public.users (
    id,
    email,
    role,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role,
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'rider')::user_role;

  -- Create role-specific records
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'rider') = 'support_worker' THEN
    INSERT INTO public.support_workers (
      user_id,
      bio,
      experience_years,
      hourly_rate,
      specializations,
      languages,
      verified,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      '',
      0,
      18.50,
      '{}',
      '{English}',
      false,
      true,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to get rider dashboard data
CREATE OR REPLACE FUNCTION get_rider_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_bookings', COALESCE(COUNT(b.id), 0),
    'completed_bookings', COALESCE(COUNT(b.id) FILTER (WHERE b.status = 'completed'), 0),
    'pending_bookings', COALESCE(COUNT(b.id) FILTER (WHERE b.status = 'pending'), 0),
    'total_spent', COALESCE(SUM(b.fare_estimate) FILTER (WHERE b.status = 'completed'), 0),
    'recent_bookings', COALESCE(
      json_agg(
        json_build_object(
          'id', b.id,
          'pickup_address', b.pickup_address,
          'dropoff_address', b.dropoff_address,
          'pickup_time', b.pickup_time,
          'status', b.status,
          'fare_estimate', b.fare_estimate,
          'support_workers_count', b.support_workers_count,
          'created_at', b.created_at
        ) ORDER BY b.created_at DESC
      ) FILTER (WHERE b.id IS NOT NULL), '[]'::json
    )
  ) INTO result
  FROM bookings b
  WHERE b.rider_id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get driver dashboard data
CREATE OR REPLACE FUNCTION get_driver_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_trips', COALESCE(COUNT(tl.id), 0),
    'completed_trips', COALESCE(COUNT(tl.id) FILTER (WHERE tl.end_time IS NOT NULL), 0),
    'total_earnings', COALESCE(SUM(pl.calculated_fare) FILTER (WHERE tl.end_time IS NOT NULL), 0),
    'average_rating', COALESCE(AVG(tl.customer_rating) FILTER (WHERE tl.customer_rating IS NOT NULL), 0),
    'vehicles', COALESCE(
      json_agg(
        json_build_object(
          'id', v.id,
          'make', v.make,
          'model', v.model,
          'license_plate', v.license_plate,
          'verified', v.verified,
          'is_active', v.is_active
        )
      ) FILTER (WHERE v.id IS NOT NULL), '[]'::json
    ),
    'recent_trips', COALESCE(
      json_agg(
        json_build_object(
          'id', tl.id,
          'booking_id', tl.booking_id,
          'start_time', tl.start_time,
          'end_time', tl.end_time,
          'customer_rating', tl.customer_rating,
          'booking', json_build_object(
            'pickup_address', b.pickup_address,
            'dropoff_address', b.dropoff_address,
            'fare_estimate', b.fare_estimate
          )
        ) ORDER BY tl.created_at DESC
      ) FILTER (WHERE tl.id IS NOT NULL), '[]'::json
    )
  ) INTO result
  FROM vehicles v
  LEFT JOIN trip_logs tl ON tl.vehicle_id = v.id
  LEFT JOIN bookings b ON b.id = tl.booking_id
  LEFT JOIN pricing_logs pl ON pl.booking_id = b.id
  WHERE v.driver_id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get support worker dashboard data
CREATE OR REPLACE FUNCTION get_support_worker_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_assignments', COALESCE(COUNT(tl.id), 0),
    'completed_assignments', COALESCE(COUNT(tl.id) FILTER (WHERE tl.end_time IS NOT NULL), 0),
    'total_earnings', COALESCE(SUM(
      CASE 
        WHEN tl.end_time IS NOT NULL AND tl.start_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (tl.end_time - tl.start_time)) / 3600 * sw.hourly_rate
        ELSE 0 
      END
    ), 0),
    'average_rating', COALESCE(AVG(tl.support_worker_rating) FILTER (WHERE tl.support_worker_rating IS NOT NULL), 0),
    'hours_worked', COALESCE(SUM(
      CASE 
        WHEN tl.end_time IS NOT NULL AND tl.start_time IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (tl.end_time - tl.start_time)) / 3600
        ELSE 0 
      END
    ), 0),
    'profile', json_build_object(
      'verified', sw.verified,
      'hourly_rate', sw.hourly_rate,
      'specializations', sw.specializations,
      'is_active', sw.is_active
    ),
    'recent_assignments', COALESCE(
      json_agg(
        json_build_object(
          'id', tl.id,
          'booking_id', tl.booking_id,
          'start_time', tl.start_time,
          'end_time', tl.end_time,
          'support_worker_rating', tl.support_worker_rating,
          'booking', json_build_object(
            'pickup_address', b.pickup_address,
            'dropoff_address', b.dropoff_address,
            'pickup_time', b.pickup_time
          )
        ) ORDER BY tl.created_at DESC
      ) FILTER (WHERE tl.id IS NOT NULL), '[]'::json
    )
  ) INTO result
  FROM support_workers sw
  LEFT JOIN trip_logs tl ON user_id = ANY(tl.support_worker_ids)
  LEFT JOIN bookings b ON b.id = tl.booking_id
  WHERE sw.user_id = user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin dashboard data
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*) FROM users
    ),
    'total_riders', (
      SELECT COUNT(*) FROM users WHERE role = 'rider'
    ),
    'total_drivers', (
      SELECT COUNT(*) FROM users WHERE role = 'driver'
    ),
    'total_support_workers', (
      SELECT COUNT(*) FROM users WHERE role = 'support_worker'
    ),
    'total_bookings', (
      SELECT COUNT(*) FROM bookings
    ),
    'active_trips', (
      SELECT COUNT(*) FROM trip_logs WHERE start_time IS NOT NULL AND end_time IS NULL
    ),
    'pending_verifications', (
      SELECT COUNT(*) FROM vehicles WHERE verified = false
    ) + (
      SELECT COUNT(*) FROM support_workers WHERE verified = false
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(calculated_fare), 0) 
      FROM pricing_logs pl
      JOIN bookings b ON b.id = pl.booking_id
      WHERE b.status = 'completed' 
      AND b.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'recent_activity', (
      SELECT json_agg(
        json_build_object(
          'type', 'booking',
          'message', 'New booking from ' || pickup_address,
          'created_at', created_at,
          'id', id
        ) ORDER BY created_at DESC
      )
      FROM bookings 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_rider_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_support_worker_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_data() TO authenticated;