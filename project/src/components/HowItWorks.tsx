import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Smartphone, UserCheck, MapPin, Star, Heart, Armchair as Wheelchair } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const cards = gsap.utils.toArray('.work-card');
    
    cards.forEach((card, index) => {
      gsap.fromTo(card as Element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card as Element,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Animate connecting lines
    gsap.fromTo('.connecting-line',
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1,
        ease: "power2.out",
        stagger: 0.3,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Animate floating background icons (if motion allowed)
    if (!prefersReducedMotion) {
      gsap.to('.floating-bg-icon', {
        y: -15,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.5
      });

      gsap.to('.rotating-bg-icon', {
        rotation: 360,
        duration: 20,
        ease: "none",
        repeat: -1
      });
    }
  }, []);

  const steps = [
    {
      icon: Smartphone,
      title: "Book a Ride",
      description: "Choose your vehicle type and optional support worker(s) through our easy-to-use platform",
      color: "blue"
    },
    {
      icon: UserCheck,
      title: "Get Matched",
      description: "Our system finds the best vehicle and trained support based on your specific needs",
      color: "teal"
    },
    {
      icon: MapPin,
      title: "Arrive Confidently",
      description: "Enjoy trained support, live tracking, and our comprehensive feedback system",
      color: "green"
    }
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200",
      gradient: "from-blue-500 to-blue-600"
    },
    teal: {
      bg: "bg-teal-100",
      text: "text-teal-600",
      border: "border-teal-200",
      gradient: "from-teal-500 to-teal-600"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200",
      gradient: "from-green-500 to-green-600"
    }
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-white relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Curved connecting paths */}
        <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 600" fill="none">
          <defs>
            <linearGradient id="stepPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          <path
            className="animated-path"
            d="M100,300 Q400,150 700,300 Q1000,450 1100,300"
            stroke="url(#stepPathGradient)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="10,5"
          />
        </svg>

        {/* Floating background icons */}
        <div className="floating-bg-icon absolute top-20 left-16 text-blue-300 opacity-40">
          <Wheelchair className="w-6 h-6" />
        </div>
        <div className="floating-bg-icon absolute top-40 right-20 text-teal-300 opacity-40">
          <Heart className="w-5 h-5" />
        </div>
        <div className="rotating-bg-icon absolute bottom-32 left-1/4 text-blue-200 opacity-30">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="floating-bg-icon absolute bottom-20 right-1/3 text-teal-200 opacity-40">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="rotating-bg-icon absolute top-1/2 right-16 text-blue-300 opacity-30">
          <UserCheck className="w-5 h-5" />
        </div>
      </div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 animate-on-scroll">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
            Getting the support you need is simple with our three-step process
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => {
              const colors = colorClasses[step.color as keyof typeof colorClasses];
              const Icon = step.icon;
              
              return (
                <div key={index} className="relative">
                  <div className={`work-card bg-white p-8 rounded-2xl shadow-lg border-2 ${colors.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                    <div className={`inline-flex p-4 rounded-full ${colors.bg} mb-6`}>
                      <Icon className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {step.description}
                    </p>

                    <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${colors.gradient} text-white rounded-full text-sm font-medium`}>
                      Step {index + 1}
                    </div>
                  </div>

                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="connecting-line w-12 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 origin-left"></div>
                      <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/book"
              onClick={() => {
                setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
              }}
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full text-lg font-semibold hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-on-scroll"
            >
              <Star className="inline-block w-5 h-5 mr-2" />
              Try It Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;