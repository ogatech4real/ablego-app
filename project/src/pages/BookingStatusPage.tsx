import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Users, 
  Phone,
  Mail,
  Navigation,
  Loader,
  Shield,
  Eye,
  CreditCard
} from 'lucide-react';
import { guestBookingService } from '../services/guestBookingService';
import GoogleMap from '../components/GoogleMap';
import PaymentForm from '../components/PaymentForm';
import { calculatePaymentSplit } from '../lib/stripe';
import { scrollToActionZone } from '../utils/scrollUtils';

const BookingStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'confirmed' | 'failed'>('pending');
  const [driverAssigned, setDriverAssigned] = useState(false);
  const [estimatedDispatchTime, setEstimatedDispatchTime] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    document.title = 'Booking Status - AbleGo';
    
    if (token) {
      loadBooking();
      // Set up real-time updates
      const interval = setInterval(loadBooking, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    } else {
      setError('No booking token provided');
      setLoading(false);
    }
  }, [token]);

  const loadBooking = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Load real booking data from Supabase
      const { data, error } = await guestBookingService.getGuestBooking(token);
      
      if (error) {
        setError(error.message || 'Failed to load booking');
        return;
      }

      if (!data) {
        setError('Booking not found or access token expired');
        return;
      }
      
      setBooking(data);
      
      // Determine payment status based on booking status and timestamps
      const bookingData = data.guest_booking;
      if (bookingData.status === 'pending') {
        setPaymentStatus('pending');
        setDriverAssigned(false);
      } else if (bookingData.status === 'confirmed') {
        setPaymentStatus('confirmed');
        setDriverAssigned(true);
        // Calculate estimated dispatch time (15 minutes after payment confirmation)
        const dispatchTime = new Date(Date.now() + 15 * 60 * 1000);
        setEstimatedDispatchTime(dispatchTime.toLocaleTimeString());
      } else if (bookingData.status === 'in_progress') {
        setPaymentStatus('confirmed');
        setDriverAssigned(true);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Navigation className="w-5 h-5" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Your Booking</h1>
              <p className="text-gray-600">Please wait while we retrieve your booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/booking"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Book New Ride
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bookingDetails = booking.guest_booking;
  const guestDetails = booking.guest_booking.guest_rider;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Booking Status</h1>
            <p className="text-gray-600">Track your ride and get real-time updates</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Booking #{bookingDetails.id.slice(0, 8)}</h2>
                <p className="text-gray-600">Booked by {guestDetails.name}</p>
              </div>
              <div className={`flex items-center px-4 py-2 rounded-full border-2 ${getStatusColor(bookingDetails.status)}`}>
                {getStatusIcon(bookingDetails.status)}
                <span className="ml-2 font-semibold capitalize">
                  {bookingDetails.status === 'pending' ? 'Awaiting Payment' : 
                   bookingDetails.status === 'confirmed' ? 'Payment Confirmed' :
                   bookingDetails.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Payment Status Section */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment & Driver Status
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Status</h4>
                  <div className={`flex items-center px-3 py-2 rounded-lg ${
                    paymentStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                    paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                    paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {paymentStatus === 'confirmed' ? <CheckCircle className="w-4 h-4 mr-2" /> :
                     paymentStatus === 'processing' ? <Clock className="w-4 h-4 mr-2" /> :
                     paymentStatus === 'failed' ? <AlertTriangle className="w-4 h-4 mr-2" /> :
                     <Clock className="w-4 h-4 mr-2" />}
                    <span className="font-medium capitalize">
                      {paymentStatus === 'pending' ? 'Awaiting Payment' :
                       paymentStatus === 'processing' ? 'Processing Payment' :
                       paymentStatus === 'confirmed' ? 'Payment Confirmed' :
                       'Payment Failed'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Driver Assignment</h4>
                  <div className={`flex items-center px-3 py-2 rounded-lg ${
                    driverAssigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {driverAssigned ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                    <span className="font-medium">
                      {driverAssigned ? 'Driver Assigned' : 'Awaiting Payment'}
                    </span>
                  </div>
                  {estimatedDispatchTime && (
                    <p className="text-xs text-green-600 mt-1">
                      Estimated dispatch: {estimatedDispatchTime}
                    </p>
                  )}
                </div>
              </div>
              
              {paymentStatus === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-semibold text-yellow-900 mb-2">Complete Payment to Dispatch Driver</h5>
                  <div className="grid md:grid-cols-2 gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Pay with Card (Instant)
                    </button>
                    <div className="text-xs text-gray-600">
                      <p><strong>Bank Transfer:</strong></p>
                      <p>Sort: 77-71-43 | Account: 00968562</p>
                      <p><strong>Reference:</strong> {bookingDetails.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Journey Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Journey Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 font-medium">From</span>
                    <p className="text-gray-800">{bookingDetails.pickup_address}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 font-medium">To</span>
                    <p className="text-gray-800">{bookingDetails.dropoff_address}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 font-medium">Pickup Time</span>
                    <p className="text-gray-800">{new Date(bookingDetails.pickup_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 font-medium">Estimated Fare</span>
                    <p className="text-blue-600 font-bold text-lg">£{bookingDetails.fare_estimate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-teal-600" />
                  Service Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 font-medium">Support Workers</span>
                    <p className="text-gray-800">
                      {bookingDetails.support_workers_count === 0 ? 'None requested' : `${bookingDetails.support_workers_count} companion${bookingDetails.support_workers_count > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 font-medium">Vehicle Features</span>
                    <p className="text-gray-800">
                      {bookingDetails.vehicle_features?.length > 0 
                        ? bookingDetails.vehicle_features.join(', ')
                        : 'Standard vehicle'
                      }
                    </p>
                  </div>
                  {bookingDetails.special_requirements && (
                    <div>
                      <span className="text-sm text-gray-500 font-medium">Special Requirements</span>
                      <p className="text-gray-800">{bookingDetails.special_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <span className="text-sm text-blue-700 font-medium">Email</span>
                    <p className="text-blue-800">{guestDetails.email}</p>
                  </div>
                </div>
                {guestDetails.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <span className="text-sm text-blue-700 font-medium">Phone</span>
                      <p className="text-blue-800">{guestDetails.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Booking Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(bookingDetails.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className={`flex items-center ${paymentStatus === 'pending' ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  paymentStatus !== 'pending' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${paymentStatus !== 'pending' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Confirmed</p>
                  <p className="text-sm text-gray-600">
                    {paymentStatus === 'confirmed' ? 'Payment received and confirmed' : 
                     paymentStatus === 'processing' ? 'Payment being processed' :
                     'Waiting for payment completion'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center ${!driverAssigned ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  driverAssigned ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Car className={`w-5 h-5 ${driverAssigned ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Driver Assigned & Dispatched</p>
                  <p className="text-sm text-gray-600">
                    {driverAssigned ? 'Driver details sent via SMS' : 'Automatic after payment confirmation'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center ${!['in_progress', 'completed'].includes(bookingDetails.status) ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  ['in_progress', 'completed'].includes(bookingDetails.status) ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <Navigation className={`w-5 h-5 ${['in_progress', 'completed'].includes(bookingDetails.status) ? 'text-teal-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Journey Started</p>
                  <p className="text-sm text-gray-600">Live GPS tracking available</p>
                </div>
              </div>

              <div className={`flex items-center ${bookingDetails.status !== 'completed' ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                  bookingDetails.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${bookingDetails.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Journey Completed</p>
                  <p className="text-sm text-gray-600">Safe arrival at destination</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {paymentStatus === 'pending' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
                Complete Payment to Dispatch Driver
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-yellow-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Payment Required</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Your driver will be automatically assigned and dispatched within 15 minutes of payment confirmation.
                </p>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-red-700">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="text-sm">{paymentError}</span>
                  </div>
                </div>
              )}

              {!showPaymentForm ? (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowPaymentForm(true);
                      setTimeout(() => scrollToActionZone('.payment-form, .payment-section'), 100);
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <CreditCard className="w-5 h-5 mr-2 inline-block" />
                    Pay £{bookingDetails.fare_estimate} Securely
                  </button>
                  <p className="text-sm text-gray-600 mt-3">
                    Secure payment via Stripe • Driver dispatched instantly
                  </p>
                </div>
              ) : (
                <PaymentForm
                  bookingId={bookingDetails.id}
                  amount={bookingDetails.fare_estimate}
                  breakdown={{
                    baseFare: 8.50,
                    distanceFare: bookingDetails.fare_estimate * 0.4,
                    vehicleFeatures: bookingDetails.vehicle_features?.length * 5 || 0,
                    supportWorkerCost: bookingDetails.support_workers_count * 18.50 || 0,
                    peakTimeSurcharge: 0
                  }}
                  onSuccess={(paymentIntent) => {
                    setPaymentStatus('confirmed');
                    setDriverAssigned(true);
                    setShowPaymentForm(false);
                    loadBooking(); // Refresh booking data
                    // Scroll to show payment success status
                    setTimeout(() => scrollToActionZone('.payment-success, .driver-assigned'), 100);
                  }}
                  onError={(error) => setPaymentError(error)}
                />
              )}
            </div>
          )}

          {/* Driver Information */}
          {driverAssigned && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Car className="w-6 h-6 mr-3 text-green-600" />
                Your Driver & Vehicle
              </h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Driver Assigned & En Route</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Driver details have been sent to your phone via SMS. Check your messages for contact information.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Driver Information</h4>
                  <p className="text-blue-800 text-sm">
                    Driver details sent via SMS to {guestDetails.phone}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Check your messages for driver name, photo, and contact number
                  </p>
                </div>
                
                <div className="bg-teal-50 rounded-lg p-4">
                  <h4 className="font-semibold text-teal-900 mb-2">Vehicle Information</h4>
                  <p className="text-teal-800 text-sm">
                    Vehicle details included in SMS
                  </p>
                  <p className="text-xs text-teal-600 mt-1">
                    Make, model, color, and license plate provided
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to="/booking"
                className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors md:col-span-2"
              >
                <Car className="w-5 h-5 mr-2" />
                Book Another Ride
              </Link>
            </div>

            {/* Support Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="tel:08001234567"
                  className="flex items-center justify-center px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call: 0800 123 4567
                </a>
                <a
                  href="mailto:support@ablego.co.uk"
                  className="flex items-center justify-center px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </a>
              </div>
            </div>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Want to track all your bookings in one place?
              </p>
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create a free account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusPage;