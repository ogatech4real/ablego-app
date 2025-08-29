import React, { useEffect, useState } from 'react';
import { 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  Navigation,
  TrendingUp,
  CheckCircle,
  Settings,
  Plus,
  LogOut,
  Power,
  PowerOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import StripeConnectOnboarding from '../../components/StripeConnectOnboarding';
import EarningsDashboard from '../../components/EarningsDashboard';
import DriverPaymentConfirmation from '../../components/DriverPaymentConfirmation';
import { scrollToActionZone } from '../../utils/scrollUtils';

const DriverDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTracking, setOnlineStatus, canTrack } = useLocationTracking();
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'vehicle' | 'payments'>('overview');
  const [stripeSetupComplete, setStripeSetupComplete] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Driver Dashboard - AbleGo';
    if (user) {
      loadDashboardData();
      checkStripeSetup();
      loadPendingPayments();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.getDriverDashboardData(user.id);

      if (error) {
        setError(error.message);
        // Provide fallback data structure
        setDashboardData({
          total_trips: 0,
          completed_trips: 0,
          total_earnings: 0,
          average_rating: 0,
          vehicles: [],
          recent_trips: []
        });
        return;
      }

      setDashboardData(data || {
        total_trips: 0,
        completed_trips: 0,
        total_earnings: 0,
        average_rating: 0,
        vehicles: [],
        recent_trips: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDashboardData({
        total_trips: 0,
        completed_trips: 0,
        total_earnings: 0,
        average_rating: 0,
        vehicles: [],
        recent_trips: []
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStripeSetup = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('stripe_account_id, stripe_account_status')
        .eq('driver_id', user.id)
        .single();

      if (!error && data?.stripe_account_id && data?.stripe_account_status === 'complete') {
        setStripeSetupComplete(true);
      }
    } catch (error) {
      console.error('Error checking Stripe setup:', error);
    }
  };

  const loadPendingPayments = async () => {
    if (!user) return;

    try {
      // Get bookings assigned to this driver that need payment confirmation
      const { data: guestBookings, error: guestError } = await supabase
        .from('guest_bookings')
        .select(`
          *,
          guest_rider:guest_riders (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'pending')
        .eq('payment_method', 'cash_bank');

      const { data: regularBookings, error: regularError } = await supabase
        .from('bookings')
        .select(`
          *,
          rider:profiles (
            name,
            email,
            phone
          )
        `)
        .eq('status', 'pending')
        .eq('payment_method', 'cash_bank');

      if (guestError) console.error('Error loading guest bookings:', guestError);
      if (regularError) console.error('Error loading regular bookings:', regularError);

      const allPendingPayments = [
        ...(guestBookings || []).map(booking => ({
          ...booking,
          customer_name: booking.guest_rider?.name,
          customer_email: booking.guest_rider?.email,
          customer_phone: booking.guest_rider?.phone
        })),
        ...(regularBookings || []).map(booking => ({
          ...booking,
          customer_name: booking.rider?.name,
          customer_email: booking.rider?.email,
          customer_phone: booking.rider?.phone
        }))
      ];

            setPendingPayments(allPendingPayments);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handlePaymentConfirmed = () => {
    setSelectedBookingForPayment(null);
    loadPendingPayments(); // Refresh the list
    loadDashboardData(); // Refresh dashboard data
  };

  const handlePaymentRejected = (reason: string) => {
    setSelectedBookingForPayment(null);
    loadPendingPayments(); // Refresh the list
    loadDashboardData(); // Refresh dashboard data
  };

  const handleToggleOnline = async () => {
    try {
      setIsTogglingOnline(true);
      const result = await setOnlineStatus(!isTracking);
      
      if (!result.success) {
        console.error('Failed to toggle online status:', result.error);
        // Show error message in viewport
        setTimeout(() => scrollToActionZone('.error-message, .status-error'), 100);
      } else {
        // Show success status in viewport
        setTimeout(() => scrollToActionZone('.status-success, .online-status'), 100);
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      setTimeout(() => scrollToActionZone('.error-message, .status-error'), 100);
    } finally {
      setIsTogglingOnline(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {error}. Showing default dashboard.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.total_trips || 0)}
              </p>
            </div>
            <Car className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.completed_trips || 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                £{loading ? '...' : (dashboardData?.total_earnings || 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.average_rating || 0).toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button 
            onClick={handleToggleOnline}
            disabled={!canTrack || isTogglingOnline}
            className={`flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              isTracking 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700' 
                : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
            }`}
          >
            {isTogglingOnline ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : isTracking ? (
              <PowerOff className="w-5 h-5 mr-2" />
            ) : (
              <Power className="w-5 h-5 mr-2" />
            )}
            {isTogglingOnline ? 'Updating...' : isTracking ? 'Go Offline' : 'Go Online'}
          </button>
          <Link
            to="/register/driver"
            className="flex items-center justify-center px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Settings className="w-5 h-5 mr-2" />
            Update Vehicle
          </Link>
          <button className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <LogOut className="w-5 h-5 mr-2" />
            Contact Support
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: Car },
            { key: 'earnings', label: 'Earnings', icon: TrendingUp },
            { key: 'vehicle', label: 'Vehicle & Payments', icon: Settings },
            { key: 'payments', label: 'Payment Confirmations', icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Trips</h3>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trips...</p>
              </div>
            ) : dashboardData?.recent_trips?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recent_trips.slice(0, 5).map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {trip.booking?.pickup_address} → {trip.booking?.dropoff_address}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {trip.start_time ? new Date(trip.start_time).toLocaleDateString() : 'Scheduled'}
                        </div>
                        {trip.customer_rating && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {trip.customer_rating}/5
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900">
                        £{trip.booking?.fare_estimate || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent trips</h4>
                <p className="text-gray-600 mb-4">Go online to start receiving booking requests</p>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Go Online Now
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'earnings' && (
        <EarningsDashboard userType="driver" />
      )}

      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          {!stripeSetupComplete && (
            <StripeConnectOnboarding 
              userType="driver"
              onComplete={() => setStripeSetupComplete(true)}
            />
          )}
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Vehicle Information</h3>
            {dashboardData?.vehicles?.length > 0 ? (
              dashboardData.vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vehicle.verified ? 'Verified' : 'Pending'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          vehicle.stripe_account_status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          Payments: {vehicle.stripe_account_status === 'complete' ? 'Ready' : 'Setup Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No vehicles registered</h4>
                <p className="text-gray-600 mb-4">Register your vehicle to start driving</p>
                <Link
                  to="/register/driver"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Vehicle
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Driver Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Vehicle Status</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading vehicle status...</p>
            </div>
          ) : dashboardData?.vehicles?.length > 0 ? (
            dashboardData.vehicles.map((vehicle: any) => (
              <div key={vehicle.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vehicle.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vehicle.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No vehicles registered</h4>
              <p className="text-gray-600 mb-4">Register your vehicle to start driving</p>
              <Link
                to="/register/driver"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Register Vehicle
              </Link>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Confirmations</h3>
            
            {pendingPayments.length > 0 ? (
              <div className="space-y-4">
                {pendingPayments.map((booking) => (
                  <div key={booking.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{booking.customer_name}</h4>
                        <p className="text-sm text-gray-600">{booking.customer_phone}</p>
                        <p className="text-sm text-gray-600">{booking.pickup_address} → {booking.dropoff_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">£{booking.fare_estimate}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.pickup_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedBookingForPayment(booking.id)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Confirm Payment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No pending payments</h4>
                <p className="text-gray-600">All payments have been confirmed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <DriverPaymentConfirmation
              bookingId={selectedBookingForPayment}
              onPaymentConfirmed={handlePaymentConfirmed}
              onPaymentRejected={handlePaymentRejected}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;