/*
  # Add Payment Method to Guest Bookings

  This migration adds a payment_method field to the guest_bookings table
  to support both cash/bank and Stripe payment methods.

  Payment methods:
  - 'cash_bank': Cash on pickup or bank transfer
  - 'stripe': Card payment via Stripe
*/

-- Add payment_method column to guest_bookings table
DO $$
BEGIN
  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guest_bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE guest_bookings ADD COLUMN payment_method text DEFAULT 'cash_bank';
  END IF;
END $$;

-- Add check constraint to ensure valid payment methods
DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'guest_bookings_payment_method_check'
  ) THEN
    ALTER TABLE guest_bookings ADD CONSTRAINT guest_bookings_payment_method_check 
    CHECK (payment_method IN ('cash_bank', 'stripe'));
  END IF;
END $$;

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_guest_bookings_payment_method ON guest_bookings(payment_method);

-- Update existing bookings to have default payment method
UPDATE guest_bookings SET payment_method = 'cash_bank' WHERE payment_method IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN guest_bookings.payment_method IS 'Payment method for the booking: cash_bank (cash on pickup/bank transfer) or stripe (card payment)';


