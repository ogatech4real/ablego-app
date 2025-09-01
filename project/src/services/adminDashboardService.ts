import { supabase } from '../lib/supabase';
import { apiCache } from '../utils/cacheUtils';
import { 
  startPerformanceTracking, 
  endPerformanceTracking, 
  createErrorResponse, 
  ERROR_CODES,
  generateRequestId 
} from '../utils/errorUtils';

export interface AdminDashboardStats {
  dashboard_overview: {
    pending_bookings: number;
    confirmed_bookings: number;
    in_progress_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    average_fare: number;
    monthly_revenue: number;
    total_riders: number;
    total_drivers: number;
    total_support_workers: number;
    new_users_30_days: number;
    total_guest_riders: number;
    new_guests_30_days: number;
    emails_sent: number;
    emails_pending: number;
    emails_failed: number;
    last_updated: string;
  };
  recent_bookings: Array<{
    id: string;
    pickup_address: string;
    dropoff_address: string;
    fare_estimate: number;
    status: string;
    created_at: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
  }>;
  recent_users: Array<{
    id: string;
    email: string;
    role: string;
    name: string;
    phone: string;
    created_at: string;
  }>;
  email_stats: {
    total_emails: number;
    sent_emails: number;
    pending_emails: number;
    failed_emails: number;
    success_rate: number;
  };
  last_updated: string;
}

export interface BookingAnalytics {
  analytics: Array<{
    date: string;
    total_bookings: number;
    pending: number;
    confirmed: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    revenue: number;
    average_fare: number;
  }>;
  period_days: number;
  generated_at: string;
}

export interface UserAnalytics {
  users: Array<{
    id: string;
    email: string;
    role: string;
    name: string;
    phone: string;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    total_bookings: number;
    total_spent: number;
    average_booking_value: number;
    last_booking_date: string;
  }>;
  total_users: number;
  generated_at: string;
}

export interface SearchResults {
  results: any[];
  total_count: number;
  search_term: string;
  status_filter?: string;
  role_filter?: string;
  date_from?: string;
  date_to?: string;
  generated_at: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  priority: string;
  created_at: string;
  read_at?: string;
}

export interface AdminNotifications {
  notifications: AdminNotification[];
  unread_count: number;
  generated_at: string;
}

class AdminDashboardService {
  /**
   * Get comprehensive admin dashboard statistics
   */
  async getDashboardStats(): Promise<{ data: AdminDashboardStats | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (error) {
        console.error('❌ Failed to get admin dashboard stats:', error);
        return { data: null, error };
      }

      return { data: data as AdminDashboardStats, error: null };
    } catch (error) {
      console.error('❌ Admin dashboard stats error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get booking analytics with caching and performance monitoring
   */
  async getBookingAnalytics(days: number = 30): Promise<{ data: BookingAnalytics | null; error: any }> {
    const requestId = startPerformanceTracking('getBookingAnalytics');
    
    try {
      const cacheKey = apiCache.generateKey('booking_analytics', { days });
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached booking analytics');
        endPerformanceTracking(requestId, true);
        return cached;
      }

      const { data, error } = await supabase
        .rpc('get_booking_analytics', { days_back: days });

      if (error) {
        console.error('❌ Failed to get booking analytics:', error);
        const errorResponse = createErrorResponse(
          'Failed to get booking analytics',
          ERROR_CODES.QUERY_FAILED,
          requestId,
          { originalError: error.message, days },
          { function: 'getBookingAnalytics' }
        );
        endPerformanceTracking(requestId, false, error.message);
        return { data: null, error: errorResponse };
      }

      const result = { data: data as BookingAnalytics, error: null };
      
      // Cache for 5 minutes (analytics data changes less frequently)
      apiCache.set(cacheKey, result, 5 * 60 * 1000);
      
      endPerformanceTracking(requestId, true);
      return result;
    } catch (error) {
      console.error('❌ Booking analytics error:', error);
      const errorResponse = createErrorResponse(
        'Internal error getting booking analytics',
        ERROR_CODES.INTERNAL_ERROR,
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error', days },
        { function: 'getBookingAnalytics' }
      );
      endPerformanceTracking(requestId, false, error instanceof Error ? error.message : 'Unknown error');
      return { data: null, error: errorResponse };
    }
  }

  /**
   * Get user analytics with caching and performance monitoring
   */
  async getUserAnalytics(): Promise<{ data: UserAnalytics | null; error: any }> {
    const requestId = startPerformanceTracking('getUserAnalytics');
    
    try {
      const cacheKey = apiCache.generateKey('user_analytics');
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached user analytics');
        endPerformanceTracking(requestId, true);
        return cached;
      }

      const { data, error } = await supabase
        .rpc('get_user_analytics');

      if (error) {
        console.error('❌ Failed to get user analytics:', error);
        const errorResponse = createErrorResponse(
          'Failed to get user analytics',
          ERROR_CODES.QUERY_FAILED,
          requestId,
          { originalError: error.message },
          { function: 'getUserAnalytics' }
        );
        endPerformanceTracking(requestId, false, error.message);
        return { data: null, error: errorResponse };
      }

      const result = { data: data as UserAnalytics, error: null };
      
      // Cache for 10 minutes (user data changes slowly)
      apiCache.set(cacheKey, result, 10 * 60 * 1000);
      
      endPerformanceTracking(requestId, true);
      return result;
    } catch (error) {
      console.error('❌ User analytics error:', error);
      const errorResponse = createErrorResponse(
        'Internal error getting user analytics',
        ERROR_CODES.INTERNAL_ERROR,
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' },
        { function: 'getUserAnalytics' }
      );
      endPerformanceTracking(requestId, false, error instanceof Error ? error.message : 'Unknown error');
      return { data: null, error: errorResponse };
    }
  }

  /**
   * Search bookings with advanced filtering
   */
  async searchBookings(
    searchTerm: string = '',
    statusFilter: string = '',
    dateFrom?: string,
    dateTo?: string,
    limitCount: number = 50
  ): Promise<{ data: SearchResults | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('search_bookings', {
          search_term: searchTerm,
          status_filter: statusFilter,
          date_from: dateFrom,
          date_to: dateTo,
          limit_count: limitCount
        });

      if (error) {
        console.error('❌ Failed to search bookings:', error);
        return { data: null, error };
      }

      return { data: data as SearchResults, error: null };
    } catch (error) {
      console.error('❌ Search bookings error:', error);
      return { data: null, error };
    }
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(
    searchTerm: string = '',
    roleFilter: string = '',
    limitCount: number = 50
  ): Promise<{ data: SearchResults | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('search_users', {
          search_term: searchTerm,
          role_filter: roleFilter,
          limit_count: limitCount
        });

      if (error) {
        console.error('❌ Failed to search users:', error);
        return { data: null, error };
      }

      return { data: data as SearchResults, error: null };
    } catch (error) {
      console.error('❌ Search users error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get unread admin notifications
   */
  async getUnreadNotifications(): Promise<{ data: AdminNotifications | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_admin_notifications');

      if (error) {
        console.error('❌ Failed to get unread notifications:', error);
        return { data: null, error };
      }

      return { data: data as AdminNotifications, error: null };
    } catch (error) {
      console.error('❌ Get unread notifications error:', error);
      return { data: null, error };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<{ data: boolean | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('mark_admin_notification_read', { notification_id: notificationId });

      if (error) {
        console.error('❌ Failed to mark notification as read:', error);
        return { data: null, error };
      }

      return { data: data as boolean, error: null };
    } catch (error) {
      console.error('❌ Mark notification read error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all admin notifications using new RPC function
   */
  async getAllNotifications(limit: number = 100): Promise<{ data: AdminNotification[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_notifications', { 
          limit_count: limit, 
          offset_count: 0 
        });

      if (error) {
        console.error('❌ Failed to get all notifications:', error);
        return { data: null, error };
      }

      // Transform the data to match AdminNotification interface
      const notifications: AdminNotification[] = (data || []).map((notification: any) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: {
          related_entity_type: notification.related_entity_type,
          related_entity_id: notification.related_entity_id
        },
        is_read: notification.read,
        priority: 'normal', // Default priority
        created_at: notification.created_at,
        read_at: notification.read ? notification.updated_at : undefined
      }));

      return { data: notifications, error: null };
    } catch (error) {
      console.error('❌ Get all notifications error:', error);
      return { data: null, error };
    }
  }

  /**
   * Mark multiple notifications as read using new RPC function
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<{ data: boolean | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('mark_notifications_as_read', { 
          notification_ids: notificationIds 
        });

      if (error) {
        console.error('❌ Failed to mark notifications as read:', error);
        return { data: null, error };
      }

      return { data: data as boolean, error: null };
    } catch (error) {
      console.error('❌ Mark notifications as read error:', error);
      return { data: null, error };
    }
  }

  /**
   * Create admin notification
   */
  async createNotification(
    type: string,
    title: string,
    message: string,
    data: any = {},
    priority: string = 'normal'
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: result, error } = await supabase
        .rpc('create_admin_notification', {
          notification_type: type,
          notification_title: title,
          notification_message: message,
          notification_data: data,
          notification_priority: priority
        });

      if (error) {
        console.error('❌ Failed to create notification:', error);
        return { data: null, error };
      }

      return { data: result as string, error: null };
    } catch (error) {
      console.error('❌ Create notification error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('admin_email_analytics')
        .select('*')
        .order('email_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('❌ Failed to get email analytics:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Email analytics error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get booking analytics view
   */
  async getBookingAnalyticsView(): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('admin_booking_analytics')
        .select('*')
        .order('booking_date', { ascending: false })
        .limit(90);

      if (error) {
        console.error('❌ Failed to get booking analytics view:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Booking analytics view error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user analytics view
   */
  async getUserAnalyticsView(): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('admin_user_analytics')
        .select('*')
        .order('total_spent', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Failed to get user analytics view:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ User analytics view error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get dashboard overview with caching and performance monitoring
   */
  async getDashboardOverview(): Promise<{ data: any | null; error: any }> {
    const requestId = startPerformanceTracking('getDashboardOverview');
    
    try {
      // Check cache first
      const cacheKey = apiCache.generateKey('dashboard_overview');
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached dashboard overview');
        endPerformanceTracking(requestId, true);
        return cached;
      }

      const { data, error } = await supabase
        .from('admin_dashboard_overview')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Failed to get dashboard overview:', error);
        const errorResponse = createErrorResponse(
          'Failed to get dashboard overview',
          ERROR_CODES.QUERY_FAILED,
          requestId,
          { originalError: error.message },
          { function: 'getDashboardOverview' }
        );
        endPerformanceTracking(requestId, false, error.message);
        return { data: null, error: errorResponse };
      }

      const result = { data, error: null };
      
      // Cache for 2 minutes (dashboard data changes frequently)
      apiCache.set(cacheKey, result, 2 * 60 * 1000);
      
      endPerformanceTracking(requestId, true);
      return result;
    } catch (error) {
      console.error('❌ Dashboard overview error:', error);
      const errorResponse = createErrorResponse(
        'Internal error getting dashboard overview',
        ERROR_CODES.INTERNAL_ERROR,
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' },
        { function: 'getDashboardOverview' }
      );
      endPerformanceTracking(requestId, false, error instanceof Error ? error.message : 'Unknown error');
      return { data: null, error: errorResponse };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('guest_bookings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update booking status:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Update booking status error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    isActive: boolean
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update user status:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Update user status error:', error);
      return { data: null, error };
    }
  }

  /**
   * Get real-time dashboard updates
   */
  async subscribeToDashboardUpdates(callback: (payload: any) => void): Promise<{ error: any }> {
    try {
      const subscription = supabase
        .channel('admin_dashboard_updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'guest_bookings' 
          }, 
          callback
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'users' 
          }, 
          callback
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'admin_notifications' 
          }, 
          callback
        )
        .subscribe();

      return { error: null };
    } catch (error) {
      console.error('❌ Dashboard subscription error:', error);
      return { error };
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
