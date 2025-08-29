import type { 
  FareBreakdown, 
  PricingConfig, 
  VehicleFeature 
} from '../types/pricing';

class PricingService {
  private config: PricingConfig = {
    baseFare: 8.50,
    vehicleFeatures: [
      {
        id: 'wheelchair',
        name: 'Wheelchair Accessible',
        description: 'Vehicle equipped with wheelchair ramp or lift',
        price: 6.00,
        icon: 'wheelchair'
      },
      {
        id: 'patient-lift',
        name: 'Patient Lift',
        description: 'Hydraulic lift for mobility assistance',
        price: 12.00,
        icon: 'lift'
      },
      {
        id: 'oxygen-support',
        name: 'Oxygen Support',
        description: 'Vehicle equipped for oxygen tank transport',
        price: 15.00,
        icon: 'oxygen'
      }
    ],
    supportWorkerRates: [
      { count: 0, hourlyRate: 0, description: 'No support needed' },
      { count: 1, hourlyRate: 20.50, description: 'One trained companion' },
      { count: 2, hourlyRate: 18.50, description: 'Two support workers (10% discount)' },
      { count: 3, hourlyRate: 17.50, description: 'Three support workers (15% discount)' },
      { count: 4, hourlyRate: 16.50, description: 'Four support workers (20% discount)' }
    ],
    distanceRate: 2.20, // £2.20 per mile
    peakTimeMultiplier: 1.15, // 15% surcharge
    peakHours: {
      morning: { start: 6, end: 9 }, // 6am-9am
      evening: { start: 15, end: 18 } // 3pm-6pm
    }
  };

