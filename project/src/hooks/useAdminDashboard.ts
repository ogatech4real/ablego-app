import { useState, useEffect, useCallback } from 'react';
import { adminDashboardService, type AdminDashboardStats, type BookingAnalytics, type UserAnalytics, type SearchResults, type AdminNotifications } from '../services/adminDashboardService';

export const useAdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [notifications, setNotifications] = useState<AdminNotifications | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.getDashboardStats();
      
      if (error) {
        setError(error.message || 'Failed to load dashboard statistics');
        return;
      }

      setDashboardStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('An unexpected error occurred while loading dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load booking analytics
  const loadBookingAnalytics = useCallback(async (daysBack: number = 30) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.getBookingAnalytics(daysBack);
      
      if (error) {
        setError(error.message || 'Failed to load booking analytics');
        return;
      }

      setBookingAnalytics(data);
    } catch (err) {
      setError('An unexpected error occurred while loading booking analytics');
      console.error('Booking analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user analytics
  const loadUserAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.getUserAnalytics();
      
      if (error) {
        setError(error.message || 'Failed to load user analytics');
        return;
      }

      setUserAnalytics(data);
    } catch (err) {
      setError('An unexpected error occurred while loading user analytics');
      console.error('User analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search bookings
  const searchBookings = useCallback(async (
    searchTerm: string = '',
    statusFilter: string = '',
    dateFrom?: string,
    dateTo?: string,
    limitCount: number = 50
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.searchBookings(
        searchTerm,
        statusFilter,
        dateFrom,
        dateTo,
        limitCount
      );
      
      if (error) {
        setError(error.message || 'Failed to search bookings');
        return;
      }

      setSearchResults(data);
    } catch (err) {
      setError('An unexpected error occurred while searching bookings');
      console.error('Search bookings error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (
    searchTerm: string = '',
    roleFilter: string = '',
    limitCount: number = 50
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.searchUsers(
        searchTerm,
        roleFilter,
        limitCount
      );
      
      if (error) {
        setError(error.message || 'Failed to search users');
        return;
      }

      setSearchResults(data);
    } catch (err) {
      setError('An unexpected error occurred while searching users');
      console.error('Search users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await adminDashboardService.getUnreadNotifications();
      
      if (error) {
        setError(error.message || 'Failed to load notifications');
        return;
      }

      setNotifications(data);
    } catch (err) {
      setError('An unexpected error occurred while loading notifications');
      console.error('Notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await adminDashboardService.markNotificationRead(notificationId);
      
      if (error) {
        setError(error.message || 'Failed to mark notification as read');
        return false;
      }

      // Reload notifications to update the list
      await loadNotifications();
      return true;
    } catch (err) {
      setError('An unexpected error occurred while marking notification as read');
      console.error('Mark notification read error:', err);
      return false;
    }
  }, [loadNotifications]);

  // Update booking status
  const updateBookingStatus = useCallback(async (
    bookingId: string,
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  ) => {
    try {
      const { error } = await adminDashboardService.updateBookingStatus(bookingId, status);
      
      if (error) {
        setError(error.message || 'Failed to update booking status');
        return false;
      }

      // Reload dashboard stats to reflect the change
      await loadDashboardStats();
      return true;
    } catch (err) {
      setError('An unexpected error occurred while updating booking status');
      console.error('Update booking status error:', err);
      return false;
    }
  }, [loadDashboardStats]);

  // Update user status
  const updateUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    try {
      const { error } = await adminDashboardService.updateUserStatus(userId, isActive);
      
      if (error) {
        setError(error.message || 'Failed to update user status');
        return false;
      }

      // Reload user analytics to reflect the change
      await loadUserAnalytics();
      return true;
    } catch (err) {
      setError('An unexpected error occurred while updating user status');
      console.error('Update user status error:', err);
      return false;
    }
  }, [loadUserAnalytics]);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    return adminDashboardService.subscribeToDashboardUpdates((payload) => {
      console.log('🔄 Real-time dashboard update:', payload);
      
      // Reload relevant data based on the change
      if (payload.table === 'guest_bookings') {
        loadDashboardStats();
        if (bookingAnalytics) {
          loadBookingAnalytics();
        }
      } else if (payload.table === 'users') {
        loadDashboardStats();
        if (userAnalytics) {
          loadUserAnalytics();
        }
      } else if (payload.table === 'admin_notifications') {
        loadNotifications();
      }
    });
  }, [loadDashboardStats, loadBookingAnalytics, loadUserAnalytics, loadNotifications, bookingAnalytics, userAnalytics]);

  // Auto-refresh functionality
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardStats();
        if (bookingAnalytics) {
          loadBookingAnalytics();
        }
        if (userAnalytics) {
          loadUserAnalytics();
        }
        loadNotifications();
      }, 30000); // Refresh every 30 seconds

      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, loadDashboardStats, loadBookingAnalytics, loadUserAnalytics, loadNotifications, bookingAnalytics, userAnalytics]);

  // Initial load
  useEffect(() => {
    loadDashboardStats();
    loadNotifications();
  }, [loadDashboardStats, loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return {
    // State
    dashboardStats,
    bookingAnalytics,
    userAnalytics,
    searchResults,
    notifications,
    loading,
    error,
    lastUpdated,
    autoRefresh,

    // Actions
    loadDashboardStats,
    loadBookingAnalytics,
    loadUserAnalytics,
    searchBookings,
    searchUsers,
    loadNotifications,
    markNotificationRead,
    updateBookingStatus,
    updateUserStatus,
    subscribeToUpdates,
    setAutoRefresh,

    // Utilities
    clearError: () => setError(null),
    clearSearchResults: () => setSearchResults(null),
  };
};
