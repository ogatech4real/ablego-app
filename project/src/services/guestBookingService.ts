import { supabase } from '../lib/supabase';
import type { AddressDetails } from './googlePlacesService';

export interface GuestBookingData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  createAccount?: boolean;
  password?: string;
  pickup: AddressDetails;
  dropoff: AddressDetails;
  stops?: AddressDetails[];
  pickupTime: string;
  dropoffTime?: string | null;
  vehicleFeatures: string[];
  supportWorkersCount: number;
  fareEstimate: number;
  bookingType: 'on_demand' | 'scheduled' | 'advance';
  leadTimeHours: number;
  timeMultiplier: number;
  bookingTypeDiscount: number;
  specialRequirements?: string | null;
  notes?: string | null;
  paymentMethod?: 'cash_bank' | 'stripe';
}

export interface GuestBookingResult {
  booking_id: string;
  access_token: string;
  guest_rider_id: string;
  success: boolean;
  message?: string;
  user_account?: {
    success: boolean;
    user_id?: string;
    account_status?: string;
    message?: string;
    action?: string;
    error?: string;
  };
}

class GuestBookingService {
  /**
   * Create a guest booking with optional account creation
   */
  async createGuestBooking(bookingData: GuestBookingData): Promise<GuestBookingResult> {
    try {
      console.log('📝 Creating guest booking with account creation:', {
        guest_email: bookingData.guestEmail,
        create_account: bookingData.createAccount,
        has_password: !!bookingData.password
      });

      // Call the Supabase function to create guest booking
      const { data, error } = await supabase.functions.invoke('create-guest-booking', {
        body: {
          guest_name: bookingData.guestName,
          guest_email: bookingData.guestEmail,
          guest_phone: bookingData.guestPhone,
          create_account: bookingData.createAccount || false,
          password: bookingData.password,
          booking_data: {
            pickup_address: bookingData.pickup.formattedAddress,
            pickup_lat: bookingData.pickup.latitude,
            pickup_lng: bookingData.pickup.longitude,
            pickup_postcode: bookingData.pickup.postcode,
            pickup_place_id: bookingData.pickup.placeId,
            dropoff_address: bookingData.dropoff.formattedAddress,
            dropoff_lat: bookingData.dropoff.latitude,
            dropoff_lng: bookingData.dropoff.longitude,
            dropoff_postcode: bookingData.dropoff.postcode,
            dropoff_place_id: bookingData.dropoff.placeId,
            stops: bookingData.stops?.map(stop => ({
              address: stop.formattedAddress,
              lat: stop.latitude,
              lng: stop.longitude,
              postcode: stop.postcode,
              place_id: stop.placeId
            })) || [],
            pickup_time: bookingData.pickupTime,
            dropoff_time: bookingData.dropoffTime,
            vehicle_features: bookingData.vehicleFeatures,
            support_workers_count: bookingData.supportWorkersCount,
            fare_estimate: bookingData.fareEstimate,
            booking_type: bookingData.bookingType,
            lead_time_hours: bookingData.leadTimeHours,
            time_multiplier: bookingData.timeMultiplier,
            booking_type_discount: bookingData.bookingTypeDiscount,
            special_requirements: bookingData.specialRequirements,
            notes: bookingData.notes,
            payment_method: bookingData.paymentMethod || 'cash_bank'
          }
        }
      });

      if (error) {
        console.error('❌ Guest booking error:', error);
        return {
          booking_id: '',
          access_token: '',
          guest_rider_id: '',
          success: false,
          message: error.message || 'Failed to create booking'
        };
      }

      if (data && data.success) {
        console.log('✅ Guest booking created successfully:', {
          booking_id: data.booking_id,
          user_account: data.user_account
        });

        return {
          booking_id: data.booking_id,
          access_token: data.access_token,
          guest_rider_id: data.guest_rider_id,
          success: true,
          user_account: data.user_account
        };
      } else {
        return {
          booking_id: '',
          access_token: '',
          guest_rider_id: '',
          success: false,
          message: data?.message || 'Failed to create booking',
          user_account: data?.user_account
        };
      }
    } catch (error) {
      console.error('❌ Guest booking service error:', error);
      return {
        booking_id: '',
        access_token: '',
        guest_rider_id: '',
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get guest booking by access token
   */
  async getGuestBookingByToken(token: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('booking_access_tokens')
        .select(`
          *,
          guest_booking:guest_bookings (
            *,
            guest_rider:guest_riders (*)
          )
        `)
        .eq('token', token)
        .eq('expires_at', 'gt', new Date().toISOString())
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Error fetching guest booking:', error);
      return { data: null, error };
    }
  }

  /**
   * Get guest booking by ID
   */
  async getGuestBooking(bookingId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('guest_bookings')
        .select(`
          *,
          guest_rider:guest_riders (*)
        `)
        .eq('id', bookingId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error fetching guest booking:', error);
      return { data: null, error };
    }
  }

  /**
   * Update guest booking status
   */
  async updateGuestBookingStatus(
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

      return { data, error };
    } catch (error) {
      console.error('❌ Error updating guest booking status:', error);
      return { data: null, error };
    }
  }

  /**
   * Cancel guest booking
   */
  async cancelGuestBooking(bookingId: string): Promise<{ data: any | null; error: any }> {
    return this.updateGuestBookingStatus(bookingId, 'cancelled');
  }

  /**
   * Get all guest bookings (admin function)
   */
  async getAllGuestBookings(limit = 50): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('guest_bookings')
        .select(`
          *,
          guest_rider:guest_riders (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Error fetching all guest bookings:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user account exists for email
   */
  async checkUserAccountStatus(email: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_account_status', { user_email: email });

      return { data, error };
    } catch (error) {
      console.error('❌ Error checking user account status:', error);
      return { data: null, error };
    }
  }

  /**
   * Upgrade guest booking to user account
   */
  async upgradeGuestToUserAccount(
    bookingId: string,
    password: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('upgrade_guest_to_user_account', {
          guest_booking_id: bookingId,
          password_hash: password
        });

      return { data, error };
    } catch (error) {
      console.error('❌ Error upgrading guest to user account:', error);
      return { data: null, error };
    }
  }

  /**
   * Merge guest bookings into user account
   */
  async mergeGuestBookingsToUser(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('merge_guest_bookings_to_user', { user_id: userId });

      return { data, error };
    } catch (error) {
      console.error('❌ Error merging guest bookings to user:', error);
      return { data: null, error };
    }
  }
}

export const guestBookingService = new GuestBookingService();