import React, { useEffect } from 'react';
import { Shield, UserCheck, Eye, Lock, Heart, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';
import TechSafety from '../components/TechSafety';

const SafetyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Safety & Security - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Your Safety is Our Priority
            </h1>
            <p className="text-xl lg:text-2xl text-green-100 mb-8">
              Comprehensive safety measures, trained professionals, and advanced technology 
              ensure every journey is secure and comfortable.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Standards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Safety Standards
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every aspect of our service is designed with your safety and wellbeing in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-green-50 p-8 rounded-2xl border-2 border-green-200">
              <UserCheck className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vetted Personnel</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Enhanced DBS background checks
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Professional references verified
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Ongoing performance monitoring
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Regular re-certification required
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200">
              <Heart className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Training & Care</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Disability awareness training
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  First aid & CPR certification
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Mental health awareness
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Communication skills training
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-8 rounded-2xl border-2 border-purple-200">
              <Lock className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Data Security</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  256-bit SSL encryption
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  GDPR compliant data handling
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Secure payment processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Regular security audits
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Safety */}
      <TechSafety />

      {/* Emergency Procedures */}
      <section className="py-16 bg-red-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Emergency Procedures
              </h2>
              <p className="text-xl text-gray-600">
                We're prepared for any situation with comprehensive emergency protocols
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Phone className="w-6 h-6 text-red-600 mr-3" />
                  24/7 Emergency Support
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-red-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Immediate Response</h4>
                      <p className="text-gray-600 text-sm">Emergency hotline connects you to our control center within 30 seconds</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-red-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Emergency Services</h4>
                      <p className="text-gray-600 text-sm">Direct coordination with NHS, police, and emergency services when needed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-red-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Family Notification</h4>
                      <p className="text-gray-600 text-sm">Automatic notification to emergency contacts if requested</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Eye className="w-6 h-6 text-blue-600 mr-3" />
                  Real-time Monitoring
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">GPS Tracking</h4>
                      <p className="text-gray-600 text-sm">Live location monitoring throughout your entire journey</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Route Monitoring</h4>
                      <p className="text-gray-600 text-sm">Automatic alerts if vehicle deviates from planned route</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Check-in System</h4>
                      <p className="text-gray-600 text-sm">Regular status updates and arrival confirmations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-600 text-white rounded-2xl p-8 mt-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Emergency Contact</h3>
              <p className="text-red-100 mb-6">
                If you're in immediate danger or need emergency assistance during your journey
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:999" 
                  className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                >
                  Emergency Services: 999
                </a>
                <a 
                  href="tel:01642089958" 
                  className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  AbleGo Emergency: 01642 089 958
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Certifications & Compliance
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              AbleGo meets and exceeds all regulatory requirements for accessible transport services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">GDPR Compliant</h3>
              <p className="text-gray-600 text-sm">Full data protection compliance</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fully Insured</h3>
              <p className="text-gray-600 text-sm">Comprehensive coverage for all journeys</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">DBS Checked</h3>
              <p className="text-gray-600 text-sm">All staff undergo enhanced screening</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Accessibility Certified</h3>
              <p className="text-gray-600 text-sm">Meeting all accessibility standards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Safety Tips for Passengers
              </h2>
              <p className="text-gray-600">
                Simple steps to ensure your journey is as safe and comfortable as possible
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Before Your Journey</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Verify driver and vehicle details in the app</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Share your journey details with family or friends</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Have emergency contacts readily available</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Ensure your phone is charged</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6">During Your Journey</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Keep the app open for live tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Communicate any concerns to your support worker</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Use the in-app emergency button if needed</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <span className="text-gray-600">Trust your instincts and speak up</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SafetyPage;