/*
  # Enhance Admin Dashboard - Priority 3

  1. Admin Dashboard Issues
    - Tables not updating properly with real-time data
    - Missing comprehensive reporting and analytics
    - No real-time notifications for new bookings
    - Limited data filtering and search capabilities
    - Missing user account management features

  2. Solutions
    - Create comprehensive admin dashboard views
    - Add real-time data aggregation functions
    - Implement admin notification system
    - Add advanced filtering and search
    - Create user account management features

  3. Changes
    - Add admin dashboard views and functions
    - Create real-time data aggregation
    - Add admin notification system
    - Implement advanced filtering
    - Add user management features
*/

-- Create comprehensive admin dashboard views
CREATE OR REPLACE VIEW admin_dashboard_overview AS
SELECT 
  -- Booking Statistics
  (SELECT COUNT(*) FROM public.guest_bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM public.guest_bookings WHERE status = 'confirmed') as confirmed_bookings,
  (SELECT COUNT(*) FROM public.guest_bookings WHERE status = 'in_progress') as in_progress_bookings,
  (SELECT COUNT(*) FROM public.guest_bookings WHERE status = 'completed') as completed_bookings,
  (SELECT COUNT(*) FROM public.guest_bookings WHERE status = 'cancelled') as cancelled_bookings,
  
  -- Financial Statistics
  (SELECT COALESCE(SUM(fare_estimate), 0.00) FROM public.guest_bookings WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(AVG(fare_estimate), 0.00) FROM public.guest_bookings WHERE status = 'completed') as average_fare,
  (SELECT COALESCE(SUM(fare_estimate), 0.00) FROM public.guest_bookings WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_revenue,
  
  -- User Statistics
  (SELECT COUNT(*) FROM public.users WHERE role = 'rider') as total_riders,
  (SELECT COUNT(*) FROM public.users WHERE role = 'driver') as total_drivers,
  (SELECT COUNT(*) FROM public.users WHERE role = 'support_worker') as total_support_workers,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30_days,
  
  -- Guest Statistics
  (SELECT COUNT(*) FROM public.guest_riders) as total_guest_riders,
  (SELECT COUNT(*) FROM public.guest_riders WHERE created_at >= NOW() - INTERVAL '30 days') as new_guests_30_days,
  
  -- Email Statistics
  (SELECT COUNT(*) FROM public.admin_email_notifications WHERE sent = true) as emails_sent,
  (SELECT COUNT(*) FROM public.admin_email_notifications WHERE sent = false) as emails_pending,
  (SELECT COUNT(*) FROM public.admin_email_notifications WHERE delivery_status = 'failed') as emails_failed,
  
  -- System Statistics
  NOW() as last_updated;

-- Create detailed booking analytics view
CREATE OR REPLACE VIEW admin_booking_analytics AS
SELECT 
  DATE(created_at) as booking_date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
  COALESCE(SUM(fare_estimate), 0.00) as total_revenue,
  COALESCE(AVG(fare_estimate), 0.00) as average_fare,
  COUNT(*) FILTER (WHERE linked_user_id IS NOT NULL) as user_account_bookings,
  COUNT(*) FILTER (WHERE linked_user_id IS NULL) as guest_bookings
FROM public.guest_bookings
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY booking_date DESC;

-- Create user account analytics view
CREATE OR REPLACE VIEW admin_user_analytics AS
SELECT 
  u.id,
  u.email,
  u.role,
  p.name,
  p.phone,
  p.is_verified,
  p.is_active,
  u.created_at,
  COUNT(gb.id) as total_bookings,
  COALESCE(SUM(gb.fare_estimate), 0.00) as total_spent,
  COALESCE(AVG(gb.fare_estimate), 0.00) as average_booking_value,
  MAX(gb.created_at) as last_booking_date,
  COUNT(gb.id) FILTER (WHERE gb.status = 'completed') as completed_bookings,
  COUNT(gb.id) FILTER (WHERE gb.status = 'cancelled') as cancelled_bookings,
  up.email_notifications,
  up.sms_notifications,
  up.push_notifications,
  us.total_bookings as statistics_total_bookings,
  us.total_spent as statistics_total_spent,
  us.average_rating
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.guest_bookings gb ON u.id = gb.linked_user_id
LEFT JOIN public.user_preferences up ON u.id = up.user_id
LEFT JOIN public.user_statistics us ON u.id = us.user_id
GROUP BY u.id, u.email, u.role, p.name, p.phone, p.is_verified, p.is_active, u.created_at,
         up.email_notifications, up.sms_notifications, up.push_notifications,
         us.total_bookings, us.total_spent, us.average_rating
ORDER BY total_spent DESC;

-- Create email delivery analytics view
CREATE OR REPLACE VIEW admin_email_analytics AS
SELECT 
  DATE(created_at) as email_date,
  notification_type,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE sent = true) as sent_emails,
  COUNT(*) FILTER (WHERE sent = false) as pending_emails,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_emails,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as delivered_emails,
  ROUND(
    (COUNT(*) FILTER (WHERE sent = true)::decimal / COUNT(*)::decimal) * 100, 2
  ) as success_rate,
  AVG(retry_count) as average_retries
