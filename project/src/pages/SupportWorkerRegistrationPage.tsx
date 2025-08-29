import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Heart, 
  Shield,
  User,
  Phone,
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  Plus,
  X,
  Briefcase,
  Globe,
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

const SupportWorkerRegistrationPage: React.FC = () => {
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
    emergencyContactPhone: ''
  });

  const [professionalData, setProfessionalData] = useState({
    bio: '',
    experienceYears: 0,
    hourlyRate: 18.50,
    specializations: [] as string[],
    languages: ['English'],
    certifications: [] as string[],
    previousEmployer: '',
    references: [] as Array<{ name: string; phone: string; relationship: string }>,
    availability: {
      monday: { available: true, start: '09:00', end: '17:00' },
      tuesday: { available: true, start: '09:00', end: '17:00' },
      wednesday: { available: true, start: '09:00', end: '17:00' },
      thursday: { available: true, start: '09:00', end: '17:00' },
      friday: { available: true, start: '09:00', end: '17:00' },
      saturday: { available: false, start: '09:00', end: '17:00' },
      sunday: { available: false, start: '09:00', end: '17:00' }
    }
  });

  useEffect(() => {
    document.title = 'Support Worker Registration - AbleGo';
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Support Worker Registration
              </h1>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                To become a support worker with AbleGo, you'll need to create an account first. 
                This helps us ensure the safety and security of our community.
              </p>

              <div className="bg-teal-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-teal-900 mb-3">What you'll need:</h3>
                <ul className="text-sm text-teal-800 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Enhanced DBS check certificate
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    First aid or relevant certifications
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Professional references
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Photo identification
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Account & Apply
                </button>
                <Link
                  to="/login"
                  className="flex-1 px-6 py-4 border-2 border-teal-600 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors text-center"
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
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePersonalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfessionalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfessionalData(prev => ({
      ...prev,
      [name]: name === 'experienceYears' || name === 'hourlyRate' ? parseFloat(value) : value
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setProfessionalData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageChange = (index: number, value: string) => {
    setProfessionalData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? value : lang)
    }));
  };

  const addLanguage = () => {
    setProfessionalData(prev => ({
      ...prev,
      languages: [...prev.languages, '']
    }));
  };

  const removeLanguage = (index: number) => {
    setProfessionalData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addReference = () => {
    setProfessionalData(prev => ({
      ...prev,
      references: [...prev.references, { name: '', phone: '', relationship: '' }]
    }));
  };

  const removeReference = (index: number) => {
    setProfessionalData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const updateReference = (index: number, field: string, value: string) => {
    setProfessionalData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setProfessionalData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
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

  const handleSubmitProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Simulate support worker creation for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful creation
      console.log('Support worker created:', professionalData);

      setCurrentStep(3);
      scrollToActionZone('.form-step.active, .registration-form');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unknown error');
      scrollToActionZone('.error-message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSpecializations = [
    { id: 'mobility_assistance', label: 'Mobility Assistance', icon: '♿', description: 'Help with walking, transfers, and mobility aids' },
    { id: 'visual_impairment', label: 'Visual Impairment Support', icon: '👁️', description: 'Guide and assist people with visual challenges' },
    { id: 'hearing_impairment', label: 'Hearing Impairment Support', icon: '👂', description: 'Communication support for hearing difficulties' },
    { id: 'learning_disabilities', label: 'Learning Disabilities', icon: '🧠', description: 'Support for cognitive and learning challenges' },
    { id: 'mental_health', label: 'Mental Health Support', icon: '💚', description: 'Compassionate mental health assistance' },
    { id: 'elderly_care', label: 'Elderly Care', icon: '👴', description: 'Specialized care for older adults' },
    { id: 'medical_transport', label: 'Medical Transport', icon: '🏥', description: 'Support for medical appointments and procedures' },
    { id: 'autism_support', label: 'Autism Support', icon: '🌟', description: 'Understanding and supporting autistic individuals' }
  ];

  const steps = [
    { number: 1, title: 'Personal Information', description: 'Your details and contact info' },
    { number: 2, title: 'Professional Profile', description: 'Experience and specializations' },
    { number: 3, title: 'Documents & Verification', description: 'Upload required documents' },
    { number: 4, title: 'Payment Setup', description: 'Set up earnings account' }
  ];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-gradient-to-r from-teal-100 to-green-100 rounded-full mb-6">
            <Users className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Support Worker Registration
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join our compassionate team and help people with disabilities and health challenges maintain their independence
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
                        ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg'
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
                        currentStep >= step.number ? 'text-teal-600' : 'text-gray-500'
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
                      currentStep > step.number ? 'bg-gradient-to-r from-teal-600 to-green-600' : 'bg-gray-300'
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
                <span>Application submitted successfully!</span>
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-teal-600" />
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be 18 or older</p>
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
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to Professional Profile
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Professional Profile</h2>
                  <p className="text-gray-600">Your experience and specializations</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmitProfessional} className="space-y-8">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Introduction *
                  </label>
                  <textarea
                    name="bio"
                    value={professionalData.bio}
                    onChange={handleProfessionalDataChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                    placeholder="Tell us about yourself, your experience, and why you want to be a support worker. This will be visible to customers."
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 100 characters</p>
                </div>

                {/* Experience & Rate */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      value={professionalData.experienceYears}
                      onChange={handleProfessionalDataChange}
                      required
                      min="0"
                      max="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Desired Hourly Rate (£) *
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={professionalData.hourlyRate}
                      onChange={handleProfessionalDataChange}
                      required
                      min="15"
                      max="25"
                      step="0.50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Range: £16.50 - £25.00 per hour</p>
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Areas of Specialization *
                  </label>
                  <p className="text-sm text-gray-600 mb-4">Select all areas where you have experience or training</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableSpecializations.map(specialization => (
                      <label
                        key={specialization.id}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                          professionalData.specializations.includes(specialization.id)
                            ? 'border-teal-500 bg-teal-50 shadow-md'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={professionalData.specializations.includes(specialization.id)}
                          onChange={() => handleSpecializationToggle(specialization.id)}
                          className="w-5 h-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500 focus:ring-offset-2 mt-0.5"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-lg mr-2">{specialization.icon}</span>
                            <span className="font-medium text-gray-800">{specialization.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{specialization.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Languages Spoken *
                  </label>
                  <div className="space-y-3">
                    {professionalData.languages.map((language, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={language}
                            onChange={(e) => handleLanguageChange(index, e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                            placeholder="Enter language"
                          />
                        </div>
                        {professionalData.languages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLanguage(index)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="flex items-center text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Language
                    </button>
                  </div>
                </div>

                {/* References */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Professional References
                  </label>
                  <p className="text-sm text-gray-600 mb-4">Provide at least 2 professional references</p>
                  <div className="space-y-4">
                    {professionalData.references.map((reference, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeReference(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={reference.name}
                            onChange={(e) => updateReference(index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            placeholder="Full name"
                          />
                          <input
                            type="tel"
                            value={reference.phone}
                            onChange={(e) => updateReference(index, 'phone', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            placeholder="Phone number"
                          />
                          <input
                            type="text"
                            value={reference.relationship}
                            onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            placeholder="Relationship (e.g., Manager)"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addReference}
                      className="flex items-center text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Reference
                    </button>
                  </div>
                </div>

                {/* Availability */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Availability
                  </h3>
                  <div className="space-y-3">
                    {daysOfWeek.map(day => (
                      <div key={day} className="flex items-center space-x-4 p-3 bg-white rounded-lg">
                        <div className="w-20">
                          <span className="font-medium text-gray-700 capitalize">{day}</span>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={professionalData.availability[day as keyof typeof professionalData.availability].available}
                            onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600">Available</span>
                        </label>
                        {professionalData.availability[day as keyof typeof professionalData.availability].available && (
                          <>
                            <input
                              type="time"
                              value={professionalData.availability[day as keyof typeof professionalData.availability].start}
                              onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={professionalData.availability[day as keyof typeof professionalData.availability].end}
                              onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </>
                        )}
                      </div>
                    ))}
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
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving Profile...
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
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Upload className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
                    <p className="text-gray-600">Upload required documents for verification</p>
                  </div>
                </div>

                <DocumentManager
                  bucket="support-ids"
                  entityType="support_worker"
                />

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Professional Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                  >
                    Continue to Payment Setup
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 text-center">What Happens Next?</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Background Check</h4>
                    <p className="text-teal-100 text-sm">Enhanced DBS check and reference verification (3-5 days)</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Training Program</h4>
                    <p className="text-teal-100 text-sm">Complete our comprehensive online and practical training</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Start Supporting</h4>
                    <p className="text-teal-100 text-sm">Begin helping customers and earning competitive rates</p>
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
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Account Setup</h2>
                    <p className="text-gray-600">Set up your Stripe account to receive earnings</p>
                  </div>
                </div>

                <StripeConnectOnboarding 
                  userType="support_worker"
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
                    to="/dashboard/support"
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                  >
                    Complete Application
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 text-center">Earnings & Payouts</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">70% Support Share</h4>
                    <p className="text-teal-100 text-sm">You keep 70% of all support worker fees</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Daily Payouts</h4>
                    <p className="text-teal-100 text-sm">Automatic transfers to your bank account</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold mb-2">Secure & Instant</h4>
                    <p className="text-teal-100 text-sm">Powered by Stripe for secure, instant payments</p>
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

export default SupportWorkerRegistrationPage;