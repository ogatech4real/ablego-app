import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Car, Heart, Shield, CheckCircle, Phone, Mail } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';
import VehicleOwners from '../components/VehicleOwners';
import { scrollToActionZone } from '../utils/scrollUtils';

const JoinPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Join AbleGo - Make a Difference';
    scrollToTop('instant');
  }, []);

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-blue-600 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Join Our Community
            </h1>
            <p className="text-xl lg:text-2xl text-teal-100 mb-8">
              Make a difference in people's lives while earning competitive income. 
              Whether you own a vehicle or want to provide support, we need you.
            </p>
            
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-3xl font-bold mb-2">500+</div>
                <p className="text-teal-100">Active Partners</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-3xl font-bold mb-2">£20.50</div>
                <p className="text-teal-100">Starting Hourly Rate</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <p className="text-teal-100">Flexible Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Join AbleGo?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Be part of a mission that makes transport accessible for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Make a Difference</h3>
              <p className="text-gray-600 text-sm">Help people with disabilities and health challenges maintain their independence</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-2xl">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Full Support</h3>
              <p className="text-gray-600 text-sm">Comprehensive training, insurance, and 24/7 operational support</p>
            </div>
            
            <div className="text-center p-6 bg-teal-50 rounded-2xl">
              <Car className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Flexible Schedule</h3>
              <p className="text-gray-600 text-sm">Work when you want, set your own availability and hours</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-2xl">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Great Community</h3>
              <p className="text-gray-600 text-sm">Join a supportive network of like-minded individuals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Process */}
      <VehicleOwners />

      {/* Requirements Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Requirements & Benefits
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Vehicle Owner Requirements */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <Car className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Vehicle Owners</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900">Requirements:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Valid UK driving license (3+ years)
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Vehicle insurance and MOT
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      DBS background check
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Vehicle accessibility compliance (if applicable)
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Earnings:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      £0.80-£1.20 per mile driven
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Weekly payments via bank transfer
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Peak hour bonuses available
                    </li>
                  </ul>
                </div>
              </div>

              {/* Support Worker Requirements */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <Users className="w-8 h-8 text-teal-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Support Workers</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900">Requirements:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Enhanced DBS check
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      First aid certification
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Disability awareness training
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Excellent communication skills
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Earnings:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      £15.00-£18.50 per hour
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      Minimum 1 hour per booking
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      Travel time compensation
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-teal-100 mb-8 max-w-2xl mx-auto">
            Have questions about joining AbleGo? Our team is here to help you every step of the way.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="tel:08001234567" 
              to="/register-driver"
              onClick={() => {
                setTimeout(() => scrollToActionZone('.registration-form, .driver-registration'), 100);
              }}
              className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call: 0800 123 4567
            </Link>
            <Link 
              href="mailto:join@ablego.co.uk" 
              to="/register-support-worker"
              onClick={() => {
                setTimeout(() => scrollToActionZone('.registration-form, .support-worker-registration'), 100);
              }}
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email: join@ablego.co.uk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinPage;