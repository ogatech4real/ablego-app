import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MapPin, Clock, Calendar, CreditCard, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BookingStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchBookingDetails();
    } else {0
      setError('No booking token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_bookings')
        .select(`
          *,
          guest_booking:guest_riders(*)
        `)
        .eq('access_token', token)
        .single();

      if (error) {
        setError('Booking not found');
      } else {
        setBooking(data);
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'pending':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'cancelled':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading booking details...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl p-8 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Booking Not Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The booking you are looking for could not be found.'}</p>
              <a
                href="/booking"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book a New Ride
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bookingDetails = booking;
  const guestDetails = booking.guest_booking.guest_rider;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Your Booking Status</h1>
            <p className="text-gray-600 dark:text-gray-400">Track your ride and get real-time updates</p>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Booking #{bookingDetails.id.slice(0, 8)}</h2>
                <p className="text-gray-600 dark:text-gray-400">Booked by {guestDetails.name}</p>
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
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">Payment Status</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bookingDetails.payment_method === 'cash' ? 'Cash Payment' : 
                       bookingDetails.payment_method === 'bank_transfer' ? 'Bank Transfer' : 
                       'Card Payment'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bookingDetails.payment_status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {bookingDetails.payment_status === 'completed' ? 'Paid' : 'Pending'}
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">Journey Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">From</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{bookingDetails.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">To</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{bookingDetails.dropoff_address}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">Schedule</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pickup Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {new Date(bookingDetails.pickup_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pickup Time</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {new Date(bookingDetails.pickup_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fare Details */}
            <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Fare Details</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estimated Fare</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  £{bookingDetails.fare_estimate}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 dark:bg-dark-800 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{guestDetails.phone}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{guestDetails.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:01642089958"
              className="flex items-center justify-center px-4 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call: 01642 089 958
            </a>
            <a
              href="/booking"
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Book Another Ride
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusPage;