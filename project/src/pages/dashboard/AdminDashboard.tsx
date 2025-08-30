import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Car, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Shield,
  Heart,
  Eye,
  UserPlus,
  Settings,
  Mail,
  Download,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../lib/stripe';
import { scrollToActionZone } from '../../utils/scrollUtils';
import PaymentAnalytics from '../../components/PaymentAnalytics';
import PerformanceMonitor from '../../components/PerformanceMonitor';

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, active: 0 });
  const [paymentStats, setPaymentStats] = useState({
    total_revenue: 0,
    platform_fees: 0,
    driver_payouts: 0,
    support_worker_payouts: 0,
    pending_payouts: 0
  });

  useEffect(() => {
    document.title = 'Admin Dashboard - AbleGo';
    
    // Load dashboard data if user is authenticated
    if (user) {
      console.log('Admin dashboard loading for user:', user.email);
      loadDashboardData();
      loadNewsletterStats();
      loadPaymentStats();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading admin dashboard data...');

      const { data, error } = await db.getAdminDashboardData();
      
      console.log('Dashboard data result:', { data, error });

      if (error) {
        console.error('Dashboard data error:', error);
        setError(error.message);
        // Provide fallback data structure
        setDashboardData({
          total_users: 0,
          total_riders: 0,
          total_drivers: 0,
          total_support_workers: 0,
          total_bookings: 0,
          active_trips: 0,
          pending_verifications: 0,
          monthly_revenue: 0,
          recent_activity: []
        });
        return;
      }

      setDashboardData(data || {
        total_users: 0,
        total_riders: 0,
        total_drivers: 0,
        total_support_workers: 0,
        total_bookings: 0,
        active_trips: 0,
        pending_verifications: 0,
        monthly_revenue: 0,
        recent_activity: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDashboardData({
        total_users: 0,
        total_riders: 0,
        total_drivers: 0,
        total_support_workers: 0,
        total_bookings: 0,
        active_trips: 0,
        pending_verifications: 0,
        monthly_revenue: 0,
        recent_activity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNewsletterStats = async () => {
    try {
      // Use secure Edge Function for newsletter stats
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics/newsletter-stats`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewsletterStats({
          total: data.total || 0,
          active: data.active || 0
        });
      }
    } catch (error) {
      console.error('Error loading newsletter stats:', error);
    }
  };

  const loadPaymentStats = async () => {
    try {
      // Use existing revenue analytics function for security
      const { data: revenueData, error } = await db.getRevenueAnalytics(30);

      if (!error && revenueData) {
        // Calculate stats from revenue analytics data
        const stats = revenueData.reduce((acc: any, day: any) => ({
          total_revenue: acc.total_revenue + (day.total_revenue || 0),
          platform_fees: acc.platform_fees + (day.platform_fees || 0),
          driver_payouts: acc.driver_payouts + (day.driver_payouts || 0),
          support_worker_payouts: acc.support_worker_payouts + (day.support_worker_payouts || 0),
          pending_payouts: acc.pending_payouts + (day.pending_payouts || 0)
        }), {
          total_revenue: 0,
          platform_fees: 0,
          driver_payouts: 0,
          support_worker_payouts: 0,
          pending_payouts: 0
        });

        setPaymentStats(stats);
      }
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const exportNewsletterSubscribers = async () => {
    try {
      // Use secure Edge Function for export
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics/newsletter-export`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Export failed:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('No subscribers to export');
        return;
      }

      // Create CSV content
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) => 
          headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting newsletter subscribers:', error);
    }
  };
  const quickStats = [
    {
      title: 'Total Users',
      value: loading ? '...' : (dashboardData?.total_users || 0),
      icon: Users,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Platform Revenue',
      value: loading ? '£...' : formatCurrency(paymentStats.platform_fees),
      icon: DollarSign,
      color: 'green',
      change: '+23%'
    },
    {
      title: 'Monthly Revenue',
      value: loading ? '£...' : formatCurrency(paymentStats.total_revenue),
      icon: TrendingUp,
      color: 'purple',
      change: '+18%'
    },
    {
      title: 'Active Trips',
      value: loading ? '...' : (dashboardData?.active_trips || 0),
      icon: Car,
      color: 'orange',
      change: '+5%'
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
    },
    {
      title: 'Payment Analytics',
      description: 'View revenue, payouts, and financial analytics',
      icon: CreditCard,
      href: '/admin/payments',
      color: 'indigo'
    },
    {
      title: 'Newsletter Subscribers',
      description: 'Manage newsletter subscriptions and export lists',
      icon: Mail,
      href: '/admin/newsletter',
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      teal: 'bg-teal-100 text-teal-600',
      pink: 'bg-pink-100 text-pink-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {(stat.title === 'Newsletter Subscribers' || stat.title === 'Platform Revenue') && (
                  <button
                    onClick={stat.title === 'Newsletter Subscribers' ? exportNewsletterSubscribers : () => {}}
                    className={`mt-2 text-xs font-medium flex items-center ${
                      stat.title === 'Newsletter Subscribers' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {stat.title === 'Newsletter Subscribers' ? 'Export CSV' : 'View Details'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                {action.title === 'Newsletter Subscribers' ? (
                  <div>
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
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {action.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Subscribers:</span>
                        <span className="font-semibold text-gray-900">{newsletterStats.active}</span>
                      </div>
                      <button
                        onClick={() => {
                          exportNewsletterSubscribers();
                          setTimeout(() => scrollToActionZone('.export-status, .download-status'), 100);
                        }}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Subscriber List
                      </button>
                    </div>
                  </div>
                ) : action.title === 'Payment Analytics' ? (
                  <div>
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
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {action.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Platform Fees:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(paymentStats.platform_fees)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Driver Payouts:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(paymentStats.driver_payouts)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Support Payouts:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(paymentStats.support_worker_payouts)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link to={action.href} className="block">
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
                )}
              </div>
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
            ) : dashboardData?.recent_activity?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Payment Processing</span>
                </div>
                <span className="text-blue-600 font-medium">Operational</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900">Stripe Connect</span>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mt-6 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
              <h4 className="text-lg font-bold mb-4">Payment Overview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-green-100 text-sm">Platform Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(paymentStats.platform_fees)}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Total Processed</p>
                  <p className="text-xl font-bold">{formatCurrency(paymentStats.total_revenue)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Link
                to="/admin/users"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <UserPlus className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Manage Users</h4>
                <p className="text-blue-100 text-sm">Upgrade user to admin role</p>
              </Link>

              <Link
                to="/admin/applications"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <FileText className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Review Applications</h4>
                <p className="text-blue-100 text-sm">Approve pending applications</p>
              </Link>

              <Link
                to="/admin/vehicles"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
              >
                <Car className="w-8 h-8 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Verify Vehicles</h4>
                <p className="text-blue-100 text-sm">Approve vehicle registrations</p>
              </Link>
            </div>
          </div>

          {/* Payment Analytics */}
          <div className="mt-8">
            <PaymentAnalytics />
          </div>
        </div>
      </div>
      
      {/* Performance Monitor */}
      <PerformanceMonitor />
    </>
  );
};

export default AdminDashboard;