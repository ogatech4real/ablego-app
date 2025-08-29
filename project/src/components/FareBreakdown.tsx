import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  Calculator, 
  Car, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  Info,
  Loader,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Gift
} from 'lucide-react';
import type { FareBreakdown as FareBreakdownType } from '../types/pricing';
import { pricingService } from '../services/pricingService';

interface FareBreakdownProps {
  breakdown: FareBreakdownType | null;
  isCalculating: boolean;
  showEstimated?: boolean;
  className?: string;
}

const FareBreakdown: React.FC<FareBreakdownProps> = ({
  breakdown,
  isCalculating,
  showEstimated = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (breakdown && containerRef.current) {
      // Animate container appearance
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.5, 
          ease: "back.out(1.7)" 
        }
      );

      // Animate breakdown items
      gsap.fromTo(itemRefs.current,
        { opacity: 0, x: -20 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.4, 
          stagger: 0.1, 
          delay: 0.2,
          ease: "power2.out" 
        }
      );

      // Animate total with special emphasis
      if (totalRef.current) {
        gsap.fromTo(totalRef.current,
          { opacity: 0, scale: 0.9 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.6, 
            delay: 0.5,
            ease: "back.out(1.7)" 
          }
        );
      }
    }
  }, [breakdown]);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !itemRefs.current.includes(el)) {
      itemRefs.current.push(el);
    }
  };

  if (isCalculating) {
    return (
      <div className={`bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium text-lg">Calculating fare...</span>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className={`bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <Calculator className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Fare Estimate</h3>
          <p className="text-gray-500">
            Complete your booking details to see fare breakdown
          </p>
        </div>
      </div>
    );
  }

  const hasVehicleFeatures = breakdown.vehicleFeatures.length > 0;
  const hasSupportWorkers = breakdown.supportWorkers.count > 0;
  const hasDistance = breakdown.distance.miles > 0;
  const isPeakTime = breakdown.timeOfDay.isPeakTime;

  return (
    <div 
      ref={containerRef}
      className={`bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calculator className="w-6 h-6 mr-3" />
            <h3 className="text-xl font-bold">
              {showEstimated ? 'Estimated' : 'Final'} Fare Breakdown
            </h3>
          </div>
          {isPeakTime && (
            <div className="flex items-center bg-orange-500 px-3 py-1 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              Peak Time
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Base Fare */}
        <div ref={addToRefs} className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="font-medium text-gray-800">Base Fare</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500">Standard service charge</span>
                <button className="ml-2 text-gray-400 hover:text-gray-600" title="Base service fee for all rides">
                  <Info className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <span className="font-semibold text-gray-800">
            {pricingService.formatCurrency(breakdown.baseFare)}
          </span>
        </div>

        {/* Vehicle Features */}
        {hasVehicleFeatures && (
          <div ref={addToRefs} className="space-y-2">
            <div className="flex items-center text-gray-700 font-medium">
              <Car className="w-4 h-4 mr-2" />
              Vehicle Features
            </div>
            {breakdown.vehicleFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between py-2 pl-6 bg-gray-50 rounded-lg">
                <span className="text-gray-600">{feature.feature}</span>
                <span className="font-medium text-gray-800">
                  +{pricingService.formatCurrency(feature.price)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Support Workers */}
        {hasSupportWorkers && (
          <div ref={addToRefs} className="py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    Support Workers ({breakdown.supportWorkers.count})
                  </span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {breakdown.supportWorkers.estimatedHours}h × {pricingService.formatCurrency(breakdown.supportWorkers.hourlyRate)}/hour
                    </span>
                    <button className="ml-2 text-gray-400 hover:text-gray-600" title="Trained companions to assist during your journey">
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <span className="font-semibold text-gray-800">
                +{pricingService.formatCurrency(breakdown.supportWorkers.totalCost)}
              </span>
            </div>
          </div>
        )}

        {/* Distance */}
        {hasDistance && (
          <div ref={addToRefs} className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Distance</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    {breakdown.distance.miles} miles × {pricingService.formatCurrency(breakdown.distance.ratePerMile)}/mile
                  </span>
                  <button className="ml-2 text-gray-400 hover:text-gray-600" title="Distance-based pricing using optimal route">
                    <Info className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <span className="font-semibold text-gray-800">
              +{pricingService.formatCurrency(breakdown.distance.totalCost)}
            </span>
          </div>
        )}

        {/* Booking Type Multiplier */}
        {breakdown.bookingType.multiplier !== 1.0 && (
          <div ref={addToRefs} className={`py-3 border-b border-gray-100 ${
            breakdown.bookingType.type === 'on_demand' ? 'bg-red-50' : 
            breakdown.bookingType.type === 'advance' ? 'bg-blue-50' : 'bg-gray-50'
          } rounded-lg px-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  breakdown.bookingType.type === 'on_demand' ? 'bg-red-100' :
                  breakdown.bookingType.type === 'advance' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {breakdown.bookingType.type === 'on_demand' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : breakdown.bookingType.type === 'advance' ? (
                    <Gift className="w-4 h-4 text-blue-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-800">
                    {pricingService.getBookingTypeInfo(breakdown.bookingType.type).label} Booking
                  </span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">
                      {breakdown.bookingType.type === 'on_demand' ? '+50% short notice' :
                       breakdown.bookingType.type === 'advance' ? '10% advance discount' :
                       'Standard rate'}
                    </span>
                    <button className="ml-2 text-gray-400 hover:text-gray-600" title={pricingService.getBookingTypeInfo(breakdown.bookingType.type).description}>
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <span className={`font-semibold ${
                breakdown.bookingType.type === 'on_demand' ? 'text-red-700' :
                breakdown.bookingType.type === 'advance' ? 'text-blue-700' : 'text-gray-800'
              }`}>
                {breakdown.bookingType.type === 'advance' ? '' : '+'}
                {pricingService.formatCurrency(Math.abs(breakdown.bookingType.discount))}
              </span>
            </div>
          </div>
        )}

        {/* Peak Time Surcharge */}
        {isPeakTime && breakdown.timeOfDay.surcharge > 0 && (
          <div ref={addToRefs} className="flex items-center justify-between py-3 border-b border-gray-100 bg-orange-50 rounded-lg px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <span className="font-medium text-gray-800">Peak Time Surcharge</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    {Math.round((breakdown.timeOfDay.multiplier - 1) * 100)}% during peak hours
                  </span>
                  <button className="ml-2 text-gray-400 hover:text-gray-600" title={pricingService.getPeakTimeDescription()}>
                    <Info className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <span className="font-semibold text-orange-700">
              +{pricingService.formatCurrency(breakdown.timeOfDay.surcharge)}
            </span>
          </div>
        )}

        {/* Total */}
        <div 
          ref={totalRef}
          className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              <div>
                <span className="text-lg font-bold">
                  {showEstimated ? 'Estimated' : 'Final'} Total
                </span>
                {breakdown.actualTotal && showEstimated && (
                  <div className="text-sm text-blue-100">
                    Final: {pricingService.formatCurrency(breakdown.actualTotal)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-2xl font-bold">
              {pricingService.formatCurrency(breakdown.actualTotal || breakdown.estimatedTotal)}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {showEstimated 
              ? 'Final fare may vary based on actual journey time, route changes, and pickup time'
              : 'All charges include VAT where applicable'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default FareBreakdown;