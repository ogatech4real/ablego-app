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
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to book your supportive transport
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Enter Details</h3>
              <p className="text-gray-600 text-sm">Pickup and drop-off locations</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Time</h3>
              <p className="text-gray-600 text-sm">Select your preferred pickup time</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
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
              href="tel:01642089958" 
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Call: 01642 089 958
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