import React, { useState, useEffect } from 'react';
import { CheckCircle, ExternalLink, Loader, AlertTriangle, CreditCard, Building } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface StripeConnectOnboardingProps {
  userType: 'driver' | 'support_worker';
  onComplete?: () => void;
  className?: string;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({
  userType,
  onComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'pending' | 'complete' | 'restricted'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkStripeAccount();
    }
  }, [user]);

  const checkStripeAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if user already has a Stripe account
      const tableName = userType === 'driver' ? 'vehicles' : 'support_workers';
      const { data, error } = await supabase
        .from(tableName)
        .select('stripe_account_id, stripe_account_status')
        .eq(userType === 'driver' ? 'driver_id' : 'user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.stripe_account_id) {
        setStripeAccountId(data.stripe_account_id);
        setAccountStatus(data.stripe_account_status || 'pending');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const createStripeAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          user_type: userType,
          email: user.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe account');
      }

      const result = await response.json();
      setStripeAccountId(result.account_id);
      setOnboardingUrl(result.onboarding_url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    if (!stripeAccountId) {
      await createStripeAccount();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/stripe/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          account_id: stripeAccountId,
          refresh_url: window.location.href,
          return_url: `${window.location.origin}/dashboard/${userType}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create onboarding link');
      }

      const result = await response.json();
      window.location.href = result.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking payment setup...</p>
        </div>
      </div>
    );
  }

  if (accountStatus === 'complete') {
    return (
      <div className={`bg-green-50 border-2 border-green-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center">
          <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
          <div>
            <h3 className="text-lg font-bold text-green-900">Payment Setup Complete</h3>
            <p className="text-green-700">You're ready to receive payments from bookings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl">
        <div className="flex items-center">
          <CreditCard className="w-8 h-8 mr-3" />
          <div>
            <h3 className="text-xl font-bold">Payment Setup Required</h3>
            <p className="text-blue-100">Set up your Stripe account to receive payments</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Secure Payment Processing</h4>
              <p className="text-sm text-gray-600">Powered by Stripe Connect for secure, instant payments</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Automatic Payouts</h4>
              <p className="text-sm text-gray-600">
                Receive {userType === 'driver' ? '70% of ride fare' : '70% of support fees'} instantly after each booking
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Bank Integration</h4>
              <p className="text-sm text-gray-600">Connect your bank account for direct deposits</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Bank account details for payouts</li>
            <li>• Government-issued ID for verification</li>
            <li>• Business details (if applicable)</li>
            <li>• Tax information</li>
          </ul>
        </div>

        <button
          onClick={startOnboarding}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Setting up...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5 mr-2" />
              Set Up Payment Account
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure setup powered by Stripe. Your banking details are never stored by AbleGo.
        </p>
      </div>
    </div>
  );
};

export default StripeConnectOnboarding;