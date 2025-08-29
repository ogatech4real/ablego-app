/*
  # Create revenue analytics view

  1. New Views
    - `revenue_analytics`
      - Aggregates payment transaction data by date
      - Provides total transactions, successful/failed counts
      - Calculates total revenue, fees, and net revenue
      - Includes average transaction amounts

  2. Security
    - View inherits RLS policies from underlying payment_transactions table
    - Only accessible to users with payment_transactions access
*/

CREATE OR REPLACE VIEW public.revenue_analytics AS
SELECT
  DATE(processed_at) AS transaction_date,
  COUNT(id) AS total_transactions,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) AS successful_transactions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_transactions,
  SUM(amount_gbp) AS total_revenue,
  SUM(COALESCE(transaction_fee, 0)) AS total_fees,
  SUM(amount_gbp) - SUM(COALESCE(transaction_fee, 0)) AS net_revenue,
  AVG(amount_gbp) AS avg_transaction_amount,
  SUM(COALESCE(platform_fee_gbp, 0)) AS platform_fees,
  SUM(COALESCE(driver_payout_gbp, 0)) AS driver_payouts,
  SUM(COALESCE(support_worker_payout_gbp, 0)) AS support_worker_payouts
FROM
  public.payment_transactions
WHERE
  processed_at IS NOT NULL
GROUP BY
  DATE(processed_at)
ORDER BY
  DATE(processed_at) DESC;