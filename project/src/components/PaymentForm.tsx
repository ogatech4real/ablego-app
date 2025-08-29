import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Loader,
  Shield,
  Info,
  User,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement, Elements } from '@stripe/react-stripe-js';
import { getStripe, calculatePaymentSplit, formatCurrency, type PaymentBreakdown } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { guestBookingService } from '../services/guestBookingService';

interface PaymentFormProps {
  bookingId?: string;
  amount: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    vehicleFeatures: number;
    supportWorkerCost: number;
    peakTimeSurcharge?: number;
    bookingTypeDiscount?: number;
  };
  bookingData?: {
    pickup_address: string;
    dropoff_address: string;
    pickup_time: string;
    dropoff_time?: string | null;
    vehicle_features: string[];
    support_workers_count: number;
    fare_estimate: number;
    booking_type: 'on_demand' | 'scheduled' | 'advance';
    lead_time_hours: number;
    time_multiplier: number;
    booking_type_discount: number;
    special_requirements?: string | null;
    payment_method?: 'cash_bank' | 'stripe';
  };
  guestInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  driverAccountId?: string;
  supportWorkerAccountIds?: string[];
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  className?: string;
}

const PaymentFormInner: React.FC<PaymentFormProps> = ({
  bookingId,
  amount,
  breakdown,
  bookingData,
  guestInfo,
  driverAccountId,
  supportWorkerAccountIds = [],
  onSuccess,
  onError,
  className = ''
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [actualBookingId, setActualBookingId] = useState<string | null>(bookingId || null);
  
  // Card element states
  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
  const [cardCvcError, setCardCvcError] = useState<string | null>(null);
  
  // Billing information
  const [billingInfo, setBillingInfo] = useState({
    name: guestInfo?.name || '',
    email: guestInfo?.email || '',
    postalCode: '',
    address: '',
    city: '',
    country: 'GB'
  });

  const [showBillingDetails, setShowBillingDetails] = useState(false);

  useEffect(() => {
    // Pre-fill billing info from guest data
    if (guestInfo) {
      setBillingInfo(prev => ({
        ...prev,
        name: guestInfo.name,
        email: guestInfo.email
      }));
    }
  }, [guestInfo]);

  useEffect(() => {
    // Calculate payment breakdown
    const calculatedBreakdown = calculatePaymentSplit(
      breakdown.baseFare,
      breakdown.distanceFare,
      breakdown.vehicleFeatures,
      breakdown.supportWorkerCost,
      breakdown.peakTimeSurcharge || 0
    );
    setPaymentBreakdown(calculatedBreakdown);

    // Create payment intent after breakdown is calculated
    if (calculatedBreakdown) {
      if (bookingId) {
        createPaymentIntent(bookingId);
      } else if (bookingData && guestInfo) {
        createBookingAndPaymentIntent();
      }
    }
  }, [bookingId, amount, bookingData, guestInfo]);

  const createBookingAndPaymentIntent = async () => {
    if (!bookingData || !guestInfo) {
      onError('Missing booking or guest information');
      return;
    }

    try {
      console.log('Creating guest booking before payment...');
      
      // Create the guest booking first with Stripe payment method
      const bookingDataWithPayment = {
        ...bookingData,
        payment_method: 'stripe' as const
      };
      
      const { data: bookingResult, error: bookingError } = await guestBookingService.createGuestBooking(
        bookingDataWithPayment,
        guestInfo.name,
        guestInfo.email,
        guestInfo.phone
      );

      if (bookingError || !bookingResult) {
        onError(bookingError?.message || 'Failed to create booking');
        return;
      }

      console.log('Guest booking created:', bookingResult.booking_id);
      setActualBookingId(bookingResult.booking_id);
      
      // Now create payment intent with the actual booking ID
      await createPaymentIntent(bookingResult.booking_id);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      onError(error instanceof Error ? error.message : 'Failed to create booking');
    }
  };

  const createPaymentIntent = async (targetBookingId: string) => {
    try {
      console.log('Creating payment intent for booking:', targetBookingId);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          booking_id: targetBookingId,
          amount: Math.round(amount * 100), // Convert to pence
          driver_account_id: driverAccountId,
          support_worker_account_ids: supportWorkerAccountIds,
          payment_breakdown: paymentBreakdown
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Payment setup failed (${response.status})`);
      }

      const { client_secret } = await response.json();
      console.log('Payment intent created successfully');
      setClientSecret(client_secret);
    } catch (error) {
      console.error('Payment intent creation error:', error);
      onError(error instanceof Error ? error.message : 'Payment setup failed');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      onError('Card element not found');
      return;
    }

    setProcessing(true);

    try {
      console.log('Confirming card payment...');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: billingInfo.name,
            email: billingInfo.email,
            address: {
              postal_code: billingInfo.postalCode,
              line1: billingInfo.address || undefined,
              city: billingInfo.city || undefined,
              country: billingInfo.country,
            },
          },
        }
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update booking status
        if (actualBookingId) {
          await supabase
            .from('guest_bookings')
            .update({ 
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', actualBookingId);
        }

        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      onError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const isFormComplete = () => {
    return cardNumberComplete && 
           cardExpiryComplete && 
           cardCvcComplete && 
           billingInfo.name.trim() && 
           billingInfo.postalCode.trim() &&
           !cardNumberError && 
           !cardExpiryError && 
           !cardCvcError;
  };

  // Stripe element styling - fixed for proper input functionality
  const elementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontWeight: '400',
        lineHeight: '20px',
        fontSmoothing: 'antialiased',
        letterSpacing: '0.025em',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#6b7280',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
      empty: {
        color: '#9ca3af',
        iconColor: '#d1d5db',
      },
    },
    showIcon: true,
    iconStyle: 'default',
    hideIcon: false,
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center">
          <CreditCard className="w-8 h-8 mr-3" />
          <div>
            <h3 className="text-2xl font-bold">Secure Payment</h3>
            <p className="text-blue-100 text-lg">Complete your booking with instant driver dispatch</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 text-lg mb-2">🔒 Your Payment is Secure</h4>
              <div className="text-green-700 text-sm space-y-1">
                <p>• 256-bit SSL encryption protects your card details</p>
                <p>• Powered by Stripe - trusted by millions worldwide</p>
                <p>• Your card information is never stored by AbleGo</p>
                <p>• PCI DSS compliant payment processing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        {paymentBreakdown && (
          <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
              <Info className="w-5 h-5 mr-2" />
              Payment Breakdown
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Base Fare + Distance</span>
                <span className="font-semibold text-gray-900">{formatCurrency(paymentBreakdown.breakdown.baseFare + paymentBreakdown.breakdown.distanceFare)}</span>
              </div>
              {paymentBreakdown.breakdown.vehicleFeatures > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Vehicle Features</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(paymentBreakdown.breakdown.vehicleFeatures)}</span>
                </div>
              )}
              {paymentBreakdown.breakdown.supportWorkerCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Support Workers</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(paymentBreakdown.breakdown.supportWorkerCost)}</span>
                </div>
              )}
              {paymentBreakdown.breakdown.peakTimeSurcharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Peak Time Surcharge</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(paymentBreakdown.breakdown.peakTimeSurcharge)}</span>
                </div>
              )}
              {breakdown.bookingTypeDiscount && breakdown.bookingTypeDiscount !== 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">
                    {breakdown.bookingTypeDiscount > 0 ? 'On-Demand Surcharge (+50%)' : 'Advance Booking Discount'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {breakdown.bookingTypeDiscount > 0 ? '+' : ''}{formatCurrency(Math.abs(breakdown.bookingTypeDiscount))}
                  </span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-900 text-xl font-bold">Total Amount</span>
                  <span className="text-blue-600 text-2xl font-bold">{formatCurrency(
                    paymentBreakdown.breakdown.baseFare + 
                    paymentBreakdown.breakdown.distanceFare + 
                    paymentBreakdown.breakdown.vehicleFeatures + 
                    paymentBreakdown.breakdown.supportWorkerCost + 
                    (paymentBreakdown.breakdown.peakTimeSurcharge || 0) +
                    (breakdown.bookingTypeDiscount || 0)
                  )}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card Details Section */}
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">💳 Card Details</h4>
              <div className="flex items-center space-x-2">
                <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4.svg" alt="Visa" className="h-8" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130.svg" alt="Mastercard" className="h-8" />
                <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd.svg" alt="Amex" className="h-8" />
              </div>
            </div>
            
            {/* Card Number */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Card Number *
              </label>
              <div className={`bg-white border-2 rounded-xl p-4 transition-all duration-300 ${
                cardNumberError ? 'border-red-300 ring-2 ring-red-100' :
                cardNumberComplete ? 'border-green-300 ring-2 ring-green-100' :
                'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
              }`}>
                <CardNumberElement 
                  options={{
                    ...elementOptions,
                    placeholder: '1234 5678 9012 3456'
                  }}
                  onChange={(event) => {
                    setCardNumberComplete(event.complete);
                    setCardNumberError(event.error ? event.error.message : null);
                  }}
                />
              </div>
              {cardNumberError && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{cardNumberError}</span>
                </div>
              )}
              {cardNumberComplete && !cardNumberError && (
                <div className="mt-2 flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Card number is valid</span>
                </div>
              )}
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Expiry Date *
                </label>
                <div className={`bg-white border-2 rounded-xl p-4 transition-all duration-300 ${
                  cardExpiryError ? 'border-red-300 ring-2 ring-red-100' :
                  cardExpiryComplete ? 'border-green-300 ring-2 ring-green-100' :
                  'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                }`}>
                  <CardExpiryElement 
                    options={{
                      ...elementOptions,
                      placeholder: 'MM / YY'
                    }}
                    onChange={(event) => {
                      setCardExpiryComplete(event.complete);
                      setCardExpiryError(event.error ? event.error.message : null);
                    }}
                  />
                </div>
                {cardExpiryError && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{cardExpiryError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  CVC *
                </label>
                <div className={`bg-white border-2 rounded-xl p-4 transition-all duration-300 ${
                  cardCvcError ? 'border-red-300 ring-2 ring-red-100' :
                  cardCvcComplete ? 'border-green-300 ring-2 ring-green-100' :
                  'border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                }`}>
                  <CardCvcElement 
                    options={{
                      ...elementOptions,
                      placeholder: '123'
                    }}
                    onChange={(event) => {
                      setCardCvcComplete(event.complete);
                      setCardCvcError(event.error ? event.error.message : null);
                    }}
                  />
                </div>
                {cardCvcError && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{cardCvcError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Input Help */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-900 mb-2">💡 Card Input Guide:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-800">
                <div>
                  <strong>Card Number:</strong><br />
                  Enter your 16-digit card number<br />
                  <span className="text-blue-600">Spaces added automatically</span>
                </div>
                <div>
                  <strong>Expiry Date:</strong><br />
                  MM/YY format<br />
                  <span className="text-blue-600">e.g., 12/28</span>
                </div>
                <div>
                  <strong>CVC:</strong><br />
                  3-digit security code<br />
                  <span className="text-blue-600">Back of card</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">📋 Billing Information</h4>
              <button
                type="button"
                onClick={() => setShowBillingDetails(!showBillingDetails)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                {showBillingDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showBillingDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cardholder Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={billingInfo.name}
                    onChange={handleBillingInfoChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Name as it appears on card"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Postal Code *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="postalCode"
                    value={billingInfo.postalCode}
                    onChange={handleBillingInfoChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>
              </div>
            </div>

            {/* Additional Billing Details (Collapsible) */}
            {showBillingDetails && (
              <div className="space-y-4 pt-4 border-t border-gray-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={billingInfo.address}
                    onChange={handleBillingInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City (Optional)
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={billingInfo.city}
                      onChange={handleBillingInfoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={billingInfo.country}
                      onChange={handleBillingInfoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="GB">United Kingdom</option>
                      <option value="IE">Ireland</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* What Happens Next */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-3 text-lg">⚡ What Happens After Payment:</h4>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              <li>✅ <strong>Payment confirmation</strong> (instant)</li>
              <li>🚗 <strong>Driver assignment and dispatch</strong> (within 15 minutes)</li>
              <li>📱 <strong>Driver details sent via SMS</strong> to {guestInfo?.phone}</li>
              <li>🗺️ <strong>Live tracking link activated</strong></li>
              <li>📧 <strong>Email receipt and booking confirmation</strong></li>
            </ol>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={!stripe || processing || !clientSecret || !paymentBreakdown || !isFormComplete()}
              className="w-full px-6 py-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {processing ? (
                <>
                  <Loader className="w-6 h-6 animate-spin mr-3" />
                  <div className="text-left">
                    <div>Processing Payment...</div>
                    <div className="text-sm opacity-80">Please don't close this page</div>
                  </div>
                </>
              ) : !isFormComplete() ? (
                <>
                  <CreditCard className="w-6 h-6 mr-3" />
                  Complete Card Details to Pay
                </>
              ) : (
                <>
                  <Lock className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div>Pay {paymentBreakdown ? formatCurrency(paymentBreakdown.totalAmount) : formatCurrency(amount)}</div>
                    <div className="text-sm opacity-90">& Dispatch Driver Instantly</div>
                  </div>
                </>
              )}
            </button>
            
            {/* Payment Status Indicators */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center text-gray-600">
                <Shield className="w-4 h-4 mr-1" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Lock className="w-4 h-4 mr-1" />
                <span>Bank-level Security</span>
              </div>
            </div>
          </div>
        </form>

        {/* Security Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <img src="https://js.stripe.com/v3/fingerprinted/img/powered_by_stripe-7d0d6c6d8c.svg" alt="Powered by Stripe" className="h-6" />
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center text-green-600">
              <Shield className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">SSL Secured</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your card details are encrypted and never stored by AbleGo. 
            This payment is processed securely by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Stripe
    const initializeStripe = async () => {
      try {
        const stripe = await getStripe();
        if (stripe) {
          setStripePromise(Promise.resolve(stripe));
          console.log('✅ Stripe loaded successfully for payment form');
        } else {
          setStripeError('Payment system not configured. Please contact support.');
        }
      } catch (error) {
        setStripeError('Failed to initialize payment system.');
        console.error('Stripe initialization error:', error);
      }
    };

    initializeStripe();
  }, []);

  if (!stripePromise) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${props.className}`}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center">
            <Loader className="w-8 h-8 mr-3 animate-spin" />
            <div>
              <h3 className="text-xl font-bold">Loading Payment System</h3>
              <p className="text-blue-100">Initializing secure payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stripeError) {
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${props.className}`}>
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-xl font-bold">Payment System Unavailable</h3>
              <p className="text-red-100">Unable to process payments at this time</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-4">{stripeError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;