import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader, CheckCircle, AlertCircle, Crosshair, Target, Info } from 'lucide-react';
import { googlePlacesService, type AddressDetails } from '../services/googlePlacesService';
import { gsap } from 'gsap';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string, details?: AddressDetails) => void;
  onLocationSelect?: (details: AddressDetails) => void;
  showUseLocation?: boolean;
  icon: 'pickup' | 'dropoff';
  className?: string;
  required?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onLocationSelect,
  showUseLocation = false,
  icon,
  className = '',
  required = false
}) => {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid' | 'precise' | 'imprecise'>('none');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [currentAddressDetails, setCurrentAddressDetails] = useState<AddressDetails | null>(null);
  const [precisionInfo, setPrecisionInfo] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const predictionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Animation for predictions dropdown
  useEffect(() => {
    if (showPredictions && predictions.length > 0) {
      gsap.fromTo(predictionsRef.current, 
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [showPredictions, predictions]);

  // Handle click outside to close predictions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (predictionsRef.current && !predictionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get autocomplete predictions with intelligent handling
  const getPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      setErrorMessage('');
      return;
    }

    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');

    try {
      const results = await googlePlacesService.getAutocompletePredictions(input);
      
      if (results.length > 0) {
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
        // Don't show error for no results - just let user continue typing
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
      setShowPredictions(false);
      // Only show error for actual failures, not for no results
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Intelligent debounced prediction fetching
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      setErrorMessage('');
      return;
    }

    // Faster response for shorter inputs, slightly longer for longer inputs
    const delay = value.length <= 3 ? 100 : 150;
    
    debounceTimeoutRef.current = setTimeout(() => {
      getPredictions(value);
    }, delay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, getPredictions]);

  // Handle input change with enhanced feedback
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear validation if user starts typing
    if (validationStatus !== 'none') {
      setValidationStatus('none');
      setErrorMessage('');
      setPrecisionInfo('');
    }
    
    // Clear selected place if user modifies the input
    if (selectedPlaceId) {
      setSelectedPlaceId('');
      setCurrentAddressDetails(null);
    }
  };

  // Intelligent prediction selection
  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');
    setPrecisionInfo('');

    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(prediction.place_id);
      
      if (placeDetails) {
        // Always accept the selection - let the user decide
        const displayAddress = googlePlacesService.getDisplayAddress(placeDetails);
        onChange(displayAddress, placeDetails);
        
        // Trigger location select callback
        if (onLocationSelect) {
          onLocationSelect(placeDetails);
        }

        setSelectedPlaceId(prediction.place_id);
        setCurrentAddressDetails(placeDetails);
        
        // Provide helpful feedback without being too strict
        if (placeDetails.preciseLocation && placeDetails.streetNumber && placeDetails.route) {
          setValidationStatus('precise');
          setPrecisionInfo('✓ Full address selected - Ready for booking');
        } else if (placeDetails.route) {
          setValidationStatus('valid');
          setPrecisionInfo('✓ Address selected - Consider adding house number for precise pickup');
        } else {
          setValidationStatus('valid');
          setPrecisionInfo('✓ Location selected - Consider adding street details for precise pickup');
        }
        
        setShowPredictions(false);
      } else {
        setValidationStatus('invalid');
        setErrorMessage('Unable to get address details');
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      setValidationStatus('invalid');
      setErrorMessage('Unable to get address details');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced current location with precision feedback
  const handleUseLocation = async () => {
    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');
    setPrecisionInfo('');

    try {
      const addressDetails = await googlePlacesService.getCurrentLocation();
      
      if (addressDetails && googlePlacesService.isUKAddress(addressDetails)) {
        const isPrecise = googlePlacesService.isPreciseEnoughForBooking(addressDetails);
        const precisionLevel = addressDetails.preciseLocation ? 'precise' : 'imprecise';
        
        const displayAddress = googlePlacesService.getDisplayAddress(addressDetails);
        onChange(displayAddress, addressDetails);
        
        if (onLocationSelect) {
          onLocationSelect(addressDetails);
        }

        setSelectedPlaceId(addressDetails.placeId);
        setCurrentAddressDetails(addressDetails);
        setValidationStatus(precisionLevel);
        
        // Set precision feedback with accuracy information
        if (isPrecise) {
          setPrecisionInfo(`✓ Precise location (${addressDetails.accuracy ? Math.round(addressDetails.accuracy) : 'unknown'}m accuracy) - Ready for booking`);
        } else if (addressDetails.preciseLocation) {
          setPrecisionInfo(`⚠️ Good location (${addressDetails.accuracy ? Math.round(addressDetails.accuracy) : 'unknown'}m accuracy) - Consider adding more details`);
        } else {
          setPrecisionInfo(`⚠️ General area (${addressDetails.accuracy ? Math.round(addressDetails.accuracy) : 'unknown'}m accuracy) - Please select a specific address`);
        }
      } else {
        setValidationStatus('invalid');
        setErrorMessage('Unable to get your current location or not in UK');
      }
    } catch (error) {
      console.error('Location error:', error);
      setValidationStatus('invalid');
      setErrorMessage('Unable to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced manual address validation
  const handleManualValidation = async () => {
    if (!value.trim()) return;

    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');
    setPrecisionInfo('');

    try {
      const addressDetails = await googlePlacesService.geocodeAddress(value);
      
      if (addressDetails && googlePlacesService.isUKAddress(addressDetails)) {
        const isPrecise = googlePlacesService.isPreciseEnoughForBooking(addressDetails);
        const precisionLevel = addressDetails.preciseLocation ? 'precise' : 'imprecise';
        
        const displayAddress = googlePlacesService.getDisplayAddress(addressDetails);
        onChange(displayAddress, addressDetails);
        
        if (onLocationSelect) {
          onLocationSelect(addressDetails);
        }

        setSelectedPlaceId(addressDetails.placeId);
        setCurrentAddressDetails(addressDetails);
        setValidationStatus(precisionLevel);
        
        // Set precision feedback
        if (isPrecise) {
          setPrecisionInfo('✓ Precise location - Ready for booking');
        } else if (addressDetails.preciseLocation) {
          setPrecisionInfo('⚠️ Good location - Consider adding more details');
        } else {
          setPrecisionInfo('⚠️ General area - Please select a specific address');
        }
      } else {
        setValidationStatus('invalid');
        setErrorMessage('Please enter a valid UK address');
      }
    } catch (error) {
      console.error('Manual validation error:', error);
      setValidationStatus('invalid');
      setErrorMessage('Please enter a valid UK address');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualValidation();
    }
  };

  const getIcon = () => {
    return icon === 'pickup' ? <MapPin className="w-5 h-5" /> : <Navigation className="w-5 h-5" />;
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'precise':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'imprecise':
        return <Target className="w-4 h-4 text-yellow-600" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    switch (validationStatus) {
      case 'precise':
        return 'border-green-300 bg-green-50';
      case 'imprecise':
        return 'border-yellow-300 bg-yellow-50';
      case 'invalid':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}`} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {getIcon()}
            </div>
          </div>
          
          <input
            ref={inputRef}
            id={`${label.toLowerCase().replace(/\s+/g, '-')}`}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={`
              block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              ${getValidationColor()}
              ${isLoading ? 'pr-16' : ''}
            `}
            autoComplete="off"
            aria-describedby={`${label.toLowerCase().replace(/\s+/g, '-')}-validation`}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          )}
          
          {/* Use location button */}
          {showUseLocation && !isLoading && (
            <button
              type="button"
              onClick={handleUseLocation}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
              title="Use current location"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Enhanced Validation Message */}
        <div 
          id={`${label.toLowerCase().replace(/\s+/g, '-')}-validation`}
          className="mt-1 min-h-[1.25rem]"
          aria-live="polite"
        >
          {validationStatus === 'precise' && (
            <p className="text-sm text-green-600 flex items-center">
              {getValidationIcon()}
              <span className="ml-1">Precise UK address</span>
            </p>
          )}
          {validationStatus === 'imprecise' && (
            <p className="text-sm text-yellow-600 flex items-center">
              {getValidationIcon()}
              <span className="ml-1">Good location - Consider adding more details</span>
            </p>
          )}
          {validationStatus === 'invalid' && (
            <p className="text-sm text-red-600 flex items-center">
              {getValidationIcon()}
              <span className="ml-1">{errorMessage || 'Please enter a valid UK address'}</span>
            </p>
          )}
          
          {/* Precision Information */}
          {precisionInfo && (
            <p className="text-xs text-gray-600 mt-1 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              {precisionInfo}
            </p>
          )}
        </div>

        {/* Enhanced Autocomplete Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div
            ref={predictionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {predictions.map((prediction, index) => {
              const hasStreetNumber = prediction.structured_formatting?.main_text?.match(/^\d+/);
              const isPrecise = hasStreetNumber;
              
              return (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handlePredictionSelect(prediction)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0 ${
                    isPrecise ? 'bg-green-50 hover:bg-green-100' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      {isPrecise ? (
                        <Target className="w-4 h-4 text-green-600" />
                      ) : (
                        <MapPin className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium">
                        {prediction.structured_formatting?.main_text || prediction.description}
                      </div>
                      {prediction.structured_formatting?.secondary_text && (
                        <div className="text-sm text-gray-500">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      )}
                      {isPrecise && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Precise location
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressInput;