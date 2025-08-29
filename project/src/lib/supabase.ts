import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables
// Local development: uses .env file
// Production: uses Netlify environment variables (automatically injected at build time)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Debug environment variables in development only
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
  console.log('Service Role Key:', supabaseServiceRoleKey ? 'Present' : 'Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables for local development!');
    console.warn('For local development, please create a .env file with:');
    console.error('VITE_SUPABASE_URL=your_supabase_project_url');
    console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    console.warn('Production deployment uses Netlify environment variables automatically.');
  }
}

// Create fallback values for development if environment variables are missing
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

// Always create client (with fallbacks for development)
export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

// Admin client with service role for elevated operations  
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseServiceRoleKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== fallbackUrl && supabaseAnonKey !== fallbackKey);
};

// Helper to validate Supabase connection
export const validateSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { 
      valid: false, 
      error: 'Supabase environment variables not configured' 
    };
  }

  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      return { 
        valid: false, 
        error: `Database connection failed: ${error.message}` 
      };
    }
    
    return { valid: true, error: null };
  } catch (error) {
    return { 
      valid: false, 
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Helper function to get the correct base URL
const getBaseUrl = (): string => {
  // In production, use the production URL
  if (import.meta.env.PROD) {
    return 'https://ablego.co.uk';
  }
  
  // In development, use the current origin
  return window.location.origin;
};

// Auth helpers
export const auth = {
  signUp: async (userData: {
    email: string;
    password: string;
    options?: {
      emailRedirectTo?: string;
      data?: {
        full_name?: string;
        phone?: string;
        role?: 'rider' | 'driver' | 'support_worker' | 'admin';
      };
    };
  }) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables and restart the development server.' }
      };
    }

    try {
      console.log('Attempting signup with:', {
        email: userData.email,
        hasPassword: !!userData.password,
        redirectTo: userData.options?.emailRedirectTo,
        userData: userData.options?.data
      });

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          ...userData.options,
          emailRedirectTo: userData.options?.emailRedirectTo || `${getBaseUrl()}/auth/confirm`,
          data: userData.options?.data
        }
      });
      
      if (error) {
        console.error('Supabase signup error:', error);
        // Handle specific Supabase auth errors
        if (error.message.includes('User already registered')) {
          return { data: null, error: { ...error, message: 'An account with this email already exists. Please sign in instead.' } };
        }
        if (error.message.includes('Signup is disabled')) {
          return { data: null, error: { ...error, message: 'Account creation is temporarily disabled. Please contact support.' } };
        }
        if (error.message.includes('rate limit')) {
          return { data: null, error: { ...error, message: 'Too many signup attempts. Please wait a few minutes and try again.' } };
        }
        if (error.message.includes('Database error')) {
          return { data: null, error: { ...error, message: 'Account creation failed. Please try again or contact support if the issue persists.' } };
        }
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          return { data: null, error: { ...error, message: 'An account with this email already exists. Please sign in instead.' } };
        }
        if (error.message.includes('email') && error.message.includes('invalid')) {
          return { data: null, error: { ...error, message: 'Please enter a valid email address.' } };
        }
        if (error.message.includes('password') && error.message.includes('weak')) {
          return { data: null, error: { ...error, message: 'Password must be at least 6 characters long and contain a mix of letters and numbers.' } };
        }
        if (error.message.includes('Invalid email')) {
          return { data: null, error: { ...error, message: 'Please enter a valid email address.' } };
        }
        if (error.message.includes('Password')) {
          return { data: null, error: { ...error, message: 'Password must be at least 6 characters long.' } };
        }
        // Generic error handling for other cases
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { data: null, error: { ...error, message: 'Network error. Please check your internet connection and try again.' } };
        }
        return { data: null, error };
      }
      
      if (data.user) {
        console.log('User signed up successfully:', {
          email: data.user.email,
          id: data.user.id,
          emailConfirmed: !!data.user.email_confirmed_at,
          metadata: data.user.user_metadata
        });
        
        // With email confirmation enabled, user needs to confirm email
        return { 
          data: {
            ...data,
            needsEmailConfirmation: !data.user.email_confirmed_at,
            autoConfirmed: !!data.user.email_confirmed_at
          }, 
          error: null 
        };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Auth signup exception:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Network error. Please check your connection.' }
      };
    }
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables and restart the development server.' }
      };
    }

    try {
      console.log('Attempting Supabase signIn for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Supabase auth response:', { 
        success: !error, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message 
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Auth signIn exception:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Network error. Please check your connection.' }
      };
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured.' } };
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      // Clear any cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      return { error: null };
    } catch (error) {
      return { 
        error: { message: error instanceof Error ? error.message : 'Error signing out' }
      };
    }
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) {
      return { 
        user: null, 
        error: { message: 'Supabase is not configured.' }
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        return { user: null, error };
      }
      
      return { user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: error instanceof Error ? error.message : 'Error getting user' }
      };
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured.' } };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getBaseUrl()}/reset-password`
      });
      
      if (error) {
        if (error.message.includes('Invalid email')) {
          return { error: { ...error, message: 'Please enter a valid email address.' } };
        }
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { 
        error: { message: error instanceof Error ? error.message : 'Error sending reset email' }
      };
    }
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase is not configured.' } };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        if (error.message.includes('New password should be different')) {
          return { error: { ...error, message: 'New password must be different from your current password.' } };
        }
        if (error.message.includes('Password should be')) {
          return { error: { ...error, message: 'Password must be at least 6 characters long.' } };
        }
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { 
        error: { message: error instanceof Error ? error.message : 'Error updating password' }
      };
    }
  }
};

