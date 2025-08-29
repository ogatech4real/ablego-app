export interface PostcodeValidationResponse {
  result: boolean;
}

export interface PostcodeLookupResponse {
  status: number;
  result: PostcodeData | null;
}

export interface PostcodeData {
  postcode: string;
  quality: number;
  eastings: number;
  northings: number;
  country: string;
  nhs_ha: string;
  longitude: number;
  latitude: number;
  european_electoral_region: string;
  primary_care_trust: string;
  region: string;
  lsoa: string;
  msoa: string;
  incode: string;
  outcode: string;
  parliamentary_constituency: string;
  admin_district: string;
  parish: string;
  admin_county: string;
  admin_ward: string;
  ced: string;
  ccg: string;
  nuts: string;
  codes: {
    admin_district: string;
    admin_county: string;
    admin_ward: string;
    parish: string;
    parliamentary_constituency: string;
    ccg: string;
    ccg_id: string;
    ced: string;
    nuts: string;
    lsoa: string;
    msoa: string;
    lau2: string;
  };
}

export interface PostcodeResponse {
  status: number;
  result: PostcodeData;
}

export interface ReverseGeocodeResponse {
  status: number;
  result: PostcodeData[];
}

export interface AddressDetails {
  postcode: string;
  latitude: number;
  longitude: number;
  district: string;
  region: string;
  country: string;
  formattedAddress: string;
}

class PostcodeService {
  private isDevelopment = import.meta.env.DEV;
  private baseUrl = this.isDevelopment ? 'https://api.postcodes.io' : '/.netlify/functions';

  /**
   * Validate a UK postcode
   */
  async validatePostcode(postcode: string): Promise<boolean> {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      
      if (this.isDevelopment) {
        // Direct API call in development
        const response = await fetch(`${this.baseUrl}/postcodes/${cleanPostcode}/validate`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          return false;
        }

        const data: PostcodeValidationResponse = await response.json();
        return data.result === true;
      } else {
        // Use Netlify function in production
        const response = await fetch(`${this.baseUrl}/postcode-validate/${cleanPostcode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.valid === true;
      }
    } catch (error) {
      console.error('Error validating postcode:', error);
      return false;
    }
  }

  /**
   * Get detailed information for a postcode
   */
  async getPostcodeDetails(postcode: string): Promise<AddressDetails | null> {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      
      if (this.isDevelopment) {
        // Direct API call in development
        const response = await fetch(`${this.baseUrl}/postcodes/${cleanPostcode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          return null;
        }

        const data: PostcodeResponse = await response.json();
        
        if (data.status !== 200 || !data.result) {
          return null;
        }

        const result = data.result;
        return {
          postcode: result.postcode,
          latitude: result.latitude,
          longitude: result.longitude,
          district: result.admin_district,
          region: result.region,
          country: result.country,
          formattedAddress: `${result.admin_district}, ${result.region}, ${result.postcode}`
        };
      } else {
        // Use Netlify function in production
        const response = await fetch(`${this.baseUrl}/postcode/${cleanPostcode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        
        if (!data.success) {
          return null;
        }

        return {
          postcode: data.postcode,
          latitude: data.latitude,
          longitude: data.longitude,
          district: data.district,
          region: data.region,
          country: data.country,
          formattedAddress: data.formatted_address
        };
      }
    } catch (error) {
      console.error('Error getting postcode details:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to find nearest postcode
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<AddressDetails | null> {
    try {
      if (this.isDevelopment) {
        // Direct API call in development
        const response = await fetch(
          `${this.baseUrl}/postcodes?lon=${longitude}&lat=${latitude}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          return null;
        }

        const data: ReverseGeocodeResponse = await response.json();
        
        if (data.status !== 200 || !data.result || data.result.length === 0) {
          return null;
        }

        const result = data.result[0];
        return {
          postcode: result.postcode,
          latitude: result.latitude,
          longitude: result.longitude,
          district: result.admin_district,
          region: result.region,
          country: result.country,
          formattedAddress: `${result.admin_district}, ${result.region}, ${result.postcode}`
        };
      } else {
        // Use Netlify function in production
        const response = await fetch(
          `${this.baseUrl}/postcode-reverse?lat=${latitude}&lng=${longitude}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        
        if (!data.success) {
          return null;
        }

        return {
          postcode: data.postcode,
          latitude: data.latitude,
          longitude: data.longitude,
          district: data.district,
          region: data.region,
          country: data.country,
          formattedAddress: data.formatted_address
        };
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Extract postcode from address string
   */
  extractPostcode(address: string): string | null {
    // UK postcode regex pattern
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
}

export const postcodeService = new PostcodeService();