  /**
   * Calculate estimated fare before trip
   */
  calculateEstimatedFare(
    selectedFeatures: string[],
    supportWorkerCount: number,
    distanceMiles: number,
    estimatedDurationMinutes: number,
    bookingTime: Date = new Date(),
    pickupTime: Date = new Date()
  ): FareBreakdown {
    // Calculate lead time
    const leadTimeHours = (pickupTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
    const bookingTypeInfo = this.getBookingType(leadTimeHours);

    const breakdown: FareBreakdown = {
      baseFare: this.config.baseFare,
      vehicleFeatures: [],
      supportWorkers: {
        count: supportWorkerCount,
        estimatedHours: Math.max(1, Math.ceil(estimatedDurationMinutes / 60)), // Minimum 1 hour
        hourlyRate: this.getSupportWorkerRate(supportWorkerCount),
        totalCost: 0
      },
      distance: {
        miles: distanceMiles,
        ratePerMile: this.config.distanceRate,
        totalCost: distanceMiles * this.config.distanceRate
      },
      timeOfDay: {
        isPeakTime: this.isPeakTime(pickupTime),
        multiplier: this.config.peakTimeMultiplier,
        surcharge: 0
      },
      bookingType: bookingTypeInfo,
      estimatedTotal: 0
    };

    // Calculate vehicle feature costs
    selectedFeatures.forEach(featureId => {
      const feature = this.config.vehicleFeatures.find(f => f.id === featureId);
      if (feature) {
        breakdown.vehicleFeatures.push({
          feature: feature.name,
          price: feature.price
        });
      }
    });

    // Calculate support worker costs
    if (supportWorkerCount > 0) {
      breakdown.supportWorkers.totalCost = 
        breakdown.supportWorkers.estimatedHours * 
        breakdown.supportWorkers.hourlyRate * 
        supportWorkerCount;
    }

    // Calculate subtotal before peak time multiplier
    const subtotal = 
      breakdown.baseFare +
      breakdown.vehicleFeatures.reduce((sum, f) => sum + f.price, 0) +
      breakdown.supportWorkers.totalCost +
      breakdown.distance.totalCost;

    // Apply booking type multiplier first
    const afterBookingTypeMultiplier = subtotal * breakdown.bookingType.multiplier;
    breakdown.bookingType.discount = afterBookingTypeMultiplier - subtotal;

    // Apply peak time surcharge
    if (breakdown.timeOfDay.isPeakTime) {
      breakdown.timeOfDay.surcharge = afterBookingTypeMultiplier * (breakdown.timeOfDay.multiplier - 1);
    }

    breakdown.estimatedTotal = afterBookingTypeMultiplier + breakdown.timeOfDay.surcharge;

    return breakdown;
  }

  /**
   * Calculate final fare after trip completion
   */
  calculateFinalFare(
    estimatedBreakdown: FareBreakdown,
    actualDurationMinutes: number,
    tripEndTime: Date
  ): FareBreakdown {
    const finalBreakdown = { ...estimatedBreakdown };

    // Recalculate support worker costs based on actual duration
    if (finalBreakdown.supportWorkers.count > 0) {
      const actualHours = Math.max(1, Math.ceil(actualDurationMinutes / 60));
      finalBreakdown.supportWorkers.estimatedHours = actualHours;
      finalBreakdown.supportWorkers.totalCost = 
        actualHours * 
        finalBreakdown.supportWorkers.hourlyRate * 
        finalBreakdown.supportWorkers.count;
    }

    // Check if trip ended during peak time (affects final calculation)
    const endTimePeakStatus = this.isPeakTime(tripEndTime);
    if (endTimePeakStatus !== finalBreakdown.timeOfDay.isPeakTime) {
      finalBreakdown.timeOfDay.isPeakTime = endTimePeakStatus;
    }

    // Recalculate final total
    const finalSubtotal = 
      finalBreakdown.baseFare +
      finalBreakdown.vehicleFeatures.reduce((sum, f) => sum + f.price, 0) +
      finalBreakdown.supportWorkers.totalCost +
      finalBreakdown.distance.totalCost;

    // Apply booking type multiplier
    const afterBookingTypeMultiplier = finalSubtotal * finalBreakdown.bookingType.multiplier;
    finalBreakdown.bookingType.discount = afterBookingTypeMultiplier - finalSubtotal;

    if (finalBreakdown.timeOfDay.isPeakTime) {
      finalBreakdown.timeOfDay.surcharge = afterBookingTypeMultiplier * (finalBreakdown.timeOfDay.multiplier - 1);
    } else {
      finalBreakdown.timeOfDay.surcharge = 0;
    }

    finalBreakdown.actualTotal = afterBookingTypeMultiplier + finalBreakdown.timeOfDay.surcharge;

    return finalBreakdown;
  }

  /**
   * Determine booking type based on lead time
   */
  private getBookingType(leadTimeHours: number): {
    type: 'on_demand' | 'scheduled' | 'advance';
    leadTimeHours: number;
    multiplier: number;
    discount: number;
  } {
    if (leadTimeHours <= 3) {
      return {
        type: 'on_demand',
        leadTimeHours,
        multiplier: 1.5, // +50% surcharge
        discount: 0
      };
    } else if (leadTimeHours <= 12) {
      return {
        type: 'scheduled',
        leadTimeHours,
        multiplier: 1.0, // Standard fare
        discount: 0
      };
    } else {
      return {
        type: 'advance',
        leadTimeHours,
        multiplier: 0.9, // 10% discount
        discount: 0
      };
    }
  }

  /**
   * Get support worker hourly rate based on count
   */
  private getSupportWorkerRate(count: number): number {
    const tier = this.config.supportWorkerRates.find(t => t.count === count);
    return tier?.hourlyRate || 0;
  }

  /**
   * Check if given time falls within peak hours
   */
  private isPeakTime(date: Date): boolean {
    const hour = date.getHours();
    const { morning, evening } = this.config.peakHours;
    
    return (
      (hour >= morning.start && hour < morning.end) ||
      (hour >= evening.start && hour < evening.end)
    );
  }

  /**
   * Get vehicle feature by ID
   */
  getVehicleFeature(id: string): VehicleFeature | undefined {
    return this.config.vehicleFeatures.find(f => f.id === id);
  }

  /**
   * Get all available vehicle features
   */
  getVehicleFeatures(): VehicleFeature[] {
    return this.config.vehicleFeatures;
  }

  /**
   * Get support worker tier information
   */
  getSupportWorkerTiers() {
    return this.config.supportWorkerRates;
  }

  /**
   * Get current pricing configuration
   */
  getPricingConfig(): PricingConfig {
    return { ...this.config };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return `£${amount.toFixed(2)}`;
  }

  /**
   * Get booking type description and badge info
   */
  getBookingTypeInfo(type: 'on_demand' | 'scheduled' | 'advance') {
    switch (type) {
      case 'on_demand':
        return {
          label: 'On-Demand',
          description: 'Pickup within 3hrs from booking: +50% short-notice charge',
          badge: 'red',
          icon: '⚠️'
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          description: 'Pickup within 12hrs from booking: standard fare',
          badge: 'green',
          icon: '✅'
        };
      case 'advance':
        return {
          label: 'Advance',
          description: 'Pickup >12hr from booking: 10% discount',
          badge: 'blue',
          icon: '🎉'
        };
    }
  }

  /**
   * Round time to nearest 15-minute increment
   */
  roundToNearestQuarter(date: Date): Date {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;
    
    if (remainder !== 0) {
      rounded.setMinutes(minutes + (15 - remainder));
    }
    
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);
    
    return rounded;
  }

  /**
   * Get minimum pickup time (now + 30 minutes, rounded to 15-min increment)
   */
  getMinimumPickupTime(): Date {
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // Add 30 minutes
    return this.roundToNearestQuarter(minTime);
  }

  /**
   * Get maximum pickup time (now + 10 days)
   */
  getMaximumPickupTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // Add 10 days
  }

  /**
   * Validate pickup time
   */
  validatePickupTime(pickupTime: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const minTime = this.getMinimumPickupTime();
    const maxTime = this.getMaximumPickupTime();

    if (pickupTime < minTime) {
      return {
        valid: false,
        error: `Pickup time must be at least 30 minutes from now (earliest: ${minTime.toLocaleString()})`
      };
    }

    if (pickupTime > maxTime) {
      return {
        valid: false,
        error: `Pickup time cannot be more than 10 days ahead (latest: ${maxTime.toLocaleDateString()})`
      };
    }

    return { valid: true };
  }

  /**
   * Get peak time description
   */
  getPeakTimeDescription(): string {
    const { morning, evening } = this.config.peakHours;
    return `Peak hours: ${morning.start}:00-${morning.end}:00 and ${evening.start}:00-${evening.end}:00 (+${Math.round((this.config.peakTimeMultiplier - 1) * 100)}%)`;
  }
}

export const pricingService = new PricingService();