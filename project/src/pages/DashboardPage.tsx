import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  Phone, 
  Mail,
  Settings,
  LogOut,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { scrollToActionZone } from '../utils/scrollUtils';

const DashboardPage: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading } = useBookings();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');

  useEffect(() => {
    document.title = 'Dashboard - AbleGo';
    
    // Redirect based on user role
    if (user && !loading) {
      // Handle admin users first
      if (user.email === 'admin@ablego.co.uk') {
        console.log('Redirecting admin to admin dashboard');
        navigate('/dashboard/admin', { replace: true });
        return;
      }
      
      // Handle users with profiles
      if (profile?.role) {
        const rolePath = getRoleDashboardPath(profile.role);
        console.log('Redirecting to role-specific dashboard:', rolePath, 'for role:', profile.role);
        navigate(rolePath, { replace: true });
        return;
      }
      
      // Handle users without profiles (fallback to rider)
      if (!profile) {
        console.log('No profile found, redirecting to rider dashboard as fallback');
        navigate('/dashboard/rider', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  // Additional effect to handle profile loading after user is set
  useEffect(() => {
    if (user && profile && !loading) {
      const rolePath = getRoleDashboardPath(profile.role);
      console.log('Redirecting to role-specific dashboard:', rolePath, 'for role:', profile.role);
      navigate(rolePath, { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const getRoleDashboardPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'driver':
        return '/dashboard/driver';
      case 'support_worker':
        return '/dashboard/support';
      default:
        return '/dashboard/rider';
    }
  };

  // Show loading while profile is being fetched
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
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

  const recentBookings = bookings.slice(0, 5);
  const isDriver = profile?.role === 'driver';
  const isSupportWorker = profile?.role === 'support_worker';

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.name || user?.email}
              </h1>
              <p className="text-gray-600 capitalize">
                {profile?.role || 'rider'} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href="/booking"
                onClick={() => {
                  setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2 inline-block" />
                New Booking
              </a>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2 inline-block" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: Calendar },
              { key: 'bookings', label: 'My Bookings', icon: MapPin },
              { key: 'profile', label: 'Profile', icon: User }
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

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Completed Trips</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.status === 'completed').length}
                        </p>
                      </div>
                      <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">4.8</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h3>
                  {bookingsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading bookings...</p>
                    </div>
                  ) : recentBookings.length > 0 ? (
                    <div className="space-y-4">
                      {recentBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {booking.pickup_address} → {booking.dropoff_address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.pickup_time).toLocaleDateString()} at{' '}
                              {new Date(booking.pickup_time).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className="font-semibold text-gray-900">
                              £{booking.fare_estimate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h4>
                      <p className="text-gray-600 mb-4">Start by booking your first ride</p>
                      <a
                        href="/booking"
                        onClick={() => {
                          setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                        }}
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Book Now
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-lg">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">All Bookings</h3>
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>

                <div className="p-6">
                  {bookingsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading bookings...</p>
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {booking.pickup_address} → {booking.dropoff_address}
                              </h4>
                              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  {new Date(booking.pickup_time).toLocaleString()}
                                </div>
                                {booking.support_workers_count && booking.support_workers_count > 0 && (
                                  <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    {booking.support_workers_count} Support Worker{booking.support_workers_count > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                              <p className="text-lg font-bold text-gray-900 mt-2">
                                £{booking.fare_estimate}
                              </p>
                            </div>
                          </div>

                          {booking.special_requirements && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-blue-800">
                                <strong>Special Requirements:</strong> {booking.special_requirements}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              Booked on {new Date(booking.created_at || '').toLocaleDateString()}
                            </p>
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                              <Eye className="w-4 h-4 mr-1 inline-block" />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h4>
                      <p className="text-gray-600 mb-6">You haven't made any bookings yet</p>
                      <a
                        href="/booking"
                        onClick={() => {
                          setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                        }}
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Book Your First Ride
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profile?.name || ''}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profile?.email || user?.email || ''}
                          disabled
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={profile?.phone || ''}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <div className="relative">
                        <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profile?.role || 'rider'}
                          disabled
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profile?.address || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter your address"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <a
                  href="/booking"
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors block text-center"
                >
                  Book New Ride
                </a>
                {isDriver && (
                  <a
                    href="/register/driver"
                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors block text-center"
                  >
                    Manage Vehicle
                  </a>
                )}
                {isSupportWorker && (
                  <a
                    href="/register/support-worker"
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors block text-center"
                  >
                    Update Profile
                  </a>
                )}
                <a
                  href="/contact"
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors block text-center"
                >
                  Contact Support
                </a>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Account Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <span className="text-green-600 font-medium">✓ Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Complete</span>
                  <span className={`font-medium ${profile?.name ? 'text-green-600' : 'text-yellow-600'}`}>
                    {profile?.name ? '✓ Complete' : '⚠ Incomplete'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Active</span>
                  <span className="text-green-600 font-medium">✓ Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;