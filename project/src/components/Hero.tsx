import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Heart, Navigation, Shield, Armchair as Wheelchair, Users, Clock } from 'lucide-react';
import { scrollToActionZone } from '../utils/scrollUtils';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference and mobile
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    if (prefersReducedMotion || isMobile) {
      setShowVideo(false);
    }

    try {
      const tl = gsap.timeline();

      // Hero text animations
      tl.fromTo('.hero-title', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
      )
      .fromTo('.hero-subtitle', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.5"
      )
      .fromTo('.hero-buttons', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.3"
      );

      // Animate accessibility icons
      gsap.fromTo('.accessibility-icon', 
        { opacity: 0, scale: 0.5, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.2, 
          ease: "back.out(1.7)",
          delay: 1.5
        }
      );

      // Floating animation for icons
      gsap.to('.accessibility-icon', {
        y: -10,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
        delay: 3
      });

      // Video fade in
      if (videoRef.current && showVideo) {
        gsap.fromTo(videoRef.current, 
          { opacity: 0 },
          { opacity: 0.6, duration: 2, ease: "power2.out", delay: 0.5 }
        );
      }
    } catch (error) {
      console.warn('Hero animation setup failed:', error);
    }
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
      {/* Video Background */}
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/Animated_Background_AbleGo.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50"></div>
        </video>
      ) : (
        /* Fallback Animated Background for Mobile/Reduced Motion */
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50">
          {/* Subtle SVG Background */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="fallbackGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M-100,400 Q200,200 500,350 T1000,300 Q1100,250 1300,400"
              stroke="url(#fallbackGradient1)"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="100" cy="400" r="8" fill="#3B82F6" opacity="0.6" />
            <circle cx="1100" cy="400" r="8" fill="#14B8A6" opacity="0.6" />
          </svg>
          
          {/* Static floating icons */}
          <div className="absolute top-20 left-20 text-blue-400 opacity-30" aria-hidden="true">
            <Heart className="w-8 h-8" />
          </div>
          <div className="absolute top-32 right-32 text-teal-400 opacity-30" aria-hidden="true">
            <Shield className="w-10 h-10" />
          </div>
          <div className="absolute bottom-40 left-40 text-blue-300 opacity-30" aria-hidden="true">
            <Users className="w-6 h-6" />
          </div>
        </div>
      )}
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="hero-title text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Inclusive Transport with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
                Compassion
              </span>
            </h1>
            
            <p className="hero-subtitle text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              Book safe, supportive rides with trained companions. 
              From door to destination — we're with you.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link 
                to="/book"
                onClick={() => {
                  setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
              >
                <Navigation className="inline-block w-5 h-5 mr-2" />
                Book a Ride
              </Link>
              <Link 
                to="/register-driver"
                className="px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
              >
                <Users className="inline-block w-5 h-5 mr-2" />
                Register as Driver
              </Link>
              <Link 
                to="/register-support-worker"
                className="px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-full text-lg font-semibold hover:from-teal-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
              >
                <Heart className="inline-block w-5 h-5 mr-2" />
                Become Support Worker
              </Link>
            </div>
          </div>

          <div ref={iconsRef} className="relative">
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="accessibility-icon flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                <Wheelchair className="w-12 h-12 text-blue-600 mb-3" />
                <span className="text-sm font-medium text-gray-700">Accessible</span>
              </div>
              <div className="accessibility-icon flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                <Heart className="w-12 h-12 text-rose-500 mb-3" />
                <span className="text-sm font-medium text-gray-700">Caring</span>
              </div>
              <div className="accessibility-icon flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg">
                <Shield className="w-12 h-12 text-green-600 mb-3" />
                <span className="text-sm font-medium text-gray-700">Safe</span>
              </div>
              <div className="accessibility-icon flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg col-span-3">
                <Clock className="w-12 h-12 text-teal-600 mb-3" />
                <span className="text-sm font-medium text-gray-700">Always Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;