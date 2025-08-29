import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, Users, Target, Shield, ArrowRight, Award } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      gsap.fromTo('.about-content',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo('.about-stat',
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: '.about-stats',
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Floating background animations
      gsap.to('.about-bg-icon', {
        y: -10,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3
      });
    }
  }, []);

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/AbleGo_About_Us_Animation.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-600"></div>
      </video>
      
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
        <div className="about-bg-icon absolute top-20 left-16 text-blue-300 opacity-25">
          <Heart className="w-6 h-6" />
        </div>
        <div className="about-bg-icon absolute top-40 right-20 text-teal-300 opacity-25">
          <Users className="w-7 h-7" />
        </div>
        <div className="about-bg-icon absolute bottom-32 left-1/4 text-blue-200 opacity-20">
          <Target className="w-5 h-5" />
        </div>
        <div className="about-bg-icon absolute bottom-20 right-1/3 text-teal-200 opacity-25">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto relative z-10">
          {/* Content */}
          <div className="about-content">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
              About AbleGo
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-white to-blue-200 mb-8"></div>
            
            <p className="text-xl text-white leading-relaxed mb-6 drop-shadow-md">
              AbleGo is a UK-based on-demand transport service designed to support individuals with 
              health challenges, disabilities, or anyone needing extra assistance when travelling.
            </p>
            
            <p className="text-lg text-white leading-relaxed mb-8 drop-shadow-md">
              We go beyond just rides — we provide trusted, trained companions who ensure safety, 
              comfort, and confidence from door to destination. With both our own accessible vehicles 
              and a network of verified partners, AbleGo gives you the freedom to book the right 
              support for your journey.
            </p>

            <div className="relative rounded-2xl p-6 bg-white/10 backdrop-blur-sm border-l-4 border-white mb-8">
              <p className="text-2xl font-bold text-white italic drop-shadow-lg">
              "We believe mobility is dignity, and we're here to make sure no one is left behind."
              </p>
            </div>

            <Link 
              to="/about"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Learn More About Us
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Stats */}
          <div className="about-stats">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Our Impact
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="about-stat text-center p-4 bg-blue-50 rounded-2xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                  <p className="text-gray-600 font-medium">Active Partners</p>
                </div>
                <div className="about-stat text-center p-4 bg-teal-50 rounded-2xl">
                  <div className="text-3xl font-bold text-teal-600 mb-2">10K+</div>
                  <p className="text-gray-600 font-medium">Journeys</p>
                </div>
                <div className="about-stat text-center p-4 bg-green-50 rounded-2xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                  <p className="text-gray-600 font-medium">Satisfaction</p>
                </div>
                <div className="about-stat text-center p-4 bg-purple-50 rounded-2xl">
                  <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                  <p className="text-gray-600 font-medium">Support</p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                  <Award className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">Trusted by Thousands</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
