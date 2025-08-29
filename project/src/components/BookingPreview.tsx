import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Navigation, 
  MapPin, 
  Users, 
  Clock, 
  Car, 
  ArrowRight,
  Shield,
  Heart,
  CheckCircle
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const BookingPreview: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      gsap.fromTo('.booking-preview-card',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.booking-step',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.booking-steps',
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  const bookingSteps = [
    {
      icon: MapPin,
      title: "Enter Locations",
      description: "Add pickup, any stops, and destination",
      color: "blue"
    },
    {
      icon: Car,
      title: "Choose Vehicle",
      description: "Select accessibility features needed",
      color: "teal"
    },
    {
      icon: Users,
      title: "Add Support",
      description: "Choose trained companions (0-4)",
      color: "green"
    },
    {
      icon: Navigation,
      title: "Book & Track",
      description: "Confirm booking and track live",
      color: "purple"
    }
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    teal: "bg-teal-100 text-teal-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600"
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Book Your Ride in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, secure booking process designed with accessibility in mind
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Booking Steps */}
            <div className="booking-steps space-y-6">
              {bookingSteps.map((step, index) => {
                const Icon = step.icon;
                const colorClass = colorClasses[step.color as keyof typeof colorClasses];
                
                return (
                  <div key={index} className="booking-step flex items-center space-x-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-gray-300">
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking Preview Card */}
            <div className="booking-preview-card">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full mb-4">
                    <Navigation className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Ready to Book?
                  </h3>
                </div>

                {/* Sample Booking Form Preview */}
                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                    <div className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                      Enter pickup location...
                    </div>
                  </div>
                  
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                    <div className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                      Enter destination...
                    </div>
                  </div>

                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <div className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                      Select pickup time...
                    </div>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                  <h4 className="font-semibold text-blue-900 mb-3">What's Included:</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Real-time GPS tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Trained support companions
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      Accessible vehicles available
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      24/7 emergency support
                    </li>
                  </ul>
                </div>

                <Link 
                  to="/booking"
                  onClick={() => {
                    setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl block text-center"
                >
                  <Navigation className="inline-block w-5 h-5 mr-2" />
                  Start Booking Now
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </Link>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    No signup required • Secure booking process
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-8 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
              <div className="flex items-center text-gray-600">
                <Shield className="w-5 h-5 mr-2 text-green-500" />
                <span className="font-medium">Secure & Safe</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center text-gray-600">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                <span className="font-medium">Compassionate Care</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                <span className="font-medium">24/7 Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingPreview;