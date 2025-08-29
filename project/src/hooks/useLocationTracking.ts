import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: string | null;
  isTracking: boolean;
  error: string | null;
}

interface LocationUpdateOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number; // milliseconds
}

export const useLocationTracking = (options: LocationUpdateOptions = {}) => {
  const { user, isDriver, isSupportWorker } = useAuth();
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    isTracking: false,
    error: null
  });

  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000, // 1 minute
    updateInterval: 120000, // 2 minutes
    ...options
  };

  useEffect(() => {
    // Only track location for drivers and support workers
    if (!user || (!isDriver && !isSupportWorker)) {
      return;
    }

    return () => {
      stopTracking();
    };
  }, [user, isDriver, isSupportWorker]);

  const startTracking = async (): Promise<{ success: boolean; error?: string }> => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      setLocationState(prev => ({ ...prev, error, isTracking: false }));
      return { success: false, error };
    }

    if (!user || (!isDriver && !isSupportWorker)) {
      const error = 'Location tracking only available for drivers and support workers';
      setLocationState(prev => ({ ...prev, error, isTracking: false }));
      return { success: false, error };
    }

    try {
      setLocationState(prev => ({ ...prev, isTracking: true, error: null }));

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };

          setLocationState(prev => ({
            ...prev,
            ...locationData,
            error: null
          }));

          // Update database
          await updateLocationInDatabase(locationData);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Location access denied';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }

          setLocationState(prev => ({ 
            ...prev, 
            error: errorMessage, 
            isTracking: false 
          }));
        },
        {
          enableHighAccuracy: defaultOptions.enableHighAccuracy,
          timeout: defaultOptions.timeout,
          maximumAge: defaultOptions.maximumAge
        }
      );

      // Set up periodic database updates
      updateIntervalRef.current = setInterval(async () => {
        if (locationState.latitude && locationState.longitude) {
          await updateLocationInDatabase({
            latitude: locationState.latitude,
            longitude: locationState.longitude,
            accuracy: locationState.accuracy,
            timestamp: new Date().toISOString()
          });
        }
      }, defaultOptions.updateInterval);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start location tracking';
      setLocationState(prev => ({ ...prev, error: errorMessage, isTracking: false }));
      return { success: false, error: errorMessage };
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setLocationState(prev => ({ 
      ...prev, 
      isTracking: false,
      error: null
    }));
  };

  const updateLocationInDatabase = async (locationData: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
  }) => {
    if (!user) return;

    try {
      if (isDriver) {
        // Update vehicle location
        const { error } = await supabase
          .from('vehicles')
          .update({
            current_location_lat: locationData.latitude,
            current_location_lng: locationData.longitude,
            last_location_update: locationData.timestamp
          })
          .eq('driver_id', user.id);

        if (error) {
          console.error('Error updating driver location:', error);
        }
      } else if (isSupportWorker) {
        // Update support worker location
        const { error } = await supabase
          .from('support_workers')
          .update({
            current_location_lat: locationData.latitude,
            current_location_lng: locationData.longitude,
            last_location_update: locationData.timestamp
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating support worker location:', error);
        }
      }
    } catch (error) {
      console.error('Database location update error:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: defaultOptions.enableHighAccuracy,
          timeout: defaultOptions.timeout,
          maximumAge: defaultOptions.maximumAge
        }
      );
    });
  };

  const setOnlineStatus = async (isOnline: boolean) => {
    if (!user || (!isDriver && !isSupportWorker)) return;

    try {
      if (isOnline) {
        // Get current location first
        const location = await getCurrentLocation();
        if (!location) {
          throw new Error('Unable to get current location');
        }

        // Update status and location
        if (isDriver) {
          await supabase
            .from('vehicles')
            .update({
              is_active: true,
              current_location_lat: location.latitude,
              current_location_lng: location.longitude,
              last_location_update: new Date().toISOString()
            })
            .eq('driver_id', user.id);
        } else if (isSupportWorker) {
          await supabase
            .from('support_workers')
            .update({
              is_active: true,
              current_location_lat: location.latitude,
              current_location_lng: location.longitude,
              last_location_update: new Date().toISOString()
            })
            .eq('user_id', user.id);
        }

        // Start location tracking
        await startTracking();
      } else {
        // Go offline
        if (isDriver) {
          await supabase
            .from('vehicles')
            .update({ is_active: false })
            .eq('driver_id', user.id);
        } else if (isSupportWorker) {
          await supabase
            .from('support_workers')
            .update({ is_active: false })
            .eq('user_id', user.id);
        }

        stopTracking();
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update online status';
      setLocationState(prev => ({ ...prev, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...locationState,
    startTracking,
    stopTracking,
    getCurrentLocation,
    setOnlineStatus,
    canTrack: !!(user && (isDriver || isSupportWorker))
  };
};