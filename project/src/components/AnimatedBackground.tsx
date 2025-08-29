import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Heart, Plus, Car, MapPin, Users, Shield } from 'lucide-react';

interface AnimatedBackgroundProps {
  variant?: 'hero' | 'steps' | 'testimonials' | 'default';
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Show static version for users who prefer reduced motion
      gsap.set('.floating-icon', { opacity: 0.3 });
      return;
    }

    // Animate floating icons
    gsap.set('.floating-icon', { opacity: 0 });
    
    // Staggered fade-in
    gsap.to('.floating-icon', {
      opacity: 0.6,
      duration: 2,
      stagger: 0.3,
      ease: "power2.out",
      delay: 0.5
    });

    // Continuous floating animation
    gsap.to('.floating-icon', {
      y: -20,
      duration: 3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

    // Gentle rotation for some icons
    gsap.to('.floating-icon.rotate', {
      rotation: 360,
      duration: 20,
      ease: "none",
      repeat: -1
    });

    // Animate curved paths
    const paths = containerRef.current.querySelectorAll('.animated-path');
    paths.forEach((path, index) => {
      const pathElement = path as SVGPathElement;
      const pathLength = pathElement.getTotalLength();
      
      gsap.set(pathElement, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength
      });

      gsap.to(pathElement, {
        strokeDashoffset: 0,
        duration: 4,
        ease: "power2.inOut",
        delay: index * 0.5,
        repeat: -1,
        repeatDelay: 2
      });
    });

  }, [variant]);

  const getBackgroundContent = () => {
    switch (variant) {
      case 'hero':
        return (
          <>
            {/* Curved Travel Paths */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-20" 
              viewBox="0 0 1200 800" 
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="pathGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="pathGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              <path
                className="animated-path"
                d="M-100,400 Q200,200 500,350 T1000,300 Q1100,250 1300,400"
                stroke="url(#pathGradient1)"
                strokeWidth="3"
                fill="none"
              />
              <path
                className="animated-path"
                d="M-50,500 Q300,300 600,450 T1100,400 Q1200,350 1350,500"
                stroke="url(#pathGradient2)"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            {/* Floating Icons */}
            <div className="floating-icon absolute top-20 left-20 text-blue-400" aria-hidden="true">
              <Heart className="w-8 h-8" />
            </div>
            <div className="floating-icon absolute top-32 right-32 text-teal-400" aria-hidden="true">
              <Car className="w-10 h-10" />
            </div>
            <div className="floating-icon rotate absolute bottom-40 left-40 text-blue-300" aria-hidden="true">
              <Plus className="w-6 h-6" />
            </div>
            <div className="floating-icon absolute top-60 left-1/2 text-teal-300" aria-hidden="true">
              <Shield className="w-7 h-7" />
            </div>
            <div className="floating-icon absolute bottom-32 right-20 text-blue-400" aria-hidden="true">
              <Users className="w-8 h-8" />
            </div>
            <div className="floating-icon rotate absolute top-40 left-1/3 text-teal-400" aria-hidden="true">
              <MapPin className="w-6 h-6" />
            </div>
          </>
        );

      case 'steps':
        return (
          <>
            {/* Connecting Lines */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-15" 
              viewBox="0 0 1200 400" 
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              <path
                className="animated-path"
                d="M100,200 Q400,100 700,200 Q1000,300 1100,200"
                stroke="url(#stepGradient)"
                strokeWidth="2"
                fill="none"
              />
            </svg>

            {/* Subtle floating icons */}
            <div className="floating-icon absolute top-10 right-20 text-blue-300" aria-hidden="true">
              <Plus className="w-4 h-4" />
            </div>
            <div className="floating-icon absolute bottom-10 left-20 text-teal-300" aria-hidden="true">
              <Heart className="w-5 h-5" />
            </div>
          </>
        );

      case 'testimonials':
        return (
          <>
            {/* Glowing background elements */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="floating-icon absolute top-20 left-10 text-blue-200">
                <Heart className="w-6 h-6" />
              </div>
              <div className="floating-icon absolute top-40 right-16 text-teal-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="floating-icon rotate absolute bottom-32 left-1/4 text-blue-200">
                <Plus className="w-4 h-4" />
              </div>
              <div className="floating-icon absolute bottom-20 right-1/3 text-teal-200">
                <Shield className="w-6 h-6" />
              </div>
              <div className="floating-icon absolute top-1/2 left-16 text-blue-200">
                <Users className="w-5 h-5" />
              </div>
              <div className="floating-icon rotate absolute top-16 right-1/4 text-teal-200">
                <Car className="w-7 h-7" />
              </div>
            </div>

            {/* Soft gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-teal-50/30"
              aria-hidden="true"
            />
          </>
        );

      default:
        return (
          <div className="floating-icon absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-200" aria-hidden="true">
            <Heart className="w-8 h-8" />
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {getBackgroundContent()}
      
      {/* Fallback static background for reduced motion */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-100 via-transparent to-teal-100" />
    </div>
  );
};

export default AnimatedBackground;