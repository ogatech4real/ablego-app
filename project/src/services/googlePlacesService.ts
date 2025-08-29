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
  };
}

class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Wait for Google Maps to be loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.geocoder = new google.maps.Geocoder();
      
      // Create a dummy div for PlacesService (required by Google API)
      const dummyDiv = document.createElement('div');
      this.placesService = new google.maps.places.PlacesService(dummyDiv);
    } else {
      // Listen for Google Maps to load
      window.addEventListener('google-maps-loaded', () => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.geocoder = new google.maps.Geocoder();
        
        const dummyDiv = document.createElement('div');
        this.placesService = new google.maps.places.PlacesService(dummyDiv);
      });
    }
  }

  /**
   * Get autocomplete predictions for UK addresses
   */
  async getAutocompletePredictions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Google Places Autocomplete service not initialized'));
        return;
      }

      if (!input || input.length < 3) {
        resolve([]);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: 'gb' }, // UK only
        types: ['address'], // Address types only
        language: 'en-GB'
      };

      this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Autocomplete failed: ${status}`));
        }
      });
    });
  }

  /**
   * Get detailed place information by place ID
   */
  async getPlaceDetails(placeId: string): Promise<AddressDetails | null> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Google Places service not initialized'));
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

  /**
   * Geocode an address string to get coordinates and details
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
        language: 'en-GB'
      };

      this.geocoder.geocode(request, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const addressDetails = this.parseAddressComponents(result);
          resolve(addressDetails);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  /**
   * Parse address components from Google Places result
   */
  private parseAddressComponents(place: google.maps.places.PlaceResult | google.maps.GeocoderResult): AddressDetails {
    const addressComponents = place.address_components || [];
    
    // Extract individual components
    const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
    const route = this.getAddressComponent(addressComponents, 'route');
    const locality = this.getAddressComponent(addressComponents, 'locality');
    const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
    const country = this.getAddressComponent(addressComponents, 'country');
    const postcode = this.getAddressComponent(addressComponents, 'postal_code');

    return {
      placeId: place.place_id || '',
      formattedAddress: place.formatted_address || '',
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0,
      postcode: postcode || '',
      streetNumber,
      route,
      locality,
      administrativeArea,
      country,
      addressComponents: {
        streetNumber,
        route,
        locality,
        administrativeArea,
        country,
        postcode
      }
    };
  }

  /**
   * Extract specific address component by type
   */
  private getAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string | undefined {
    const component = components.find(comp => comp.types.includes(type));
    return component?.long_name;
  }

  /**
   * Extract postcode from address string using regex (fallback)
   */
  extractPostcode(address: string): string | null {
    const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})/gi;
    const match = address.match(postcodeRegex);
    return match ? match[0].toUpperCase() : null;
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
   * Get a user-friendly display address
   */
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
    
    return parts.join(', ') || addressDetails.formattedAddress;
  }
}

export const googlePlacesService = new GooglePlacesService();
