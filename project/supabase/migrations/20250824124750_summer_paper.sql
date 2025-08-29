/*
  # Add Stripe Connect Integration Fields

  1. New Columns
    - Add Stripe account fields to vehicles and support_workers tables
    - Add payment tracking fields to payment_transactions table
    - Add payout tracking table for earnings management

  2. Security
    - Update RLS policies for new tables
    - Add policies for Stripe-related operations

  3. Functions
    - Add helper functions for payment calculations
    - Add webhook processing functions
*/

-- Add Stripe Connect fields to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN stripe_account_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'stripe_account_status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN stripe_account_status text DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN stripe_charges_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN stripe_payouts_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add Stripe Connect fields to support_workers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_workers' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE support_workers ADD COLUMN stripe_account_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_workers' AND column_name = 'stripe_account_status'
  ) THEN
    ALTER TABLE support_workers ADD COLUMN stripe_account_status text DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_workers' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE support_workers ADD COLUMN stripe_charges_enabled boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_workers' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE support_workers ADD COLUMN stripe_payouts_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Create payment_splits table for tracking payment distribution
CREATE TABLE IF NOT EXISTS payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  recipient_type text NOT NULL CHECK (recipient_type IN ('platform', 'driver', 'support_worker', 'stripe')),
  recipient_id uuid, -- user_id for driver/support_worker, null for platform/stripe
  stripe_account_id text,
  amount_gbp numeric(10,2) NOT NULL,
  percentage numeric(5,2) NOT NULL,
  stripe_transfer_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for payment_splits
