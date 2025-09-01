-- Complete Data Flow Fix Migration
-- This migration ensures seamless data routing from frontend to Supabase to admin dashboard

-- 1. First, ensure all required columns exist before adding foreign keys
DO $$ 
BEGIN
    -- Add user_id column to bookings table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN user_id uuid;
    END IF;

    -- Add user_id column to driver_applications table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'driver_applications' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE driver_applications ADD COLUMN user_id uuid;
    END IF;

    -- Add user_id column to support_worker_applications table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_worker_applications' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE support_worker_applications ADD COLUMN user_id uuid;
    END IF;

    -- Add driver_application_id column to vehicles table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'driver_application_id'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN driver_application_id uuid;
    END IF;

    -- Add support_worker_application_id column to support_workers table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_workers' AND column_name = 'support_worker_application_id'
    ) THEN
        ALTER TABLE support_workers ADD COLUMN support_worker_application_id uuid;
    END IF;
END $$;

-- 2. Now add missing foreign key relationships
DO $$ 
BEGIN
    -- Add missing foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_user_id' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_guest_bookings_guest_rider_id' 
        AND table_name = 'guest_bookings'
    ) THEN
        ALTER TABLE guest_bookings 
        ADD CONSTRAINT fk_guest_bookings_guest_rider_id 
        FOREIGN KEY (guest_rider_id) REFERENCES guest_riders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_driver_applications_user_id' 
        AND table_name = 'driver_applications'
    ) THEN
        ALTER TABLE driver_applications 
        ADD CONSTRAINT fk_driver_applications_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_support_worker_applications_user_id' 
        AND table_name = 'support_worker_applications'
    ) THEN
        ALTER TABLE support_worker_applications 
        ADD CONSTRAINT fk_support_worker_applications_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_vehicles_driver_application_id' 
        AND table_name = 'vehicles'
    ) THEN
        ALTER TABLE vehicles 
        ADD CONSTRAINT fk_vehicles_driver_application_id 
        FOREIGN KEY (driver_application_id) REFERENCES driver_applications(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_support_workers_support_worker_application_id' 
        AND table_name = 'support_workers'
    ) THEN
        ALTER TABLE support_workers 
        ADD CONSTRAINT fk_support_workers_support_worker_application_id 
        FOREIGN KEY (support_worker_application_id) REFERENCES support_worker_applications(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_guest_rider_id ON guest_bookings(guest_rider_id);
CREATE INDEX IF NOT EXISTS idx_guest_bookings_created_at ON guest_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_applications_user_id ON driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_support_worker_applications_user_id ON support_worker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_worker_applications_status ON support_worker_applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 4. Create or replace functions for data flow
CREATE OR REPLACE FUNCTION create_notification_for_admin(
    notification_type notification_type,
    message TEXT,
    related_entity_type TEXT DEFAULT NULL,
    related_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@ablego.co.uk' 
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    -- Create notification
    INSERT INTO notifications (
        user_id,
        type,
        message,
        data,
        read,
        created_at
    ) VALUES (
        admin_user_id,
        notification_type,
        message,
        jsonb_build_object(
            'related_entity_type', related_entity_type,
            'related_entity_id', related_entity_id
        ),
        FALSE,
        NOW()
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

-- 5. Create triggers for automatic admin notifications
CREATE OR REPLACE FUNCTION notify_admin_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create admin notification for new booking
    PERFORM create_notification_for_admin(
        'system'::notification_type,
        'A new booking has been created with ID: ' || NEW.id,
        'booking',
        NEW.id
    );
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_admin_on_new_driver_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create admin notification for new driver application
    PERFORM create_notification_for_admin(
        'system'::notification_type,
        'A new driver application has been submitted by: ' || NEW.full_name,
        'driver_application',
        NEW.id
    );
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_admin_on_new_support_worker_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create admin notification for new support worker application
    PERFORM create_notification_for_admin(
        'system'::notification_type,
        'A new support worker application has been submitted by: ' || NEW.id,
        'support_worker_application',
        NEW.id
    );
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_admin_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create admin notification for new user registration
    PERFORM create_notification_for_admin(
        'system'::notification_type,
        'A new user has registered: ' || NEW.email,
        'user',
        NEW.id
    );
    
    RETURN NEW;
END;
$$;

-- 6. Create or replace triggers
DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_booking ON bookings;
CREATE TRIGGER trigger_notify_admin_on_new_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_booking();

DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_guest_booking ON guest_bookings;
CREATE TRIGGER trigger_notify_admin_on_new_guest_booking
    AFTER INSERT ON guest_bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_booking();

DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_driver_application ON driver_applications;
CREATE TRIGGER trigger_notify_admin_on_new_driver_application
    AFTER INSERT ON driver_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_driver_application();

DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_support_worker_application ON support_worker_applications;
CREATE TRIGGER trigger_notify_admin_on_new_support_worker_application
    AFTER INSERT ON support_worker_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_support_worker_application();

DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_user ON auth.users;
CREATE TRIGGER trigger_notify_admin_on_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_new_user();

-- 7. Create RPC functions for admin dashboard data
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings', (SELECT COUNT(*) FROM bookings),
        'pending_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'pending'),
        'completed_bookings', (SELECT COUNT(*) FROM bookings WHERE status = 'completed'),
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_drivers', (SELECT COUNT(*) FROM users WHERE role = 'driver'),
        'total_support_workers', (SELECT COUNT(*) FROM users WHERE role = 'support_worker'),
        'pending_driver_applications', (SELECT COUNT(*) FROM driver_applications WHERE status = 'pending'),
        'pending_support_worker_applications', (SELECT COUNT(*) FROM support_worker_applications WHERE status = 'pending'),
        'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE read = FALSE),
        'recent_bookings', (
            SELECT json_agg(
                json_build_object(
                    'id', b.id,
                    'pickup_address', b.pickup_address,
                    'dropoff_address', b.dropoff_address,
                    'status', b.status,
                    'created_at', b.created_at,
                    'fare_estimate', b.fare_estimate
                )
            )
            FROM (
                SELECT * FROM bookings 
                ORDER BY created_at DESC 
                LIMIT 5
            ) b
        ),
        'recent_applications', (
            SELECT json_agg(
                json_build_object(
                    'id', da.id,
                    'type', 'driver',
                    'full_name', da.full_name,
                    'status', da.status,
                    'created_at', da.created_at
                )
            )
            FROM (
                SELECT * FROM driver_applications 
                ORDER BY created_at DESC 
                LIMIT 3
            ) da
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 8. Create function to get notifications for admin
CREATE OR REPLACE FUNCTION get_admin_notifications(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type notification_type,
    message TEXT,
    data JSONB,
    read BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.message,
        n.data,
        n.read,
        n.created_at
    FROM notifications n
    INNER JOIN auth.users u ON n.user_id = u.id
    WHERE u.email = 'admin@ablego.co.uk'
    ORDER BY n.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- 9. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
    notification_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = NOW()
    WHERE id = ANY(notification_ids)
    AND user_id IN (
        SELECT id FROM auth.users WHERE email = 'admin@ablego.co.uk'
    );
    
    RETURN FOUND;
END;
$$;

-- 10. Update RLS policies to ensure proper access
-- Admin can read all data
DROP POLICY IF EXISTS "Admin can read all data" ON bookings;
CREATE POLICY "Admin can read all data" ON bookings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

DROP POLICY IF EXISTS "Admin can read all driver applications" ON driver_applications;
CREATE POLICY "Admin can read all driver applications" ON driver_applications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

DROP POLICY IF EXISTS "Admin can read all support worker applications" ON support_worker_applications;
CREATE POLICY "Admin can read all support worker applications" ON support_worker_applications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

DROP POLICY IF EXISTS "Admin can read all notifications" ON notifications;
CREATE POLICY "Admin can read all notifications" ON notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

DROP POLICY IF EXISTS "Admin can update notifications" ON notifications;
CREATE POLICY "Admin can update notifications" ON notifications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND email = 'admin@ablego.co.uk'
        )
    );

-- 11. Create view for admin dashboard recent activity
CREATE OR REPLACE VIEW admin_recent_activity AS
SELECT 
    'booking' as activity_type,
    id,
    pickup_address as title,
    status::text,
    created_at,
    'New booking created' as description
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'driver_application' as activity_type,
    id,
    full_name as title,
    status::text,
    created_at,
    'New driver application submitted' as description
FROM driver_applications
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'support_worker_application' as activity_type,
    id,
    full_name as title,
    status::text,
    created_at,
    'New support worker application submitted' as description
FROM support_worker_applications
WHERE created_at >= NOW() - INTERVAL '7 days'

ORDER BY created_at DESC;

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;
GRANT SELECT ON admin_recent_activity TO authenticated;

-- 13. Create function to sync guest booking with user account
CREATE OR REPLACE FUNCTION sync_guest_booking_with_user(
    guest_booking_id UUID,
    user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update guest booking to link with user
    UPDATE guest_bookings 
    SET user_id = sync_guest_booking_with_user.user_id
    WHERE id = guest_booking_id;
    
    -- Create corresponding booking record
    INSERT INTO bookings (
        user_id,
        pickup_address,
        dropoff_address,
        pickup_time,
        support_workers_count,
        special_requirements,
        fare_estimate,
        status,
        created_at
    )
    SELECT 
        sync_guest_booking_with_user.user_id,
        gb.pickup_address,
        gb.dropoff_address,
        gb.pickup_time,
        gb.support_workers_count,
        gb.special_requirements,
        gb.fare_estimate,
        'pending',
        NOW()
    FROM guest_bookings gb
    WHERE gb.id = guest_booking_id;
    
    RETURN FOUND;
END;
$$;

-- 14. Create function to update user role
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update users table role
    UPDATE users 
    SET role = new_role
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION sync_guest_booking_with_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(UUID, user_role) TO authenticated;

-- 15. Create indexes for better performance on admin queries
-- Note: Cannot create indexes on views, but the underlying tables already have appropriate indexes

-- 16. Add comments for documentation
COMMENT ON FUNCTION get_admin_dashboard_stats() IS 'Returns comprehensive statistics for admin dashboard';
COMMENT ON FUNCTION get_admin_notifications(INTEGER, INTEGER) IS 'Returns paginated notifications for admin user';
COMMENT ON FUNCTION mark_notifications_as_read(UUID[]) IS 'Marks specified notifications as read for admin';
COMMENT ON FUNCTION sync_guest_booking_with_user(UUID, UUID) IS 'Links guest booking to authenticated user account';
COMMENT ON FUNCTION update_user_role(UUID, user_role) IS 'Updates user role in users table';
COMMENT ON VIEW admin_recent_activity IS 'View showing recent activity for admin dashboard';

-- Migration completed successfully
SELECT 'Complete Data Flow Fix Migration applied successfully' as status;
