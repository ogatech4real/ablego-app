import { supabase, supabaseAdmin } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

// Helper class for database operations
class DatabaseHelper {
  // Dashboard Overview
  async getDashboardOverview() {
    try {
      // Get total users by role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role');

      if (usersError) throw usersError;

      const totalRiders = users?.filter(u => u.role === 'rider').length || 0;
      const totalDrivers = users?.filter(u => u.role === 'driver').length || 0;
      const totalSupportWorkers = users?.filter(u => u.role === 'support_worker').length || 0;

      // Get total bookings
      const { count: totalBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      if (bookingsError) throw bookingsError;

      // Get guest bookings
      const { count: totalGuestBookings, error: guestBookingsError } = await supabase
        .from('guest_bookings')
        .select('*', { count: 'exact', head: true });

      if (guestBookingsError) throw guestBookingsError;

      // Get monthly revenue (sum of fare_estimate for completed bookings this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyBookings, error: revenueError } = await supabase
        .from('bookings')
        .select('fare_estimate, payment_status')
        .gte('created_at', startOfMonth.toISOString())
        .eq('payment_status', 'confirmed');

      if (revenueError) throw revenueError;

      const monthRevenue = monthlyBookings?.reduce((sum, booking) => sum + (booking.fare_estimate || 0), 0) || 0;

      // Get active trips (bookings in progress)
      const { count: activeTrips, error: activeError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      if (activeError) throw activeError;

      return {
        data: {
          total_riders: totalRiders,
          total_drivers: totalDrivers,
          total_support_workers: totalSupportWorkers,
          total_bookings: (totalBookings || 0) + (totalGuestBookings || 0),
          month_bookings: monthlyBookings?.length || 0,
          month_revenue: monthRevenue,
          active_trips: activeTrips || 0
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Get all users with pagination and filters
  async getAllUsers(page = 1, limit = 50, filters?: { role?: string; search?: string }) {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          profiles (
            name,
            phone,
            address,
            is_verified,
            is_active,
            created_at
          )
        `);

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,profiles.name.ilike.%${filters.search}%`);
      }

      // Get total count
      const { count, error: countError } = await query.select('*', { count: 'exact', head: true });
      if (countError) throw countError;

      // Get paginated data
      const { data, error } = await query
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        error: null
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Get all bookings (both regular and guest bookings)
  async getAllBookings(page = 1, limit = 50, filters?: { status?: string; dateFrom?: string; dateTo?: string }) {
    try {
      // Get regular bookings
      let regularBookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          rider_id,
          pickup_address,
          dropoff_address,
          pickup_time,
          dropoff_time,
          vehicle_features,
          support_workers_count,
          fare_estimate,
          status,
          booking_type,
          special_requirements,
          created_at,
          profiles!bookings_rider_id_fkey (
            name,
            email,
            phone
          )
        `);

      // Get guest bookings
      let guestBookingsQuery = supabase
        .from('guest_bookings')
        .select(`
          id,
          guest_rider_id,
          pickup_address,
          dropoff_address,
          pickup_time,
          dropoff_time,
          vehicle_features,
          support_workers_count,
          fare_estimate,
          status,
          booking_type,
          special_requirements,
          created_at,
          guest_riders!guest_bookings_guest_rider_id_fkey (
            name,
            email,
            phone
          )
        `);

      // Apply filters to both queries
      if (filters?.status) {
        regularBookingsQuery = regularBookingsQuery.eq('status', filters.status);
        guestBookingsQuery = guestBookingsQuery.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        regularBookingsQuery = regularBookingsQuery.gte('created_at', filters.dateFrom);
        guestBookingsQuery = guestBookingsQuery.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        regularBookingsQuery = regularBookingsQuery.lte('created_at', filters.dateTo);
        guestBookingsQuery = guestBookingsQuery.lte('created_at', filters.dateTo);
      }

      // Execute both queries
      const [regularResult, guestResult] = await Promise.all([
        regularBookingsQuery.order('created_at', { ascending: false }),
        guestBookingsQuery.order('created_at', { ascending: false })
      ]);

      if (regularResult.error) throw regularResult.error;
      if (guestResult.error) throw guestResult.error;

      // Combine and format the results
      const regularBookings = (regularResult.data || []).map(booking => ({
        ...booking,
        booking_type: 'user' as const,
        customer_name: booking.profiles?.name,
        customer_email: booking.profiles?.email,
        customer_phone: booking.profiles?.phone
      }));

      const guestBookings = (guestResult.data || []).map(booking => ({
        ...booking,
        booking_type: 'guest' as const,
        customer_name: booking.guest_riders?.name,
        customer_email: booking.guest_riders?.email,
        customer_phone: booking.guest_riders?.phone
      }));

      const allBookings = [...regularBookings, ...guestBookings]
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      // Apply pagination
      const total = allBookings.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBookings = allBookings.slice(startIndex, endIndex);

      return {
        data: paginatedBookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        error: null
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Get driver applications
  async getDriverApplications(page = 1, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select(`
          *,
          profiles!driver_applications_user_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('driver_applications')
        .select('*', { count: 'exact', head: true });

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        error: null
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Get support worker applications
  async getSupportWorkerApplications(page = 1, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('support_worker_applications')
        .select(`
          *,
          profiles!support_worker_applications_user_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('support_worker_applications')
        .select('*', { count: 'exact', head: true });

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        error: null
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Get vehicle registrations
  async getVehicleRegistrations(page = 1, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('vehicle_registrations')
        .select(`
          *,
          profiles!vehicle_registrations_user_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('vehicle_registrations')
        .select('*', { count: 'exact', head: true });

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        },
        error: null
      };
    } catch (error) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Promote user to admin
  async promoteUserToAdmin(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Verify vehicle
  async verifyVehicle(vehicleId: string, verified: boolean, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('vehicle_registrations')
        .update({
          is_verified: verified,
          verification_notes: notes,
          verified_at: verified ? new Date().toISOString() : null
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  // Verify support worker
  async verifySupportWorker(supportWorkerId: string, verified: boolean, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('support_worker_applications')
        .update({
          is_verified: verified,
          verification_notes: notes,
          verified_at: verified ? new Date().toISOString() : null
        })
        .eq('id', supportWorkerId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

// Export singleton instance
export const db = new DatabaseHelper();
