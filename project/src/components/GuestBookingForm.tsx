import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { 
  MapPin, 
  Clock, 
  Users, 
  Car, 
  Navigation, 
  Plus, 
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Lock,
  CreditCard,
  Shield
} from 'lucide-react';
import { pricingService } from '../services/pricingService';
import { googleMapsService } from '../services/googleMapsService';
import AddressInput from './AddressInput';
import DateTimePicker from './DateTimePicker';
import FareBreakdown from './FareBreakdown';
import TravelInfo from './TravelInfo';
import GoogleMap from './GoogleMap';
import PaymentForm from './PaymentForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import type { FareBreakdown as FareBreakdownType } from '../types/pricing';
import type { TravelInfo as TravelInfoType } from '../services/googleMapsService';
import type { AddressDetails } from '../services/googlePlacesService';
import { scrollToActionZone, scrollToFormError } from '../utils/scrollUtils';

interface Stop {
  id: string;
  address: string;
  details: AddressDetails | null;
}

interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  password?: string;
  needsPassword?: boolean;
}

const GuestBookingForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'booking' | 'guest-info' | 'password' | 'confirmation'>('booking');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupDetails, setPickupDetails] = useState<AddressDetails | null>(null);
  const [dropoffDetails, setDropoffDetails] = useState<AddressDetails | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [pickupTime, setPickupTime] = useState<Date>(pricingService.getMinimumPickupTime());
  const [pickupTimeError, setPickupTimeError] = useState<string | null>(null);
  const [vehicleFeatures, setVehicleFeatures] = useState<string[]>([]);
  const [supportWorkers, setSupportWorkers] = useState(0);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [travelInfo, setTravelInfo] = useState<TravelInfoType | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdownType | null>(null);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: '',
    email: '',
    phone: '',
    password: undefined,
    needsPassword: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{ 
    booking_id: string; 
    access_token: string; 
    reference: string;
    payment_method: 'cash_bank' | 'stripe';
  } | null>(null);
  const [wantsAccount, setWantsAccount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash_bank' | 'stripe'>('cash_bank');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pickupDetails && dropoffDetails && areAllStopsValid()) {
      calculateTravelInfo();
    } else {
      setTravelInfo(null);
    }
  }, [pickupDetails, dropoffDetails, stops]);

  useEffect(() => {
    calculateFare();
  }, [vehicleFeatures, supportWorkers, travelInfo, pickupTime]);

  const areAllStopsValid = (): boolean => {
    return stops.every(stop => stop.details !== null);
  };

  const addStop = () => {
    if (stops.length >= 2) return;
    
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      address: '',
      details: null
    };
    
    setStops(prev => [...prev, newStop]);
  };

  const removeStop = (stopId: string) => {
    setStops(prev => prev.filter(stop => stop.id !== stopId));
  };

  const updateStop = (stopId: string, address: string, details?: AddressDetails) => {
    setStops(prev => prev.map(stop => 
      stop.id === stopId 
        ? { ...stop, address, details: details || null }
        : stop
    ));
  };

  const calculateTravelInfo = async () => {
    if (!pickupDetails || !dropoffDetails || !areAllStopsValid()) return;

    setIsCalculatingRoute(true);
    
    try {
      const waypoints = [
        { lat: pickupDetails.latitude, lng: pickupDetails.longitude },
        ...stops.filter(stop => stop.details).map(stop => ({
          lat: stop.details!.latitude,
          lng: stop.details!.longitude
        })),
        { lat: dropoffDetails.latitude, lng: dropoffDetails.longitude }
      ];
      
      const result = await googleMapsService.getMultiStopRoute(waypoints);
      setTravelInfo(result);
    } catch (error) {
      console.error('Error calculating travel info:', error);
      setTravelInfo({ 
        distance: { text: 'Unknown', miles: 0 }, 
        duration: { text: 'Unknown', minutes: 0 }, 
        status: 'ERROR' 
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const calculateFare = async () => {
    if (!travelInfo || travelInfo.status !== 'OK') {
      setFareBreakdown(null);
      return;
    }

    setIsCalculatingFare(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const breakdown = pricingService.calculateEstimatedFare(
        vehicleFeatures,
        supportWorkers,
        travelInfo.distance.miles,
        travelInfo.duration.minutes,
        new Date(),
        pickupTime
      );

      setFareBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating fare:', error);
      setFareBreakdown(null);
    } finally {
      setIsCalculatingFare(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handlePickupChange = (value: string, details?: AddressDetails) => {
    setPickup(value);
    setPickupDetails(details || null);
  };

  const handleDropoffChange = (value: string, details?: AddressDetails) => {
    setDropoff(value);
    setDropoffDetails(details || null);
  };

  const handlePickupTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = new Date(e.target.value);
    const validation = pricingService.validatePickupTime(selectedTime);
    
    if (validation.valid) {
      setPickupTime(selectedTime);
      setPickupTimeError(null);
    } else {
      setPickupTimeError(validation.error || 'Invalid pickup time');
    }
  };

  const handleGuestInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: value }));
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const canProceedToGuestInfo = () => {
    return !!(
      pickup && dropoff && 
      pickupDetails && dropoffDetails && 
      areAllStopsValid() && 
      fareBreakdown && 
      !pickupTimeError
    );
  };

  const canSubmitBooking = () => {
    return !!(
      guestInfo.name.trim() && 
      guestInfo.email.trim() && 
      guestInfo.phone.trim() &&
      (!wantsAccount || guestInfo.password?.trim()) &&
      canProceedToGuestInfo()
    );
  };

  const handleProceedToGuestInfo = () => {
    if (canProceedToGuestInfo()) {
      setCurrentStep('guest-info');
      scrollToActionZone('.form-step.active');
      
      // Animate step transition
      if (containerRef.current) {
        gsap.fromTo(containerRef.current,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    }
  };

  const handleSubmitGuestInfo = async () => {
    if (!guestInfo.name.trim() || !guestInfo.email.trim() || !guestInfo.phone.trim()) {
      setSubmitError('Please fill in all required fields. Phone number is required for driver contact and emergency updates.');
      scrollToFormError();
      return;
    }

    if (wantsAccount && !guestInfo.password?.trim()) {
      setSubmitError('Please enter a password to create your account.');
      scrollToFormError();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowPayment(false);
    setPaymentError(null);

    try {
      // Show payment form instead of creating booking immediately
      setShowPayment(true);
      scrollToActionZone('.payment-section');

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Booking failed');
      scrollToFormError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: { id: string; metadata?: { booking_id?: string } }) => {
    try {
      console.log('Payment successful, booking already created');
      
      // The booking was created during payment process
      setBookingResult({
        booking_id: paymentIntent.metadata?.booking_id || 'unknown',
        access_token: 'payment_confirmed',
        reference: paymentIntent.id,
        payment_method: 'stripe'
      });
      
      setCurrentStep('confirmation');
      setShowPayment(false);
      scrollToActionZone('.confirmation');

      // Animate to confirmation
      if (containerRef.current) {
        gsap.fromTo(containerRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

    } catch (error) {
      console.error('Post-payment processing error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Booking creation failed');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    scrollToActionZone('.payment-error');
  };

  const handleCashBankBooking = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('🚀 Starting cash/bank booking submission...', {
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        pickup: pickupDetails?.formattedAddress,
        dropoff: dropoffDetails?.formattedAddress,
        pickupTime: pickupTime.toISOString(),
        fareEstimate: fareBreakdown?.estimatedTotal,
        paymentMethod: 'cash_bank'
      });

      // Create booking with cash/bank payment method
      const bookingData = {
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        createAccount: wantsAccount,
        password: wantsAccount ? guestInfo.password : undefined,
        pickup: pickupDetails!,
        dropoff: dropoffDetails!,
        stops: stops.filter(stop => stop.details).map(stop => stop.details!),
        pickupTime: pickupTime.toISOString(),
        dropoffTime: null,
        vehicleFeatures: vehicleFeatures,
        supportWorkersCount: supportWorkers,
        fareEstimate: fareBreakdown!.estimatedTotal,
        bookingType: fareBreakdown?.bookingType.type || 'scheduled',
        leadTimeHours: fareBreakdown?.bookingType.leadTimeHours || 0,
        timeMultiplier: fareBreakdown?.bookingType.multiplier || 1.0,
        bookingTypeDiscount: fareBreakdown?.bookingType.discount || 0,
        specialRequirements: specialRequirements || null,
        paymentMethod: 'cash_bank' as const
      };

      console.log('📋 Booking data prepared:', bookingData);

      // Import the guest booking service
      const { guestBookingService } = await import('../services/guestBookingService');
      
      console.log('📞 Calling guest booking service...');
      const result = await guestBookingService.createGuestBooking(bookingData);
      
      console.log('📥 Guest booking service response:', result);
      
      if (result.success) {
        console.log('✅ Booking created successfully:', result);
        setBookingResult({
          booking_id: result.booking_id,
          access_token: result.access_token,
          reference: result.booking_id, // Use booking_id as reference
          payment_method: 'cash_bank'
        });
        
        // Handle account creation result
        if (result.user_account) {
          if (result.user_account.success) {
            console.log('✅ User account created/linked successfully:', result.user_account);
          } else {
            console.warn('⚠️ User account creation failed:', result.user_account.error);
            // Don't fail the booking for account creation issues
          }
        }
        
        setCurrentStep('confirmation');
        setShowPayment(false);
        scrollToActionZone('.confirmation');

        // Animate to confirmation
        if (containerRef.current) {
          gsap.fromTo(containerRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
          );
        }
      } else {
        console.error('❌ Booking creation failed:', result);
        throw new Error(result.message || 'Booking creation failed');
      }

    } catch (error) {
      console.error('❌ Cash/Bank booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Booking creation failed';
      setSubmitError(`Failed to create booking: ${errorMessage}`);
      scrollToActionZone('.payment-error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFeatures = pricingService.getVehicleFeatures();
  const supportWorkerTiers = pricingService.getSupportWorkerTiers();

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto">
      {/* Payment Section */}
      {showPayment && fareBreakdown && (
        <div className="payment-section">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white mb-8">
            <h3 className="text-2xl font-bold mb-2">Complete Your Booking</h3>
            <p className="text-green-100">
              Choose your payment method to complete your booking
            </p>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 payment-error">
              <div className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{paymentError}</span>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-8">
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
              amount={fareBreakdown.estimatedTotal}
            />
          </div>

          {/* Payment Form or Booking Confirmation */}
          {paymentMethod === 'stripe' ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <PaymentForm
                  amount={fareBreakdown.estimatedTotal}
                  breakdown={{
                    baseFare: fareBreakdown.baseFare,
                    distanceFare: fareBreakdown.distance.totalCost,
                    vehicleFeatures: fareBreakdown.vehicleFeatures.reduce((sum, f) => sum + f.price, 0),
                    supportWorkerCost: fareBreakdown.supportWorkers.totalCost,
                    peakTimeSurcharge: fareBreakdown.timeOfDay.surcharge || 0,
                    bookingTypeDiscount: fareBreakdown.bookingType.type === 'on_demand' ? 
                      (fareBreakdown.baseFare + fareBreakdown.distance.totalCost + fareBreakdown.vehicleFeatures.reduce((sum, f) => sum + f.price, 0) + fareBreakdown.supportWorkers.totalCost) * 0.5 :
                      fareBreakdown.bookingType.discount || 0
                  }}
                  bookingData={{
                    pickup_address: pickup,
                    dropoff_address: dropoff,
                    pickup_time: pickupTime.toISOString(),
                    dropoff_time: null,
                    vehicle_features: vehicleFeatures,
                    support_workers_count: supportWorkers,
                    fare_estimate: fareBreakdown.estimatedTotal,
                    booking_type: fareBreakdown?.bookingType.type || 'scheduled',
                    lead_time_hours: fareBreakdown?.bookingType.leadTimeHours || 0,
                    time_multiplier: fareBreakdown?.bookingType.multiplier || 1.0,
                    booking_type_discount: fareBreakdown?.bookingType.discount || 0,
                    special_requirements: specialRequirements || null
                  }}
                  guestInfo={{
                    name: guestInfo.name,
                    email: guestInfo.email,
                    phone: guestInfo.phone
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
              
              <div>
                <FareBreakdown 
                  breakdown={fareBreakdown}
                  isCalculating={false}
                  showEstimated={true}
                />
                
                <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Total Amount Due
                  </h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {pricingService.formatCurrency(fareBreakdown.estimatedTotal)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Final price - no additional charges
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Cash/Bank Payment Confirmation */
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h4 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
                  <Shield className="w-6 h-6 mr-2" />
                  Cash/Bank Payment Booking
                </h4>
                
                <div className="space-y-4 text-yellow-700">
                  <p className="text-sm">
                    <strong>Payment Method:</strong> Cash on pickup or Bank Transfer
                  </p>
                  <p className="text-sm">
                    <strong>Payment Due:</strong> On pickup (before drop-off)
                  </p>
                  <p className="text-sm">
                    <strong>Driver Confirmation:</strong> Driver will confirm payment received
                  </p>
                  <p className="text-sm">
                    <strong>Invoice:</strong> Sent to your email with payment instructions
                  </p>
                </div>

                <button
                  onClick={handleCashBankBooking}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-yellow-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Booking...' : 'Confirm Cash/Bank Booking'}
                </button>
              </div>
              
              <div>
                <FareBreakdown 
                  breakdown={fareBreakdown}
                  isCalculating={false}
                  showEstimated={true}
                />
                
                <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Total Amount Due
                  </h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-700">
                      {pricingService.formatCurrency(fareBreakdown.estimatedTotal)}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Payment due on pickup - no booking fees
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setShowPayment(false)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Booking Details
            </button>
          </div>
        </div>
      )}

      {currentStep === 'booking' && !showPayment && (
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Booking Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 form-step active guest-booking-form">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <Car className="w-6 h-6 mr-3 text-blue-600" />
              Book Your Ride
            </h3>

            {/* Location Inputs */}
            <div className="space-y-6 mb-8">
              <AddressInput
                label="Pickup Location"
                placeholder="Enter pickup postcode"
                value={pickup}
                onChange={handlePickupChange}
                onLocationSelect={setPickupDetails}
                showUseLocation={true}
                icon="pickup"
              />

              {/* Stops */}
              <div className="space-y-4">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="relative">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <AddressInput
                          label={`Stop ${index + 1}`}
                          placeholder="Enter stop postcode"
                          value={stop.address}
                          onChange={(value, details) => updateStop(stop.id, value, details)}
                          onLocationSelect={(details) => updateStop(stop.id, stop.address, details)}
                         showUseLocation={true}
                          icon="pickup"
                        />
                      </div>
                      <div className="flex-shrink-0 mt-12">
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="w-6 h-6 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {stops.length < 2 && (
                <div className="flex justify-center">
                  <button
                    onClick={addStop}
                    className="flex items-center px-4 py-3 bg-blue-50 text-blue-600 rounded-xl border-2 border-blue-200 border-dashed hover:bg-blue-100 hover:border-blue-300 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Stop ({stops.length}/2)
                  </button>
                </div>
              )}

              <AddressInput
                label="Final Drop-off Location"
                placeholder="Enter destination postcode"
                value={dropoff}
                onChange={handleDropoffChange}
                onLocationSelect={setDropoffDetails}
               showUseLocation={true}
                icon="dropoff"
              />
            </div>

            {/* Pickup Time */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Pickup Date & Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(pickupTime)}
                  onChange={handlePickupTimeChange}
                  min={formatDateTimeLocal(pricingService.getMinimumPickupTime())}
                  max={formatDateTimeLocal(pricingService.getMaximumPickupTime())}
                  step="900"
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 text-lg transition-all duration-300 ${
                    pickupTimeError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                />
              </div>
              
              <div className="mt-2 min-h-[1.25rem]">
                {pickupTimeError ? (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {pickupTimeError}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Earliest pickup: {pricingService.getMinimumPickupTime().toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Travel Information */}
            <div className="mb-8">
              <TravelInfo 
                travelInfo={travelInfo}
                isLoading={isCalculatingRoute}
                stopsCount={stops.length}
              />
            </div>

            {/* Vehicle Features */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Standard Ride
              </label>
              
              {/* Standard Features (Always Included) */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Included at no extra charge:
                </h4>
                <div className="flex items-center text-green-800">
                  <Car className="w-4 h-4 mr-2" />
                  <span className="text-sm">Wide door access for easier entry/exit</span>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Additional Features (Optional)
              </label>
              <div className="grid grid-cols-1 gap-3">
                {availableFeatures.map((feature) => {
                  const isSelected = vehicleFeatures.includes(feature.id);
                  const IconComponent = feature.icon === 'wheelchair' ? Car : 
                                      feature.icon === 'door' ? Car :
                                      feature.icon === 'lift' ? Users :
                                      feature.icon === 'oxygen' ? Car : Car;
                  
                  return (
                    <label key={feature.id} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFeatureToggle(feature.id)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-2"
                      />
                      <IconComponent className={`w-5 h-5 mx-3 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <span className={`font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                          {feature.name}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{feature.description}</span>
                          <span className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                            +{pricingService.formatCurrency(feature.price)}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Support Workers */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Support Workers (0-4)
              </label>
              <div className="space-y-3">
                {supportWorkerTiers.map((tier) => (
                  <label 
                    key={tier.count} 
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      supportWorkers === tier.count 
                        ? 'border-teal-500 bg-teal-50 shadow-md' 
                        : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="supportWorkers"
                      checked={supportWorkers === tier.count}
                      onChange={() => setSupportWorkers(tier.count)}
                      className="w-5 h-5 text-teal-600 border-2 border-gray-300 focus:ring-teal-500 focus:ring-offset-2"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {tier.count === 0 ? (
                            <Car className={`w-5 h-5 mr-2 ${supportWorkers === tier.count ? 'text-teal-600' : 'text-gray-600'}`} />
                          ) : (
                            <Users className={`w-5 h-5 mr-2 ${supportWorkers === tier.count ? 'text-teal-600' : 'text-gray-600'}`} />
                          )}
                          <span className={`font-medium ${supportWorkers === tier.count ? 'text-teal-800' : 'text-gray-700'}`}>
                            {tier.count === 0 ? 'No Support Needed' : `${tier.count} Support Worker${tier.count > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold ${supportWorkers === tier.count ? 'text-teal-600' : 'text-gray-600'}`}>
                          {tier.count === 0 ? 'Free' : `${pricingService.formatCurrency(tier.hourlyRate)}/hour`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Requirements */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insert Full Address here & any Special Request
              </label>
              <textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Complete address, special request, or notes for your journey..."
              />
            </div>

            {/* Fare Breakdown */}
            <div className="mb-8">
              <FareBreakdown 
                breakdown={fareBreakdown}
                isCalculating={isCalculatingFare}
                showEstimated={true}
              />
            </div>

            {/* Continue Button */}
            <button 
              onClick={handleProceedToGuestInfo}
              disabled={!canProceedToGuestInfo()}
              className={`w-full py-4 rounded-xl text-lg font-semibold transform transition-all duration-300 shadow-lg hover:shadow-xl ${
                canProceedToGuestInfo()
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Navigation className="inline-block w-5 h-5 mr-2" />
              {canProceedToGuestInfo()
                ? `Continue - ${fareBreakdown ? pricingService.formatCurrency(fareBreakdown.estimatedTotal) : ''}`
                : 'Complete Details to Continue'
              }
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                No account required • Secure booking process
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white dark:bg-dark-800/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              {stops.length > 0 ? 'Multi-Stop Route Preview' : 'Live Tracking Preview'}
            </h3>
            
            <GoogleMap 
              pickup={pickup}
              dropoff={dropoff}
              pickupCoords={pickupDetails ? { lat: pickupDetails.latitude, lng: pickupDetails.longitude } : undefined}
              dropoffCoords={dropoffDetails ? { lat: dropoffDetails.latitude, lng: dropoffDetails.longitude } : undefined}
              stops={stops.filter(stop => stop.details).map(stop => ({
                address: stop.address,
                coords: { lat: stop.details!.latitude, lng: stop.details!.longitude }
              }))}
              showProviders={true}
              maxProviders={20}
              searchRadius={15}
              className="h-96"
            />

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                <span className="text-green-800 dark:text-green-300 font-medium">
                  {pickupDetails && dropoffDetails && areAllStopsValid()
                    ? `Route calculated: ${travelInfo?.distance.text || 'calculating...'} • Admin will assign driver after booking`
                    : 'Enter valid UK addresses to see route preview'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'guest-info' && !showPayment && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Your Information</h3>
              <p className="text-gray-600 dark:text-gray-300">We need a few details to complete your booking</p>
            </div>

            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmitGuestInfo(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={guestInfo.name}
                    onChange={handleGuestInfoChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={guestInfo.email}
                    onChange={handleGuestInfoChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We'll send your booking confirmation here</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={guestInfo.phone}
                    onChange={handleGuestInfoChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your phone number (required)"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Required for driver contact and emergency updates</p>
              </div>

              {/* Optional Account Creation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="wantsAccount"
                    checked={wantsAccount}
                    onChange={(e) => setWantsAccount(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <label htmlFor="wantsAccount" className="font-medium text-blue-900 cursor-pointer">
                      Create an account to track your bookings (Optional)
                    </label>
                    <p className="text-sm text-blue-700 mt-1">
                      You can book without an account. Creating an account allows you to track all your bookings in one place.
                    </p>
                  </div>
                </div>
                
                {wantsAccount && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Create Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                      <input
                        type="password"
                        value={guestInfo.password || ''}
                        onChange={(e) => setGuestInfo(prev => ({ ...prev, password: e.target.value }))}
                        required={wantsAccount}
                        minLength={6}
                        className="w-full pl-12 pr-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Create a secure password (min 6 characters)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="text-gray-800 font-medium">{pickup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="text-gray-800 font-medium">{dropoff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup:</span>
                    <span className="text-gray-800 font-medium">{pickupTime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Support Workers:</span>
                    <span className="text-gray-800 font-medium">{supportWorkers === 0 ? 'None' : supportWorkers}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                    <span className="text-gray-900 font-semibold">Total Fare:</span>
                    <span className="text-blue-600 font-bold text-lg">
                      {fareBreakdown ? pricingService.formatCurrency(fareBreakdown.estimatedTotal) : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('booking')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Booking
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitBooking() || isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="inline-block w-5 h-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By booking, you agree to our Terms of Service and Privacy Policy. 
                Your information is secure and GDPR compliant.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'confirmation' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center confirmation">
            {bookingResult ? (
              <>
                {/* Success Icon and Header */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  ✅ Your Ride Has Been Booked!
                </h3>
                
                <p className="text-gray-600 mb-8 text-lg">
                  A confirmation has been sent to your email with journey and payment details.
                  <br />
                  <span className="font-semibold text-green-600">
                    Your assigned driver and support worker (if selected) will contact you shortly.
                  </span>
                </p>

                {/* Trip Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-8 border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">Trip Summary</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm text-gray-600">Pickup</p>
                          <p className="font-medium text-gray-900">{pickup}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm text-gray-600">Drop-off</p>
                          <p className="font-medium text-gray-900">{dropoff}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Pickup Time</p>
                        <p className="font-medium text-gray-900">{pickupTime.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium text-gray-900">
                          {bookingResult.payment_method === 'cash_bank' ? 'Cash on Pickup' : 'Paid via Card'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Booking Details</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <code className="bg-gray-200 px-2 py-1 rounded text-gray-800 font-mono">
                        {bookingResult.booking_id.slice(0, 8).toUpperCase()}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-gray-900">
                        {fareBreakdown ? pricingService.formatCurrency(fareBreakdown.estimatedTotal) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a
                    href={`/booking-status?token=${bookingResult.access_token}`}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
                  >
                    <Shield className="inline-block w-5 h-5 mr-2" />
                    Track My Ride
                  </a>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                  >
                    Return to Homepage
                  </button>
                </div>

                {/* What Happens Next */}
                <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-4 text-lg">What happens next:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>📧 Confirmation email sent with payment instructions</span>
                      </div>
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>💳 Complete payment using your preferred method</span>
                      </div>
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>🚗 Driver automatically assigned and dispatched</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>📱 Driver details sent via SMS before pickup</span>
                      </div>
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>🗺️ Live GPS tracking available during journey</span>
                      </div>
                      <div className="flex items-center text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                        <span>✅ Safe and compassionate transport experience</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm font-medium">
                    💡 <strong>Pro Tip:</strong> Bookmark your tracking link or save this email for easy access to your booking status
                  </p>
                </div>

                {/* Create Account CTA */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Want to track all your bookings in one place?
                  </p>
                  <Link
                    to="/signup"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                  >
                    Create a free account →
                  </Link>
                </div>
              </>
            ) : (
              // Fallback for when bookingResult is null
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Booking Status Unavailable
                </h3>
                
                <p className="text-gray-600 mb-8">
                  We're having trouble loading your booking details. Please check your email for confirmation or contact support.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Return to Homepage
                  </button>
                  <button
                    onClick={() => setCurrentStep('booking')}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBookingForm;