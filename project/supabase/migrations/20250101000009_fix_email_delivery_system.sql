/*
  # Fix Email Delivery System - Priority 1

  1. Email Processing Issues
    - Emails are queued but never processed automatically
    - No trigger to call process-email-queue function
    - Missing email delivery status tracking
    - No retry mechanism for failed emails

  2. Solutions
    - Create automatic trigger to process email queue
    - Add email delivery status tracking
    - Improve error handling and retry logic
    - Add email queue monitoring

  3. Changes
    - Add email processing trigger
    - Enhance admin_email_notifications table
    - Create email queue monitoring views
    - Add email delivery status tracking
*/

-- Enable http extension for function calls
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create email delivery status enum first
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

-- Create admin_email_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_email_notifications (
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
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_email_notifications
ALTER TABLE admin_email_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_email_notifications
CREATE POLICY "Admin can manage email notifications"
  ON admin_email_notifications
  FOR ALL
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON admin_email_notifications TO authenticated;

-- Add email delivery status tracking columns
DO $$
BEGIN
  -- Add delivery_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN delivery_status email_delivery_status DEFAULT 'pending';
  ELSE
    -- If column exists, update it to use the enum type
    BEGIN
      ALTER TABLE admin_email_notifications 
      ALTER COLUMN delivery_status TYPE email_delivery_status 
      USING delivery_status::email_delivery_status;
    EXCEPTION
      WHEN OTHERS THEN
        -- If conversion fails, drop and recreate the column
        ALTER TABLE admin_email_notifications DROP COLUMN delivery_status;
        ALTER TABLE admin_email_notifications ADD COLUMN delivery_status email_delivery_status DEFAULT 'pending';
    END;
  END IF;

  -- Add delivery_error column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'delivery_error'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN delivery_error text;
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

  -- Add processing_attempts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' AND column_name = 'processing_attempts'
  ) THEN
    ALTER TABLE admin_email_notifications ADD COLUMN processing_attempts integer DEFAULT 0;
  END IF;
END $$;

-- Create function to trigger email processing
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

-- Create function to manually trigger email processing
CREATE OR REPLACE FUNCTION manual_process_email_queue()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Call the process-email-queue function
  SELECT content::json INTO result
  FROM net.http_post(
    url := 'https://myutbivamzrfccoljilo.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json',
      'X-Client-Info', 'supabase-js/2.0.0'
    ),
    body := '{}'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create email queue monitoring view
CREATE OR REPLACE VIEW email_queue_status AS
SELECT 
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE sent = false) as pending_emails,
  COUNT(*) FILTER (WHERE sent = true) as sent_emails,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_emails,
  COUNT(*) FILTER (WHERE delivery_status = 'processing') as processing_emails,
  COUNT(*) FILTER (WHERE retry_count > 0) as retry_emails,
  COUNT(*) FILTER (WHERE retry_count >= max_retries) as max_retry_emails,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '1 hour' AND sent = false) as old_pending_emails,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '24 hours' AND sent = false) as very_old_pending_emails,
  MIN(created_at) FILTER (WHERE sent = false) as oldest_pending_email,
  MAX(created_at) FILTER (WHERE sent = false) as newest_pending_email
FROM admin_email_notifications;

-- Create email delivery statistics view
CREATE OR REPLACE VIEW email_delivery_stats AS
SELECT 
  DATE(created_at) as date,
  notification_type,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE sent = true) as sent_emails,
  COUNT(*) FILTER (WHERE sent = false) as pending_emails,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed_emails,
  ROUND(
    (COUNT(*) FILTER (WHERE sent = true)::decimal / COUNT(*)::decimal) * 100, 2
  ) as success_rate
FROM admin_email_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), notification_type
ORDER BY date DESC, notification_type;

-- Create function to clean up old failed emails
CREATE OR REPLACE FUNCTION cleanup_failed_emails()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM admin_email_notifications 
  WHERE sent = false 
    AND retry_count >= max_retries 
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to retry failed emails
CREATE OR REPLACE FUNCTION retry_failed_emails()
RETURNS integer AS $$
DECLARE
  retry_count integer;
BEGIN
  UPDATE admin_email_notifications 
  SET 
    delivery_status = 'pending',
    retry_count = retry_count + 1,
    last_retry_at = NOW(),
    updated_at = NOW()
  WHERE sent = false 
    AND retry_count < max_retries 
    AND delivery_status = 'failed'
    AND last_retry_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS retry_count = ROW_COUNT;
  
  -- Trigger email processing for retried emails
  IF retry_count > 0 THEN
    PERFORM manual_process_email_queue();
  END IF;
  
  RETURN retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_sent_status 
ON admin_email_notifications (sent, delivery_status);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_retry 
ON admin_email_notifications (retry_count, last_retry_at);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_created_at 
ON admin_email_notifications (created_at);

CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_notification_type 
ON admin_email_notifications (notification_type);

-- Note: Email templates will be created in a separate migration
-- to avoid dependency issues

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_email_queue_processing() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_process_email_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_failed_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION retry_failed_emails() TO authenticated;
GRANT SELECT ON email_queue_status TO authenticated;
GRANT SELECT ON email_delivery_stats TO authenticated;

-- Add RLS policies for email monitoring
ALTER VIEW email_queue_status SET (security_invoker = true);
ALTER VIEW email_delivery_stats SET (security_invoker = true);

-- Create policy for admin users to view email queue
CREATE POLICY "Admin can view email queue status" ON admin_email_notifications
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

-- Log the migration completion
DO $$
BEGIN
  RAISE LOG 'Email delivery system migration completed successfully';
  RAISE LOG 'Created trigger_email_queue_processing function';
  RAISE LOG 'Created email queue monitoring views';
  RAISE LOG 'Added email delivery status tracking';
END $$;
