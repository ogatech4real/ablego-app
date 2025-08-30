/*
  # Create SMTP Configuration Table - Workaround for Environment Variables
  
  Since Supabase doesn't expose environment variables in the UI,
  we'll store SMTP configuration in a database table as a workaround.
  
  This allows us to configure SMTP settings without relying on
  environment variables that aren't accessible through the UI.
*/

-- Create SMTP configuration table
CREATE TABLE IF NOT EXISTS public.smtp_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  smtp_host TEXT NOT NULL DEFAULT 'smtp.ionos.co.uk',
  smtp_port TEXT NOT NULL DEFAULT '587',
  smtp_user TEXT NOT NULL DEFAULT 'admin@ablego.co.uk',
  smtp_pass TEXT NOT NULL DEFAULT 'CareGold17',
  smtp_from_name TEXT NOT NULL DEFAULT 'AbleGo Ltd',
  smtp_from_email TEXT NOT NULL DEFAULT 'admin@ablego.co.uk',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SMTP configuration
INSERT INTO public.smtp_config (
  id,
  smtp_host,
  smtp_port,
  smtp_user,
  smtp_pass,
  smtp_from_name,
  smtp_from_email,
  is_active
) VALUES (
  1,
  'smtp.ionos.co.uk',
  '587',
  'admin@ablego.co.uk',
  'CareGold17',
  'AbleGo Ltd',
  'admin@ablego.co.uk',
  true
) ON CONFLICT (id) DO UPDATE SET
  smtp_host = EXCLUDED.smtp_host,
  smtp_port = EXCLUDED.smtp_port,
  smtp_user = EXCLUDED.smtp_user,
  smtp_pass = EXCLUDED.smtp_pass,
  smtp_from_name = EXCLUDED.smtp_from_name,
  smtp_from_email = EXCLUDED.smtp_from_email,
  updated_at = NOW();

-- Create function to get SMTP configuration
CREATE OR REPLACE FUNCTION get_smtp_config()
RETURNS json AS $$
DECLARE
  config_record RECORD;
BEGIN
  SELECT * INTO config_record
  FROM public.smtp_config
  WHERE id = 1 AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SMTP configuration not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'config', row_to_json(config_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update SMTP configuration
CREATE OR REPLACE FUNCTION update_smtp_config(
  p_smtp_host TEXT DEFAULT NULL,
  p_smtp_port TEXT DEFAULT NULL,
  p_smtp_user TEXT DEFAULT NULL,
  p_smtp_pass TEXT DEFAULT NULL,
  p_smtp_from_name TEXT DEFAULT NULL,
  p_smtp_from_email TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  config_record RECORD;
BEGIN
  UPDATE public.smtp_config
  SET 
    smtp_host = COALESCE(p_smtp_host, smtp_host),
    smtp_port = COALESCE(p_smtp_port, smtp_port),
    smtp_user = COALESCE(p_smtp_user, smtp_user),
    smtp_pass = COALESCE(p_smtp_pass, smtp_pass),
    smtp_from_name = COALESCE(p_smtp_from_name, smtp_from_name),
    smtp_from_email = COALESCE(p_smtp_from_email, smtp_from_email),
    updated_at = NOW()
  WHERE id = 1
  RETURNING * INTO config_record;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to update SMTP configuration'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'SMTP configuration updated successfully',
    'config', row_to_json(config_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.smtp_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only access)
CREATE POLICY "Admin can view SMTP config" ON public.smtp_config
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

CREATE POLICY "Admin can update SMTP config" ON public.smtp_config
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

CREATE POLICY "Admin can insert SMTP config" ON public.smtp_config
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'admin@ablego.co.uk'
  );

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_smtp_config() TO authenticated;
GRANT EXECUTE ON FUNCTION update_smtp_config(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Log the migration completion
DO $$
BEGIN
  RAISE LOG 'SMTP configuration table migration completed successfully';
  RAISE LOG 'Created smtp_config table with default IONOS settings';
  RAISE LOG 'Added get_smtp_config and update_smtp_config functions';
  RAISE LOG 'Configured RLS policies for admin-only access';
END $$;
