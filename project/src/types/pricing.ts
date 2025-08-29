export interface VehicleFeature {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface SupportWorkerTier {
  count: number;
  hourlyRate: number;
  description: string;
}

export interface FareBreakdown {
  baseFare: number;
  vehicleFeatures: {
    feature: string;
    price: number;
  }[];
  supportWorkers: {
    count: number;
    estimatedHours: number;
    hourlyRate: number;
    totalCost: number;
  };
  distance: {
    miles: number;
    ratePerMile: number;
    totalCost: number;
  };
  timeOfDay: {
    isPeakTime: boolean;
    multiplier: number;
    surcharge: number;
  };
  bookingType: {
    type: 'on_demand' | 'scheduled' | 'advance';
    leadTimeHours: number;
    multiplier: number;
    discount: number;
  };
  estimatedTotal: number;
  actualTotal?: number; // For post-trip calculation
}

export interface PricingConfig {
  baseFare: number;
  vehicleFeatures: VehicleFeature[];
  supportWorkerRates: SupportWorkerTier[];
  distanceRate: number; // per mile
  peakTimeMultiplier: number;
  peakHours: {
    morning: { start: number; end: number };
    evening: { start: number; end: number };
  };
}

export interface TripDuration {
  estimatedMinutes: number;
  actualMinutes?: number;
}