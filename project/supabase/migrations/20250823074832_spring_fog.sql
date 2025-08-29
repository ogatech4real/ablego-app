/*
  # Manual Booking Assignment System

  1. New Tables
    - `booking_assignments` - Track driver/support worker assignments
    - `admin_notifications` - Email notifications for admins

  2. Functions
    - `assign_booking_to_driver` - Manually assign driver to booking
    - `assign_support_workers_to_booking` - Assign support workers
    - `send_admin_email_notification` - Queue admin emails
    - `send_assignment_notification` - Notify assigned staff

  3. Triggers
    - Auto-notify admins when bookings are created
    - Send assignment notifications to drivers/support workers

  4. Security
    - Admin-only assignment functions
    - Proper RLS policies for new tables
*/

-- Create booking assignments table
CREATE TABLE IF NOT EXISTS booking_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('user', 'guest')),
  driver_id uuid REFERENCES users(id),
  support_worker_ids uuid[] DEFAULT '{}',
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
  driver_notes text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin email notifications queue
CREATE TABLE IF NOT EXISTS admin_email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  booking_id uuid,
  notification_type text NOT NULL,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_assignments
CREATE POLICY "Admins can manage all assignments"
  ON booking_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Drivers can view their assignments"
  ON booking_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Support workers can view their assignments"
  ON booking_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(support_worker_ids));

-- RLS Policies for admin_email_notifications
CREATE POLICY "Admins can manage email notifications"
  ON admin_email_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to assign driver to booking