FROM public.admin_email_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), notification_type
ORDER BY email_date DESC, notification_type;

-- Create function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json AS $$
DECLARE
  dashboard_stats RECORD;
  recent_bookings json;
  recent_users json;
  email_stats RECORD;
BEGIN
  -- Get dashboard overview
  SELECT * INTO dashboard_stats FROM admin_dashboard_overview;
  
  -- Get recent bookings (last 10)
  SELECT json_agg(row_to_json(b)) INTO recent_bookings
  FROM (
    SELECT 
      gb.id,
      gb.pickup_address,
      gb.dropoff_address,
      gb.fare_estimate,
      gb.status,
      gb.created_at,
      gr.name as guest_name,
      gr.email as guest_email,
      gr.phone as guest_phone
    FROM public.guest_bookings gb
    JOIN public.guest_riders gr ON gb.guest_rider_id = gr.id
    ORDER BY gb.created_at DESC
    LIMIT 10
  ) b;
  
  -- Get recent users (last 10)
  SELECT json_agg(row_to_json(u)) INTO recent_users
  FROM (
    SELECT 
      u.id,
      u.email,
      u.role,
      p.name,
      p.phone,
      u.created_at
    FROM public.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC
    LIMIT 10
  ) u;
  
  -- Get email statistics
  SELECT row_to_json(e) INTO email_stats
  FROM (
    SELECT 
      COUNT(*) as total_emails,
      COUNT(*) FILTER (WHERE sent = true) as sent_emails,
      COUNT(*) FILTER (WHERE sent = false) as pending_emails,
      COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_emails,
      ROUND(
        (COUNT(*) FILTER (WHERE sent = true)::decimal / COUNT(*)::decimal) * 100, 2
      ) as success_rate
    FROM public.admin_email_notifications
    WHERE created_at >= NOW() - INTERVAL '7 days'
  ) e;
  
  RETURN json_build_object(
    'dashboard_overview', row_to_json(dashboard_stats),
    'recent_bookings', COALESCE(recent_bookings, '[]'::json),
    'recent_users', COALESCE(recent_users, '[]'::json),
    'email_stats', email_stats,
    'last_updated', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get booking analytics
CREATE OR REPLACE FUNCTION get_booking_analytics(days_back INTEGER DEFAULT 30)
RETURNS json AS $$
DECLARE
  analytics_data json;
BEGIN
  SELECT json_agg(row_to_json(a)) INTO analytics_data
  FROM (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
      COALESCE(SUM(fare_estimate), 0.00) as revenue,
      COALESCE(AVG(fare_estimate), 0.00) as average_fare
    FROM public.guest_bookings
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  ) a;
  
  RETURN json_build_object(
    'analytics', COALESCE(analytics_data, '[]'::json),
    'period_days', days_back,
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS json AS $$
DECLARE
  user_analytics json;
BEGIN
  SELECT json_agg(row_to_json(u)) INTO user_analytics
  FROM (
    SELECT 
      u.id,
      u.email,
      u.role,
      p.name,
      p.phone,
      p.is_verified,
      p.is_active,
      u.created_at,
      COUNT(gb.id) as total_bookings,
      COALESCE(SUM(gb.fare_estimate), 0.00) as total_spent,
      COALESCE(AVG(gb.fare_estimate), 0.00) as average_booking_value,
      MAX(gb.created_at) as last_booking_date
    FROM public.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    LEFT JOIN public.guest_bookings gb ON u.id = gb.linked_user_id
    GROUP BY u.id, u.email, u.role, p.name, p.phone, p.is_verified, p.is_active, u.created_at
    ORDER BY total_spent DESC
  ) u;
  
  RETURN json_build_object(
    'users', COALESCE(user_analytics, '[]'::json),
    'total_users', json_array_length(COALESCE(user_analytics, '[]'::json)),
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search bookings
CREATE OR REPLACE FUNCTION search_bookings(
  search_term TEXT DEFAULT '',
  status_filter TEXT DEFAULT '',
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS json AS $$
DECLARE
  search_results json;
BEGIN
  SELECT json_agg(row_to_json(b)) INTO search_results
  FROM (
    SELECT 
      gb.id,
      gb.pickup_address,
      gb.dropoff_address,
      gb.fare_estimate,
      gb.status,
      gb.created_at,
      gb.pickup_time,
      gr.name as guest_name,
      gr.email as guest_email,
      gr.phone as guest_phone,
      u.email as user_email,
      u.role as user_role
    FROM public.guest_bookings gb
    JOIN public.guest_riders gr ON gb.guest_rider_id = gr.id
    LEFT JOIN public.users u ON gb.linked_user_id = u.id
    WHERE 
      (search_term = '' OR 
       gb.pickup_address ILIKE '%' || search_term || '%' OR
       gb.dropoff_address ILIKE '%' || search_term || '%' OR
       gr.name ILIKE '%' || search_term || '%' OR
       gr.email ILIKE '%' || search_term || '%' OR
       gr.phone ILIKE '%' || search_term || '%')
      AND (status_filter = '' OR gb.status = status_filter)
      AND (date_from IS NULL OR gb.created_at >= date_from)
      AND (date_to IS NULL OR gb.created_at <= date_to)
    ORDER BY gb.created_at DESC
    LIMIT limit_count
  ) b;
  
  RETURN json_build_object(
    'results', COALESCE(search_results, '[]'::json),
    'total_count', json_array_length(COALESCE(search_results, '[]'::json)),
    'search_term', search_term,
    'status_filter', status_filter,
    'date_from', date_from,
    'date_to', date_to,
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search users
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT DEFAULT '',
  role_filter TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 50
)
RETURNS json AS $$
DECLARE
  search_results json;
BEGIN
  SELECT json_agg(row_to_json(u)) INTO search_results
  FROM (
    SELECT 
      u.id,
      u.email,
      u.role,
      p.name,
      p.phone,
      p.is_verified,
      p.is_active,
      u.created_at,
      COUNT(gb.id) as total_bookings,
      COALESCE(SUM(gb.fare_estimate), 0.00) as total_spent
    FROM public.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    LEFT JOIN public.guest_bookings gb ON u.id = gb.linked_user_id
    WHERE 
      (search_term = '' OR 
       u.email ILIKE '%' || search_term || '%' OR
       p.name ILIKE '%' || search_term || '%' OR
       p.phone ILIKE '%' || search_term || '%')
      AND (role_filter = '' OR u.role = role_filter)
    GROUP BY u.id, u.email, u.role, p.name, p.phone, p.is_verified, p.is_active, u.created_at
    ORDER BY u.created_at DESC
    LIMIT limit_count
  ) u;
  
  RETURN json_build_object(
    'results', COALESCE(search_results, '[]'::json),
    'total_count', json_array_length(COALESCE(search_results, '[]'::json)),
    'search_term', search_term,
    'role_filter', role_filter,
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin notification system
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create admin notification types
CREATE TYPE admin_notification_type AS ENUM (
  'new_booking',
  'booking_status_change',
  'new_user_registration',
  'email_delivery_failed',
  'system_alert',
  'payment_received',
  'driver_assigned'
);

-- Create function to create admin notifications
CREATE OR REPLACE FUNCTION create_admin_notification(
  notification_type admin_notification_type,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}',
  notification_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.admin_notifications (
    type,
    title,
    message,
    data,
    priority
  ) VALUES (
    notification_type,
    notification_title,
    notification_message,
    notification_data,
    notification_priority
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread admin notifications
CREATE OR REPLACE FUNCTION get_unread_admin_notifications()
RETURNS json AS $$
DECLARE
  notifications json;
BEGIN
  SELECT json_agg(row_to_json(n)) INTO notifications
  FROM (
    SELECT
      id,
      type,
      title,
      message,
      data,
      priority,
      created_at
    FROM public.admin_notifications
    WHERE is_read = false
    ORDER BY
      CASE priority
        WHEN 'high' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
      END,
      created_at DESC
  ) n;

  RETURN json_build_object(
    'notifications', COALESCE(notifications, '[]'::json),
    'unread_count', json_array_length(COALESCE(notifications, '[]'::json)),
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_admin_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admin_notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic admin notifications
CREATE OR REPLACE FUNCTION trigger_admin_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- New booking notification
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'guest_bookings' THEN
    PERFORM create_admin_notification(
      'new_booking',
      'New Booking Created',
      'A new booking has been created by ' || (
        SELECT name FROM public.guest_riders WHERE id = NEW.guest_rider_id
      ),
      json_build_object(
        'booking_id', NEW.id,
        'guest_name', (SELECT name FROM public.guest_riders WHERE id = NEW.guest_rider_id),
        'pickup_address', NEW.pickup_address,
        'dropoff_address', NEW.dropoff_address,
        'fare_estimate', NEW.fare_estimate
      ),
      'normal'
    );
  END IF;
  
  -- Booking status change notification
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'guest_bookings' AND OLD.status != NEW.status THEN
    PERFORM create_admin_notification(
      'booking_status_change',
      'Booking Status Changed',
      'Booking ' || NEW.id || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      json_build_object(
        'booking_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'guest_name', (SELECT name FROM public.guest_riders WHERE id = NEW.guest_rider_id)
      ),
      'normal'
    );
  END IF;
  
  -- New user registration notification
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'users' THEN
    PERFORM create_admin_notification(
      'new_user_registration',
      'New User Registered',
      'New user registered: ' || NEW.email || ' (Role: ' || NEW.role || ')',
      json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'role', NEW.role
      ),
      'normal'
    );
  END IF;
  
  -- Email delivery failure notification
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'admin_email_notifications' 
     AND OLD.delivery_status != NEW.delivery_status 
     AND NEW.delivery_status = 'failed' THEN
    PERFORM create_admin_notification(
      'email_delivery_failed',
      'Email Delivery Failed',
      'Failed to send email to ' || NEW.recipient_email,
      json_build_object(
        'email_id', NEW.id,
        'recipient', NEW.recipient_email,
        'error', NEW.delivery_error,
        'retry_count', NEW.retry_count
      ),
      'high'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_admin_notifications_guest_bookings ON public.guest_bookings;
CREATE TRIGGER trigger_admin_notifications_guest_bookings
  AFTER INSERT OR UPDATE ON public.guest_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_notifications();

DROP TRIGGER IF EXISTS trigger_admin_notifications_users ON public.users;
CREATE TRIGGER trigger_admin_notifications_users
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_notifications();

DROP TRIGGER IF EXISTS trigger_admin_notifications_emails ON public.admin_email_notifications;
CREATE TRIGGER trigger_admin_notifications_emails
  AFTER UPDATE ON public.admin_email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_notifications();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type 
ON public.admin_notifications (type);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read 
ON public.admin_notifications (is_read, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority 
ON public.admin_notifications (priority, created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION search_bookings(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_notification(admin_notification_type, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_admin_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_admin_notification_read(UUID) TO authenticated;

GRANT SELECT ON admin_dashboard_overview TO authenticated;
GRANT SELECT ON admin_booking_analytics TO authenticated;
GRANT SELECT ON admin_user_analytics TO authenticated;
GRANT SELECT ON admin_email_analytics TO authenticated;

-- Add RLS policies for admin notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all notifications" ON public.admin_notifications
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

CREATE POLICY "Admin can update notifications" ON public.admin_notifications
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

-- Log the migration completion
DO $$
BEGIN
  RAISE LOG 'Admin dashboard enhancement migration completed successfully';
  RAISE LOG 'Created comprehensive admin dashboard views';
  RAISE LOG 'Added real-time analytics functions';
  RAISE LOG 'Implemented admin notification system';
  RAISE LOG 'Added advanced search and filtering capabilities';
END $$;
