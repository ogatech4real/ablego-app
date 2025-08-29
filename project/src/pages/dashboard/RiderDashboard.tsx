import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  Plus,
  Eye,
  Navigation,
  TrendingUp,
  CheckCircle,
  Users,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase';
import { scrollToActionZone } from '../../utils/scrollUtils';

const RiderDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Rider Dashboard - AbleGo';
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await db.getRiderDashboardData(user.id);

      if (error) {
        setError(error.message);
        // Provide fallback data structure
        setDashboardData({
          total_bookings: 0,
          completed_bookings: 0,
          pending_bookings: 0,
          total_spent: 0,
          recent_bookings: []
        });
        return;
      }

      setDashboardData(data || {
        total_bookings: 0,
        completed_bookings: 0,
        pending_bookings: 0,
        total_spent: 0,
        recent_bookings: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDashboardData({
        total_bookings: 0,
        completed_bookings: 0,
        pending_bookings: 0,
        total_spent: 0,
        recent_bookings: []
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const recentBookings = dashboardData?.recent_bookings?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {error}. Showing default dashboard.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.total_bookings || 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Completed Trips</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.completed_bookings || 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                £{loading ? '...' : (dashboardData?.total_spent || 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : '4.8'}
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
          <Link
            to="/booking"
            onClick={() => {
              setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
            }}
            className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Book New Ride
          </Link>
          <Link
            to="/dashboard/rider/bookings"
            className="flex items-center justify-center px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Calendar className="w-5 h-5 mr-2" />
            View All Bookings
          </Link>
          <Link
            to="/dashboard/rider"
            className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 mr-2" />
            Update Profile
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
          <Link
            to="/dashboard/rider/bookings"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {booking.pickup_address} → {booking.dropoff_address}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(booking.pickup_time).toLocaleDateString()} at{' '}
                      {new Date(booking.pickup_time).toLocaleTimeString()}
                    </div>
                    {booking.support_workers_count && booking.support_workers_count > 0 && (
                      <div className="flex items-center">
                        {new Date(booking.pickup_time).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  <span className="font-semibold text-gray-900">
                    £{booking.fare_estimate}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h4>
            <p className="text-gray-600 mb-4">Start by booking your first ride</p>
            <Link
              to="/booking"
              onClick={() => {
                setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
              }}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;