export interface GooglePlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AddressDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  postcode: string;
  streetNumber?: string;
  route?: string;
  locality?: string;
  administrativeArea?: string;
  country?: string;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    country?: string;
    postcode?: string;
    sublocality?: string;
    neighborhood?: string;
  };
  // Enhanced precision fields
  preciseLocation: boolean;
  accuracy?: number; // in meters
  fullAddress: string;
}

class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeServices();
  }

  /**
   * Check if Google Maps API is loaded and ready
   */
  private isGoogleMapsReady(): boolean {
    return typeof window !== 'undefined' && 
           window.google && 
           window.google.maps && 
           window.google.maps.places;
  }

  /**
   * Check if services are initialized
   */
  private areServicesInitialized(): boolean {
    return this.isInitialized && 
           this.autocompleteService !== null && 
           this.placesService !== null && 
           this.geocoder !== null;
  }

  private initializeServices() {
    const initialize = () => {
      if (this.isGoogleMapsReady()) {
        try {
          // Only initialize if not already done
          if (!this.autocompleteService) {
            this.autocompleteService = new google.maps.places.AutocompleteService();
          }
          if (!this.geocoder) {
            this.geocoder = new google.maps.Geocoder();
          }
          if (!this.placesService) {
            // Create a dummy div for PlacesService (required by Google API)
            const dummyDiv = document.createElement('div');
            this.placesService = new google.maps.places.PlacesService(dummyDiv);
          }
          
          this.isInitialized = true;
          console.log('✅ Google Places services initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Google Places services:', error);
        }
      }
    };

    // Try to initialize immediately
    initialize();

    // If not ready, wait for Google Maps to load
    if (typeof window !== 'undefined') {
      // Listen for Google Maps to load
      window.addEventListener('google-maps-loaded', initialize);
      
      // Also check periodically for a few seconds
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts
      const checkInterval = setInterval(() => {
        attempts++;
        if (this.isGoogleMapsReady()) {
          initialize();
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Google Maps failed to load after multiple attempts');
        }
      }, 300); // Faster checking
    }
  }

  /**
   * Get autocomplete predictions for UK addresses with enhanced precision
   */
  async getAutocompletePredictions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    return new Promise((resolve, reject) => {
      if (!this.isGoogleMapsReady()) {
        console.error('❌ Google Maps API not ready');
        reject(new Error('Google Maps API not ready. Please wait a moment and try again.'));
        return;
      }

      // Try to initialize services if not ready
      if (!this.areServicesInitialized()) {
        console.log('🔄 Services not initialized, attempting to initialize...');
        this.initializeServices();
        
        // Wait a bit and try again
        setTimeout(() => {
          if (this.areServicesInitialized()) {
            this.getAutocompletePredictions(input).then(resolve).catch(reject);
          } else {
            reject(new Error('Google Places Autocomplete service not initialized'));
          }
        }, 500);
        return;
      }

      if (!this.autocompleteService) {
        console.error('❌ Autocomplete service not initialized');
        reject(new Error('Google Places Autocomplete service not initialized'));
        return;
      }

      if (!input || input.length < 2) { // Reduced minimum length for better UX
        resolve([]);
        return;
      }

      console.log('🔍 Fetching predictions for:', input);

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: 'gb' }, // UK only
        types: ['address', 'establishment', 'geocode', 'street_address'], // Include more types for better results
        language: 'en-GB',
        sessionToken: new google.maps.places.AutocompleteSessionToken() // For better performance
      };

      this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
        console.log('📡 Autocomplete response:', { status, predictionsCount: predictions?.length || 0 });
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Filter and sort predictions for better relevance
          const filteredPredictions = predictions
            .filter(prediction => {
              // Be less restrictive - accept most UK addresses
              const isUKAddress = prediction.description.toLowerCase().includes('uk') || 
                                 prediction.description.toLowerCase().includes('united kingdom') ||
                                 prediction.description.toLowerCase().includes('england') ||
                                 prediction.description.toLowerCase().includes('scotland') ||
                                 prediction.description.toLowerCase().includes('wales') ||
                                 prediction.description.toLowerCase().includes('northern ireland');
              
              // If it's clearly a UK address, accept it
              if (isUKAddress) return true;
              
              // Also accept addresses that might be UK (no explicit country mentioned)
              const hasStreetNumber = prediction.structured_formatting?.main_text?.match(/^\d+/);
              const hasPostcode = prediction.description.match(/[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i);
              
              return hasStreetNumber || hasPostcode;
            })
            .sort((a, b) => {
              // Sort by relevance: street numbers first, then by description length
              const aHasNumber = a.structured_formatting?.main_text?.match(/^\d+/);
              const bHasNumber = b.structured_formatting?.main_text?.match(/^\d+/);
              
              if (aHasNumber && !bHasNumber) return -1;
              if (!aHasNumber && bHasNumber) return 1;
              
              return (a.description.length - b.description.length);
            });
          
          resolve(filteredPredictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Autocomplete failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get detailed place information by place ID with enhanced precision
   */
  async getPlaceDetails(placeId: string): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Google Places service not initialized'));
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name']
      };

      this.placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressDetails = this.parseAddressComponents(place);
          resolve(addressDetails);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  /**
   * Enhanced geocoding with high precision for UK addresses
   */
  async geocodeAddress(address: string): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Google Geocoder not initialized'));
        return;
      }

      const request: google.maps.GeocoderRequest = {
        address,
        componentRestrictions: { country: 'gb' }, // UK only
        language: 'en-GB',
        region: 'gb' // Bias towards UK results
      };

      this.geocoder.geocode(request, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          // Find the most precise result
          const mostPreciseResult = this.findMostPreciseResult(results);
          const addressDetails = this.parseAddressComponents(mostPreciseResult);
          resolve(addressDetails);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get precise current location with reverse geocoding
   */
  async getCurrentLocation(): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Reverse geocode the coordinates
            const addressDetails = await this.reverseGeocode(latitude, longitude, accuracy);
            resolve(addressDetails);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get precise address
   */
  async reverseGeocode(lat: number, lng: number, accuracy?: number): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Google Geocoder not initialized'));
        return;
      }

      const request: google.maps.GeocoderRequest = {
        location: { lat, lng },
        language: 'en-GB',
        region: 'gb'
      };

      this.geocoder.geocode(request, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const mostPreciseResult = this.findMostPreciseResult(results);
          const addressDetails = this.parseAddressComponents(mostPreciseResult);
          
          // Add accuracy information
          addressDetails.accuracy = accuracy;
          addressDetails.preciseLocation = accuracy ? accuracy < 50 : false; // Consider precise if within 50m
          
          resolve(addressDetails);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Find the most precise geocoding result
   */
  private findMostPreciseResult(results: google.maps.GeocoderResult[]): google.maps.GeocoderResult {
    // Sort by precision: street_number > route > locality > administrative_area
    const precisionOrder = ['street_number', 'route', 'sublocality', 'locality', 'administrative_area_level_1'];
    
    return results.sort((a, b) => {
      const aPrecision = this.getPrecisionScore(a, precisionOrder);
      const bPrecision = this.getPrecisionScore(b, precisionOrder);
      return bPrecision - aPrecision;
    })[0];
  }

  /**
   * Calculate precision score for a geocoding result
   */
  private getPrecisionScore(result: google.maps.GeocoderResult, precisionOrder: string[]): number {
    const components = result.address_components || [];
    let score = 0;
    
    precisionOrder.forEach((type, index) => {
      if (components.some(comp => comp.types.includes(type))) {
        score += precisionOrder.length - index;
      }
    });
    
    return score;
  }

  /**
   * Parse address components from Google Places result with enhanced precision
   */
  private parseAddressComponents(place: google.maps.places.PlaceResult | google.maps.GeocoderResult): AddressDetails {
    const addressComponents = place.address_components || [];
    
    // Extract individual components with enhanced precision
    const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
    const route = this.getAddressComponent(addressComponents, 'route');
    const locality = this.getAddressComponent(addressComponents, 'locality');
    const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
    const neighborhood = this.getAddressComponent(addressComponents, 'neighborhood');
    const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
    const country = this.getAddressComponent(addressComponents, 'country');
    const postcode = this.getAddressComponent(addressComponents, 'postal_code');

    // Determine if this is a precise location
    const preciseLocation = !!(streetNumber && route);

    // Build full address with maximum detail
    const fullAddress = this.buildFullAddress({
      streetNumber,
      route,
      locality: locality || sublocality,
      neighborhood,
      administrativeArea,
      postcode,
      country
    });

    return {
      placeId: place.place_id || '',
      formattedAddress: place.formatted_address || '',
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0,
      postcode: postcode || '',
      streetNumber,
      route,
      locality: locality || sublocality,
      administrativeArea,
      country,
      addressComponents: {
        streetNumber,
        route,
        locality: locality || sublocality,
        administrativeArea,
        country,
        postcode,
        sublocality,
        neighborhood
      },
      preciseLocation,
      fullAddress
    };
  }

  /**
   * Build a comprehensive full address string
   */
  private buildFullAddress(components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    neighborhood?: string;
    administrativeArea?: string;
    postcode?: string;
    country?: string;
  }): string {
    const parts = [];
    
    if (components.streetNumber && components.route) {
      parts.push(`${components.streetNumber} ${components.route}`);
    } else if (components.route) {
      parts.push(components.route);
    }
    
    if (components.neighborhood && components.neighborhood !== components.locality) {
      parts.push(components.neighborhood);
    }
    
    if (components.locality) {
      parts.push(components.locality);
    }
    
    if (components.administrativeArea) {
      parts.push(components.administrativeArea);
    }
    
    if (components.postcode) {
      parts.push(components.postcode);
    }
    
    return parts.join(', ');
  }

  /**
   * Extract specific address component by type
   */
  private getAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string | undefined {
    const component = components.find(comp => comp.types.includes(type));
    return component?.long_name;
  }

  /**
   * Extract postcode from address string using enhanced regex
   */
  extractPostcode(address: string): string | null {
    // Enhanced UK postcode regex
    const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})/gi;
    const match = address.match(postcodeRegex);
    return match ? this.formatPostcode(match[0]) : null;
  }

  /**
   * Format postcode with proper spacing
   */
  formatPostcode(postcode: string): string {
    const clean = postcode.replace(/\s+/g, '').toUpperCase();
    if (clean.length >= 5) {
      return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
    }
    return clean;
  }

  /**
   * Validate if a place is in the UK
   */
  isUKAddress(addressDetails: AddressDetails): boolean {
    return addressDetails.country === 'United Kingdom' || 
           addressDetails.addressComponents.country === 'United Kingdom';
  }

  /**
   * Get a user-friendly display address with precision indicator
   */
  getDisplayAddress(addressDetails: AddressDetails): string {
    if (addressDetails.preciseLocation) {
      // For precise locations, show street number and name
      const parts = [];
      
      if (addressDetails.streetNumber && addressDetails.route) {
        parts.push(`${addressDetails.streetNumber} ${addressDetails.route}`);
      } else if (addressDetails.route) {
        parts.push(addressDetails.route);
      }
      
      if (addressDetails.locality) {
        parts.push(addressDetails.locality);
      }
      
      if (addressDetails.postcode) {
        parts.push(addressDetails.postcode);
      }
      
      return parts.join(', ');
    } else {
      // For less precise locations, show more context
      return addressDetails.fullAddress || addressDetails.formattedAddress;
    }
  }

  /**
   * Get a detailed address for display purposes
   */
  getDetailedAddress(addressDetails: AddressDetails): string {
    return addressDetails.fullAddress || addressDetails.formattedAddress;
  }

  /**
   * Check if an address is precise enough for booking
   */
  isPreciseEnoughForBooking(addressDetails: AddressDetails): boolean {
    return addressDetails.preciseLocation && 
           addressDetails.streetNumber && 
           addressDetails.route &&
           addressDetails.postcode;
  }
}

export const googlePlacesService = new GooglePlacesService();
