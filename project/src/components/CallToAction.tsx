import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Navigation, Users, ArrowRight, Phone, Mail } from 'lucide-react';

const CallToAction: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo('.cta-card',
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 relative overflow-hidden">

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of people who trust AbleGo for safe, compassionate transport
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* User CTA */}
          <div className="cta-card bg-white rounded-3xl p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-6">
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Need a ride with support?
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Book your first journey with a trained companion. Safe, reliable, and designed with your needs in mind.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Door-to-door service
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Trained support workers
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Real-time tracking
                </div>
              </div>

              <Link 
                to="/book"
                onClick={() => {
                  setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl block text-center"
              >
                <Navigation className="inline-block w-5 h-5 mr-2" />
                Book Now
                <ArrowRight className="inline-block w-5 h-5 ml-2" />
              </Link>

              <p className="text-sm text-gray-500 mt-4">
                No signup fees • Cancel anytime
              </p>
            </div>
          </div>

          {/* Partner CTA */}
          <div className="cta-card bg-white rounded-3xl p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-center">
              <div className="inline-flex p-4 bg-teal-100 rounded-full mb-6">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Own a car or want to help?
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Join our community of drivers and support workers making a difference in people's lives every day.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Flexible working hours
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Competitive earnings
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Full training provided
                </div>
              </div>

              <Link 
                to="/register-support-worker"
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-lg font-semibold hover:from-teal-700 hover:to-teal-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl block text-center group"
              >
                <Users className="inline-block w-5 h-5 mr-2" />
                <span>Join AbleGo</span>
                <ArrowRight className="inline-block w-5 h-5 ml-2" />
              </Link>

              <p className="text-sm text-gray-500 mt-4">
                Free to register • Start earning today
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-white/15 backdrop-blur-sm rounded-2xl px-8 py-6">
            <div className="flex items-center text-white">
              <Phone className="w-5 h-5 mr-2" />
                              <span className="font-medium">01642 089 958</span>
            </div>
            <div className="w-px h-6 bg-white/30 hidden sm:block"></div>
            <div className="flex items-center text-white">
              <Mail className="w-5 h-5 mr-2" />
              <span className="font-medium">hello@ablego.co.uk</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;