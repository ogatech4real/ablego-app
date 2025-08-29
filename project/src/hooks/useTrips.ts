import { useState, useEffect } from 'react';
import { supabase, subscriptions } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '../lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];

interface TripTracking {
  id: string;
  trip_id: string;
  lat: number;
  lng: number;
  speed_mph: number | null;
  heading: number | null;
  accuracy_meters: number | null;
  timestamp: string;
}

export const useTrips = (tripId?: string) => {
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tracking, setTracking] = useState<TripTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && tripId) {
      fetchTrip();
      fetchTracking();
    }
  }, [isAuthenticated, tripId, fetchTrip, fetchTracking]);

  // Real-time trip updates
  useEffect(() => {
    if (!tripId) return;

    const tripSubscription = subscriptions.subscribeToTrip(tripId, (payload) => {
      if (payload.eventType === 'UPDATE') {
        setTrip(payload.new as Trip);
      }
    });

    const trackingSubscription = subscriptions.subscribeToTripTracking(tripId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setTracking(prev => [...prev, payload.new as TripTracking]);
      }
    });

    return () => {
      tripSubscription.unsubscribe();
      trackingSubscription.unsubscribe();
    };
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          booking:bookings (
            pickup_address,
            dropoff_address,
            scheduled_pickup_time,
            customer_id,
            profiles (
              full_name,
              phone
            )
          ),
          driver:profiles!trips_driver_id_fkey (
            full_name,
            phone,
            profile_image_url
          ),
          vehicle:vehicles (
            make,
            model,
            color,
            license_plate
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setTrip(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    if (!tripId) return;

    try {
      const { data, error } = await supabase
        .from('trip_tracking')
        .select('*')
        .eq('trip_id', tripId)
        .order('timestamp', { ascending: true });

      if (error) {
        setError(error.message);
        return;
      }

      setTracking(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateTripStatus = async (status: Trip['status'], notes?: string) => {
    if (!tripId) return { data: null, error: { message: 'No trip ID provided' } };

    try {
      setLoading(true);
      setError(null);

      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'pickup') {
        updates.actual_pickup_time = new Date().toISOString();
      } else if (status === 'completed') {
        updates.actual_dropoff_time = new Date().toISOString();
      }

      if (notes) {
        updates.driver_notes = notes;
      }

      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return { data: null, error };
      }

      setTrip(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (lat: number, lng: number, speed?: number, heading?: number) => {
    if (!tripId) return { data: null, error: { message: 'No trip ID provided' } };

    try {
      // Update trip location
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          live_location_lat: lat,
          live_location_lng: lng,
          last_location_update: new Date().toISOString()
        })
        .eq('id', tripId);

      if (tripError) {
        setError(tripError.message);
        return { data: null, error: tripError };
      }

      // Insert tracking record
      const { data, error } = await supabase
        .from('trip_tracking')
        .insert({
          trip_id: tripId,
          lat,
          lng,
          speed_mph: speed || null,
          heading: heading || null,
          timestamp: new Date().toISOString()
        })
        .select()
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
    }
  };

  const getLatestLocation = () => {
    if (tracking.length === 0) return null;
    return tracking[tracking.length - 1];
  };

  return {
    trip,
    tracking,
    loading,
    error,
    updateTripStatus,
    updateLocation,
    getLatestLocation,
    refreshTrip: fetchTrip,
    refreshTracking: fetchTracking
  };
};