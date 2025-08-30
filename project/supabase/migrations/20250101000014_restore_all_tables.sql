/*
  # Restore All Essential Tables - Emergency Recovery
  
  This migration restores all essential tables that might have been lost
  during the database reset process. It creates all required tables with
  proper structure, relationships, and permissions.
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create email delivery status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_delivery_status') THEN
    CREATE TYPE email_delivery_status AS ENUM (
      'pending',
      'processing',
      'sent',
      'delivered',
      'failed',
      'bounced',
      'retry_scheduled'
    );
  END IF;
END $$;

-- Create guest_riders table
CREATE TABLE IF NOT EXISTS public.guest_riders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linked_user_id uuid,
  account_created_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create guest_bookings table
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_rider_id uuid NOT NULL,
  linked_user_id uuid,
  pickup_address text NOT NULL,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  pickup_postcode text,
  pickup_place_id text,
  dropoff_address text NOT NULL,
  dropoff_lat decimal(10,8),
  dropoff_lng decimal(11,8),
  dropoff_postcode text,
  dropoff_place_id text,
  pickup_time timestamptz NOT NULL,
  dropoff_time timestamptz,
  vehicle_features text[] DEFAULT '{}',
  support_workers_count integer DEFAULT 0,
  fare_estimate numeric(10,2) NOT NULL,
  booking_type text DEFAULT 'scheduled',
  lead_time_hours numeric(6,2) DEFAULT 0,
  time_multiplier numeric(4,2) DEFAULT 1.0,
  booking_type_discount numeric(8,2) DEFAULT 0,
  status text DEFAULT 'pending',
  special_requirements text,
  notes text,
  payment_method text DEFAULT 'cash_bank',
  account_linked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_access_tokens table
CREATE TABLE IF NOT EXISTS public.booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_booking_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Create admin_email_notifications table
CREATE TABLE IF NOT EXISTS public.admin_email_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  booking_id uuid,
  notification_type text DEFAULT 'system',
  email_type text DEFAULT 'notification',
  email_status text DEFAULT 'queued',
  priority integer DEFAULT 3,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  delivery_status email_delivery_status DEFAULT 'pending',
  delivery_error text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  last_retry_at timestamptz,
  processing_attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.guest_bookings 
  ADD CONSTRAINT fk_guest_bookings_guest_rider_id 
  FOREIGN KEY (guest_rider_id) REFERENCES public.guest_riders(id) ON DELETE CASCADE;

ALTER TABLE public.booking_access_tokens 
  ADD CONSTRAINT fk_booking_access_tokens_guest_booking_id 
  FOREIGN KEY (guest_booking_id) REFERENCES public.guest_bookings(id) ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE public.guest_riders 
  ADD CONSTRAINT guest_riders_email_key UNIQUE (email);

-- Enable RLS on all tables
ALTER TABLE public.guest_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for guest_riders
CREATE POLICY "Anyone can create guest rider records"
  ON public.guest_riders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest riders can read own data via email"
  ON public.guest_riders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create RLS policies for guest_bookings
CREATE POLICY "Anyone can create guest bookings"
  ON public.guest_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Guest bookings readable via token"
  ON public.guest_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can access all guest bookings"
  ON public.guest_bookings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create RLS policies for booking_access_tokens
CREATE POLICY "Tokens readable by token value"
  ON public.booking_access_tokens
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

CREATE POLICY "Anyone can create access tokens"
  ON public.booking_access_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create RLS policies for admin_email_notifications
CREATE POLICY "Admin can manage email notifications"
  ON public.admin_email_notifications
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_riders_email ON public.guest_riders(email);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_guest_rider_id ON public.guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_status ON public.guest_bookings(status);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_time ON public.guest_bookings(pickup_time);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_coords ON public.guest_bookings(pickup_lat, pickup_lng);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_dropoff_coords ON public.guest_bookings(dropoff_lat, dropoff_lng);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_pickup_postcode ON public.guest_bookings(pickup_postcode);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_dropoff_postcode ON public.guest_bookings(dropoff_postcode);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_token ON public.booking_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_booking_access_tokens_expires ON public.booking_access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_sent_status ON public.admin_email_notifications(sent, delivery_status);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_retry ON public.admin_email_notifications(retry_count, last_retry_at);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_created_at ON public.admin_email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_notification_type ON public.admin_email_notifications(notification_type);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.guest_riders TO anon, authenticated;
GRANT ALL ON public.guest_bookings TO anon, authenticated;
GRANT ALL ON public.booking_access_tokens TO anon, authenticated;
GRANT ALL ON public.admin_email_notifications TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create email processing trigger function
CREATE OR REPLACE FUNCTION trigger_email_queue_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new emails that are not sent
  IF NEW.sent = false AND NEW.delivery_status = 'pending' THEN
    -- Call the process-email-queue function asynchronously
    PERFORM net.http_post(
      url := 'https://myutbivamzrfccoljilo.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json',
        'X-Client-Info', 'supabase-js/2.0.0'
      ),
      body := '{}'
    );
    
    -- Log the trigger
    RAISE LOG 'Email processing triggered for email ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Error triggering email processing: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically process email queue
DROP TRIGGER IF EXISTS trigger_email_queue_processing ON admin_email_notifications;
CREATE TRIGGER trigger_email_queue_processing
  AFTER INSERT ON admin_email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_queue_processing();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_email_queue_processing() TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE LOG 'All essential tables restored successfully';
  RAISE LOG 'Created guest_riders, guest_bookings, booking_access_tokens, admin_email_notifications';
  RAISE LOG 'RLS policies and indexes created';
  RAISE LOG 'Email processing trigger configured';
  RAISE LOG 'Permissions granted to anon and authenticated roles';
END $$;
