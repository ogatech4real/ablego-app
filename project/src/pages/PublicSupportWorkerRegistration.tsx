import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Heart,
  Briefcase,
  Globe,
  Plus,
  X,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scrollToTop } from '../utils/scrollUtils';
import { scrollToActionZone } from '../utils/scrollUtils';

interface SupportWorkerApplicationData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  
  // Professional Information
  bio: string;
  experienceYears: number;
  desiredHourlyRate: number;
  specializations: string[];
  languages: string[];
  certifications: string[];
  previousEmployer: string;
  references: Array<{ name: string; phone: string; relationship: string; email: string }>;
  
  // Availability
  availability: {
    [key: string]: { available: boolean; start: string; end: string };
  };
  
  // Additional Information
  motivation: string;
  hasDbsCheck: boolean;
  dbsIssueDate: string;
  hasFirstAid: boolean;
  firstAidExpiryDate: string;
  hasTransportExperience: boolean;
  transportExperienceDetails: string;
}

const PublicSupportWorkerRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SupportWorkerApplicationData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bio: '',
    experienceYears: 0,
    desiredHourlyRate: 18.50,
    specializations: [],
    languages: ['English'],
    certifications: [],
    previousEmployer: '',
    references: [
      { name: '', phone: '', relationship: '', email: '' },
      { name: '', phone: '', relationship: '', email: '' }
    ],
    availability: {
      monday: { available: true, start: '09:00', end: '17:00' },
      tuesday: { available: true, start: '09:00', end: '17:00' },
      wednesday: { available: true, start: '09:00', end: '17:00' },
      thursday: { available: true, start: '09:00', end: '17:00' },
      friday: { available: true, start: '09:00', end: '17:00' },
      saturday: { available: false, start: '09:00', end: '17:00' },
      sunday: { available: false, start: '09:00', end: '17:00' }
    },
    motivation: '',
    hasDbsCheck: false,
    dbsIssueDate: '',
    hasFirstAid: false,
    firstAidExpiryDate: '',
    hasTransportExperience: false,
    transportExperienceDetails: ''
  });

  useEffect(() => {
    document.title = 'Support Worker Registration - AbleGo';
    scrollToTop('instant');
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'experienceYears' || name === 'desiredHourlyRate'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? value : lang)
    }));
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, '']
    }));
  };

  const removeLanguage = (index: number) => {
    if (formData.languages.length > 1) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  const updateReference = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const addReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { name: '', phone: '', relationship: '', email: '' }]
    }));
  };

  const removeReference = (index: number) => {
    if (formData.references.length > 2) {
      setFormData(prev => ({
        ...prev,
        references: prev.references.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.email && formData.phone && formData.address && formData.dateOfBirth);
      case 2:
        return !!(formData.bio && formData.bio.length >= 100 && formData.specializations.length > 0);
      case 3:
        return formData.references.filter(ref => ref.name && ref.phone && ref.relationship).length >= 2;
      default:
        return true;
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      if (validateStep(currentStep)) {
        setCurrentStep(prev => prev + 1);
        scrollToActionZone('.form-step.active, .support-worker-registration');
      }
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Simulate application submission for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful submission
      const mockData = {
        id: `app_${Date.now()}`,
        ...formData,
        status: 'pending',
        application_type: 'support_worker'
      };

      setApplicationId(mockData.id);
      setSubmitSuccess(true);
      scrollToActionZone('.success-message, .confirmation');

      console.log('Support worker application submitted:', mockData);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unknown error occurred');
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

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Application Submitted!
              </h1>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Thank you for your interest in becoming an AbleGo support worker. Your application has been submitted 
                and is now under review. We'll contact you within 2-3 business days.
              </p>

              <div className="bg-teal-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-teal-900 mb-3">What happens next:</h3>
                <ul className="text-sm text-teal-800 space-y-2 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Application review and reference checks (2-3 days)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Enhanced DBS check and certification verification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Training program enrollment and completion
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                    Email invitation to create your support worker account
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Application ID: <code className="bg-gray-100 px-2 py-1 rounded">{applicationId}</code>
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-center mb-12 support-worker-registration">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step, index) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep >= step
                        ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        step
                      )}
                    </div>
                    <p className={`text-sm font-medium mt-2 ${
                      currentStep >= step ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {step === 1 && 'Personal'}
                      {step === 2 && 'Professional'}
                      {step === 3 && 'References'}
                      {step === 4 && 'Availability'}
                    </p>
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 transition-all duration-300 ${
                      currentStep > step ? 'bg-gradient-to-r from-teal-600 to-green-600' : 'bg-gray-300'
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

          <form onSubmit={handleStepSubmit} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600">Tell us about yourself</p>
                  </div>
                </div>
                
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
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="Enter your email address"
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
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="Enter your phone number"
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
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Must be 18 or older</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                        placeholder="Enter your full address including postcode"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200 mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Professional Profile</h2>
                    <p className="text-gray-600">Your experience and specializations</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio / Introduction *
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                      placeholder="Tell us about yourself, your experience, and why you want to be a support worker. This will be visible to customers."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 100 characters ({formData.bio.length}/100)
                    </p>
                  </div>

                  {/* Experience & Rate */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Care Experience
                      </label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desired Hourly Rate (£)
                      </label>
                      <input
                        type="number"
                        name="desiredHourlyRate"
                        value={formData.desiredHourlyRate}
                        onChange={handleInputChange}
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
                      Areas of Specialization * (Select at least one)
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {availableSpecializations.map(specialization => (
                        <label
                          key={specialization.id}
                          className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                            formData.specializations.includes(specialization.id)
                              ? 'border-teal-500 bg-teal-50 shadow-md'
                              : 'border-gray-200 hover:border-teal-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(specialization.id)}
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
                      {formData.languages.map((language, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={language}
                              onChange={(e) => handleLanguageChange(index, e.target.value)}
                              required
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                              placeholder="Enter language"
                            />
                          </div>
                          {formData.languages.length > 1 && (
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

                  {/* Certifications */}
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Certifications & Checks
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="hasDbsCheck"
                              checked={formData.hasDbsCheck}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 font-medium text-gray-800">Enhanced DBS Check</span>
                          </label>
                          <p className="text-sm text-gray-600 ml-8">Current enhanced DBS certificate</p>
                        </div>
                        {formData.hasDbsCheck && (
                          <input
                            type="date"
                            name="dbsIssueDate"
                            value={formData.dbsIssueDate}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Issue date"
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              name="hasFirstAid"
                              checked={formData.hasFirstAid}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 font-medium text-gray-800">First Aid Certification</span>
                          </label>
                          <p className="text-sm text-gray-600 ml-8">Valid first aid certificate</p>
                        </div>
                        {formData.hasFirstAid && (
                          <input
                            type="date"
                            name="firstAidExpiryDate"
                            value={formData.firstAidExpiryDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Expiry date"
                          />
                        )}
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="hasTransportExperience"
                            checked={formData.hasTransportExperience}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 font-medium text-gray-800">Previous Transport Experience</span>
                        </label>
                        <p className="text-sm text-gray-600 ml-8">Experience in transport or care services</p>
                        {formData.hasTransportExperience && (
                          <textarea
                            name="transportExperienceDetails"
                            value={formData.transportExperienceDetails}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none mt-3"
                            placeholder="Describe your transport or care experience..."
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: References */}
            {currentStep === 3 && (
              <div>
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Professional References</h2>
                    <p className="text-gray-600">Provide at least 2 professional references</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {formData.references.map((reference, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
                        {formData.references.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeReference(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={reference.name}
                          onChange={(e) => updateReference(index, 'name', e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Full name *"
                          required
                        />
                        <input
                          type="email"
                          value={reference.email}
                          onChange={(e) => updateReference(index, 'email', e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Email address"
                        />
                        <input
                          type="tel"
                          value={reference.phone}
                          onChange={(e) => updateReference(index, 'phone', e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Phone number *"
                          required
                        />
                        <input
                          type="text"
                          value={reference.relationship}
                          onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Relationship (e.g., Manager) *"
                          required
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formData.references.length < 5 && (
                    <button
                      type="button"
                      onClick={addReference}
                      className="flex items-center text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Reference
                    </button>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Employer (if applicable)
                    </label>
                    <input
                      type="text"
                      name="previousEmployer"
                      value={formData.previousEmployer}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Most recent employer in care/support role"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Availability & Motivation */}
            {currentStep === 4 && (
              <div>
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Availability & Motivation</h2>
                    <p className="text-gray-600">When can you work and why do you want to help?</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {/* Availability */}
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Weekly Availability
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
                              checked={formData.availability[day].available}
                              onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Available</span>
                          </label>
                          {formData.availability[day].available && (
                            <>
                              <input
                                type="time"
                                value={formData.availability[day].start}
                                onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={formData.availability[day].end}
                                onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you want to become a support worker with AbleGo? *
                    </label>
                    <textarea
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                      placeholder="Tell us about your motivation to help people with disabilities and health challenges..."
                    />
                  </div>
                </div>

                <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200 mt-8">
                  <h3 className="text-lg font-semibold text-teal-900 mb-3">Next Steps After Submission:</h3>
                  <ul className="text-sm text-teal-800 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                      Application review and reference verification (2-3 days)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                      Enhanced DBS check and certification verification
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                      Training program enrollment and completion
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-600" />
                      Email invitation to create your support worker account
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting || !validateStep(currentStep)}
                className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting Application...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Submit Application
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicSupportWorkerRegistration;