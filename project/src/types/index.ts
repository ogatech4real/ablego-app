export interface BookingDetails {
  pickup: string;
  dropoff: string;
  vehicleFeatures: string[];
  supportWorkers: number;
  estimatedFare: number;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  image: string;
}

export interface ServiceFeature {
  icon: string;
  title: string;
  description: string;
}