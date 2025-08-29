import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  CheckCircle, 
  MapPin, 
  TrendingUp,
  Download,
  Star,
  Heart
} from 'lucide-react';
import FareBreakdown from './FareBreakdown';
import { pricingService } from '../services/pricingService';
import type { FareBreakdown as FareBreakdownType } from '../types/pricing';

interface PostTripSummaryProps {
  estimatedBreakdown: FareBreakdownType;
  actualDurationMinutes: number;
  tripEndTime: Date;
  tripDetails: {
    pickup: string;
    dropoff: string;
    distance: number;
    supportWorkerCount: number;
    vehicleFeatures: string[];
  };
  onClose?: () => void;
  className?: string;
}

const PostTripSummary: React.FC<PostTripSummaryProps> = ({
  estimatedBreakdown,
  actualDurationMinutes,
  tripEndTime,
  tripDetails,
  onClose,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const finalBreakdown = pricingService.calculateFinalFare(
    estimatedBreakdown,
    actualDurationMinutes,
    tripEndTime
  );

  const estimatedTotal = estimatedBreakdown.estimatedTotal;
  const actualTotal = finalBreakdown.actualTotal || finalBreakdown.estimatedTotal;
  const difference = actualTotal - estimatedTotal;

  useEffect(() => {
    if (containerRef.current) {
      // Animate modal appearance
      gsap.fromTo(containerRef.current,
        { opacity: 0, scale: 0.9, y: 50 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.6, 
          ease: "back.out(1.7)" 
        }
      );
    }
  }, []);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={containerRef}
        className={`bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white rounded-t-3xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Trip Completed!</h2>
            <p className="text-green-100 text-lg">
              Thank you for choosing AbleGo
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Trip Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Trip Summary
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 font-medium">From</span>
                  <p className="text-gray-800">{tripDetails.pickup}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium">To</span>
                  <p className="text-gray-800">{tripDetails.dropoff}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Distance</span>
                  <span className="text-gray-800 font-semibold">{tripDetails.distance} miles</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Duration</span>
                  <span className="text-gray-800 font-semibold">{formatDuration(actualDurationMinutes)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Support Workers</span>
                  <span className="text-gray-800 font-semibold">
                    {tripDetails.supportWorkerCount === 0 ? 'None' : tripDetails.supportWorkerCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Comparison */}
          {Math.abs(difference) > 0.01 && (
            <div className={`rounded-2xl p-6 mb-8 border-2 ${
              difference > 0 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className={`w-5 h-5 mr-2 ${difference > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                Fare Adjustment
              </h3>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-sm text-gray-500 font-medium">Estimated</span>
                  <p className="text-lg font-bold text-gray-800">
                    {pricingService.formatCurrency(estimatedTotal)}
                  </p>
                </div>
                <div>
                  <span className={`text-sm font-medium ${difference > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {difference > 0 ? 'Additional' : 'Savings'}
                  </span>
                  <p className={`text-lg font-bold ${difference > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                    {difference > 0 ? '+' : ''}{pricingService.formatCurrency(difference)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 font-medium">Final Total</span>
                  <p className="text-lg font-bold text-gray-800">
                    {pricingService.formatCurrency(actualTotal)}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center mt-4">
                {difference > 0 
                  ? 'Final fare adjusted based on actual journey time and peak hour pricing'
                  : 'You saved money due to shorter journey time!'
                }
              </p>
            </div>
          )}

          {/* Final Fare Breakdown */}
          <FareBreakdown 
            breakdown={finalBreakdown}
            isCalculating={false}
            showEstimated={false}
            className="mb-8"
          />

          {/* Rating Section */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              How was your experience?
            </h3>
            
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-2 hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star className="w-8 h-8 text-yellow-400 hover:text-yellow-500 fill-current" />
                </button>
              ))}
            </div>
            
            <textarea
              placeholder="Tell us about your experience (optional)"
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Download className="w-5 h-5 mr-2" />
              Download Receipt
            </button>
            
            <button className="flex-1 px-6 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors">
              Book Another Ride
            </button>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostTripSummary;