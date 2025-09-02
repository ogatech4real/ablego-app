import React, { useEffect } from 'react';
import { Car, Users, Shield, Clock, Heart, CheckCircle } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';

const ServicesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Our Services - AbleGo';
    scrollToTop('instant');
  }, []);

  const services = [
    {
      icon: Car,
      title: "Accessible Transport",
      description: "Wheelchair accessible vehicles with ramps, lifts, and wide doors for easy entry and exit.",
      features: ["Wheelchair accessible", "Wide door access", "Patient lifts", "Oxygen support"],
      color: "blue"
    },
    {
      icon: Users,
      title: "Trained Companions",
      description: "Professional support workers trained in disability awareness, first aid, and compassionate care.",
      features: ["DBS checked", "First aid certified", "Disability awareness", "Mental health trained"],
      color: "teal"
    },
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Comprehensive safety measures including real-time tracking, emergency support, and verified staff.",
      features: ["Real-time GPS tracking", "24/7 emergency support", "Background checked staff", "Insurance covered"],
      color: "green"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Round-the-clock service for medical appointments, social outings, and emergency transport needs.",
      features: ["24/7 booking", "Emergency transport", "Scheduled rides", "Flexible timing"],
      color: "purple"
    }
  ];

  const colorClasses = {
    blue: "from-blue-600 to-blue-700",
    teal: "from-teal-600 to-teal-700",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700"
  };

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white py-16 overflow-hidden">
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/hotpage.mp4"
          poster="/AbleGo.png"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Heart className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Our Services
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Comprehensive transport solutions designed with your needs in mind
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${colorClasses[service.color as keyof typeof colorClasses]} text-white mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees, clear breakdown of all costs
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Base Pricing</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Base Fare</span>
                    <span className="font-semibold text-gray-900">£8.50</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Per Mile</span>
                    <span className="font-semibold text-gray-900">£2.20</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Support Worker</span>
                    <span className="font-semibold text-gray-900">£16.50-20.50/hour</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Vehicle Features</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Wheelchair Accessible</span>
                    <span className="font-semibold text-gray-900">+£6.00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Wide Door Access</span>
                    <span className="font-semibold text-gray-900">+£3.50</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700">Patient Lift</span>
                    <span className="font-semibold text-gray-900">+£12.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-600 mb-6">
                Peak hours (6-9am, 3-6pm): +15% surcharge
              </p>
              <a 
                href="/booking" 
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Quote
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;