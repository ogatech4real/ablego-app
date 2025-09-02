import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Users, Car } from 'lucide-react';
import AddressInput from '../AddressInput';
import DateTimePicker from '../DateTimePicker';
import GoogleMap from '../GoogleMap';
import { pricingService } from '../../services/pricingService';
import { googleMapsService } from '../../services/googleMapsService';
import type { AddressDetails } from '../../services/googlePlacesService';
import type { TravelInfo } from '../../services/googleMapsService';
import type { FareBreakdown } from '../../types/pricing';

interface Stop {
  id: string;
  address: string;
  details: AddressDetails | null;
}

interface JourneyDetailsFormProps {
  pickup: string;
  setPickup: (value: string) => void;
  dropoff: string;
  setDropoff: (value: string) => void;
  pickupDetails: AddressDetails | null;
  setPickupDetails: (details: AddressDetails | null) => void;
  dropoffDetails: AddressDetails | null;
  setDropoffDetails: (details: AddressDetails | null) => void;
  stops: Stop[];
  setStops: (stops: Stop[]) => void;
  pickupTime: Date;
  setPickupTime: (time: Date) => void;
  pickupTimeError: string | null;
  setPickupTimeError: (error: string | null) => void;
  vehicleFeatures: string[];
  setVehicleFeatures: (features: string[]) => void;
  supportWorkers: number;
  setSupportWorkers: (count: number) => void;
  specialRequirements: string;
  setSpecialRequirements: (requirements: string) => void;
  travelInfo: TravelInfo | null;
  setTravelInfo: (info: TravelInfo | null) => void;
  fareBreakdown: FareBreakdown | null;
  setFareBreakdown: (breakdown: FareBreakdown | null) => void;
  isCalculatingRoute: boolean;
  setIsCalculatingRoute: (calculating: boolean) => void;
  isCalculatingFare: boolean;
  setIsCalculatingFare: (calculating: boolean) => void;
  onNext: () => void;
}

