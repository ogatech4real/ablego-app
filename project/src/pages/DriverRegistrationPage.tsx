import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  User,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ArrowRight,
  Clock,
  Award,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/supabase';
import DocumentManager from '../components/DocumentManager';
import AuthModal from '../components/AuthModal';
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';
import { scrollToTop } from '../utils/scrollUtils';
import { scrollToActionZone } from '../utils/scrollUtils';

const DriverRegistrationPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [stripeSetupComplete, setStripeSetupComplete] = useState(false);
  
  const [personalData, setPersonalData] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    drivingLicenseNumber: '',
    licenseIssueDate: '',
    licenseExpiryDate: ''
  });

  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    passengerCapacity: 4,
    wheelchairCapacity: 0,
    accessibleRating: 1,
    features: [] as string[],
    insuranceProvider: '',
    insuranceExpiryDate: '',
    motExpiryDate: ''
  });

  useEffect(() => {
    document.title = 'Driver Registration - AbleGo';
    scrollToTop('instant');
    
    // Pre-fill data if user is logged in
    if (profile) {
      setPersonalData(prev => ({
        ...prev,
        fullName: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      }));
    }
  }, [profile]);

  // Redirect if not authenticated
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Driver Registration
              </h1>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                To register as a driver with AbleGo, you'll need to create an account first. 
                This helps us verify your identity and keep our platform secure.
              </p>

              <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3">What you'll need:</h3>
                <ul className="text-sm text-blue-800 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Valid UK driving license (3+ years)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Vehicle registration documents
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Current insurance certificate
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    MOT certificate (if applicable)
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Account & Register
                </button>
                <Link
                  to="/login"
                  className="flex-1 px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-center"
                >
                  Already Have Account?
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="signup"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePersonalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'passengerCapacity' || name === 'wheelchairCapacity' || name === 'accessibleRating'
        ? parseInt(value)
        : value
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmitPersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Simulate profile update for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful update
      console.log('Profile updated:', personalData);

      setCurrentStep(2);
      scrollToActionZone('.form-step.active, .registration-form');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unknown error');
      scrollToActionZone('.error-message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Simulate vehicle creation for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful creation
      console.log('Vehicle created:', vehicleData);

      setCurrentStep(3);
      scrollToActionZone('.form-step.active, .registration-form');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unknown error');
      scrollToActionZone('.error-message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFeatures = [
    { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿', description: 'Ramp or lift for wheelchairs' },
    { id: 'wide_door_access', label: 'Wide Door Access', icon: '🚪', description: 'Extra-wide doors for easy entry' },
    { id: 'patient_lift', label: 'Patient Lift', icon: '🏥', description: 'Hydraulic lift assistance' },
    { id: 'oxygen_support', label: 'Oxygen Support', icon: '🫁', description: 'Oxygen tank transport ready' },
    { id: 'hearing_loop', label: 'Hearing Loop', icon: '👂', description: 'Induction loop system' },
    { id: 'visual_aids', label: 'Visual Aids', icon: '👁️', description: 'High contrast displays' }
  ];

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Your details and contact info' },
    { number: 2, title: 'Vehicle Details', description: 'Register your vehicle' },
    { number: 3, title: 'Documents & Verification', description: 'Upload required documents' },
    { number: 4, title: 'Payment Setup', description: 'Set up earnings account' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full mb-6">
            <Car className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Driver Registration
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join our network of professional drivers and start earning while making a difference in people's lives
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-center mb-12 registration-form">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 max-w-24">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-teal-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Registration completed successfully!</span>
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmitPersonalInfo} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={personalData.fullName}
                        onChange={handlePersonalDataChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={personalData.phone}
                        onChange={handlePersonalDataChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        name="address"
                        value={personalData.address}
                        onChange={handlePersonalDataChange}
                        required
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Enter your full address including postcode"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={personalData.dateOfBirth}
                        onChange={handlePersonalDataChange}
                        required
                        max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be 18 or older</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      name="drivingLicenseNumber"
                      value={personalData.drivingLicenseNumber}
                      onChange={handlePersonalDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="UK driving license number"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={personalData.emergencyContactName}
                        onChange={handlePersonalDataChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={personalData.emergencyContactPhone}
                        onChange={handlePersonalDataChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to Vehicle Details
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  <Car className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vehicle Information</h2>
                  <p className="text-gray-600">Tell us about your vehicle</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmitVehicle} className="space-y-8">
                {/* Basic Vehicle Info */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Make *
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={vehicleData.make}
                      onChange={handleVehicleDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., Ford, Toyota, Mercedes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={vehicleData.model}
                      onChange={handleVehicleDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., Transit, Prius, Sprinter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={vehicleData.year}
                      onChange={handleVehicleDataChange}
                      required
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      name="licensePlate"
                      value={vehicleData.licensePlate}
                      onChange={handleVehicleDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase"
                      placeholder="e.g., AB12 CDE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color *
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={vehicleData.color}
                      onChange={handleVehicleDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., White, Blue, Silver"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passenger Capacity *
                    </label>
                    <select
                      name="passengerCapacity"
                      value={vehicleData.passengerCapacity}
                      onChange={handleVehicleDataChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wheelchair Capacity
                    </label>
                    <select
                      name="wheelchairCapacity"
                      value={vehicleData.wheelchairCapacity}
                      onChange={handleVehicleDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {[0, 1, 2].map(num => (
                        <option key={num} value={num}>{num} wheelchair{num !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accessibility Rating
                    </label>
                    <select
                      name="accessibleRating"
                      value={vehicleData.accessibleRating}
                      onChange={handleVehicleDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>
                          {num} star{num > 1 ? 's' : ''} - {
                            num === 1 ? 'Basic accessibility' :
                            num === 2 ? 'Good accessibility' :
                            num === 3 ? 'Very accessible' :
                            num === 4 ? 'Excellent accessibility' :
                            'Premium accessibility'
                          }
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vehicle Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Accessibility Features
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableFeatures.map(feature => (
                      <label
                        key={feature.id}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                          vehicleData.features.includes(feature.id)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={vehicleData.features.includes(feature.id)}
                          onChange={() => handleFeatureToggle(feature.id)}
                          className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-2 mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-lg mr-2">{feature.icon}</span>
                            <span className="font-medium text-gray-800">{feature.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Insurance & MOT */}
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Insurance & MOT Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        name="insuranceProvider"
                        value={vehicleData.insuranceProvider}
                        onChange={handleVehicleDataChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="e.g., Aviva, Direct Line"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Expiry Date
                      </label>
                      <input
                        type="date"
                        name="insuranceExpiryDate"
                        value={vehicleData.insuranceExpiryDate}
                        onChange={handleVehicleDataChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MOT Expiry Date
                      </label>
                      <input
                        type="date"
                        name="motExpiryDate"
                        value={vehicleData.motExpiryDate}
                        onChange={handleVehicleDataChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for vehicles over 3 years old</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving Vehicle...
                      </>
                    ) : (
                      <>
                        Continue to Documents
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
                    <p className="text-gray-600">Upload required documents for verification</p>
                  </div>
                </div>

                <DocumentManager
                  bucket="vehicle-docs"
                  entityId="temp-vehicle-id"
                  entityType="vehicle"
                />

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Vehicle Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                  >
                    Continue to Payment Setup
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 text-center">What Happens Next?</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Document Review</h4>
                    <p className="text-blue-100 text-sm">Our team will review your documents within 24-48 hours</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Verification</h4>
                    <p className="text-blue-100 text-sm">Background checks and vehicle inspection completed</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Start Driving</h4>
                    <p className="text-blue-100 text-sm">Begin accepting bookings and earning money</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment Setup */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Account Setup</h2>
                    <p className="text-gray-600">Set up your Stripe account to receive earnings</p>
                  </div>
                </div>

                <StripeConnectOnboarding 
                  userType="driver"
                  onComplete={() => setStripeSetupComplete(true)}
                />

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Documents
                  </button>
                  <Link
                    to="/dashboard/driver"
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                  >
                    Complete Registration
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 text-center">Earnings & Payouts</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">70% Driver Share</h4>
                    <p className="text-blue-100 text-sm">You keep 70% of base fare + distance costs</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Daily Payouts</h4>
                    <p className="text-blue-100 text-sm">Automatic transfers to your bank account</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Secure & Instant</h4>
                    <p className="text-blue-100 text-sm">Powered by Stripe for secure, instant payments</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverRegistrationPage;