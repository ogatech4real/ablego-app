import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Loader, CheckCircle, AlertCircle, Crosshair } from 'lucide-react';
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
}

const AddressInput: React.FC<AddressInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onLocationSelect,
  showUseLocation = false,
  icon,
  className = ''
}) => {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');

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

  // Get autocomplete predictions
  const getPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    setValidationStatus('none');

    try {
      const results = await googlePlacesService.getAutocompletePredictions(input);
      setPredictions(results);
      setShowPredictions(results.length > 0);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setErrorMessage('Unable to fetch address suggestions');
      setValidationStatus('invalid');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced prediction fetching
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      getPredictions(value);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, getPredictions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear validation if user starts typing
    if (validationStatus !== 'none') {
      setValidationStatus('none');
      setErrorMessage('');
    }
    
    // Clear selected place if user modifies the input
    if (selectedPlaceId) {
      setSelectedPlaceId('');
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');

    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(prediction.place_id);
      
      if (placeDetails) {
        // Validate it's a UK address
        if (!googlePlacesService.isUKAddress(placeDetails)) {
          setValidationStatus('invalid');
          setErrorMessage('Please select a UK address');
          setIsLoading(false);
          return;
        }

        // Update input with formatted address
        const displayAddress = googlePlacesService.getDisplayAddress(placeDetails);
        onChange(displayAddress, placeDetails);
        
        // Trigger location select callback
        if (onLocationSelect) {
          onLocationSelect(placeDetails);
        }

        setSelectedPlaceId(prediction.place_id);
        setValidationStatus('valid');
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

  // Handle use current location
  const handleUseLocation = async () => {
    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode the coordinates
      const addressDetails = await googlePlacesService.geocodeAddress(`${latitude}, ${longitude}`);
      
      if (addressDetails && googlePlacesService.isUKAddress(addressDetails)) {
        const displayAddress = googlePlacesService.getDisplayAddress(addressDetails);
        onChange(displayAddress, addressDetails);
        
        if (onLocationSelect) {
          onLocationSelect(addressDetails);
        }

        setSelectedPlaceId(addressDetails.placeId);
        setValidationStatus('valid');
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

  // Handle manual address validation (when user types and presses enter)
  const handleManualValidation = async () => {
    if (!value.trim()) return;

    setIsLoading(true);
    setValidationStatus('none');
    setErrorMessage('');

    try {
      const addressDetails = await googlePlacesService.geocodeAddress(value);
      
      if (addressDetails && googlePlacesService.isUKAddress(addressDetails)) {
        const displayAddress = googlePlacesService.getDisplayAddress(addressDetails);
        onChange(displayAddress, addressDetails);
        
        if (onLocationSelect) {
          onLocationSelect(addressDetails);
        }

        setSelectedPlaceId(addressDetails.placeId);
        setValidationStatus('valid');
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

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}`} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
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
              ${validationStatus === 'valid' ? 'border-green-300 bg-green-50' : ''}
              ${validationStatus === 'invalid' ? 'border-red-300 bg-red-50' : 'border-gray-300'}
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

        {/* Validation Message */}
        <div 
          id={`${label.toLowerCase().replace(/\s+/g, '-')}-validation`}
          className="mt-1 min-h-[1.25rem]"
          aria-live="polite"
        >
          {validationStatus === 'valid' && (
            <p className="text-sm text-green-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Valid UK address
            </p>
          )}
          {validationStatus === 'invalid' && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errorMessage || 'Please enter a valid UK address'}
            </p>
          )}
        </div>

        {/* Autocomplete Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div
            ref={predictionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePredictionSelect(prediction)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </div>
                    {prediction.structured_formatting?.secondary_text && (
                      <div className="text-sm text-gray-500">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressInput;