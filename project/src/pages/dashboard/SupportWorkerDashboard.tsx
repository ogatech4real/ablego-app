import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Star, 
  Heart,
  TrendingUp,
  CheckCircle,
  Settings,
  Phone,
  LogOut,
  Power,
  PowerOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/supabase';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import StripeConnectOnboarding from '../../components/StripeConnectOnboarding';
import EarningsDashboard from '../../components/EarningsDashboard';
import { scrollToActionZone } from '../../utils/scrollUtils';

const SupportWorkerDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isTracking, setOnlineStatus, canTrack } = useLocationTracking();
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'profile'>('overview');
  const [stripeSetupComplete, setStripeSetupComplete] = useState(false);

  useEffect(() => {
    document.title = 'Support Worker Dashboard - AbleGo';
    if (user) {
      loadDashboardData();
      checkStripeSetup();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await db.getSupportWorkerDashboardData(user.id);

      if (error) {
        setError(error.message);
        // Provide fallback data structure
        setDashboardData({
          total_assignments: 0,
          completed_assignments: 0,
          total_earnings: 0,
          average_rating: 0,
          hours_worked: 0,
          profile: { verified: false, hourly_rate: 18.50, specializations: [], is_active: true },
          recent_assignments: []
        });
        return;
      }

      setDashboardData(data || {
        total_assignments: 0,
        completed_assignments: 0,
        total_earnings: 0,
        average_rating: 0,
        hours_worked: 0,
        profile: { verified: false, hourly_rate: 18.50, specializations: [], is_active: true },
        recent_assignments: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDashboardData({
        total_assignments: 0,
        completed_assignments: 0,
        total_earnings: 0,
        average_rating: 0,
        hours_worked: 0,
        profile: { verified: false, hourly_rate: 18.50, specializations: [], is_active: true },
        recent_assignments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStripeSetup = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_workers')
        .select('stripe_account_id, stripe_account_status')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.stripe_account_id && data?.stripe_account_status === 'complete') {
        setStripeSetupComplete(true);
      }
    } catch (error) {
      console.error('Error checking Stripe setup:', error);
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
              <p className="text-sm text-gray-600 font-medium">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.total_assignments || 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-teal-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : (dashboardData?.completed_assignments || 0)}
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

      {/* Availability Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Availability</h3>
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
          <button className="flex items-center justify-center px-6 py-4 border-2 border-orange-600 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
            <Clock className="w-5 h-5 mr-2" />
            Take Break
          </button>
          <button className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 mr-2" />
            Update Schedule
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: Users },
            { key: 'earnings', label: 'Earnings', icon: TrendingUp },
            { key: 'profile', label: 'Profile & Payments', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
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
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent assignments</h4>
          <p className="text-gray-600 mb-4">Set yourself as available to receive assignment requests</p>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            Set Available
          </button>
        </div>
      )}

      {activeTab === 'earnings' && (
        <EarningsDashboard userType="support_worker" />
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {!stripeSetupComplete && (
            <StripeConnectOnboarding 
              userType="support_worker"
              onComplete={() => setStripeSetupComplete(true)}
            />
          )}
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile?.name || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile?.phone || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Assignments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Assignments</h3>
          <button className="text-teal-600 hover:text-teal-700 font-medium">
            View All
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        ) : dashboardData?.recent_assignments?.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.recent_assignments.slice(0, 5).map((assignment: any) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Support for {assignment.booking?.pickup_address}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {assignment.start_time ? new Date(assignment.start_time).toLocaleDateString() : 'Scheduled'}
                    </div>
                    {assignment.support_worker_rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        {assignment.support_worker_rating}/5
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    £{dashboardData?.profile?.hourly_rate || 20.50}/hr
                  </span>
                  <button className="text-teal-600 hover:text-teal-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent assignments</h4>
            <p className="text-gray-600 mb-4">Set yourself as available to receive assignment requests</p>
            <button className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Set Available
            </button>
          </div>
        )}
      </div>

      {/* Support Worker Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Support Worker Status</h3>
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            dashboardData?.profile?.verified ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center">
              {dashboardData?.profile?.verified ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              )}
              <span className="font-medium text-gray-900">Profile Verified</span>
            </div>
            <span className={`font-medium ${
              dashboardData?.profile?.verified ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {dashboardData?.profile?.verified ? '✓ Verified' : '⚠ Pending'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span className="font-medium text-gray-900">Hourly Rate</span>
            </div>
            <span className="text-green-600 font-medium">
              £{dashboardData?.profile?.hourly_rate || 18.50}/hour
            </span>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            stripeSetupComplete ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center">
              {stripeSetupComplete ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              )}
              <span className="font-medium text-gray-900">Payment Setup</span>
            </div>
            <span className={`font-medium ${
              stripeSetupComplete ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {stripeSetupComplete ? '✓ Complete' : '⚠ Required'}
            </span>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            dashboardData?.profile?.is_active ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center">
              {dashboardData?.profile?.is_active ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              ) : (
                <Clock className="w-5 h-5 text-red-600 mr-3" />
              )}
              <span className="font-medium text-gray-900">Account Status</span>
            </div>
            <span className={`font-medium ${
              dashboardData?.profile?.is_active ? 'text-green-600' : 'text-red-600'
            }`}>
              {dashboardData?.profile?.is_active ? '✓ Active' : '⚠ Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportWorkerDashboard;