import { useState, useEffect } from 'react';
import { supabase, db } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type Stop = Database['public']['Tables']['stops']['Row'];

interface BookingWithDetails extends Booking {
  stops?: Stop[];
  trip_logs?: Array<{
    id: string;
    driver_id: string | null;
    vehicle_id: string | null;
    support_worker_ids: string[] | null;
    start_time: string | null;
    end_time: string | null;
    actual_duration: number | null;
    actual_distance: number | null;
    customer_rating: number | null;
    driver_rating: number | null;
    support_worker_rating: number | null;
  }>;
  pricing_logs?: Array<{
    id: string;
    calculated_fare: number;
    breakdown_json: any;
    peak_multiplier: number | null;
    duration_modifier: number | null;
  }>;
}

export const useBookings = () => {
  const { user, isAuthenticated, isRider } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && isRider) {
      fetchBookings();
    }
  }, [isAuthenticated, user, isRider]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await db.getBookings(user.id);

      if (error) {
        setError(error.message);
        return;
      }

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (
    bookingData: Omit<BookingInsert, 'rider_id'>,
    stops?: Array<{
      order_index: number;
      stop_address: string;
      latitude: number;
      longitude: number;
    }>
  ) => {
    if (!user) {
      return { data: null, error: { message: 'No authenticated user' } };
    }

    try {
      setLoading(true);
      setError(null);

      // Create booking
      const { data: booking, error: bookingError } = await db.createBooking({
        ...bookingData,
        rider_id: user.id
      });

      if (bookingError) {
        setError(bookingError.message);
        return { data: null, error: bookingError };
      }

      // Create stops if provided
      if (stops && stops.length > 0) {
        const stopsData = stops.map(stop => ({
          ...stop,
          booking_id: booking.id
        }));

        const { error: stopsError } = await db.createStops(stopsData);
        
        if (stopsError) {
          console.error('Error creating stops:', stopsError);
        }
      }

      // Refresh bookings list
      await fetchBookings();

      return { data: booking, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (
    bookingId: string, 
    status: Database['public']['Enums']['booking_status']
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await db.updateBookingStatus(bookingId, status);

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status }
          : booking
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const { data, error } = await updateBookingStatus(bookingId, 'cancelled');
      
      if (!error && reason) {
        // Add cancellation note
        await supabase
          .from('bookings')
          .update({ 
            notes: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);
      }

      return { data, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const getBookingDetails = async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          stops (*),
          trip_logs (
            *,
            driver:profiles!driver_id (
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
          ),
          pricing_logs (*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`bookings-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `rider_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookings(prev => [payload.new as BookingWithDetails, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => prev.map(booking => 
            booking.id === payload.new.id 
              ? { ...booking, ...payload.new }
              : booking
          ));
        } else if (payload.eventType === 'DELETE') {
          setBookings(prev => prev.filter(booking => booking.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    getBookingDetails,
    refreshBookings: fetchBookings
  };
};