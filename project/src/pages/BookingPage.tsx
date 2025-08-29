import React, { useEffect } from 'react';
import { Navigation, MapPin, Clock, Users, Car, Shield, Heart } from 'lucide-react';
import GuestBookingForm from '../components/GuestBookingForm';
import { scrollToTop } from '../utils/scrollUtils';

const BookingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Book a Ride - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Navigation className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Book Your Ride
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Safe, supportive transport with trained companions. 
              From door to destination — we're with you.
            </p>
            
            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Shield className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Safe & Secure</h3>
                <p className="text-blue-100 text-sm">DBS checked drivers and support workers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Clock className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-blue-100 text-sm">Live GPS tracking throughout your journey</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Heart className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Compassionate Care</h3>
                <p className="text-blue-100 text-sm">Trained companions who understand your needs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden booking-form">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Book Your Ride
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Easy and Convenient - book and track your journey
            </p>
          </div>
          <GuestBookingForm />
        </div>
      </section>

      {/* How It Works Quick Guide */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Booking Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to get the support you need
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enter Addresses</h3>
              <p className="text-gray-600 text-sm">Add pickup, any stops, and final destination</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Features</h3>
              <p className="text-gray-600 text-sm">Select vehicle accessibility options</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Support</h3>
              <p className="text-gray-600 text-sm">Choose 0-4 trained companions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Confirm & Go</h3>
              <p className="text-gray-600 text-sm">Review fare and book your ride</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h3>
          <p className="text-blue-100 mb-6">Our 24/7 support team is here to help</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:08001234567" 
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Call: 0800 123 4567
            </a>
            <a 
              href="mailto:hello@ablego.co.uk" 
              className="px-6 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Email: hello@ablego.co.uk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingPage;