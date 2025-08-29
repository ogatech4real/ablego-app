import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  Banknote,
  Clock,
  User,
  MapPin,
  Calendar,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentConfirmationProps {
  bookingId: string;
  onPaymentConfirmed: () => void;
  onPaymentRejected: (reason: string) => void;
  className?: string;
}

interface BookingDetails {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  fare_estimate: number;
  payment_method: 'cash_bank' | 'stripe';
  status: string;
  guest_rider?: {
    name: string;
    email: string;
    phone: string;
  };
  guest_details?: {
    name: string;
    email: string;
    phone: string;
  };
}

const DriverPaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  bookingId,
  onPaymentConfirmed,
  onPaymentRejected,
  className = ''
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get booking from guest_bookings first
      let { data: guestBooking, error: guestError } = await supabase
        .from('guest_bookings')
        .select(`
          *,
          guest_rider:guest_riders (
            name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .single();

      if (guestBooking) {
        setBooking({
          ...guestBooking,
          guest_details: guestBooking.guest_rider
        });
        return;
      }

      // If not found in guest_bookings, try regular bookings
      const { data: regularBooking, error: regularError } = await supabase
        .from('bookings')
        .select(`
          *,
          rider:profiles (
            name,
            email,
            phone
          )
        `)
        .eq('id', bookingId)
        .single();

      if (regularBooking) {
        setBooking({
          ...regularBooking,
          guest_details: regularBooking.rider
        });
        return;
      }

      if (guestError && regularError) {
        setError('Booking not found');
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    try {
      setConfirming(true);
      setError(null);

      // Update booking status to payment confirmed
      const { error: updateError } = await supabase
        .from('guest_bookings')
        .update({ 
          status: 'payment_confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        // Try updating regular bookings table
        const { error: regularUpdateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'payment_confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (regularUpdateError) {
          throw new Error('Failed to update booking status');
        }
      }

      // Create payment transaction record
      await supabase
        .from('payment_transactions')
        .insert({
          booking_id: bookingId,
          amount_gbp: booking?.fare_estimate || 0,
          currency: 'GBP',
          status: 'completed',
          payment_method: booking?.payment_method || 'cash_bank',
          processed_at: new Date().toISOString()
        });

      // Send payment receipt to customer
      await supabase
        .from('admin_email_notifications')
        .insert({
          recipient_email: booking?.guest_details?.email || 'customer@example.com',
          subject: `✅ Payment Confirmed - Booking ${bookingId.slice(0, 8)}`,
          html_content: `
            <h2>Payment Confirmed</h2>
            <p>Dear ${booking?.guest_details?.name},</p>
            <p>Your payment has been confirmed by our driver.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId.slice(0, 8)}</p>
              <p><strong>Amount Paid:</strong> £${booking?.fare_estimate?.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> ${booking?.payment_method === 'cash_bank' ? 'Cash/Bank Transfer' : 'Stripe'}</p>
              <p><strong>Confirmed Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Thank you for choosing AbleGo!</p>
            <p>Best regards,<br>The AbleGo Team</p>
          `,
          booking_id: bookingId,
          notification_type: 'payment_receipt',
          email_type: 'customer_notification',
          email_status: 'queued',
          priority: 2,
          retry_count: 0,
          max_retries: 3,
          sent: false
        });

      // Send admin notification for tracking
      await supabase
        .from('admin_email_notifications')
        .insert({
          recipient_email: 'admin@ablego.co.uk',
          subject: `📊 Payment Confirmed by Driver - Booking ${bookingId.slice(0, 8)}`,
          html_content: `
            <h2>Payment Confirmed by Driver</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Customer:</strong> ${booking?.guest_details?.name} (${booking?.guest_details?.email})</p>
            <p><strong>Amount:</strong> £${booking?.fare_estimate?.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${booking?.payment_method === 'cash_bank' ? 'Cash/Bank Transfer' : 'Stripe'}</p>
            <p><strong>Confirmed by:</strong> Driver</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          `,
          booking_id: bookingId,
          notification_type: 'admin_payment_confirmation',
          email_type: 'admin_notification',
          email_status: 'queued',
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          sent: false
        });

      onPaymentConfirmed();
    } catch (error) {
      console.error('Error confirming payment:', error);
      setError('Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const rejectPayment = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setRejecting(true);
      setError(null);

      // Update booking status
      const { error: updateError } = await supabase
        .from('guest_bookings')
        .update({ 
          status: 'payment_failed',
          notes: `Payment rejected: ${rejectReason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        // Try updating regular bookings table
        const { error: regularUpdateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'payment_failed',
            notes: `Payment rejected: ${rejectReason}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (regularUpdateError) {
          throw new Error('Failed to update booking status');
        }
      }

      // Send payment rejection notification to customer
      await supabase
        .from('admin_email_notifications')
        .insert({
          recipient_email: booking?.guest_details?.email || 'customer@example.com',
          subject: `❌ Payment Issue - Booking ${bookingId.slice(0, 8)}`,
          html_content: `
            <h2>Payment Issue</h2>
            <p>Dear ${booking?.guest_details?.name},</p>
            <p>We encountered an issue with your payment. Please contact us immediately.</p>
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
              <h3>Issue Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId.slice(0, 8)}</p>
              <p><strong>Amount Due:</strong> £${booking?.fare_estimate?.toFixed(2)}</p>
              <p><strong>Issue:</strong> ${rejectReason}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Please contact us at admin@ablego.co.uk</li>
              <li>Provide your booking reference: ${bookingId.slice(0, 8)}</li>
              <li>We'll help resolve the payment issue</li>
            </ul>
            <p>Best regards,<br>The AbleGo Team</p>
          `,
          booking_id: bookingId,
          notification_type: 'payment_rejection',
          email_type: 'customer_notification',
          email_status: 'queued',
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          sent: false
        });

      // Send admin notification for tracking
      await supabase
        .from('admin_email_notifications')
        .insert({
          recipient_email: 'admin@ablego.co.uk',
          subject: `🚨 Payment Rejected by Driver - Booking ${bookingId.slice(0, 8)}`,
          html_content: `
            <h2>Payment Rejected by Driver</h2>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Customer:</strong> ${booking?.guest_details?.name} (${booking?.guest_details?.email})</p>
            <p><strong>Amount:</strong> £${booking?.fare_estimate?.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${booking?.payment_method === 'cash_bank' ? 'Cash/Bank Transfer' : 'Stripe'}</p>
            <p><strong>Rejection Reason:</strong> ${rejectReason}</p>
            <p><strong>Rejected by:</strong> Driver</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Action Required:</strong> Contact customer to resolve payment issue</p>
          `,
          booking_id: bookingId,
          notification_type: 'admin_payment_rejection',
          email_type: 'admin_notification',
          email_status: 'queued',
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          sent: false
        });

      onPaymentRejected(rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setError('Failed to reject payment');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading booking details...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-700">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error || 'Booking not found'}</span>
        </div>
      </div>
    );
  }

  const isCashBankPayment = booking.payment_method === 'cash_bank';
  const pickupDate = new Date(booking.pickup_time);

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Payment Confirmation</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isCashBankPayment 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {isCashBankPayment ? 'Cash/Bank Payment' : 'Stripe Payment'}
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">{booking.guest_details?.name || 'N/A'}</p>
              <p className="text-sm text-gray-600">{booking.guest_details?.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Amount Due</p>
              <p className="text-2xl font-bold text-gray-900">£{booking.fare_estimate.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium text-sm">{booking.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-medium text-sm">{booking.dropoff_address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Pickup Time</p>
              <p className="font-medium">{pickupDate.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{booking.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      {isCashBankPayment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <Banknote className="w-4 h-4 mr-2" />
            Cash/Bank Payment Instructions
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Verify cash amount received: £{booking.fare_estimate.toFixed(2)}</li>
            <li>• Check bank transfer confirmation if applicable</li>
            <li>• Confirm payment before completing the journey</li>
            <li>• Contact admin if payment issues arise</li>
          </ul>
        </div>
      )}

      {!isCashBankPayment && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Stripe Payment Status
          </h4>
          <p className="text-sm text-green-700">
            Payment has been processed via Stripe. No additional action required.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={confirmPayment}
          disabled={confirming || rejecting}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {confirming ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Payment Received
            </>
          )}
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={confirming || rejecting}
          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject Payment
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Payment</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this payment:</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Customer refused to pay, incorrect amount, etc."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
            />

            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={rejectPayment}
                disabled={rejecting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPaymentConfirmation;
