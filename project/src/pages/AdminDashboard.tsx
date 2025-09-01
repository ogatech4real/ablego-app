import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Car, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Shield,
  Clock,
  MapPin,
  Heart,
  Eye,
  Download,
  UserPlus,
  Settings,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import NotificationCenter from '../components/NotificationCenter';
import PerformanceMonitor from '../components/PerformanceMonitor';

const AdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { 
    stats, 
    notifications, 
    loading, 
    lastRefresh,
    loadDashboardStats,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useAdmin();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    document.title = 'Admin Dashboard - AbleGo';
    loadDashboardStats();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleRefresh = () => {
    loadDashboardStats();
  };

  const quickStats = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      change: '+12%',
      href: '/admin/users'
    },
    {
      title: 'Active Trips',
      value: stats?.activeTrips || 0,
      icon: MapPin,
      color: 'green',
      change: '+5%',
      href: '/admin/bookings'
    },
    {
      title: 'Monthly Revenue',
      value: `£${stats?.totalRevenue || 0}`,
      icon: TrendingUp,
      color: 'purple',
      change: '+18%',
      href: '/admin/bookings'
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: AlertTriangle,
      color: 'orange',
      change: '-3%',
      href: '/admin/applications'
    }
  ];

  const adminActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'blue'
    },
    {
      title: 'Applications',
      description: 'Review driver and support worker applications',
      icon: FileText,
      href: '/admin/applications',
      color: 'teal'
    },
    {
      title: 'Bookings',
      description: 'Monitor and manage all bookings',
      icon: Calendar,
      href: '/admin/bookings',
      color: 'green'
    },
    {
      title: 'Vehicles',
      description: 'Verify and manage vehicle registrations',
      icon: Car,
      href: '/admin/vehicles',
      color: 'purple'
    },
    {
      title: 'Support Workers',
      description: 'Manage support worker verifications',
      icon: Heart,
      href: '/admin/support-workers',
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AbleGo</title>
        <meta name="description" content="Admin dashboard for managing AbleGo transport platform" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-dark-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Welcome back, {profile?.name || user?.email}
                </p>
                {lastRefresh && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <NotificationCenter
                  notifications={notifications}
                  unreadCount={stats?.unreadNotifications || 0}
                  onMarkAsRead={markNotificationAsRead}
                  onMarkAllAsRead={markAllNotificationsAsRead}
                />
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <Link
                  to="/admin/applications"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
                >
                  <FileText className="w-4 h-4 mr-2 inline-block" />
                  Review Applications
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={index}
                  to={stat.href}
                  className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-700 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(stat.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">{stat.value}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.title}</p>
                </Link>
              );
            })}
          </div>

          {/* Admin Actions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {adminActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border border-gray-100 dark:border-dark-700"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(action.color)} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Recent Activity & System Status */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Recent Activity</h3>
                <Link to="/admin/notifications" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                  View All
                </Link>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Loading activity...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-50">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                      </div>
                      {notification.action_url && (
                        <Link
                          to={notification.action_url}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">System Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">Database</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">Payment System</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">Email Service</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">Operational</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="font-medium text-gray-900 dark:text-gray-50">SMS Service</span>
                  </div>
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Maintenance</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="text-gray-900 dark:text-gray-50 font-medium">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white mt-8">
            <h3 className="text-2xl font-bold mb-6 text-center">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                to="/admin/users"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 text-center"
              >
                <UserPlus className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Promote User</h4>
                <p className="text-blue-100 text-sm">Upgrade user to admin role</p>
              </Link>

              <Link
                to="/admin/applications"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 text-center"
              >
                <FileText className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Review Applications</h4>
                <p className="text-blue-100 text-sm">Approve pending applications</p>
              </Link>

              <Link
                to="/admin/vehicles"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 text-center"
              >
                <Car className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Verify Vehicles</h4>
                <p className="text-blue-100 text-sm">Approve vehicle registrations</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Performance Monitor */}
        <PerformanceMonitor />
      </div>
    </>
  );
};

export default AdminDashboard;