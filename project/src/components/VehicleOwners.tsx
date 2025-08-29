import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Car, Users, FileText, CheckCircle, ArrowRight, Upload, Shield, Heart, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { scrollToActionZone } from '../utils/scrollUtils';

const VehicleOwners: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'support'>('vehicle');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    gsap.fromTo('.tab-content',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
    );

    // Animate background elements (if motion allowed)
    if (!prefersReducedMotion) {
      gsap.to('.partner-bg-icon', {
        y: -12,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4
      });

      // Animate progress steps
      gsap.fromTo('.progress-step',
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: "back.out(1.7)",
          delay: 0.5
        }
      );
    }
  }, [activeTab]);

  const vehicleSteps = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Submit vehicle registration, insurance, and accessibility certificates",
      details: ["Vehicle registration", "Insurance certificate", "MOT certificate", "Accessibility compliance"]
    },
    {
      icon: CheckCircle,
      title: "Pass Checks",
      description: "We verify your documents and conduct a vehicle inspection",
      details: ["Document verification", "Background checks", "Vehicle inspection", "Safety assessment"]
    },
    {
      icon: Car,
      title: "Start Earning",
      description: "Begin accepting bookings and earning money helping others",
      details: ["Receive booking requests", "Set your availability", "Track earnings", "Help customers"]
    }
  ];

  const supportSteps = [
    {
      icon: FileText,
      title: "Submit Application",
      description: "Complete your profile and submit required certifications",
      details: ["Personal information", "Experience details", "References", "Certifications"]
    },
    {
      icon: CheckCircle,
      title: "Training & Verification",
      description: "Complete our training program and background checks",
      details: ["Background screening", "Training modules", "First aid certification", "Communication skills"]
    },
    {
      icon: Users,
      title: "Start Supporting",
      description: "Begin helping passengers with their transport needs",
      details: ["Accept assignments", "Provide compassionate care", "Build relationships", "Earn competitive rates"]
    }
  ];

  const currentSteps = activeTab === 'vehicle' ? vehicleSteps : supportSteps;

  return (
    <section id="join" className="py-20 bg-gradient-to-br from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Enhanced Partner Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Background illustrations */}
        <svg className="absolute inset-0 w-full h-full opacity-8" viewBox="0 0 1200 800" fill="none">
          <defs>
            <linearGradient id="partnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Abstract vehicle and people shapes */}
          <rect x="100" y="200" width="80" height="40" rx="20" fill="url(#partnerGradient)" />
          <rect x="1000" y="500" width="80" height="40" rx="20" fill="url(#partnerGradient)" />
          <circle cx="300" cy="600" r="25" fill="url(#partnerGradient)" />
          <circle cx="900" cy="150" r="25" fill="url(#partnerGradient)" />
        </svg>

        {/* Floating partner-related icons */}
        <div className="partner-bg-icon absolute top-20 left-16 text-blue-300 opacity-25">
          <Car className="w-8 h-8" />
        </div>
        <div className="partner-bg-icon absolute top-40 right-20 text-teal-300 opacity-25">
          <Users className="w-7 h-7" />
        </div>
        <div className="partner-bg-icon absolute bottom-32 left-1/4 text-blue-200 opacity-20">
          <Shield className="w-6 h-6" />
        </div>
        <div className="partner-bg-icon absolute bottom-20 right-1/3 text-teal-200 opacity-25">
          <Heart className="w-5 h-5" />
        </div>
        <div className="partner-bg-icon absolute top-1/2 left-20 text-blue-300 opacity-20">
          <UserCheck className="w-6 h-6" />
        </div>
        <div className="partner-bg-icon absolute top-1/3 right-16 text-teal-300 opacity-25">
          <CheckCircle className="w-7 h-7" />
        </div>
      </div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 animate-on-scroll">
            Join Our Community
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
            Whether you own a vehicle or want to provide support, become part of our mission
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-2 rounded-2xl inline-flex">
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'vehicle'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Car className="inline-block w-5 h-5 mr-2" />
              Register Your Vehicle
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'support'
                  ? 'bg-white text-teal-600 shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="inline-block w-5 h-5 mr-2" />
              Become a Support Worker
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="tab-content max-w-6xl mx-auto">
          {/* Progress indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {currentSteps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className={`progress-step w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeTab === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < currentSteps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      activeTab === 'vehicle' ? 'bg-blue-200' : 'bg-teal-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {currentSteps.map((step, index) => {
              const Icon = step.icon;
              const isVehicle = activeTab === 'vehicle';
              
              return (
                <div key={index} className="relative">
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                    <div className={`inline-flex p-4 rounded-full ${
                      isVehicle ? 'bg-blue-100' : 'bg-teal-100'
                    } mb-6`}>
                      <Icon className={`w-8 h-8 ${
                        isVehicle ? 'text-blue-600' : 'text-teal-600'
                      }`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className={`w-4 h-4 mr-2 ${
                            isVehicle ? 'text-blue-500' : 'text-teal-500'
                          }`} />
                          {detail}
                        </li>
                      ))}
                    </ul>

                    <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${
                      isVehicle ? 'from-blue-500 to-blue-600' : 'from-teal-500 to-teal-600'
                    } text-white rounded-full text-sm font-medium`}>
                      Step {index + 1}
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < currentSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className={`w-6 h-6 ${
                        isVehicle ? 'text-blue-400' : 'text-teal-400'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {activeTab === 'vehicle' ? (
                <Link 
                  to="/register-driver"
                  onClick={() => {
                    setTimeout(() => scrollToActionZone('.registration-form, .driver-registration'), 100);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  <Car className="inline-block w-5 h-5 mr-2" />
                  Register Vehicle
                </Link>
              ) : (
                <Link 
                  to="/register-support-worker"
                  onClick={() => {
                    setTimeout(() => scrollToActionZone('.registration-form, .support-worker-registration'), 100);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-full text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  <Users className="inline-block w-5 h-5 mr-2" />
                  Apply Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VehicleOwners;