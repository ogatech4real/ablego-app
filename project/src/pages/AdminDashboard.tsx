import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

const AdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { stats, loading, loadDashboardStats } = useAdmin();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    document.title = 'Admin Dashboard - AbleGo';
    loadDashboardStats();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const quickStats = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Active Trips',
      value: stats?.activeTrips || 0,
      icon: MapPin,
      color: 'green',
      change: '+5%'
    },
    {
      title: 'Monthly Revenue',
      value: `£${stats?.totalRevenue || 0}`,
      icon: TrendingUp,
      color: 'purple',
      change: '+18%'
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: AlertTriangle,
      color: 'orange',
      change: '-3%'
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
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      teal: 'bg-teal-100 text-teal-600',
      pink: 'bg-pink-100 text-pink-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Welcome back, {profile?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link
                to="/admin/applications"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
              >
                <FileText className="w-4 h-4 mr-2 inline-block" />
                Review Applications
              </Link>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(stat.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
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
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(action.color)} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity & System Status */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View All
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">New driver application</p>
                    <p className="text-sm text-gray-600">John Smith applied 2 hours ago</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Vehicle verified</p>
                    <p className="text-sm text-gray-600">Ford Transit approved for service</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-teal-50 rounded-lg">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Support worker approved</p>
                    <p className="text-sm text-gray-600">Sarah Williams completed training</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">System Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Database</span>
                </div>
                <span className="text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Payment System</span>
                </div>
                <span className="text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Email Service</span>
                </div>
                <span className="text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">SMS Service</span>
                </div>
                <span className="text-yellow-600 font-medium">Maintenance</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-gray-900 font-medium">
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
    </div>
  );
};

export default AdminDashboard;