// Database helpers
export const db = {
  // Users & Profiles
  getProfile: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.' }
      };
    }

    try {
      console.log('Getting profile for user:', userId);
      
      // Simple profile fetch - no upsert operations
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Get profile error:', error, 'for user:', userId);
        
        return { data: null, error };
      }
      
      console.log('Successfully fetched profile:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Get profile exception:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error loading profile' }
      };
    }
  },

  updateProfile: async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Update profile error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Update profile exception:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error updating profile' }
      };
    }
  },

  // Create profile manually if needed
  createProfile: async (userId: string, profileData: {
    email: string;
    name?: string;
    phone?: string;
    role?: Database['public']['Enums']['user_role'];
  }) => {
    try {
      console.log('Creating profile for user:', userId, profileData);
      
      // Determine role - admin for admin email, otherwise use provided role
      const isAdminEmail = profileData.email === 'admin@ablego.co.uk';
      const actualRole = isAdminEmail ? 'admin' : (profileData.role || 'rider');
      
      console.log('Creating profile with role:', actualRole, 'for email:', profileData.email);
      
      // Ensure user record exists in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: profileData.email,
          role: actualRole,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (userError) {
        console.error('User upsert error:', userError);
      }
      
      // Create the profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: profileData.email,
          name: profileData.name || (isAdminEmail ? 'AbleGo Admin' : null),
          phone: profileData.phone || null,
          is_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        console.error('Create profile error:', error);
        return { data: null, error };
      }
      
      console.log('Profile created successfully:', data);
      
      return { data, error: null };
    } catch (error) {
      console.error('Create profile exception:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error creating profile' }
      };
    }
  },

  // Bookings
  createBooking: async (bookingData: Database['public']['Tables']['bookings']['Insert']) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    return { data, error };
  },

  getBookings: async (userId: string, limit = 10) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        stops (*),
        trip_logs (
          id,
          driver_id,
          vehicle_id,
          support_worker_ids,
          start_time,
          end_time,
          actual_duration,
          actual_distance,
          customer_rating,
          driver_rating,
          support_worker_rating
        ),
        pricing_logs (*)
      `)
      .eq('rider_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  updateBookingStatus: async (bookingId: string, status: Database['public']['Enums']['booking_status']) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();
    return { data, error };
  },

  // Stops
  createStops: async (stops: Database['public']['Tables']['stops']['Insert'][]) => {
    const { data, error } = await supabase
      .from('stops')
      .insert(stops)
      .select();
    return { data, error };
  },

  getStops: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('booking_id', bookingId)
      .order('order_index', { ascending: true });
    return { data, error };
  },

  // Vehicles
  getVehicles: async (driverId?: string) => {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        driver:profiles!vehicles_driver_id_fkey (
          name,
          phone,
          profile_image_url
        ),
        vehicle_insurance (*)
      `)
      .eq('is_active', true);
    
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    
    const { data, error } = await query;
    return { data, error };
  },

  createVehicle: async (vehicleData: Database['public']['Tables']['vehicles']['Insert']) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();
    return { data, error };
  },

  // Support Workers
  getSupportWorkers: async (location?: { lat: number; lng: number }, radius = 10) => {
    const { data, error } = await supabase
      .from('support_workers')
      .select(`
        *,
        user:users!user_id (
          id,
          email,
          role
        ),
        user_profile:profiles!user_id (
          name,
          phone,
          profile_image_url
        ),
        certifications (*)
      `)
      .eq('is_active', true)
      .eq('verified', true);
    return { data, error };
  },

  createSupportWorker: async (supportWorkerData: Database['public']['Tables']['support_workers']['Insert']) => {
    const { data, error } = await supabase
      .from('support_workers')
      .insert(supportWorkerData)
      .select()
      .single();
    return { data, error };
  },

  // Trip Logs
  createTripLog: async (tripData: Database['public']['Tables']['trip_logs']['Insert']) => {
    const { data, error } = await supabase
      .from('trip_logs')
      .insert(tripData)
      .select()
      .single();
    return { data, error };
  },

  updateTripLog: async (tripId: string, updates: Database['public']['Tables']['trip_logs']['Update']) => {
    const { data, error } = await supabase
      .from('trip_logs')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();
    return { data, error };
  },

  getTripLog: async (tripId: string) => {
    const { data, error } = await supabase
      .from('trip_logs')
      .select(`
        *,
        booking:bookings (
          pickup_address,
          dropoff_address,
          rider_id,
          profiles (
            name,
            phone,
            emergency_contact_name,
            emergency_contact_phone
          )
        ),
        driver:profiles!trip_logs_driver_id_fkey (
          name,
          phone,
          profile_image_url
        ),
        vehicle:vehicles (
          make,
          model,
          color,
          license_plate,
          features
        ),
        trip_tracking (*)
      `)
      .eq('id', tripId)
      .single();
    return { data, error };
  },

  // Pricing Logs
  createPricingLog: async (pricingData: Database['public']['Tables']['pricing_logs']['Insert']) => {
    const { data, error } = await supabase
      .from('pricing_logs')
      .insert(pricingData)
      .select()
      .single();
    return { data, error };
  },

  // Notifications
  createNotification: async (notificationData: Database['public']['Tables']['notifications']['Insert']) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    return { data, error };
  },

  getNotifications: async (userId: string, limit = 20) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  markNotificationAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  },

  // Trip Tracking
  addTripTracking: async (trackingData: Database['public']['Tables']['trip_tracking']['Insert']) => {
    const { data, error } = await supabase
      .from('trip_tracking')
      .insert(trackingData)
      .select()
      .single();
    return { data, error };
  },

  getTripTracking: async (tripLogId: string) => {
    const { data, error } = await supabase
      .from('trip_tracking')
      .select('*')
      .eq('trip_log_id', tripLogId)
      .order('timestamp', { ascending: true });
    return { data, error };
  },

  // Admin Functions
  getDashboardOverview: async () => {
    const { data, error } = await supabase
      .from('dashboard_overview')
      .select('*')
      .single();
    return { data, error };
  },

  // Dashboard data functions
  getRiderDashboardData: async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_rider_dashboard_data', {
        user_id: userId
      });
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading rider dashboard' }
      };
    }
  },

  getDriverDashboardData: async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_driver_dashboard_data', {
        user_id: userId
      });
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading driver dashboard' }
      };
    }
  },

  getSupportWorkerDashboardData: async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_support_worker_dashboard_data', {
        user_id: userId
      });
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading support worker dashboard' }
      };
    }
  },

  getAdminDashboardData: async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_data');
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading admin dashboard' }
      };
    }
  },

  // Enhanced admin functions using service role
  promoteUserToAdmin: async (userId: string) => {
    try {
      // Update both users and profiles tables
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (userError) {
        return { data: null, error: userError };
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error promoting user' }
      };
    }
  },

  getAllUsers: async (page = 1, limit = 50, filters?: { role?: string; search?: string }) => {
    try {
      let query = supabaseAdmin
        .from('profiles')
        .select(`
          *,
          user:users!profiles_id_fkey (
            role
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.role) {
        query = query.eq('user.role', filters.role);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      return { 
        data: data || [], 
        error,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        data: [], 
        error: { message: error instanceof Error ? error.message : 'Error fetching users' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  },

  getAllBookings: async (page = 1, limit = 50, filters?: { status?: string; dateFrom?: string; dateTo?: string }) => {
    try {
      let query = supabaseAdmin
        .from('bookings')
        .select(`
          *,
          rider:profiles!bookings_rider_id_fkey (
            name,
            phone,
            email
          ),
          stops (*),
          trip_logs (
            *,
            driver:profiles!trip_logs_driver_id_fkey (
              name,
              phone
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      return { 
        data: data || [], 
        error,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        data: [], 
        error: { message: error instanceof Error ? error.message : 'Error fetching bookings' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  },

  verifyVehicle: async (vehicleId: string, verified: boolean, notes?: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .update({
          verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Send notification to vehicle owner
      const { data: vehicle } = await supabaseAdmin
        .from('vehicles')
        .select('driver_id')
        .eq('id', vehicleId)
        .single();

      if (vehicle) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: vehicle.driver_id,
            message: verified 
              ? 'Your vehicle has been verified and is now active!'
              : 'Your vehicle verification requires attention. Please check your documents.',
            type: 'system',
            data: {
              vehicle_id: vehicleId,
              verified,
              notes
            }
          });
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error verifying vehicle' }
      };
    }
  },

  verifySupportWorker: async (supportWorkerId: string, verified: boolean, notes?: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_workers')
        .update({
          verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', supportWorkerId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Send notification to support worker
      const { data: supportWorker } = await supabaseAdmin
        .from('support_workers')
        .select('user_id')
        .eq('id', supportWorkerId)
        .single();

      if (supportWorker) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: supportWorker.user_id,
            message: verified 
              ? 'Your support worker profile has been verified! You can now accept bookings.'
              : 'Your support worker verification requires attention. Please check your documents.',
            type: 'system',
            data: {
              support_worker_id: supportWorkerId,
              verified,
              notes
            }
          });
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error verifying support worker' }
      };
    }
  },

  getTripAnalytics: async (days = 30) => {
    const { data, error } = await supabase
      .from('trip_analytics')
      .select('*')
      .gte('trip_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('trip_date', { ascending: false });
    return { data, error };
  },

  getUserAnalytics: async () => {
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*');
    return { data, error };
  },

  getRevenueAnalytics: async (days = 30) => {
    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('*')
      .gte('transaction_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });
    return { data, error };
  },

  // Guest Booking Functions
  createGuestBooking: async (
    email: string,
    name: string,
    phone: string,
    bookingData: {
      pickup_address: string;
      dropoff_address: string;
      pickup_time: string;
      dropoff_time?: string | null;
      vehicle_features: string[];
      support_workers_count: number;
      fare_estimate: number;
      booking_type: 'on_demand' | 'scheduled' | 'advance';
      lead_time_hours: number;
      time_multiplier: number;
      booking_type_discount: number;
      special_requirements?: string | null;
      notes?: string | null;
    }
  ) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Database not configured. Please check environment variables.' }
      };
    }

    try {
      // Create guest rider first
      const { data: guestRider, error: guestRiderError } = await supabase
        .from('guest_riders')
        .upsert({
          name: name,
          email: email,
          phone: phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select()
        .single();
      
      if (guestRiderError) {
        console.error('Guest rider creation error:', guestRiderError);
        return { data: null, error: guestRiderError };
      }
      
      // Create guest booking
      const { data: guestBooking, error: guestBookingError } = await supabase
        .from('guest_bookings')
        .insert({
          guest_rider_id: guestRider.id,
          ...bookingData
        })
        .select()
        .single();

      if (guestBookingError) {
        console.error('Guest booking creation error:', guestBookingError);
        return { data: null, error: guestBookingError };
      }

      // Generate access token
      const accessToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: tokenData, error: tokenError } = await supabase
        .from('booking_access_tokens')
        .insert({
          guest_booking_id: guestBooking.id,
          token: accessToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (tokenError) {
        console.error('Token creation error:', tokenError);
        return { data: null, error: tokenError };
      }

      return { 
        data: {
          booking_id: guestBooking.id,
          guest_rider_id: guestRider.id,
          access_token: accessToken,
          tracking_url: `${window.location.origin}/booking-status?token=${accessToken}`,
          booking_details: guestBooking,
          guest_details: guestRider
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error creating guest booking' }
      };
    }
  },

  // Stripe Connect Functions
  createStripeConnectAccount: async (userId: string, userType: 'driver' | 'support_worker', email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-connect-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          user_type: userType,
          email: email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe account');
      }

      return await response.json();
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Stripe account creation failed' }
      };
    }
  },

  createPaymentIntent: async (bookingId: string, amount: number, paymentBreakdown: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount: Math.round(amount * 100), // Convert to pence
          payment_breakdown: paymentBreakdown
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Payment intent creation failed' }
      };
    }
  },

  // Payment Analytics
  getPaymentAnalytics: async (days = 30) => {
    try {
      const { data, error } = await supabase
        .from('payment_splits')
        .select(`
          *,
          payment_transaction:payment_transactions (
            amount_gbp,
            processed_at,
            booking_id
          )
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading payment analytics' }
      };
    }
  },

  getUserEarnings: async (userId: string, userType: 'driver' | 'support_worker') => {
    try {
      const { data, error } = await supabase
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
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error loading earnings' }
      };
    }
  },

  getGuestBooking: async (token: string) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: { message: 'Database not configured. Please check environment variables.' }
      };
    }

    try {
      const { data, error } = await supabase
        .from('booking_access_tokens')
        .select(`
          *,
          guest_booking:guest_bookings (
            *,
            guest_rider:guest_riders (
              name,
              email,
              phone
            )
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Error retrieving booking' }
      };
    }
  },

  // Newsletter Functions
  subscribeToNewsletter: async (email: string, source: string = 'footer_signup') => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase().trim(),
          source: source,
          preferences: {
            updates: true,
            safety_tips: true,
            stories: true
          }
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Newsletter subscription failed' }
      };
    }
  },

  getNewsletterSubscribers: async (page = 1, limit = 50, filters?: { active?: boolean; search?: string }) => {
    try {
      // Use secure Edge Function instead of exposing service role key
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.active !== undefined && { active: filters.active.toString() }),
        ...(filters?.search && { search: filters.search })
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics/newsletter-subscribers?${params}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch newsletter subscribers');
      }

      const result = await response.json();

      return { 
        data: result.data || [], 
        error: null,
        pagination: result.pagination || { page: 1, limit, total: 0, pages: 0 }
      };
    } catch (error) {
      return { 
        data: [], 
        error: { message: error instanceof Error ? error.message : 'Error fetching newsletter subscribers' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  },

  unsubscribeFromNewsletter: async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase().trim())
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unsubscribe failed' }
      };
    }
  },

  exportNewsletterSubscribers: async (activeOnly: boolean = true) => {
    try {
      // Use secure Edge Function for export
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics/newsletter-export?active=${activeOnly}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const csvData = await response.json();

      return { data: csvData, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Export failed' }
      };
    }
  },

  // Test database connection and booking flow
  testBookingFlow: async () => {
    try {
      // Test basic database connectivity
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        return { 
          success: false, 
          error: `Database connection failed: ${testError.message}` 
        };
      }

      // Test guest booking function
      const testBooking = await db.createGuestBooking(
        'test@example.com',
        'Test User',
        '+44 7700 900123',
        {
          pickup_address: 'Test Pickup',
          dropoff_address: 'Test Dropoff',
          pickup_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          dropoff_time: null,
          vehicle_features: ['wheelchair_accessible'],
          support_workers_count: 1,
          fare_estimate: 25.50,
          booking_type: 'scheduled',
          lead_time_hours: 2,
          time_multiplier: 1.0,
          booking_type_discount: 0,
          special_requirements: null,
          notes: null
        }
      );

      if (testBooking.error) {
        return { 
          success: false, 
          error: `Booking flow test failed: ${testBooking.error.message}` 
        };
      }

      // Clean up test data
      if (testBooking.data) {
        await supabase
          .from('booking_access_tokens')
          .delete()
          .eq('guest_booking_id', testBooking.data.booking_id);
        
        await supabase
          .from('guest_bookings')
          .delete()
          .eq('id', testBooking.data.booking_id);
        
        await supabase
          .from('guest_riders')
          .delete()
          .eq('email', 'test@example.com');
      }

      return { 
        success: true, 
        message: 'Database and booking flow validation successful' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },

  // Application Management
  getDriverApplications: async (page = 1, limit = 20, filters?: { status?: string; search?: string }) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: [], 
        error: { message: 'Database not configured.' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }

    try {
      let query = supabaseAdmin
        .from('driver_applications')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      return { 
        data: data || [], 
        error,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        data: [], 
        error: { message: error instanceof Error ? error.message : 'Error fetching driver applications' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  },

  getSupportWorkerApplications: async (page = 1, limit = 20, filters?: { status?: string; search?: string }) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: [], 
        error: { message: 'Database not configured.' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }

    try {
      let query = supabaseAdmin
        .from('support_worker_applications')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      return { 
        data: data || [], 
        error,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        data: [], 
        error: { message: error instanceof Error ? error.message : 'Error fetching support worker applications' },
        pagination: { page: 1, limit, total: 0, pages: 0 }
      };
    }
  },

  approveApplication: async (applicationId: string, applicationType: 'driver' | 'support_worker', adminNotes?: string) => {
    try {
      const tableName = applicationType === 'driver' ? 'driver_applications' : 'support_worker_applications';
      
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', applicationId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error approving application' }
      };
    }
  },

  rejectApplication: async (applicationId: string, applicationType: 'driver' | 'support_worker', rejectionReason: string) => {
    try {
      const tableName = applicationType === 'driver' ? 'driver_applications' : 'support_worker_applications';
      
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', applicationId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Error rejecting application' }
      };
    }
  }
};

// Real-time subscriptions
export const subscriptions = {
  subscribeToBookings: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`bookings-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `rider_id=eq.${userId}`
      }, callback)
      .subscribe();
  },

  subscribeToTrip: (tripId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trip_logs',
        filter: `id=eq.${tripId}`
      }, callback)
      .subscribe();
  },

  subscribeToTripTracking: (tripId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`tracking-${tripId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_tracking',
        filter: `trip_log_id=eq.${tripId}`
      }, callback)
      .subscribe();
  },

  subscribeToNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
};

// Storage helpers
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  createSignedUrl: async (bucket: string, path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { data, error };
  }
};