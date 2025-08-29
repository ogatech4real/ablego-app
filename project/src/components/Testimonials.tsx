import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronLeft, ChevronRight, Star, Quote, Heart, MessageCircle, Sparkles } from 'lucide-react';
import type { Testimonial } from '../types';

const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Margaret Thompson",
      role: "Regular User, Age 78",
      quote: "AbleGo has given me back my independence. The support workers are so kind and patient, and I always feel safe. It's like having family help me get around.",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      id: 2,
      name: "David Chen",
      role: "Caregiver",
      quote: "As a caregiver for my elderly father, AbleGo has been a lifesaver. I can book rides for him with confidence, knowing he'll receive the care and attention he needs.",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    },
    {
      id: 3,
      name: "Sarah Williams",
      role: "Support Worker",
      quote: "Working with AbleGo allows me to make a real difference in people's lives. Every day I help someone get to where they need to go, and it's incredibly rewarding.",
      image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
    }
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    startAutoPlay();
    
    // Animate floating testimonial symbols (if motion allowed)
    if (!prefersReducedMotion) {
      gsap.to('.testimonial-bg-icon', {
        y: -8,
        duration: 4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.6
      });

      gsap.to('.glowing-symbol', {
        scale: 1.1,
        opacity: 0.8,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.4
      });
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    animateCarousel();
  }, [currentIndex]);

  const startAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
  };

  const animateCarousel = () => {
    if (carouselRef.current) {
      gsap.fromTo(carouselRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    startAutoPlay();
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % testimonials.length;
    goToSlide(newIndex);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
      {/* Enhanced Testimonial Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Gently glowing floating symbols */}
        <div className="testimonial-bg-icon glowing-symbol absolute top-20 left-10 text-blue-200 opacity-40">
          <Heart className="w-8 h-8" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute top-40 right-16 text-teal-200 opacity-40">
          <Star className="w-6 h-6" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute bottom-32 left-1/4 text-blue-200 opacity-30">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute bottom-20 right-1/3 text-teal-200 opacity-40">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute top-1/2 left-16 text-blue-200 opacity-35">
          <Quote className="w-6 h-6" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute top-16 right-1/4 text-teal-200 opacity-30">
          <Heart className="w-5 h-5" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute bottom-40 right-20 text-blue-200 opacity-40">
          <Star className="w-4 h-4" />
        </div>
        <div className="testimonial-bg-icon glowing-symbol absolute top-32 left-1/3 text-teal-200 opacity-35">
          <MessageCircle className="w-6 h-6" />
        </div>

        {/* Soft gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-teal-50/20" />
      </div>
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 animate-on-scroll">
            What Our Community Says
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
            Real stories from the people who make AbleGo a trusted transport solution
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div ref={carouselRef} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <Quote className="w-full h-full text-blue-600" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src={currentTestimonial.image}
                      alt={currentTestimonial.name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2">
                      <Quote className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  {/* Stars */}
                  <div className="flex justify-center md:justify-start mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-6 italic">
                    "{currentTestimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                      {currentTestimonial.name}
                    </h4>
                    <p className="text-blue-600 font-medium">
                      {currentTestimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border-2 border-gray-100 hover:border-blue-200"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            {/* Dots */}
            <div className="flex space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border-2 border-gray-100 hover:border-blue-200"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Small Thumbnails */}
          <div className="flex justify-center mt-8 space-x-4">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.id}
                onClick={() => goToSlide(index)}
                className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'ring-4 ring-blue-400 scale-110'
                    : 'opacity-50 hover:opacity-75 hover:scale-105'
                }`}
              >
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;