CREATE OR REPLACE FUNCTION assign_booking_to_driver(
  p_booking_id uuid,
  p_booking_type text,
  p_driver_id uuid,
  p_admin_notes text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record booking_assignments;
  driver_profile profiles;
  booking_info record;
  customer_info record;
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get driver profile
  SELECT * INTO driver_profile
  FROM profiles
  WHERE id = p_driver_id;
  
  IF driver_profile IS NULL THEN
    RAISE EXCEPTION 'Driver not found';
  END IF;
  
  -- Get booking info based on type
  IF p_booking_type = 'user' THEN
    SELECT 
      b.id, b.pickup_address, b.dropoff_address, b.pickup_time, b.fare_estimate,
      p.name as customer_name, p.email as customer_email
    INTO booking_info
    FROM bookings b
    LEFT JOIN profiles p ON b.rider_id = p.id
    WHERE b.id = p_booking_id;
  ELSE
    SELECT 
      gb.id, gb.pickup_address, gb.dropoff_address, gb.pickup_time, gb.fare_estimate,
      gr.name as customer_name, gr.email as customer_email
    INTO booking_info
    FROM guest_bookings gb
    LEFT JOIN guest_riders gr ON gb.guest_rider_id = gr.id
    WHERE gb.id = p_booking_id;
  END IF;
  
  IF booking_info IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Create assignment
  INSERT INTO booking_assignments (
    booking_id,
    booking_type,
    driver_id,
    assigned_by,
    admin_notes,
    status
  ) VALUES (
    p_booking_id,
    p_booking_type,
    p_driver_id,
    auth.uid(),
    p_admin_notes,
    'assigned'
  ) RETURNING * INTO assignment_record;
  
  -- Update booking status
  IF p_booking_type = 'user' THEN
    UPDATE bookings SET status = 'confirmed', updated_at = now() WHERE id = p_booking_id;
  ELSE
    UPDATE guest_bookings SET status = 'confirmed', updated_at = now() WHERE id = p_booking_id;
  END IF;
  
  -- Send notification to driver
  INSERT INTO notifications (
    user_id,
    message,
    type,
    data
  ) VALUES (
    p_driver_id,
    'New booking assigned: ' || booking_info.pickup_address || ' to ' || booking_info.dropoff_address,
    'booking_request',
    json_build_object(
      'booking_id', p_booking_id,
      'booking_type', p_booking_type,
      'pickup_address', booking_info.pickup_address,
      'dropoff_address', booking_info.dropoff_address,
      'pickup_time', booking_info.pickup_time,
      'fare_estimate', booking_info.fare_estimate,
      'customer_name', booking_info.customer_name,
      'assignment_id', assignment_record.id
    )
  );
  
  -- Queue email notification to driver
  INSERT INTO admin_email_notifications (
    recipient_email,
    subject,
    html_content,
    booking_id,
    notification_type
  ) VALUES (
    driver_profile.email,
    'New Booking Assignment - AbleGo',
    format('
      <h2>New Booking Assignment</h2>
      <p>Dear %s,</p>
      <p>You have been assigned a new booking:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Pickup:</strong> %s</p>
        <p><strong>Dropoff:</strong> %s</p>
        <p><strong>Date & Time:</strong> %s</p>
        <p><strong>Customer:</strong> %s</p>
        <p><strong>Estimated Fare:</strong> £%s</p>
      </div>
      <p>Please log into your dashboard to accept or decline this booking.</p>
      <a href="https://ablego.co.uk/dashboard/driver" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Assignment</a>
    ',
    driver_profile.name,
    booking_info.pickup_address,
    booking_info.dropoff_address,
    booking_info.pickup_time,
    booking_info.customer_name,
    booking_info.fare_estimate
    ),
    p_booking_id,
    'driver_assignment'
  );
  
  RETURN json_build_object(
    'success', true,
    'assignment', row_to_json(assignment_record),
    'message', 'Driver assigned successfully'
  );
END;
$$;

-- Function to assign support workers to booking
CREATE OR REPLACE FUNCTION assign_support_workers_to_booking(
  p_booking_id uuid,
  p_booking_type text,
  p_support_worker_ids uuid[],
  p_admin_notes text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record booking_assignments;
  worker_profile profiles;
  booking_info record;
  worker_id uuid;
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get booking info
  IF p_booking_type = 'user' THEN
    SELECT 
      b.id, b.pickup_address, b.dropoff_address, b.pickup_time, b.fare_estimate,
      p.name as customer_name, p.email as customer_email
    INTO booking_info
    FROM bookings b
    LEFT JOIN profiles p ON b.rider_id = p.id
    WHERE b.id = p_booking_id;
  ELSE
    SELECT 
      gb.id, gb.pickup_address, gb.dropoff_address, gb.pickup_time, gb.fare_estimate,
      gr.name as customer_name, gr.email as customer_email
    INTO booking_info
    FROM guest_bookings gb
    LEFT JOIN guest_riders gr ON gb.guest_rider_id = gr.id
    WHERE gb.id = p_booking_id;
  END IF;
  
  -- Update existing assignment or create new one
  INSERT INTO booking_assignments (
    booking_id,
    booking_type,
    support_worker_ids,
    assigned_by,
    admin_notes,
    status
  ) VALUES (
    p_booking_id,
    p_booking_type,
    p_support_worker_ids,
    auth.uid(),
    p_admin_notes,
    'assigned'
  ) 
  ON CONFLICT (booking_id, booking_type) 
  DO UPDATE SET 
    support_worker_ids = p_support_worker_ids,
    admin_notes = p_admin_notes,
    updated_at = now()
  RETURNING * INTO assignment_record;
  
  -- Send notifications to each support worker
  FOREACH worker_id IN ARRAY p_support_worker_ids
  LOOP
    SELECT * INTO worker_profile
    FROM profiles
    WHERE id = worker_id;
    
    IF worker_profile IS NOT NULL THEN
      -- In-app notification
      INSERT INTO notifications (
        user_id,
        message,
        type,
        data
      ) VALUES (
        worker_id,
        'New support assignment: ' || booking_info.pickup_address || ' to ' || booking_info.dropoff_address,
        'booking_request',
        json_build_object(
          'booking_id', p_booking_id,
          'booking_type', p_booking_type,
          'pickup_address', booking_info.pickup_address,
          'dropoff_address', booking_info.dropoff_address,
          'pickup_time', booking_info.pickup_time,
          'customer_name', booking_info.customer_name,
          'assignment_id', assignment_record.id
        )
      );
      
      -- Email notification
      INSERT INTO admin_email_notifications (
        recipient_email,
        subject,
        html_content,
        booking_id,
        notification_type
      ) VALUES (
        worker_profile.email,
        'New Support Assignment - AbleGo',
        format('
          <h2>New Support Worker Assignment</h2>
          <p>Dear %s,</p>
          <p>You have been assigned to provide support for a customer journey:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Pickup:</strong> %s</p>
            <p><strong>Dropoff:</strong> %s</p>
            <p><strong>Date & Time:</strong> %s</p>
            <p><strong>Customer:</strong> %s</p>
          </div>
          <p>Please log into your dashboard to accept this assignment.</p>
          <a href="https://ablego.co.uk/dashboard/support" style="background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Assignment</a>
        ',
        worker_profile.name,
        booking_info.pickup_address,
        booking_info.dropoff_address,
        booking_info.pickup_time,
        booking_info.customer_name
        ),
        p_booking_id,
        'support_worker_assignment'
      );
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'assignment', row_to_json(assignment_record),
    'message', 'Support workers assigned successfully'
  );
END;
$$;

-- Enhanced admin notification function
CREATE OR REPLACE FUNCTION send_admin_booking_notification(
  p_booking_id uuid,
  p_booking_type text,
  p_customer_name text,
  p_customer_email text,
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_time timestamptz,
  p_fare_estimate numeric,
  p_support_workers_count integer DEFAULT 0,
  p_vehicle_features text[] DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Queue admin email notification
  INSERT INTO admin_email_notifications (
    recipient_email,
    subject,
    html_content,
    booking_id,
    notification_type
  ) VALUES (
    'admin@ablego.co.uk',
    'New Booking Requires Assignment - ' || p_customer_name,
    format('
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%%, #14B8A6 100%%); padding: 30px; text-align: center; color: white;">
          <h1>🚗 New Booking Requires Assignment</h1>
          <p>A new booking has been created and needs driver assignment</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2>Booking Details</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> %s</p>
            <p><strong>Type:</strong> %s</p>
            <p><strong>Customer:</strong> %s (%s)</p>
            <p><strong>From:</strong> %s</p>
            <p><strong>To:</strong> %s</p>
            <p><strong>Pickup Time:</strong> %s</p>
            <p><strong>Estimated Fare:</strong> £%s</p>
            %s
            %s
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://ablego.co.uk/dashboard/admin/bookings?id=%s" 
               style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Assign Driver Now
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⏰ Action Required:</strong> Please assign a driver and support workers (if needed) as soon as possible.</p>
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>This is an automated notification from AbleGo Admin System</p>
          <p>AbleGo Ltd • Middlesbrough, United Kingdom</p>
        </div>
      </div>
    ',
    p_booking_id,
    p_booking_type,
    p_customer_name,
    p_customer_email,
    p_pickup_address,
    p_dropoff_address,
    p_pickup_time,
    p_fare_estimate,
    CASE WHEN p_support_workers_count > 0 
         THEN format('<p><strong>Support Workers Needed:</strong> %s</p>', p_support_workers_count)
         ELSE '' END,
    CASE WHEN array_length(p_vehicle_features, 1) > 0 
         THEN format('<p><strong>Vehicle Features:</strong> %s</p>', array_to_string(p_vehicle_features, ', '))
         ELSE '' END,
    p_booking_id
    ),
    p_booking_id,
    'new_booking_admin'
  );
  
  -- Also create in-app notification for all admins
  INSERT INTO notifications (
    user_id,
    message,
    type,
    data
  )
  SELECT 
    u.id,
    'New booking requires assignment: ' || p_customer_name || ' - ' || p_pickup_address || ' to ' || p_dropoff_address,
    'system',
    json_build_object(
      'booking_id', p_booking_id,
      'booking_type', p_booking_type,
      'customer_name', p_customer_name,
      'pickup_address', p_pickup_address,
      'pickup_time', p_pickup_time,
      'fare_estimate', p_fare_estimate,
      'requires_assignment', true
    )
  FROM users u
  WHERE u.role = 'admin';
END;
$$;

-- Enhanced booking notification trigger
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_name text;
  customer_email text;
BEGIN
  IF TG_TABLE_NAME = 'bookings' THEN
    -- Get customer info from profiles
    SELECT p.name, p.email INTO customer_name, customer_email
    FROM profiles p
    WHERE p.id = NEW.rider_id;
    
    -- Send admin notification
    PERFORM send_admin_booking_notification(
      NEW.id,
      'user',
      customer_name,
      customer_email,
      NEW.pickup_address,
      NEW.dropoff_address,
      NEW.pickup_time,
      NEW.fare_estimate,
      NEW.support_workers_count,
      NEW.vehicle_features
    );
    
  ELSIF TG_TABLE_NAME = 'guest_bookings' THEN
    -- Get customer info from guest_riders
    SELECT gr.name, gr.email INTO customer_name, customer_email
    FROM guest_riders gr
    WHERE gr.id = NEW.guest_rider_id;
    
    -- Send admin notification
    PERFORM send_admin_booking_notification(
      NEW.id,
      'guest',
      customer_name,
      customer_email,
      NEW.pickup_address,
      NEW.dropoff_address,
      NEW.pickup_time,
      NEW.fare_estimate,
      NEW.support_workers_count,
      NEW.vehicle_features
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for both booking tables
DROP TRIGGER IF EXISTS trigger_notify_booking_created ON bookings;
CREATE TRIGGER trigger_notify_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

DROP TRIGGER IF EXISTS trigger_notify_guest_booking_created ON guest_bookings;
CREATE TRIGGER trigger_notify_guest_booking_created
  AFTER INSERT ON guest_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

-- Function to get available drivers for assignment
CREATE OR REPLACE FUNCTION get_available_drivers_for_booking(
  p_pickup_lat numeric,
  p_pickup_lng numeric,
  p_vehicle_features text[] DEFAULT '{}',
  p_pickup_time timestamptz DEFAULT now()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'driver_id', v.driver_id,
      'driver_name', p.name,
      'driver_email', p.email,
      'driver_phone', p.phone,
      'vehicle_id', v.id,
      'vehicle_info', v.make || ' ' || v.model || ' (' || v.year || ')',
      'license_plate', v.license_plate,
      'vehicle_features', v.features,
      'accessible_rating', v.accessible_rating,
      'passenger_capacity', v.passenger_capacity,
      'wheelchair_capacity', v.wheelchair_capacity
    )
  ) INTO result
  FROM vehicles v
  LEFT JOIN profiles p ON v.driver_id = p.id
  WHERE v.verified = true 
    AND v.is_active = true
    AND p.is_active = true
    AND (
      array_length(p_vehicle_features, 1) IS NULL 
      OR p_vehicle_features <@ v.features
    );
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to get available support workers
CREATE OR REPLACE FUNCTION get_available_support_workers_for_booking(
  p_pickup_lat numeric,
  p_pickup_lng numeric,
  p_pickup_time timestamptz DEFAULT now()
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'support_worker_id', sw.user_id,
      'worker_name', p.name,
      'worker_email', p.email,
      'worker_phone', p.phone,
      'hourly_rate', sw.hourly_rate,
      'experience_years', sw.experience_years,
      'specializations', sw.specializations,
      'languages', sw.languages,
      'bio', sw.bio
    )
  ) INTO result
  FROM support_workers sw
  LEFT JOIN profiles p ON sw.user_id = p.id
  WHERE sw.verified = true 
    AND sw.is_active = true
    AND p.is_active = true;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking_id ON booking_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_driver_id ON booking_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_status ON booking_assignments(status);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_sent ON admin_email_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_created_at ON admin_email_notifications(created_at);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON booking_assignments TO authenticated;
GRANT SELECT ON admin_email_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION assign_booking_to_driver TO authenticated;
GRANT EXECUTE ON FUNCTION assign_support_workers_to_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_drivers_for_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_support_workers_for_booking TO authenticated;
GRANT EXECUTE ON FUNCTION send_admin_booking_notification TO authenticated, anon;