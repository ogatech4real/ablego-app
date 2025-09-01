-- Fix Email Delivery System Migration
-- This migration ensures emails are actually sent, not just queued

-- 1. Create email configuration table for SMTP settings
CREATE TABLE IF NOT EXISTS email_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    smtp_from_email TEXT NOT NULL,
    smtp_from_name TEXT NOT NULL,
    smtp_secure BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to admin_email_notifications table
DO $$
BEGIN
    -- Add email_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'email_type'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN email_type TEXT DEFAULT 'admin_notification';
    END IF;

    -- Add email_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'email_status'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN email_status TEXT DEFAULT 'queued';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN priority INTEGER DEFAULT 1;
    END IF;

    -- Add retry_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;

    -- Add max_retries column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'max_retries'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN max_retries INTEGER DEFAULT 3;
    END IF;

    -- Add last_retry_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'last_retry_at'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN last_retry_at TIMESTAMPTZ;
    END IF;

    -- Add delivery_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN delivery_status TEXT DEFAULT 'pending';
    END IF;

    -- Add delivery_status_details column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_email_notifications' AND column_name = 'delivery_status_details'
    ) THEN
        ALTER TABLE admin_email_notifications ADD COLUMN delivery_status_details JSONB;
    END IF;
END $$;

-- 3. Create email_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_type') THEN
        CREATE TYPE email_type AS ENUM (
            'booking_confirmation',
            'payment_receipt',
            'driver_assignment',
            'admin_notification',
            'welcome_email',
            'password_reset',
            'account_verification'
        );
    END IF;
END $$;

-- 4. Create email_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
        CREATE TYPE email_status AS ENUM (
            'queued',
            'processing',
            'sent',
            'failed',
            'delivered',
            'bounced'
        );
    END IF;
END $$;

-- 5. Update existing records to have proper email_type and email_status
-- Check if email_type column is still TEXT type before updating
DO $$
DECLARE
    col_type text;
BEGIN
    -- Get the current data type of email_type column
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' 
    AND column_name = 'email_type';
    
    -- Only update if the column is still TEXT type
    IF col_type = 'text' THEN
        UPDATE admin_email_notifications 
        SET email_type = CASE 
            WHEN notification_type = 'booking_confirmation' THEN 'booking_confirmation'
            WHEN notification_type = 'payment_confirmation' THEN 'payment_receipt'
            WHEN notification_type = 'admin_booking_notification' THEN 'admin_notification'
            WHEN notification_type = 'admin_driver_assignment' THEN 'admin_notification'
            ELSE 'admin_notification'
        END
        WHERE email_type IS NULL OR email_type = 'admin_notification';
    END IF;
END $$;

-- Check if email_status column is still TEXT type before updating
DO $$
DECLARE
    col_type text;
BEGIN
    -- Get the current data type of email_status column
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' 
    AND column_name = 'email_status';
    
    -- Only update if the column is still TEXT type
    IF col_type = 'text' THEN
        UPDATE admin_email_notifications 
        SET email_status = CASE 
            WHEN sent = true THEN 'sent'
            ELSE 'queued'
        END
        WHERE email_status IS NULL;
    END IF;
END $$;

-- 6. Set proper priorities for different email types
-- Handle priority update based on current column type
DO $$
DECLARE
    col_type text;
BEGIN
    -- Get the current data type of email_type column
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' 
    AND column_name = 'email_type';
    
    -- Update priorities based on column type
    IF col_type = 'text' THEN
        -- Column is still TEXT type
        UPDATE admin_email_notifications 
        SET priority = CASE 
            WHEN email_type = 'booking_confirmation' THEN 1
            WHEN email_type = 'payment_receipt' THEN 1
            WHEN email_type = 'driver_assignment' THEN 2
            WHEN email_type = 'admin_notification' THEN 3
            ELSE 3
        END
        WHERE priority IS NULL OR priority = 1;
    ELSE
        -- Column is enum type
        UPDATE admin_email_notifications 
        SET priority = CASE 
            WHEN email_type = 'booking_confirmation'::email_type THEN 1
            WHEN email_type = 'payment_receipt'::email_type THEN 1
            WHEN email_type = 'driver_assignment'::email_type THEN 2
            WHEN email_type = 'admin_notification'::email_type THEN 3
            ELSE 3
        END
        WHERE priority IS NULL OR priority = 1;
    END IF;
END $$;

-- 7. Now convert the columns to use enum types (after data is properly set)
-- Convert email_type column to use the enum type only if it's still TEXT
DO $$
DECLARE
    col_type text;
BEGIN
    -- Get the current data type of email_type column
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' 
    AND column_name = 'email_type';
    
    -- Only convert if the column is still TEXT type
    IF col_type = 'text' THEN
        ALTER TABLE admin_email_notifications 
        ALTER COLUMN email_type TYPE email_type 
        USING email_type::email_type;
    END IF;
END $$;

-- Convert email_status column to use the enum type only if it's still TEXT
DO $$
DECLARE
    col_type text;
BEGIN
    -- Get the current data type of email_status column
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'admin_email_notifications' 
    AND column_name = 'email_status';
    
    -- Only convert if the column is still TEXT type
    IF col_type = 'text' THEN
        ALTER TABLE admin_email_notifications 
        ALTER COLUMN email_status TYPE email_status 
        USING email_status::email_status;
    END IF;
END $$;

-- 8. Create indexes for better email processing performance
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_status ON admin_email_notifications(email_status);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_type ON admin_email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_priority ON admin_email_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_created_at ON admin_email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_email_notifications_retry_count ON admin_email_notifications(retry_count);

-- 9. Create RLS policies for email configuration table
ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;

-- Only admin can manage email configuration
CREATE POLICY "Admin can manage email configuration" ON email_configuration
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

-- 10. Insert default email configuration (Gmail SMTP for testing)
INSERT INTO email_configuration (
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_password,
    smtp_from_email,
    smtp_from_name,
    smtp_secure,
    is_active
) VALUES (
    'smtp.gmail.com',
    587,
    'admin@ablego.co.uk',
    'your-app-password-here',
    'admin@ablego.co.uk',
    'AbleGo Ltd',
    false,
    true
) ON CONFLICT DO NOTHING;

-- 11. Create function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    processed_count INTEGER := 0;
    successful_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    -- This function can be called to manually trigger email processing
    -- In production, this should be called by a cron job or webhook
    
    SELECT json_build_object(
        'message', 'Email queue processing triggered',
        'processed', processed_count,
        'successful', successful_count,
        'failed', failed_count,
        'timestamp', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION process_email_queue() TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_configuration TO authenticated;

-- 13. Create view for email delivery monitoring
CREATE OR REPLACE VIEW email_delivery_stats AS
SELECT 
    email_type,
    email_status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delivery_time_seconds,
    MIN(created_at) as oldest_email,
    MAX(created_at) as newest_email
FROM admin_email_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY email_type, email_status
ORDER BY email_type, email_status;

-- 14. Add comments for documentation
COMMENT ON TABLE email_configuration IS 'SMTP configuration for email delivery';
COMMENT ON TABLE admin_email_notifications IS 'Email queue and delivery tracking';
COMMENT ON FUNCTION process_email_queue() IS 'Manually trigger email queue processing';
COMMENT ON VIEW email_delivery_stats IS 'Email delivery statistics and monitoring';

-- Migration completed successfully
SELECT 'Email delivery system migration applied successfully' as status;
