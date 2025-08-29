/*
  # Enhanced Email Notification System - Fixed

  1. Database Enhancements
    - Add email_type field to admin_email_notifications
    - Add email delivery status tracking
    - Add retry logic fields
    - Add email template management

  2. New Email Types
    - booking_invoice: Initial booking with payment instructions
    - payment_receipt: Payment confirmation and driver dispatch
    - driver_assignment: Driver details and contact info
    - trip_updates: Journey status updates
    - trip_completion: Journey summary and rating request

  3. Email Queue Management
    - Priority-based email processing
    - Retry logic for failed emails
    - Delivery status tracking
    - Template-based email generation
*/

-- Add email_type enum for better categorization
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_type') THEN
    CREATE TYPE email_type AS ENUM (
      'booking_invoice',
      'payment_receipt', 
      'driver_assignment',
      'trip_update',
      'trip_completion',
      'admin_notification',
      'system_alert'
    );
  END IF;
END $$;

-- Add email_status enum for delivery tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM (
      'queued',
      'sending',
      'sent',
      'delivered',
      'failed',
      'bounced'
    );
  END IF;
END $$;

-- Enhance admin_email_notifications table
DO $$
BEGIN
  -- Add email_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'email_type'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN email_type email_type DEFAULT 'admin_notification';
  END IF;

  -- Add email_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'email_status'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN email_status email_status DEFAULT 'queued';
  END IF;

  -- Add priority column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'priority'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN priority integer DEFAULT 5;
  END IF;

  -- Add retry_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN retry_count integer DEFAULT 0;
  END IF;

  -- Add max_retries column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'max_retries'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN max_retries integer DEFAULT 3;
  END IF;

  -- Add last_retry_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'last_retry_at'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN last_retry_at timestamptz;
  END IF;

  -- Add delivery_status_details column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'delivery_status_details'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN delivery_status_details jsonb DEFAULT '{}';
  END IF;

  -- Add template_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'template_data'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN template_data jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create email_templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  email_type email_type NOT NULL,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  variables jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_email_type 
