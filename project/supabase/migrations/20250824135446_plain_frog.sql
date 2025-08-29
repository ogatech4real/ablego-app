/*
  # Add Foreign Key Constraints for Profiles Relationships

  1. Foreign Key Constraints
    - Add foreign key constraint from `vehicles.driver_id` to `profiles.id`
    - Add foreign key constraint from `support_workers.user_id` to `profiles.id`
  
  2. Security
    - These constraints ensure data integrity
    - Enable proper Supabase relationship queries
    - Support CASCADE deletion for data consistency

  This migration resolves the Supabase query errors by establishing the missing
  foreign key relationships that allow proper joins between tables.
*/

-- Add foreign key constraint for vehicles table to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_vehicles_driver_profile' 
    AND table_name = 'vehicles'
  ) THEN
    ALTER TABLE public.vehicles
    ADD CONSTRAINT fk_vehicles_driver_profile
    FOREIGN KEY (driver_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for support_workers table to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_support_workers_user_profile' 
    AND table_name = 'support_workers'
  ) THEN
    ALTER TABLE public.support_workers
    ADD CONSTRAINT fk_support_workers_user_profile
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;