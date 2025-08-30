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
  preciseLocation: boolean;
  accuracy?: number;
  fullAddress: string;
}

class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Simple initialization - wait for Google Maps to load
    const initServices = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        try {
          this.autocompleteService = new google.maps.places.AutocompleteService();
          this.geocoder = new google.maps.Geocoder();
          
          // Create a dummy div for PlacesService
          const dummyDiv = document.createElement('div');
          this.placesService = new google.maps.places.PlacesService(dummyDiv);
          
          console.log('✅ Google Places services initialized');
        } catch (error) {
          console.error('❌ Error initializing Google Places services:', error);
        }
      }
    };

    // Try to initialize immediately
    initServices();

    // Listen for Google Maps to load
    if (typeof window !== 'undefined') {
      window.addEventListener('google-maps-loaded', initServices);
      
      // Also check periodically
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          initServices();
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Google Maps failed to load');
        }
      }, 500);
    }
  }

  async getAutocompletePredictions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not initialized'));
        return;
      }

      if (!input || input.length < 2) {
        resolve([]);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: 'gb' },
        types: ['address', 'establishment', 'geocode'],
        language: 'en-GB'
      };

      this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Simple filtering - just return UK addresses
          const ukPredictions = predictions.filter(prediction => {
            const description = prediction.description.toLowerCase();
            return description.includes('uk') || 
                   description.includes('united kingdom') ||
                   description.includes('england') ||
                   description.includes('scotland') ||
                   description.includes('wales') ||
                   description.includes('northern ireland') ||
                   description.match(/[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i); // UK postcode
          });
          
          resolve(ukPredictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Autocomplete failed: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['place_id', 'formatted_address', 'geometry', 'address_components']
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
          maximumAge: 300000
        }
      );
    });
  }

  async reverseGeocode(lat: number, lng: number, accuracy?: number): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'));
        return;
      }

      const request: google.maps.GeocoderRequest = {
        location: { lat, lng },
        language: 'en-GB',
        region: 'gb'
      };

      this.geocoder.geocode(request, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const addressDetails = this.parseAddressComponents(results[0]);
          addressDetails.accuracy = accuracy;
          addressDetails.preciseLocation = accuracy ? accuracy < 50 : false;
          resolve(addressDetails);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  private parseAddressComponents(place: google.maps.places.PlaceResult | google.maps.GeocoderResult): AddressDetails {
    const addressComponents = place.address_components || [];
    
    const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
    const route = this.getAddressComponent(addressComponents, 'route');
    const locality = this.getAddressComponent(addressComponents, 'locality');
    const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
    const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
    const country = this.getAddressComponent(addressComponents, 'country');
    const postcode = this.getAddressComponent(addressComponents, 'postal_code');

    const preciseLocation = !!(streetNumber && route);

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
        neighborhood: this.getAddressComponent(addressComponents, 'neighborhood')
      },
      preciseLocation,
      fullAddress: place.formatted_address || ''
    };
  }

  private getAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string | undefined {
    const component = components.find(comp => comp.types.includes(type));
    return component?.long_name;
  }

  isUKAddress(addressDetails: AddressDetails): boolean {
    return addressDetails.country === 'United Kingdom' || 
           addressDetails.addressComponents.country === 'United Kingdom';
  }

  getDisplayAddress(addressDetails: AddressDetails): string {
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
  }

  isPreciseEnoughForBooking(addressDetails: AddressDetails): boolean {
    return addressDetails.preciseLocation && 
           addressDetails.streetNumber && 
           addressDetails.route &&
           addressDetails.postcode;
  }
}

export const googlePlacesService = new GooglePlacesService();
