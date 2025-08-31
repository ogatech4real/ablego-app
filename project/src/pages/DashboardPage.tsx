import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Clock, Navigation, Phone, Mail, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { scrollToTop } from '../utils/scrollUtils';

const DashboardPage: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');

  useEffect(() => {
    document.title = 'Dashboard - AbleGo';
    scrollToTop('instant');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-800 pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Welcome back, {profile?.name || user?.email}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your rides, profile, and preferences
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 mb-8">
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
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-dark-700'
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
                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Quick Actions</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Link
                        to="/booking"
                        className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-50">Book a Ride</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Schedule your next journey</p>
                        </div>
                      </Link>
                      <Link
                        to="/contact"
                        className="flex items-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
                      >
                        <Phone className="w-6 h-6 text-teal-600 dark:text-teal-400 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-50">Contact Support</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Get help when you need it</p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-gray-50">Account created successfully</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-gray-50">Profile information updated</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">1 week ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">My Bookings</h3>
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No bookings yet</p>
                    <Link
                      to="/booking"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Book Your First Ride
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <p className="text-gray-900 dark:text-gray-50">{profile?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <p className="text-gray-900 dark:text-gray-50">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <p className="text-gray-900 dark:text-gray-50">{profile?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                      <p className="text-gray-900 dark:text-gray-50 capitalize">rider</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/dashboard/settings"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Account Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email Verified</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">✓ Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Profile Complete</span>
                    <span className={`font-medium ${profile?.name ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {profile?.name ? '✓ Complete' : '⚠ Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Account Active</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">✓ Active</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Rides</span>
                    <span className="text-gray-900 dark:text-gray-50 font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">This Month</span>
                    <span className="text-gray-900 dark:text-gray-50 font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                    <span className="text-gray-900 dark:text-gray-50 font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="bg-white dark:bg-dark-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Need Help?</h4>
                <div className="space-y-3">
                  <a
                    href="tel:01642089958"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </a>
                  <a
                    href="mailto:support@ablego.co.uk"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </a>
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