const JourneyDetailsForm: React.FC<JourneyDetailsFormProps> = ({
  pickup,
  setPickup,
  dropoff,
  setDropoff,
  pickupDetails,
  setPickupDetails,
  dropoffDetails,
  setDropoffDetails,
  stops,
  setStops,
  pickupTime,
  setPickupTime,
  pickupTimeError,
  setPickupTimeError,
  vehicleFeatures,
  setVehicleFeatures,
  supportWorkers,
  setSupportWorkers,
  specialRequirements,
  setSpecialRequirements,
  travelInfo,
  setTravelInfo,
  fareBreakdown,
  setFareBreakdown,
  isCalculatingRoute,
  setIsCalculatingRoute,
  isCalculatingFare,
  setIsCalculatingFare,
  onNext
}) => {
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    validateForm();
  }, [pickup, dropoff, pickupTime, pickupDetails, dropoffDetails]);

  const validateForm = () => {
    const hasValidPickup = pickup.trim() && pickupDetails;
    const hasValidDropoff = dropoff.trim() && dropoffDetails;
    const hasValidTime = !pickupTimeError && pickupTime > new Date();
    
    setIsValid(hasValidPickup && hasValidDropoff && hasValidTime);
  };

  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      address: '',
      details: null
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (stopId: string) => {
    setStops(stops.filter(stop => stop.id !== stopId);
  };

  const updateStop = (stopId: string, address: string, details: AddressDetails | null) => {
    setStops(stops.map(stop => 
      stop.id === stopId ? { ...stop, address, details } : stop
    ));
  };

  const calculateTravelInfo = async () => {
    if (!pickupDetails || !dropoffDetails) return;
    
    setIsCalculatingRoute(true);
    try {
      const info = await googleMapsService.getTravelInfo(pickupDetails, dropoffDetails, stops);
      setTravelInfo(info);
    } catch (error) {
      console.error('Failed to calculate travel info:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const calculateFare = async () => {
    if (!travelInfo) return;
    
    setIsCalculatingFare(true);
    try {
      const fare = await pricingService.calculateFare({
        distance: travelInfo.distance,
        duration: travelInfo.duration,
        vehicleFeatures,
        supportWorkers,
        pickupTime
      });
      setFareBreakdown(fare);
    } catch (error) {
      console.error('Failed to calculate fare:', error);
    } finally {
      setIsCalculatingFare(false);
    }
  };

  useEffect(() => {
    if (pickupDetails && dropoffDetails && stops.every(stop => stop.details !== null)) {
      calculateTravelInfo();
    }
  }, [pickupDetails, dropoffDetails, stops]);

  useEffect(() => {
    calculateFare();
  }, [travelInfo, vehicleFeatures, supportWorkers, pickupTime]);

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Journey Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your journey and requirements
        </p>
      </div>

      {/* Address inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pickup Address
          </label>
          <AddressInput
            value={pickup}
            onChange={setPickup}
            onAddressSelect={setPickupDetails}
            placeholder="Enter pickup address"
            icon={<MapPin className="w-5 h-5" />}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dropoff Address
          </label>
          <AddressInput
            value={dropoff}
            onChange={setDropoff}
            onAddressSelect={setDropoffDetails}
            placeholder="Enter dropoff address"
            icon={<MapPin className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Additional stops */}
      {stops.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Stops
          </label>
          <div className="space-y-3">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center space-x-3">
                <AddressInput
                  value={stop.address}
                  onChange={(address) => updateStop(stop.id, address, null)}
                  onAddressSelect={(details) => updateStop(stop.id, stop.address, details)}
                  placeholder="Enter stop address"
                  icon={<MapPin className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add stop button */}
      <button
        type="button"
        onClick={addStop}
        className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Stop</span>
      </button>

      {/* Pickup time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Pickup Time
        </label>
        <DateTimePicker
          value={pickupTime}
          onChange={setPickupTime}
          minTime={pricingService.getMinimumPickupTime()}
          error={pickupTimeError}
        />
      </div>

      {/* Vehicle features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Vehicle Requirements
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Wheelchair Access', 'Lift', 'Air Conditioning', 'Child Seat'].map((feature) => (
            <label key={feature} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={vehicleFeatures.includes(feature)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setVehicleFeatures([...vehicleFeatures, feature]);
                  } else {
                    setVehicleFeatures(vehicleFeatures.filter(f => f !== feature));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Support workers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Support Workers
        </label>
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-gray-400" />
          <input
            type="number"
            min="0"
            max="10"
            value={supportWorkers}
            onChange={(e) => setSupportWorkers(parseInt(e.target.value) || 0)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">workers</span>
        </div>
      </div>

      {/* Special requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Special Requirements
        </label>
        <textarea
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          placeholder="Any special requirements or notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Map preview */}
      {pickupDetails && dropoffDetails && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Route Preview
          </label>
          <div className="h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <GoogleMap
              pickup={pickupDetails}
              dropoff={dropoffDetails}
              stops={stops}
              travelInfo={travelInfo}
            />
          </div>
        </div>
      )}

      {/* Fare breakdown */}
      {fareBreakdown && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Fare Estimate
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Base Fare:</span>
              <span className="font-medium">£{fareBreakdown.baseFare.toFixed(2)}</span>
            </div>
            {fareBreakdown.distanceCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Distance Charge:</span>
                <span className="font-medium">£{fareBreakdown.distanceCharge.toFixed(2)}</span>
              </div>
            )}
            {fareBreakdown.supportWorkerFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Support Worker Fee:</span>
                <span className="font-medium">£{fareBreakdown.supportWorkerFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>£{fareBreakdown.totalFare.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={handleNext}
          disabled={!isValid || isCalculatingRoute || isCalculatingFare}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCalculatingRoute || isCalculatingFare ? 'Calculating...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default JourneyDetailsForm;
