import { supabase } from '../lib/supabase';
import { pricingService } from './pricingService';
import type { Database } from '../lib/database.types';
import type { AddressDetails } from './googlePlacesService';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];

export interface BookingRequest {
  pickup: AddressDetails;
  dropoff: AddressDetails;
  stops?: AddressDetails[];
  scheduledPickupTime: Date;
  estimatedDurationMinutes: number;
  estimatedDistanceMiles: number;
  vehicleFeatures: string[];
  supportWorkerCount: number;
  specialRequirements?: string;
  notes?: string;
}

export interface BookingResponse {
  booking: Booking;
  fareBreakdown: unknown;
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(
    customerId: string,
    bookingRequest: BookingRequest
  ): Promise<{ data: BookingResponse | null; error: any }> {
    try {
      // Calculate fare
      const fareBreakdown = pricingService.calculateEstimatedFare(
        bookingRequest.vehicleFeatures,
        bookingRequest.supportWorkerCount,
        bookingRequest.estimatedDistanceMiles,
        bookingRequest.estimatedDurationMinutes,
        bookingRequest.scheduledPickupTime
      );

      // Prepare booking data with new coordinate fields
      const bookingData: BookingInsert = {
        rider_id: customerId,
        pickup_address: bookingRequest.pickup.formattedAddress,
        pickup_lat: bookingRequest.pickup.latitude,
        pickup_lng: bookingRequest.pickup.longitude,
        pickup_postcode: bookingRequest.pickup.postcode,
        pickup_place_id: bookingRequest.pickup.placeId,
        dropoff_address: bookingRequest.dropoff.formattedAddress,
        dropoff_lat: bookingRequest.dropoff.latitude,
        dropoff_lng: bookingRequest.dropoff.longitude,
        dropoff_postcode: bookingRequest.dropoff.postcode,
        dropoff_place_id: bookingRequest.dropoff.placeId,
        pickup_time: bookingRequest.scheduledPickupTime.toISOString(),
        dropoff_time: null,
        vehicle_features: bookingRequest.vehicleFeatures,
        support_workers_count: bookingRequest.supportWorkerCount,
        fare_estimate: fareBreakdown.estimatedTotal,
        special_requirements: bookingRequest.specialRequirements,
        notes: bookingRequest.notes,
        status: 'pending'
      };

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        return { data: null, error: bookingError };
      }

      // Create stops if any
      if (bookingRequest.stops && bookingRequest.stops.length > 0) {
        const stopsData = bookingRequest.stops.map((stop, index) => ({
          booking_id: booking.id,
          order_index: index + 1,
          stop_address: stop.formattedAddress,
          latitude: stop.latitude,
          longitude: stop.longitude
        }));

        const { error: stopsError } = await supabase
          .from('stops')
          .insert(stopsData);

        if (stopsError) {
          console.error('Error creating stops:', stopsError);
        }
      }

      // Store fare calculation
      const { error: fareError } = await supabase
        .from('pricing_logs')
        .insert({
          booking_id: booking.id,
          calculated_fare: fareBreakdown.estimatedTotal,
          breakdown_json: fareBreakdown,
          base_fare: fareBreakdown.baseFare,
          distance_cost: fareBreakdown.distanceCost,
          vehicle_features_cost: fareBreakdown.vehicleFeaturesCost,
          support_workers_cost: fareBreakdown.supportWorkersCost,
          peak_time_surcharge: fareBreakdown.peakTimeSurcharge,
          is_estimated: true
        });

      if (fareError) {
        console.error('Error storing fare calculation:', fareError);
      }

      return {
        data: {
          booking,
          fareBreakdown
        },
        error: null
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { data: null, error };
    }
  }

  /**
   * Get bookings for a user
   */
  async getUserBookings(userId: string, limit = 10): Promise<{ data: Booking[] | null; error: any }> {
    try {
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
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a specific booking
   */
  async getBooking(bookingId: string): Promise<{ data: Booking | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          stops (*),
          trip_logs (*),
          pricing_logs (*)
        `)
        .eq('id', bookingId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return { data: null, error };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string, 
    status: Database['public']['Enums']['booking_status']
  ): Promise<{ data: Booking | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return { data: null, error };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<{ data: Booking | null; error: any }> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  }
}

export const bookingService = new BookingService();