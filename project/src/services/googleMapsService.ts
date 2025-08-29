export interface DistanceMatrixElement {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  status: string;
}

export interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: {
    elements: DistanceMatrixElement[];
  }[];
  status: string;
}

export interface TravelInfo {
  distance: {
    text: string;
    miles: number;
  };
  duration: {
    text: string;
    minutes: number;
  };
  status: 'OK' | 'ERROR';
}

class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured. Map features will be limited.');
    }
  }

  /**
   * Calculate distance and travel time between two points
   */
  async getDistanceMatrix(
    origins: string | { lat: number; lng: number },
    destinations: string | { lat: number; lng: number }
  ): Promise<TravelInfo | null> {
    try {
      const originParam = typeof origins === 'string' 
        ? encodeURIComponent(origins)
        : `${origins.lat},${origins.lng}`;
      
      const destinationParam = typeof destinations === 'string'
        ? encodeURIComponent(destinations)
        : `${destinations.lat},${destinations.lng}`;


      // Note: In a real application, this would need to be called from a backend
      // due to CORS restrictions. For demo purposes, we'll simulate the response.
      const response = await this.simulateDistanceMatrix(origins, destinations);
      
      if (response.status !== 'OK' || !response.rows[0]?.elements[0]) {
        return null;
      }

      const element = response.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        return null;
      }

      // Convert meters to miles
      const miles = Math.round((element.distance.value * 0.000621371) * 10) / 10;
      const minutes = Math.round(element.duration.value / 60);

      return {
        distance: {
          text: `${miles} miles`,
          miles
        },
        duration: {
          text: `${minutes} mins`,
          minutes
        },
        status: 'OK'
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }

  /**
   * Calculate multi-stop route with waypoints
   */
  async getMultiStopRoute(waypoints: { lat: number; lng: number }[]): Promise<TravelInfo | null> {
    if (waypoints.length < 2) {
      return null;
    }

    try {
      // For demo purposes, calculate total distance by summing segments
      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const segmentInfo = await this.getDistanceMatrix(waypoints[i], waypoints[i + 1]);
        if (segmentInfo && segmentInfo.status === 'OK') {
          totalDistance += segmentInfo.distance.miles;
          totalDuration += segmentInfo.duration.minutes;
        }
      }

      if (totalDistance === 0) {
        return null;
      }

      return {
        distance: {
          text: `${Math.round(totalDistance * 10) / 10} miles`,
          miles: Math.round(totalDistance * 10) / 10
        },
        duration: {
          text: `${Math.round(totalDuration)} mins`,
          minutes: Math.round(totalDuration)
        },
        status: 'OK'
      };
    } catch (error) {
      console.error('Error calculating multi-stop route:', error);
      return null;
    }
  }

  /**
   * Simulate distance matrix response for demo purposes
   * In production, this would be handled by your backend
   */
  private async simulateDistanceMatrix(
    origins: string | { lat: number; lng: number },
    destinations: string | { lat: number; lng: number }
  ): Promise<DistanceMatrixResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate approximate distance using Haversine formula
    let distance = 5000; // Default 5km
    
    if (typeof origins === 'object' && typeof destinations === 'object') {
      distance = this.calculateHaversineDistance(
        origins.lat, origins.lng,
        destinations.lat, destinations.lng
      );
    } else {
      // Random distance for string addresses (demo purposes)
      distance = Math.random() * 20000 + 2000; // 2-22km
    }

    const duration = Math.round(distance / 400 * 60); // Approximate driving time

    return {
      destination_addresses: ['Destination Address'],
      origin_addresses: ['Origin Address'],
      rows: [{
        elements: [{
          distance: {
            text: `${Math.round(distance / 1000 * 10) / 10} km`,
            value: Math.round(distance)
          },
          duration: {
            text: `${Math.round(duration / 60)} mins`,
            value: duration
          },
          status: 'OK'
        }]
      }],
      status: 'OK'
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get current user location
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}

export const googleMapsService = new GoogleMapsService();