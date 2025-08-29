import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe Configuration
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Validate Stripe configuration
const validateStripeKey = (key: string | undefined): boolean => {
  if (!key) return false;
  
  // Validate key format
  const testKeyPattern = /^pk_test_[a-zA-Z0-9]{99,}$/;
  const liveKeyPattern = /^pk_live_[a-zA-Z0-9]{99,}$/;
  
  // Allow both test and live keys in development for flexibility
  if (isDevelopment && !testKeyPattern.test(key) && !liveKeyPattern.test(key)) {
    console.error('❌ Invalid Stripe key format');
    console.error('Expected format: pk_test_... or pk_live_...');
    console.error('Current key length:', key.length);
    return false;
  }
  
  if (isProduction && !liveKeyPattern.test(key)) {
    console.error('❌ Production requires live Stripe key (pk_live_...)');
    return false;
  }
  
  return true;
};

// Initialize Stripe with validation
let stripePromise: Promise<Stripe | null> | null = null;

// Initialize Stripe
if (stripePublishableKey && validateStripeKey(stripePublishableKey)) {
  stripePromise = loadStripe(stripePublishableKey, {
    locale: 'en-GB',
    stripeAccount: undefined // Ensure we're not accidentally using Connect mode
  });
  
  // Verify Stripe loads correctly
  stripePromise.then(stripe => {
    if (stripe) {
      console.log('✅ Stripe initialized successfully');
    } else {
      console.error('❌ Stripe failed to initialize');
    }
  }).catch(error => {
    console.error('❌ Stripe initialization error:', error);
  });
} else {
  console.error('❌ Invalid or missing Stripe publishable key');
  console.error('🔧 Key validation failed:', {
    hasKey: !!stripePublishableKey,
    keyLength: stripePublishableKey?.length || 0,
    keyPrefix: stripePublishableKey?.substring(0, 7) || 'none'
  });
  stripePromise = Promise.resolve(null);
}

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePublishableKey) {
    console.error('❌ Stripe publishable key not configured');
    console.error('🔧 Environment check:', {
      isDev: isDevelopment,
      isProd: isProduction,
      hasKey: !!stripePublishableKey,
      keyPrefix: stripePublishableKey?.substring(0, 7) || 'none'
    });
    return null;
  }
  
  try {
    const stripe = await stripePromise;
    if (stripe) {
      console.log('✅ Stripe loaded successfully');
    }
    return stripe;
  } catch (error) {
    console.error('❌ Failed to load Stripe:', error.message || error);
    return null;
  }
};

// Payment calculation utilities
export interface PaymentBreakdown {
  totalAmount: number;
  platformFee: number;
  driverShare: number;
  supportWorkerShare: number;
  stripeFee: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    vehicleFeatures: number;
    supportWorkerCost: number;
    peakTimeSurcharge: number;
  };
}

export const calculatePaymentSplit = (
  baseFare: number,
  distanceFare: number,
  vehicleFeatures: number,
  supportWorkerCost: number,
  peakTimeSurcharge: number = 0
): PaymentBreakdown => {
  const totalAmount = baseFare + distanceFare + vehicleFeatures + supportWorkerCost + peakTimeSurcharge;
  
  // Calculate shares
  const driverBaseFare = baseFare + distanceFare + vehicleFeatures + peakTimeSurcharge;
  const driverShare = Math.round(driverBaseFare * 0.70 * 100) / 100; // 70% of driver-related costs
  const supportWorkerShare = Math.round(supportWorkerCost * 0.70 * 100) / 100; // 70% of support worker costs
  const stripeFee = Math.round((totalAmount * 0.029 + 0.30) * 100) / 100; // 2.9% + 30p
  const platformFee = Math.round((totalAmount - driverShare - supportWorkerShare - stripeFee) * 100) / 100;

  return {
    totalAmount,
    platformFee,
    driverShare,
    supportWorkerShare,
    stripeFee,
    breakdown: {
      baseFare,
      distanceFare,
      vehicleFeatures,
      supportWorkerCost,
      peakTimeSurcharge
    }
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Stripe Connect utilities
export const createConnectAccountLink = async (accountId: string, refreshUrl: string, returnUrl: string) => {
  try {
    const response = await fetch('/api/stripe/create-account-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create account link');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
};

export const createPaymentIntent = async (
  bookingId: string,
  amount: number,
  driverAccountId?: string,
  supportWorkerAccountIds?: string[],
  paymentBreakdown?: PaymentBreakdown
) => {
  try {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: bookingId,
        amount: Math.round(amount * 100), // Convert to pence
        driver_account_id: driverAccountId,
        support_worker_account_ids: supportWorkerAccountIds,
        payment_breakdown: paymentBreakdown
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};