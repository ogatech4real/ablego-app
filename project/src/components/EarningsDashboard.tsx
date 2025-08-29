import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock,
  Download,
  Eye,
  CreditCard,
  Building,
  Users,
  Car
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/stripe';

interface EarningsData {
  total_earnings: number;
  total_bookings: number;
  total_hours: number;
  average_rating: number;
  this_week_earnings: number;
  this_month_earnings: number;
  pending_payouts: number;
  recent_payments: Array<{
    id: string;
    amount: number;
    booking_id: string;
    date: string;
    status: string;
    customer_name: string;
  }>;
}

interface EarningsDashboardProps {
  userType: 'driver' | 'support_worker';
  className?: string;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({
  userType,
  className = ''
}) => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  }, [user, selectedPeriod]);

  const loadEarningsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get earnings data from payment_splits
      const { data: splits, error: splitsError } = await supabase
        .from('payment_splits')
        .select(`
          *,
          payment_transaction:payment_transactions (
            booking_id,
            amount_gbp,
            processed_at,
            guest_booking:guest_bookings (
              guest_rider:guest_riders (
                name
              )
            )
          )
        `)
        .eq('recipient_id', user.id)
        .eq('recipient_type', userType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (splitsError) {
        console.error('Error loading earnings:', splitsError);
        return;
      }

      // Calculate totals
      const totalEarnings = splits?.reduce((sum, split) => sum + (split.amount_gbp || 0), 0) || 0;
      const totalBookings = splits?.length || 0;

      // Calculate period-specific earnings
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisWeekEarnings = splits?.filter(split => 
        new Date(split.created_at) >= weekStart
      ).reduce((sum, split) => sum + (split.amount_gbp || 0), 0) || 0;

      const thisMonthEarnings = splits?.filter(split => 
        new Date(split.created_at) >= monthStart
      ).reduce((sum, split) => sum + (split.amount_gbp || 0), 0) || 0;

      // Format recent payments
      const recentPayments = splits?.slice(0, 10).map(split => ({
        id: split.id,
        amount: split.amount_gbp || 0,
        booking_id: split.payment_transaction?.booking_id || '',
        date: split.processed_at || split.created_at,
        status: split.status,
        customer_name: split.payment_transaction?.guest_booking?.guest_rider?.name || 'Unknown'
      })) || [];

      setEarnings({
        total_earnings: totalEarnings,
        total_bookings: totalBookings,
        total_hours: totalBookings * 1.5, // Estimate
        average_rating: 4.8, // Mock data
        this_week_earnings: thisWeekEarnings,
        this_month_earnings: thisMonthEarnings,
        pending_payouts: 0, // Mock data
        recent_payments: recentPayments
      });

    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportEarnings = () => {
    if (!earnings?.recent_payments) return;

    const csvData = earnings.recent_payments.map(payment => ({
      date: new Date(payment.date).toLocaleDateString(),
      booking_id: payment.booking_id.slice(0, 8),
      customer: payment.customer_name,
      amount: payment.amount,
      status: payment.status
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${userType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Earnings Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings?.total_earnings || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings?.this_month_earnings || 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total {userType === 'driver' ? 'Rides' : 'Assignments'}</p>
              <p className="text-2xl font-bold text-gray-900">{earnings?.total_bookings || 0}</p>
            </div>
            {userType === 'driver' ? (
              <Car className="w-8 h-8 text-purple-600" />
            ) : (
              <Users className="w-8 h-8 text-teal-600" />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900">{earnings?.average_rating || 0}</p>
            </div>
            <div className="text-yellow-500">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={exportEarnings}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="p-6">
          {earnings?.recent_payments && earnings.recent_payments.length > 0 ? (
            <div className="space-y-4">
              {earnings.recent_payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {userType === 'driver' ? 'Ride Payment' : 'Support Assignment'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.customer_name} • {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className={`text-xs font-medium ${
                        payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {payment.status === 'completed' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h4>
              <p className="text-gray-600">
                Complete {userType === 'driver' ? 'rides' : 'support assignments'} to see your earnings here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Information */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Automatic Payouts</h3>
            <p className="text-blue-100">
              Earnings are automatically transferred to your bank account daily
            </p>
          </div>
          <Building className="w-12 h-12 text-white/80" />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-sm">Your Share</p>
            <p className="text-2xl font-bold">70%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-sm">Payout Schedule</p>
            <p className="text-lg font-semibold">Daily</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-sm">Processing Time</p>
            <p className="text-lg font-semibold">1-2 Days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;