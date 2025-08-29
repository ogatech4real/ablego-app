import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  MapPin, 
  CreditCard, 
  UserCheck, 
  Shield, 
  Eye, 
  Smartphone,
  Lock,
  Heart
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const TechSafety: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const features = gsap.utils.toArray('.tech-feature');
    
    features.forEach((feature, index) => {
      gsap.fromTo(feature as Element,
        { opacity: 0, scale: 0.8, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          delay: index * 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: feature as Element,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Floating animation for icons
    if (!prefersReducedMotion) {
      gsap.to('.tech-icon', {
        y: -8,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });

      gsap.to('.safety-bg-icon', {
        y: -6,
        duration: 3.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4
      });
    }
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Real-time Tracking",
      description: "Live GPS tracking keeps you and your family informed throughout the journey",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "End-to-end encrypted payment processing with multiple payment options",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: UserCheck,
      title: "Verified Support Staff",
      description: "All support workers undergo thorough background checks and training",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Your data is protected with bank-level security and full GDPR compliance",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Eye,
      title: "Accessible Design",
      description: "Platform designed with accessibility in mind for users of all abilities",
      color: "bg-teal-100 text-teal-600"
    },
    {
      icon: Smartphone,
      title: "Easy-to-Use App",
      description: "Intuitive interface designed specifically for seniors and those with disabilities",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <section id="safety" ref={sectionRef} className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Enhanced Safety Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Tech-focused floating icons */}
        <div className="safety-bg-icon absolute top-24 left-20 text-blue-300 opacity-20">
          <Shield className="w-7 h-7" />
        </div>
        <div className="safety-bg-icon absolute top-40 right-24 text-teal-300 opacity-20">
          <Lock className="w-6 h-6" />
        </div>
        <div className="safety-bg-icon absolute bottom-32 left-1/4 text-blue-200 opacity-15">
          <Eye className="w-5 h-5" />
        </div>
        <div className="safety-bg-icon absolute bottom-20 right-1/3 text-teal-200 opacity-20">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="safety-bg-icon absolute top-1/2 left-16 text-blue-300 opacity-15">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="safety-bg-icon absolute top-1/3 right-20 text-teal-300 opacity-20">
          <CreditCard className="w-6 h-6" />
        </div>

        {/* Subtle grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="safety-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#safety-grid)" />
        </svg>
      </div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 animate-on-scroll">
            Smart Tech, Real Care
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
            Advanced technology meets compassionate service to provide the safest, most reliable transport experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div key={index} className="tech-feature bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className={`tech-icon inline-flex p-4 rounded-full ${feature.color} mb-6`}>
                  <Icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto animate-on-scroll">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Your Safety & Privacy is Our Priority
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 text-green-600 mr-2" />
                Security Measures
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  256-bit SSL encryption
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  PCI DSS compliant payments
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Regular security audits
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Two-factor authentication
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                Care Standards
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  DBS checked support workers
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  First aid trained staff
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  Disability awareness training
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  24/7 emergency support
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Fully Licensed & Insured</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechSafety;