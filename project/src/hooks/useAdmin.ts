import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/database';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeTrips: number;
  pendingVerifications: number;
  newBookings: number;
  pendingApplications: number;
  unreadNotifications: number;
}

interface Notification {
  id: string;
  type: 'booking' | 'application' | 'user' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  action_url?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error: any;
}

export const useAdmin = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  const loadDashboardStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await db.getDashboardOverview();

      if (error) {
        setError(error.message);
        return;
      }

      // Calculate pending verifications
      const pendingVerifications = await calculatePendingVerifications();

      setStats({
        totalUsers: data?.total_riders + data?.total_drivers + data?.total_support_workers || 0,
        totalBookings: data?.total_bookings || 0,
        totalRevenue: data?.month_revenue || 0,
        activeTrips: data?.active_trips || 0,
        pendingVerifications,
        newBookings: data?.new_bookings || 0,
        pendingApplications: data?.pending_applications || 0,
        unreadNotifications: notifications.filter(n => !n.read).length
      });

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, notifications]);

  const calculatePendingVerifications = async (): Promise<number> => {
    try {
      // Count pending driver applications
      const { count: pendingDrivers } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count pending support worker applications
      const { count: pendingSupportWorkers } = await supabase
        .from('support_worker_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count pending vehicle verifications
      const { count: pendingVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      return (pendingDrivers || 0) + (pendingSupportWorkers || 0) + (pendingVehicles || 0);
    } catch (error) {
      console.error('Error calculating pending verifications:', error);
      return 0;
    }
  };

  const loadNotifications = useCallback(async () => {
    if (!isAdmin) return;

    try {
      // Get recent notifications from admin_email_notifications table
      const { data: emailNotifications, error: emailError } = await supabase
        .from('admin_email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (emailError) {
        console.error('Error loading email notifications:', emailError);
        return;
      }

      // Get recent bookings for notifications
      const { data: recentBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, status, pickup_address, dropoff_address')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(20);

      if (bookingsError) {
        console.error('Error loading recent bookings:', bookingsError);
        return;
      }

      // Get recent guest bookings
      const { data: recentGuestBookings, error: guestBookingsError } = await supabase
        .from('guest_bookings')
        .select('id, created_at, status, pickup_address, dropoff_address')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (guestBookingsError) {
        console.error('Error loading recent guest bookings:', guestBookingsError);
        return;
      }

      // Get recent applications
      const { data: recentDriverApps, error: driverAppsError } = await supabase
        .from('driver_applications')
        .select('id, created_at, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentSupportWorkerApps, error: supportWorkerAppsError } = await supabase
        .from('support_worker_applications')
        .select('id, created_at, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Transform data into notifications
      const transformedNotifications: Notification[] = [];

      // Add booking notifications
      [...(recentBookings || []), ...(recentGuestBookings || [])].forEach(booking => {
        transformedNotifications.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'New Booking',
          message: `New ${booking.status} booking from ${booking.pickup_address} to ${booking.dropoff_address}`,
          data: booking,
          read: false,
          created_at: booking.created_at,
          action_url: `/admin/bookings?booking=${booking.id}`
        });
      });

      // Add application notifications
      [...(recentDriverApps || []), ...(recentSupportWorkerApps || [])].forEach(app => {
        transformedNotifications.push({
          id: `application-${app.id}`,
          type: 'application',
          title: 'New Application',
          message: `New ${app.status} application submitted`,
          data: app,
          read: false,
          created_at: app.created_at,
          action_url: `/admin/applications?application=${app.id}`
        });
      });

      // Sort by creation date
      transformedNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [isAdmin]);

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to new bookings
    const bookingsSubscription = supabase
      .channel('admin-bookings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('New booking detected:', payload);
          loadDashboardStats();
          loadNotifications();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking updated:', payload);
          loadDashboardStats();
        }
      )
      .subscribe();

    // Subscribe to guest bookings
    const guestBookingsSubscription = supabase
      .channel('admin-guest-bookings')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guest_bookings' },
        (payload) => {
          console.log('New guest booking detected:', payload);
          loadDashboardStats();
          loadNotifications();
        }
      )
      .subscribe();

    // Subscribe to applications
    const driverAppsSubscription = supabase
      .channel('admin-driver-applications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_applications' },
        (payload) => {
          console.log('New driver application detected:', payload);
          loadDashboardStats();
          loadNotifications();
        }
      )
      .subscribe();

    const supportWorkerAppsSubscription = supabase
      .channel('admin-support-worker-applications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_worker_applications' },
        (payload) => {
          console.log('New support worker application detected:', payload);
          loadDashboardStats();
          loadNotifications();
        }
      )
      .subscribe();

    // Subscribe to user registrations
    const usersSubscription = supabase
      .channel('admin-users')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          console.log('New user detected:', payload);
          loadDashboardStats();
          loadNotifications();
        }
      )
      .subscribe();

    // Auto-refresh timer
    const refreshTimer = setInterval(() => {
      loadDashboardStats();
      loadNotifications();
    }, REFRESH_INTERVAL);

    // Initial load
    loadDashboardStats();
    loadNotifications();

    return () => {
      bookingsSubscription.unsubscribe();
      guestBookingsSubscription.unsubscribe();
      driverAppsSubscription.unsubscribe();
      supportWorkerAppsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      clearInterval(refreshTimer);
    };
  }, [isAdmin, loadDashboardStats, loadNotifications]);

  const getAllUsers = async (
    page = 1, 
    limit = 50, 
    filters?: { role?: string; search?: string }
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getAllUsers(page, limit, filters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getAllBookings = async (
    page = 1, 
    limit = 50, 
    filters?: { status?: string; dateFrom?: string; dateTo?: string }
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getAllBookings(page, limit, filters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getDriverApplications = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getDriverApplications(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getSupportWorkerApplications = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getSupportWorkerApplications(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getVehicleRegistrations = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getVehicleRegistrations(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const promoteUserToAdmin = async (userId: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.promoteUserToAdmin(userId);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const verifyVehicle = async (vehicleId: string, verified: boolean, notes?: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.verifyVehicle(vehicleId, verified, notes);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const verifySupportWorker = async (supportWorkerId: string, verified: boolean, notes?: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.verifySupportWorker(supportWorkerId, verified, notes);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    notifications,
    loading,
    error,
    lastRefresh,
    loadDashboardStats,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getAllUsers,
    getAllBookings,
    getDriverApplications,
    getSupportWorkerApplications,
    getVehicleRegistrations,
    promoteUserToAdmin,
    verifyVehicle,
    verifySupportWorker
  };
};