ON admin_email_notifications (email_type);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_email_status 
ON admin_email_notifications (email_status);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_priority 
ON admin_email_notifications (priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_retry 
ON admin_email_notifications (retry_count, last_retry_at);

-- Insert default email templates
INSERT INTO email_templates (template_name, email_type, subject_template, html_template, variables) VALUES
(
  'booking_invoice',
  'booking_invoice',
  '🧾 Invoice & Booking Confirmation - AbleGo Ride on {{pickup_date}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Invoice - AbleGo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">🧾 Booking Invoice</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Complete payment to dispatch your driver</p>
    </div>
    <div style="padding: 30px;">
      <p>Dear {{customer_name}},</p>
      <p>Your AbleGo booking has been created. Complete payment to have your driver dispatched automatically.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="{{tracking_url}}" style="background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold;">Track Booking & Pay</a>
      </div>
    </div>
  </div>
</body>
</html>',
  '{"customer_name": "string", "pickup_date": "string", "tracking_url": "string"}'
),
(
  'payment_receipt',
  'payment_receipt',
  '✅ Payment Confirmed - Driver Being Assigned | AbleGo',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Confirmed - AbleGo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">✅ Payment Confirmed!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your driver is being assigned now</p>
    </div>
    <div style="padding: 30px;">
      <p>Dear {{customer_name}},</p>
      <p>Your payment has been confirmed and we are now assigning a suitable driver for your journey.</p>
    </div>
  </div>
</body>
</html>',
  '{"customer_name": "string", "payment_amount": "number", "booking_reference": "string"}'
),
(
  'driver_assignment',
  'driver_assignment',
  '🚗 Driver Assigned - {{driver_name}} is on the way | AbleGo',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Driver Assigned - AbleGo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">🚗 Driver Assigned!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{driver_name}} is on the way</p>
    </div>
    <div style="padding: 30px;">
      <p>Dear {{customer_name}},</p>
      <p>Great news! Your driver has been assigned and is on the way to pick you up.</p>
    </div>
  </div>
</body>
</html>',
  '{"customer_name": "string", "driver_name": "string", "vehicle_details": "string"}'
);

-- Update existing notification_type enum to include new types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'driver_assignment' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'driver_assignment';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_receipt' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
    ALTER TYPE notification_type ADD VALUE 'payment_receipt';
  END IF;
END $$;

-- Create function to queue emails with templates (FIXED SYNTAX)
CREATE OR REPLACE FUNCTION queue_templated_email(
  p_recipient_email text,
  p_template_name text,
  p_template_data jsonb DEFAULT '{}',
  p_booking_id uuid DEFAULT NULL,
  p_priority integer DEFAULT 5
) RETURNS uuid AS $$
DECLARE
  v_template_record email_templates%ROWTYPE;
  v_notification_id uuid;
  v_subject text;
  v_html_content text;
  v_key text;
  v_value text;
  v_record record;
BEGIN
  -- Get template
  SELECT * INTO v_template_record
  FROM email_templates
  WHERE template_name = p_template_name AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email template not found: %', p_template_name;
  END IF;

  -- Replace template variables in subject
  v_subject := v_template_record.subject_template;
  FOR v_record IN SELECT key, value FROM jsonb_each_text(p_template_data) LOOP
    v_subject := replace(v_subject, '{{' || v_record.key || '}}', v_record.value);
  END LOOP;

  -- Replace template variables in HTML content
  v_html_content := v_template_record.html_template;
  FOR v_record IN SELECT key, value FROM jsonb_each_text(p_template_data) LOOP
    v_html_content := replace(v_html_content, '{{' || v_record.key || '}}', v_record.value);
  END LOOP;

  -- Insert notification
  INSERT INTO admin_email_notifications (
    recipient_email,
    subject,
    html_content,
    booking_id,
    notification_type,
    email_type,
    email_status,
    priority,
    template_data,
    sent,
    created_at
  ) VALUES (
    p_recipient_email,
    v_subject,
    v_html_content,
    p_booking_id,
    v_template_record.email_type::text,
    v_template_record.email_type,
    'queued',
    p_priority,
    p_template_data,
    false,
    now()
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically send booking invoice
CREATE OR REPLACE FUNCTION send_booking_invoice_auto()
RETURNS trigger AS $$
DECLARE
  v_access_token text;
BEGIN
  -- Get access token for this booking
  SELECT token INTO v_access_token
  FROM booking_access_tokens
  WHERE guest_booking_id = NEW.id
  LIMIT 1;

  -- Queue booking invoice email
  PERFORM queue_templated_email(
    (SELECT email FROM guest_riders WHERE id = NEW.guest_rider_id),
    'booking_invoice',
    jsonb_build_object(
      'customer_name', (SELECT name FROM guest_riders WHERE id = NEW.guest_rider_id),
      'pickup_date', to_char(NEW.pickup_time::date, 'DD/MM/YYYY'),
      'pickup_time', to_char(NEW.pickup_time, 'HH24:MI'),
      'pickup_address', NEW.pickup_address,
      'dropoff_address', NEW.dropoff_address,
      'fare_amount', NEW.fare_estimate::text,
      'booking_reference', substring(NEW.id::text, 1, 8),
      'tracking_url', 'https://ablego.co.uk/booking-status?token=' || COALESCE(v_access_token, 'unknown'),
      'support_workers_count', COALESCE(NEW.support_workers_count, 0)::text,
      'vehicle_features', array_to_string(COALESCE(NEW.vehicle_features, '{}'), ', '),
      'special_requirements', COALESCE(NEW.special_requirements, 'None'),
      'booking_type', NEW.booking_type::text
    ),
    NEW.id,
    1 -- High priority
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic booking invoice
DROP TRIGGER IF EXISTS trigger_send_booking_invoice_auto ON guest_bookings;
CREATE TRIGGER trigger_send_booking_invoice_auto
  AFTER INSERT ON guest_bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_invoice_auto();

-- Create function to send payment receipt
CREATE OR REPLACE FUNCTION send_payment_receipt(
  p_booking_id uuid,
  p_payment_amount numeric,
  p_payment_method text DEFAULT 'card'
) RETURNS uuid AS $$
DECLARE
  v_booking_record record;
  v_notification_id uuid;
BEGIN
  -- Get booking details
  SELECT 
    gb.*,
    gr.name as guest_rider_name,
    gr.email as guest_rider_email,
    gr.phone as guest_rider_phone,
    bat.token as access_token
  INTO v_booking_record
  FROM guest_bookings gb
  JOIN guest_riders gr ON gb.guest_rider_id = gr.id
  LEFT JOIN booking_access_tokens bat ON gb.id = bat.guest_booking_id
  WHERE gb.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Queue payment receipt email
  SELECT queue_templated_email(
    v_booking_record.guest_rider_email,
    'payment_receipt',
    jsonb_build_object(
      'customer_name', v_booking_record.guest_rider_name,
      'payment_amount', p_payment_amount::text,
      'payment_method', p_payment_method,
      'booking_reference', substring(p_booking_id::text, 1, 8),
      'pickup_address', v_booking_record.pickup_address,
      'dropoff_address', v_booking_record.dropoff_address,
      'pickup_time', to_char(v_booking_record.pickup_time, 'DD/MM/YYYY at HH24:MI'),
      'tracking_url', 'https://ablego.co.uk/booking-status?token=' || COALESCE(v_booking_record.access_token, 'unknown'),
      'customer_phone', v_booking_record.guest_rider_phone
    ),
    p_booking_id,
    1 -- High priority
  ) INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send driver assignment notification
CREATE OR REPLACE FUNCTION send_driver_assignment_notification(
  p_booking_id uuid,
  p_driver_name text,
  p_driver_phone text,
  p_vehicle_details text,
  p_license_plate text,
  p_estimated_arrival text
) RETURNS uuid AS $$
DECLARE
  v_booking_record record;
  v_notification_id uuid;
BEGIN
  -- Get booking details
  SELECT 
    gb.*,
    gr.name as guest_rider_name,
    gr.email as guest_rider_email,
    gr.phone as guest_rider_phone,
    bat.token as access_token
  INTO v_booking_record
  FROM guest_bookings gb
  JOIN guest_riders gr ON gb.guest_rider_id = gr.id
  LEFT JOIN booking_access_tokens bat ON gb.id = bat.guest_booking_id
  WHERE gb.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Queue driver assignment email
  SELECT queue_templated_email(
    v_booking_record.guest_rider_email,
    'driver_assignment',
    jsonb_build_object(
      'customer_name', v_booking_record.guest_rider_name,
      'driver_name', p_driver_name,
      'driver_phone', p_driver_phone,
      'vehicle_details', p_vehicle_details,
      'license_plate', p_license_plate,
      'estimated_arrival', p_estimated_arrival,
      'pickup_address', v_booking_record.pickup_address,
      'pickup_time', to_char(v_booking_record.pickup_time, 'DD/MM/YYYY at HH24:MI'),
      'tracking_url', 'https://ablego.co.uk/booking-status?token=' || COALESCE(v_booking_record.access_token, 'unknown')
    ),
    p_booking_id,
    2 -- High priority
  ) INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing records to have proper email_type
UPDATE admin_email_notifications 
SET email_type = CASE 
  WHEN notification_type = 'booking_invoice' THEN 'booking_invoice'::email_type
  WHEN notification_type = 'payment_confirmation' THEN 'payment_receipt'::email_type
  WHEN notification_type = 'admin_booking_notification' THEN 'admin_notification'::email_type
  WHEN notification_type = 'admin_driver_assignment' THEN 'admin_notification'::email_type
  ELSE 'admin_notification'::email_type
END
WHERE email_type IS NULL;

-- Update email_status based on sent field
UPDATE admin_email_notifications 
SET email_status = CASE 
  WHEN sent = true THEN 'sent'::email_status
  ELSE 'queued'::email_status
END
WHERE email_status = 'queued';

-- Enable RLS on email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policy for service role access
CREATE POLICY "Service role can access email templates"
  ON email_templates
  FOR ALL
  TO service_role
  USING (true);