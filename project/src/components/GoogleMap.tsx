import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Users, Car, AlertTriangle, Route, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { googleMapsService } from '../services/googleMapsService';
import { type AddressDetails } from '../services/googlePlacesService';

interface MapLocation {
  lat: number;
  lng: number;
}

interface VerifiedDriver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lat: number;
  lng: number;
  verified: boolean;
  vehicle: {
    make: string;
    model: string;
    color: string;
    license_plate: string;
    features: string[];
    accessible_rating: number;
    passenger_capacity: number;
    wheelchair_capacity: number;
  };
  last_update: string;
}

interface VerifiedSupportWorker {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lat: number;
  lng: number;
  verified: boolean;
  hourly_rate: number;
  specializations: string[];
  languages: string[];
  experience_years: number;
  last_update: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  distanceMiles: number;
  durationMinutes: number;
}

interface GoogleMapProps {
  pickup?: string;
  dropoff?: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  stops?: Array<{ address: string; coords: { lat: number; lng: number } }>;
  showProviders?: boolean;
  maxProviders?: number;
  searchRadius?: number; // kilometers
  className?: string;
  onRouteUpdate?: (routeInfo: RouteInfo) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  pickup, 
  dropoff, 
  pickupCoords, 
  dropoffCoords, 
  stops = [],
  showProviders = true,
  maxProviders = 25,
  searchRadius = 10, // 10km default radius
  className = '',
  onRouteUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [markers, setMarkers] = useState<any[]>([]);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [verifiedDrivers, setVerifiedDrivers] = useState<VerifiedDriver[]>([]);
  const [verifiedSupportWorkers, setVerifiedSupportWorkers] = useState<VerifiedSupportWorker[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [totalProvidersInArea, setTotalProvidersInArea] = useState({ drivers: 0, supportWorkers: 0 });

  // Route calculation effect
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      calculateRoute();
    }
  }, [pickupCoords, dropoffCoords, stops]);

  // Calculate route with real-time updates
  const calculateRoute = useCallback(async () => {
    if (!pickupCoords || !dropoffCoords) return;

    setIsCalculatingRoute(true);

    try {
      // Clear existing route
      if (routePolyline) {
        routePolyline.setMap(null);
      }

      // Prepare waypoints for the route
      const waypoints = [pickupCoords, ...stops.map(stop => stop.coords), dropoffCoords];
      
      // Calculate route using Google Maps service
      const routeResult = await googleMapsService.getMultiStopRoute(waypoints);
      
      if (routeResult && routeResult.status === 'OK') {
        // Create polyline for the route
        const polyline = new google.maps.Polyline({
          path: waypoints,
          geodesic: true,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map
        });

        setRoutePolyline(polyline);

        // Update route info
        const newRouteInfo: RouteInfo = {
          distance: routeResult.distance.text,
          duration: routeResult.duration.text,
          distanceMiles: routeResult.distance.miles,
          durationMinutes: routeResult.duration.minutes
        };

        setRouteInfo(newRouteInfo);
        
        // Notify parent component
        if (onRouteUpdate) {
          onRouteUpdate(newRouteInfo);
        }

        // Adjust map bounds to show the entire route
        if (map) {
          const bounds = new google.maps.LatLngBounds();
          waypoints.forEach(point => bounds.extend(point));
          map.fitBounds(bounds);
          
          // Ensure minimum zoom level
          const listener = google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom() && map.getZoom()! > 15) {
              map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          });
        }
      }
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [pickupCoords, dropoffCoords, stops, map, routePolyline, onRouteUpdate]);

  useEffect(() => {
    // Check if Google Maps API is available
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      setUserLocation({ lat: 51.5074, lng: -0.1278 }); // London fallback
      return;
    }

    // Check if user has already granted location permission
    if (navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          if (result.state === 'prompt') {
            setShowLocationModal(true);
          } else if (result.state === 'granted') {
            getCurrentLocation();
          }
        });
      } else {
        // Fallback for browsers without permissions API
        getCurrentLocation();
      }
    }
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current && window.google) {
      initializeMap();
    }
  }, [userLocation, verifiedDrivers, verifiedSupportWorkers]);

  const loadNearbyProviders = async () => {
    if (!userLocation) return;

    try {
      setLoadingProviders(true);
      setProvidersError(null);

      // Calculate bounding box for the search radius
      const radiusInDegrees = searchRadius / 111; // Rough conversion: 1 degree ≈ 111km
      const bounds = {
        north: userLocation.lat + radiusInDegrees,
        south: userLocation.lat - radiusInDegrees,
        east: userLocation.lng + radiusInDegrees,
        west: userLocation.lng - radiusInDegrees
      };

      // Load verified drivers with their vehicles and current locations
      const { data: driversData, error: driversError } = await supabase
        .from('vehicles')
        .select(`
          id,
          make,
          model,
          color,
          license_plate,
          features,
          accessible_rating,
          passenger_capacity,
          wheelchair_capacity,
          current_location_lat,
          current_location_lng,
          last_location_update,
          driver_profile:profiles (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('verified', true)
        .eq('is_active', true)
        .not('current_location_lat', 'is', null)
        .not('current_location_lng', 'is', null)
        .gte('current_location_lat', bounds.south)
        .lte('current_location_lat', bounds.north)
        .gte('current_location_lng', bounds.west)
        .lte('current_location_lng', bounds.east)
        .gte('last_location_update', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Within last 15 minutes

      // Get total count for display purposes
      const { count: totalDriversCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('verified', true)
        .eq('is_active', true)
        .not('current_location_lat', 'is', null)
        .gte('current_location_lat', bounds.south)
        .lte('current_location_lat', bounds.north)
        .gte('current_location_lng', bounds.west)
        .lte('current_location_lng', bounds.east)
        .gte('last_location_update', new Date(Date.now() - 15 * 60 * 1000).toISOString());
      if (driversError) {
        console.error('Error loading drivers:', driversError);
      } else {
        let drivers: VerifiedDriver[] = (driversData || [])
          .filter(vehicle => vehicle.driver_profile && vehicle.current_location_lat && vehicle.current_location_lng)
          .map(vehicle => ({
            id: vehicle.driver_profile.id,
            name: vehicle.driver_profile.name || 'Driver',
            email: vehicle.driver_profile.email,
            phone: vehicle.driver_profile.phone,
            lat: vehicle.current_location_lat,
            lng: vehicle.current_location_lng,
            verified: true,
            vehicle: {
              make: vehicle.make,
              model: vehicle.model,
              color: vehicle.color,
              license_plate: vehicle.license_plate,
              features: vehicle.features || [],
              accessible_rating: vehicle.accessible_rating || 1,
              passenger_capacity: vehicle.passenger_capacity || 4,
              wheelchair_capacity: vehicle.wheelchair_capacity || 0
            },
            last_update: vehicle.last_location_update || ''
          }));

        // Calculate distance and sort by proximity
        drivers = drivers
          .map(driver => ({
            ...driver,
            distance: calculateDistance(userLocation.lat, userLocation.lng, driver.lat, driver.lng)
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, Math.floor(maxProviders * 0.6)); // 60% of markers for drivers
        setVerifiedDrivers(drivers);
        setTotalProvidersInArea(prev => ({ ...prev, drivers: totalDriversCount || 0 }));
      }

      // Load verified support workers with current locations
      const { data: supportWorkersData, error: supportWorkersError } = await supabase
        .from('support_workers')
        .select(`
          id,
          hourly_rate,
          specializations,
          languages,
          experience_years,
          current_location_lat,
          current_location_lng,
          last_location_update,
          user_profile:profiles (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('verified', true)
        .eq('is_active', true)
        .not('current_location_lat', 'is', null)
        .not('current_location_lng', 'is', null)
        .gte('current_location_lat', bounds.south)
        .lte('current_location_lat', bounds.north)
        .gte('current_location_lng', bounds.west)
        .lte('current_location_lng', bounds.east)
        .gte('last_location_update', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Within last 15 minutes

      // Get total count for display purposes
      const { count: totalSupportWorkersCount } = await supabase
        .from('support_workers')
        .select('id', { count: 'exact', head: true })
        .eq('verified', true)
        .eq('is_active', true)
        .not('current_location_lat', 'is', null)
        .gte('current_location_lat', bounds.south)
        .lte('current_location_lat', bounds.north)
        .gte('current_location_lng', bounds.west)
        .lte('current_location_lng', bounds.east)
        .gte('last_location_update', new Date(Date.now() - 15 * 60 * 1000).toISOString());
      if (supportWorkersError) {
        console.error('Error loading support workers:', supportWorkersError);
      } else {
        let supportWorkers: VerifiedSupportWorker[] = (supportWorkersData || [])
          .filter(worker => worker.user_profile && worker.current_location_lat && worker.current_location_lng)
          .map(worker => ({
            id: worker.user_profile.id,
            name: worker.user_profile.name || 'Support Worker',
            email: worker.user_profile.email,
            phone: worker.user_profile.phone,
            lat: worker.current_location_lat,
            lng: worker.current_location_lng,
            verified: true,
            hourly_rate: worker.hourly_rate || 20.50,
            specializations: worker.specializations || [],
            languages: worker.languages || ['English'],
            experience_years: worker.experience_years || 0,
            last_update: worker.last_location_update || ''
          }));

        // Calculate distance and sort by proximity
        supportWorkers = supportWorkers
          .map(worker => ({
            ...worker,
            distance: calculateDistance(userLocation.lat, userLocation.lng, worker.lat, worker.lng)
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, Math.floor(maxProviders * 0.4)); // 40% of markers for support workers
        setVerifiedSupportWorkers(supportWorkers);
        setTotalProvidersInArea(prev => ({ ...prev, supportWorkers: totalSupportWorkersCount || 0 }));
      }

    } catch (error) {
      console.error('Error loading nearby providers:', error);
      setProvidersError('Unable to load nearby drivers and support workers');
    } finally {
      setLoadingProviders(false);
    }
  };
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationPermission('granted');
          setShowLocationModal(false);
        },
        (error) => {
          if (error.code === error.TIMEOUT) {
            console.warn('Location request timed out, using fallback location');
          } else {
            console.error('Error getting location:', error);
          }
          // Fallback to London coordinates
          setUserLocation({ lat: 51.5074, lng: -0.1278 });
          setLocationPermission('denied');
          setShowLocationModal(false);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    } else {
      // Fallback to London coordinates
      setUserLocation({ lat: 51.5074, lng: -0.1278 });
      setShowLocationModal(false);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const handleLocationRequest = () => {
    getCurrentLocation();
  };

  const initializeMap = () => {
    if (!userLocation || !mapRef.current || !(window as any).google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setMap(mapInstance);
    addMarkers(mapInstance);
  };

  const createPulsingMarker = (
    map: google.maps.Map,
    position: { lat: number; lng: number },
    type: 'user' | 'driver' | 'support',
    info?: VerifiedDriver | VerifiedSupportWorker,
    distance?: number
  ) => {
    const marker = new google.maps.Marker({
      position,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: type === 'user' ? 8 : 6,
        fillColor: type === 'user' ? '#3B82F6' : type === 'driver' ? '#10B981' : '#F97316',
        fillOpacity: 0.8,
        strokeColor: 'white',
        strokeWeight: 2
      },
      animation: google.maps.Animation.DROP,
      title: info ? (type === 'driver' ? 
        `${info.name} - ${(info as VerifiedDriver).vehicle.make} ${(info as VerifiedDriver).vehicle.model}${distance ? ` (${distance.toFixed(1)}km away)` : ''}` :
        `${info.name} - Support Worker${distance ? ` (${distance.toFixed(1)}km away)` : ''}`
      ) : undefined
    });

    // Add hover tooltip and click info window for verified providers
    if (info && type !== 'user') {
      let tooltipContent = '';
      
      if (type === 'driver') {
        const driver = info as VerifiedDriver;
        tooltipContent = `
          <div class="p-4 max-w-xs">
            <div class="flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
              </svg>
              <span class="font-bold text-gray-800">${driver.name}</span>
            </div>
            <div class="space-y-2 text-sm">
              ${distance ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Distance:</span>
                <span class="font-medium text-blue-600">${distance.toFixed(1)}km away</span>
              </div>
              ` : ''}
              <div class="flex justify-between">
                <span class="text-gray-600">Vehicle:</span>
                <span class="font-medium">${driver.vehicle.make} ${driver.vehicle.model}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Color:</span>
                <span class="font-medium">${driver.vehicle.color}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Capacity:</span>
                <span class="font-medium">${driver.vehicle.passenger_capacity} passengers</span>
              </div>
              ${driver.vehicle.wheelchair_capacity > 0 ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Wheelchair:</span>
                <span class="font-medium text-blue-600">${driver.vehicle.wheelchair_capacity} spaces</span>
              </div>
              ` : ''}
              <div class="flex justify-between">
                <span class="text-gray-600">Rating:</span>
                <span class="font-medium">${driver.vehicle.accessible_rating}/5 ⭐</span>
              </div>
              ${driver.vehicle.features.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <span class="text-gray-600 text-xs">Features:</span>
                <p class="text-xs text-blue-600">${driver.vehicle.features.join(', ')}</p>
              </div>
              ` : ''}
              <div class="text-xs text-gray-500 mt-2">
                <span class="text-green-600 font-medium">✓ Verified Driver</span> • 
                Updated ${new Date(driver.last_update).toLocaleTimeString()}
              </div>
            </div>
          </div>
        `;
      } else {
        const worker = info as VerifiedSupportWorker;
        tooltipContent = `
          <div class="p-4 max-w-xs">
            <div class="flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
              <span class="font-bold text-gray-800">${worker.name}</span>
            </div>
            <div class="space-y-2 text-sm">
              ${distance ? `
              <div class="flex justify-between">
                <span class="text-gray-600">Distance:</span>
                <span class="font-medium text-orange-600">${distance.toFixed(1)}km away</span>
              </div>
              ` : ''}
              <div class="flex justify-between">
                <span class="text-gray-600">Rate:</span>
                <span class="font-medium">£${worker.hourly_rate}/hour</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Experience:</span>
                <span class="font-medium">${worker.experience_years} years</span>
              </div>
              ${worker.specializations.length > 0 ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <span class="text-gray-600 text-xs">Specializations:</span>
                <p class="text-xs text-orange-600">${worker.specializations.slice(0, 3).join(', ')}${worker.specializations.length > 3 ? '...' : ''}</p>
              </div>
              ` : ''}
              <div class="flex justify-between">
                <span class="text-gray-600">Languages:</span>
                <span class="font-medium text-xs">${worker.languages.slice(0, 2).join(', ')}</span>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                <span class="text-green-600 font-medium">✓ Verified Support Worker</span> • 
                Updated ${new Date(worker.last_update).toLocaleTimeString()}
              </div>
            </div>
          </div>
        `;
      }

      const infoWindow = new google.maps.InfoWindow({
        content: tooltipContent,
        maxWidth: 300
      });

      // Add hover listeners for tooltip
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      // Keep click listener for mobile devices
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    }

    return marker;
  };

  const addMarkers = (mapInstance: google.maps.Map) => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = createPulsingMarker(mapInstance, userLocation, 'user');
      newMarkers.push(userMarker);
    }

    // Add verified driver markers with animation delay
    verifiedDrivers.forEach((driver, index) => {
      setTimeout(() => {
        const driverMarker = createPulsingMarker(
          mapInstance,
          { lat: driver.lat, lng: driver.lng },
          'driver',
          driver,
          (driver as any).distance
        );
        newMarkers.push(driverMarker);
      }, (index + 1) * 300);
    });

    // Add verified support worker markers with animation delay
    verifiedSupportWorkers.forEach((worker, index) => {
      setTimeout(() => {
        const workerMarker = createPulsingMarker(
          mapInstance,
          { lat: worker.lat, lng: worker.lng },
          'support',
          worker,
          (worker as any).distance
        );
        newMarkers.push(workerMarker);
      }, (index + verifiedDrivers.length + 1) * 300);
    });

    setMarkers(newMarkers);
  };

  // Add pickup, stops, and dropoff markers when addresses are provided
  useEffect(() => {
    if (map && pickupCoords && dropoffCoords) {
      // Clear existing route markers
      markers.forEach(marker => {
        if (marker.getTitle && (marker.getTitle()?.includes('Pickup') || 
            marker.getTitle()?.includes('Dropoff') || 
            marker.getTitle()?.includes('Stop'))) {
          marker.setMap(null);
        }
      });

      // Add pickup marker
      const pickupMarker = new google.maps.Marker({
        position: pickupCoords,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3
        },
        title: 'Pickup Location',
        animation: google.maps.Animation.DROP
      });

      const pickupInfo = new google.maps.InfoWindow({
        content: `<div class="p-3 text-center">
          <div class="flex items-center justify-center mb-2">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <strong class="text-gray-800">Pickup Location</strong>
          </div>
          <p class="text-sm text-gray-600">${pickup || 'Selected location'}</p>
        </div>`
      });

      pickupMarker.addListener('click', () => {
        pickupInfo.open(map, pickupMarker);
      });

      // Add stop markers
      const stopMarkers: any[] = [];
      stops.forEach((stop, index) => {
        const stopMarker = new google.maps.Marker({
          position: stop.coords,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#F97316',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3
          },
          title: `Stop ${index + 1}`,
          animation: google.maps.Animation.DROP
        });

        const stopInfo = new google.maps.InfoWindow({
          content: `<div class="p-3 text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <strong class="text-gray-800">Stop ${index + 1}</strong>
            </div>
            <p class="text-sm text-gray-600">${stop.address}</p>
          </div>`
        });

        stopMarker.addListener('click', () => {
          stopInfo.open(map, stopMarker);
        });

        stopMarkers.push(stopMarker);
      });
      // Add dropoff marker
      const dropoffMarker = new google.maps.Marker({
        position: dropoffCoords,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3
        },
        title: 'Dropoff Location',
        animation: google.maps.Animation.DROP
      });

      const dropoffInfo = new google.maps.InfoWindow({
        content: `<div class="p-3 text-center">
          <div class="flex items-center justify-center mb-2">
            <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <strong class="text-gray-800">Dropoff Location</strong>
          </div>
          <p class="text-sm text-gray-600">${dropoff || 'Selected location'}</p>
        </div>`
      });

      dropoffMarker.addListener('click', () => {
        dropoffInfo.open(map, dropoffMarker);
      });

      // Draw multi-stop route
      const routeWaypoints = [pickupCoords, ...stops.map(stop => stop.coords), dropoffCoords];
      new google.maps.Polyline({
        path: routeWaypoints,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
      });

      // Adjust map bounds to show both markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupCoords);
      stops.forEach(stop => bounds.extend(stop.coords));
      bounds.extend(dropoffCoords);
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });

      // Add markers to tracking array
      setMarkers(prev => [...prev, pickupMarker, ...stopMarkers, dropoffMarker]);
    }
  }, [map, pickupCoords, dropoffCoords, stops, pickup, dropoff]);

  return (
    <>
      <div className={`relative ${className}`}>
        <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden bg-gray-100">
          {!userLocation && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {window.google ? 'Loading map...' : 'Map service unavailable'}
                </p>
                {!window.google && (
                  <p className="text-sm text-gray-500 mt-2">
                    Google Maps API not configured
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Drivers ({verifiedDrivers.length}/{totalProvidersInArea.drivers})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Support ({verifiedSupportWorkers.length}/{totalProvidersInArea.supportWorkers})</span>
            </div>
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2">
              <p>Within {searchRadius}km radius</p>
              <p>Showing closest {maxProviders} providers</p>
            </div>
            {loadingProviders && (
              <div className="flex items-center text-blue-600">
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Loading...</span>
              </div>
            )}
            {providersError && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-3 h-3 mr-2" />
                <span className="text-xs">Error loading providers</span>
              </div>
            )}
          </div>
        </div>

        {/* Provider Count Display */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <div className="flex items-center">
                <Car className="w-4 h-4 text-green-600 mr-1" />
                <span className="font-medium">{verifiedDrivers.length}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 text-orange-600 mr-1" />
                <span className="font-medium">{verifiedSupportWorkers.length}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {verifiedDrivers.length + verifiedSupportWorkers.length > 0 ? (
                <>
                  Available nearby
                  {(totalProvidersInArea.drivers + totalProvidersInArea.supportWorkers) > (verifiedDrivers.length + verifiedSupportWorkers.length) && (
                    <span className="block text-blue-600">
                      +{(totalProvidersInArea.drivers + totalProvidersInArea.supportWorkers) - (verifiedDrivers.length + verifiedSupportWorkers.length)} more in area
                    </span>
                  )}
                </>
              ) : (
                'No providers nearby'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Enable Location Services
              </h3>
              
              <p className="text-gray-600 mb-6">
                AbleGo needs your location to show nearby support vehicles and workers for the best service experience.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={handleLocationRequest}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Allow Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
};

export default GoogleMap;