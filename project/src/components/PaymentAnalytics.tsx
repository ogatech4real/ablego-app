import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentStats {
  totalRevenue: number;
  totalBookings: number;
  cashBankRevenue: number;
  stripeRevenue: number;
  cashBankBookings: number;
  stripeBookings: number;
  pendingPayments: number;
  confirmedPayments: number;
  failedPayments: number;
  averageFare: number;
  revenueChange: number;
  bookingsChange: number;
}

interface PaymentMethodBreakdown {
  method: 'cash_bank' | 'stripe';
  count: number;
  revenue: number;
  percentage: number;
}

interface RecentPayment {
  id: string;
  booking_id: string;
  amount_gbp: number;
  payment_method: 'cash_bank' | 'stripe';
  status: string;
  processed_at: string;
  customer_name: string;
  customer_email: string;
}

const PaymentAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdown[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentAnalytics();
  }, [timeRange]);

  const loadPaymentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Load payment statistics
      await Promise.all([
        loadPaymentStats(startDate, endDate),
        loadPaymentMethodBreakdown(startDate, endDate),
        loadRecentPayments()
      ]);

    } catch (error) {
      console.error('Error loading payment analytics:', error);
      setError('Failed to load payment analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async (startDate: Date, endDate: Date) => {
    // Get guest bookings statistics
    const { data: guestBookings, error: guestError } = await supabase
      .from('guest_bookings')
      .select('fare_estimate, payment_method, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (guestError) throw guestError;

    // Get regular bookings statistics
    const { data: regularBookings, error: regularError } = await supabase
      .from('bookings')
      .select('fare_estimate, payment_method, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (regularError) throw regularError;

    const allBookings = [...(guestBookings || []), ...(regularBookings || [])];

    // Calculate statistics
    const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0);
    const totalBookings = allBookings.length;
    
    const cashBankBookings = allBookings.filter(b => b.payment_method === 'cash_bank');
    const stripeBookings = allBookings.filter(b => b.payment_method === 'stripe');
    
    const cashBankRevenue = cashBankBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0);
    const stripeRevenue = stripeBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0);
    
    const pendingPayments = allBookings.filter(b => b.status === 'pending').length;
    const confirmedPayments = allBookings.filter(b => b.status === 'payment_confirmed' || b.status === 'completed').length;
    const failedPayments = allBookings.filter(b => b.status === 'payment_failed').length;
    
    const averageFare = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate change from previous period
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(prevStartDate.getTime() - periodLength);
    prevEndDate.setTime(prevEndDate.getTime() - periodLength);

    const { data: prevGuestBookings } = await supabase
      .from('guest_bookings')
      .select('fare_estimate')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const { data: prevRegularBookings } = await supabase
      .from('bookings')
      .select('fare_estimate')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const prevTotalRevenue = [...(prevGuestBookings || []), ...(prevRegularBookings || [])]
      .reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0);

    const revenueChange = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

    setStats({
      totalRevenue,
      totalBookings,
      cashBankRevenue,
      stripeRevenue,
      cashBankBookings: cashBankBookings.length,
      stripeBookings: stripeBookings.length,
      pendingPayments,
      confirmedPayments,
      failedPayments,
      averageFare,
      revenueChange,
      bookingsChange: 0 // TODO: Calculate bookings change
    });
  };

  const loadPaymentMethodBreakdown = async (startDate: Date, endDate: Date) => {
    const { data: guestBookings } = await supabase
      .from('guest_bookings')
      .select('fare_estimate, payment_method')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: regularBookings } = await supabase
      .from('bookings')
      .select('fare_estimate, payment_method')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const allBookings = [...(guestBookings || []), ...(regularBookings || [])];
    const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0);

    const cashBankBookings = allBookings.filter(b => b.payment_method === 'cash_bank');
    const stripeBookings = allBookings.filter(b => b.payment_method === 'stripe');

    const breakdown: PaymentMethodBreakdown[] = [
      {
        method: 'cash_bank',
        count: cashBankBookings.length,
        revenue: cashBankBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0),
        percentage: totalRevenue > 0 ? (cashBankBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0) / totalRevenue) * 100 : 0
      },
      {
        method: 'stripe',
        count: stripeBookings.length,
        revenue: stripeBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0),
        percentage: totalRevenue > 0 ? (stripeBookings.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0) / totalRevenue) * 100 : 0
      }
    ];

    setPaymentMethods(breakdown);
  };

  const loadRecentPayments = async () => {
    const { data: payments, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        booking:bookings (
          rider:profiles (name, email)
        ),
        guest_booking:guest_bookings (
          guest_rider:guest_riders (name, email)
        )
      `)
      .order('processed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const recentPayments: RecentPayment[] = (payments || []).map(payment => ({
      id: payment.id,
      booking_id: payment.booking_id,
      amount_gbp: payment.amount_gbp,
      payment_method: payment.payment_method as 'cash_bank' | 'stripe',
      status: payment.status,
      processed_at: payment.processed_at || '',
      customer_name: payment.booking?.rider?.name || payment.guest_booking?.guest_rider?.name || 'Unknown',
      customer_email: payment.booking?.rider?.email || payment.guest_booking?.guest_rider?.email || 'Unknown'
    }));

    setRecentPayments(recentPayments);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading payment analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center text-red-700">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex items-center mt-2">
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(stats.revenueChange))}
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Avg: {formatCurrency(stats.averageFare)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-gray-600">{stats.confirmedPayments} Confirmed</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-3 h-3 text-yellow-600 mr-1" />
                    <span className="text-gray-600">{stats.pendingPayments} Pending</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <XCircle className="w-3 h-3 text-red-600 mr-1" />
                    <span className="text-gray-600">{stats.failedPayments} Failed</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {stats.totalBookings > 0 ? Math.round((stats.confirmedPayments / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Payment Methods</p>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center text-sm">
                    <Banknote className="w-3 h-3 text-yellow-600 mr-1" />
                    <span className="text-gray-600">{stats.cashBankBookings} Cash/Bank</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CreditCard className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-gray-600">{stats.stripeBookings} Stripe</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {stats.totalBookings > 0 ? Math.round((stats.cashBankBookings / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {method.method === 'cash_bank' ? (
                    <Banknote className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.method === 'cash_bank' ? 'Cash/Bank Transfer' : 'Stripe'}
                    </p>
                    <p className="text-sm text-gray-500">{method.count} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(method.revenue)}</p>
                  <p className="text-sm text-gray-500">{formatPercentage(method.percentage)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {payment.payment_method === 'cash_bank' ? (
                    <Banknote className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{payment.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.processed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(payment.amount_gbp)}</p>
                  <p className={`text-xs ${
                    payment.status === 'completed' ? 'text-green-600' : 
                    payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;