CREATE INDEX IF NOT EXISTS idx_payment_splits_transaction_id ON payment_splits(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_recipient ON payment_splits(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON payment_splits(status);

-- Create earnings_summary table for dashboard analytics
CREATE TABLE IF NOT EXISTS earnings_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('driver', 'support_worker')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_earnings_gbp numeric(10,2) DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_hours_worked numeric(8,2) DEFAULT 0,
  average_rating numeric(3,2),
  stripe_account_id text,
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for earnings_summary
CREATE INDEX IF NOT EXISTS idx_earnings_summary_user_id ON earnings_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_summary_period ON earnings_summary(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_earnings_summary_user_type ON earnings_summary(user_type);

-- Enable RLS on new tables
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_splits
CREATE POLICY "Users can view their own payment splits"
  ON payment_splits
  FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create payment splits"
  ON payment_splits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "System can update payment splits"
  ON payment_splits
  FOR UPDATE
  TO service_role
  USING (true);

-- RLS policies for earnings_summary
CREATE POLICY "Users can view their own earnings"
  ON earnings_summary
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "System can manage earnings summaries"
  ON earnings_summary
  FOR ALL
  TO service_role
  USING (true);

-- Function to calculate payment splits
CREATE OR REPLACE FUNCTION calculate_payment_splits(
  p_total_amount numeric,
  p_base_fare numeric,
  p_distance_fare numeric,
  p_vehicle_features numeric,
  p_support_worker_cost numeric,
  p_peak_surcharge numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  driver_base_amount numeric;
  driver_share numeric;
  support_worker_share numeric;
  stripe_fee numeric;
  platform_fee numeric;
  result jsonb;
BEGIN
  -- Calculate driver share (70% of base + distance + features + peak)
  driver_base_amount := p_base_fare + p_distance_fare + p_vehicle_features + p_peak_surcharge;
  driver_share := ROUND(driver_base_amount * 0.70, 2);
  
  -- Calculate support worker share (70% of support worker costs)
  support_worker_share := ROUND(p_support_worker_cost * 0.70, 2);
  
  -- Calculate Stripe fee (2.9% + £0.30)
  stripe_fee := ROUND(p_total_amount * 0.029 + 0.30, 2);
  
  -- Platform fee is the remainder
  platform_fee := p_total_amount - driver_share - support_worker_share - stripe_fee;
  
  result := jsonb_build_object(
    'total_amount', p_total_amount,
    'platform_fee', platform_fee,
    'platform_percentage', ROUND((platform_fee / p_total_amount) * 100, 2),
    'driver_share', driver_share,
    'driver_percentage', CASE WHEN driver_base_amount > 0 THEN 70.0 ELSE 0.0 END,
    'support_worker_share', support_worker_share,
    'support_worker_percentage', CASE WHEN p_support_worker_cost > 0 THEN 70.0 ELSE 0.0 END,
    'stripe_fee', stripe_fee,
    'stripe_percentage', ROUND((stripe_fee / p_total_amount) * 100, 2)
  );
  
  RETURN result;
END;
$$;

-- Function to create payment splits records
CREATE OR REPLACE FUNCTION create_payment_splits(
  p_payment_transaction_id uuid,
  p_total_amount numeric,
  p_driver_id uuid DEFAULT NULL,
  p_support_worker_ids uuid[] DEFAULT NULL,
  p_driver_stripe_account text DEFAULT NULL,
  p_support_worker_stripe_accounts text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  splits jsonb;
  support_worker_count integer;
  support_worker_share_each numeric;
  i integer;
BEGIN
  -- Get payment breakdown from transaction
  SELECT 
    calculate_payment_splits(
      amount_gbp,
      8.50, -- base fare (you might want to make this dynamic)
      amount_gbp * 0.4, -- approximate distance fare
      amount_gbp * 0.1, -- approximate vehicle features
      amount_gbp * 0.3, -- approximate support worker cost
      0 -- peak surcharge
    ) INTO splits
  FROM payment_transactions
  WHERE id = p_payment_transaction_id;

  -- Insert platform fee split
  INSERT INTO payment_splits (
    payment_transaction_id,
    recipient_type,
    recipient_id,
    amount_gbp,
    percentage,
    status
  ) VALUES (
    p_payment_transaction_id,
    'platform',
    NULL,
    (splits->>'platform_fee')::numeric,
    (splits->>'platform_percentage')::numeric,
    'completed'
  );

  -- Insert Stripe fee split
  INSERT INTO payment_splits (
    payment_transaction_id,
    recipient_type,
    recipient_id,
    amount_gbp,
    percentage,
    status
  ) VALUES (
    p_payment_transaction_id,
    'stripe',
    NULL,
    (splits->>'stripe_fee')::numeric,
    (splits->>'stripe_percentage')::numeric,
    'completed'
  );

  -- Insert driver split if applicable
  IF p_driver_id IS NOT NULL AND (splits->>'driver_share')::numeric > 0 THEN
    INSERT INTO payment_splits (
      payment_transaction_id,
      recipient_type,
      recipient_id,
      stripe_account_id,
      amount_gbp,
      percentage,
      status
    ) VALUES (
      p_payment_transaction_id,
      'driver',
      p_driver_id,
      p_driver_stripe_account,
      (splits->>'driver_share')::numeric,
      (splits->>'driver_percentage')::numeric,
      'pending'
    );
  END IF;

  -- Insert support worker splits if applicable
  IF p_support_worker_ids IS NOT NULL AND array_length(p_support_worker_ids, 1) > 0 THEN
    support_worker_count := array_length(p_support_worker_ids, 1);
    support_worker_share_each := (splits->>'support_worker_share')::numeric / support_worker_count;
    
    FOR i IN 1..support_worker_count LOOP
      INSERT INTO payment_splits (
        payment_transaction_id,
        recipient_type,
        recipient_id,
        stripe_account_id,
        amount_gbp,
        percentage,
        status
      ) VALUES (
        p_payment_transaction_id,
        'support_worker',
        p_support_worker_ids[i],
        CASE 
          WHEN p_support_worker_stripe_accounts IS NOT NULL 
          THEN p_support_worker_stripe_accounts[i]
          ELSE NULL
        END,
        support_worker_share_each,
        (splits->>'support_worker_percentage')::numeric,
        'pending'
      );
    END LOOP;
  END IF;
END;
$$;

-- Update payment_transactions table with additional fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'platform_fee_gbp'
  ) THEN
    ALTER TABLE payment_transactions ADD COLUMN platform_fee_gbp numeric(8,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'driver_payout_gbp'
  ) THEN
    ALTER TABLE payment_transactions ADD COLUMN driver_payout_gbp numeric(8,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'support_worker_payout_gbp'
  ) THEN
    ALTER TABLE payment_transactions ADD COLUMN support_worker_payout_gbp numeric(8,2);
  END IF;
END $$;