import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Users, CheckCircle, Phone, AlertTriangle, Heart, Car, Clock } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';

const SafetyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Safety & Security - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <>
      <Helmet>
        <title>Safety & Security - AbleGo</title>
        <meta name="description" content="Learn about AbleGo's comprehensive safety measures, driver vetting, vehicle standards, and real-time monitoring to ensure your journey is safe and secure." />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section relative py-20 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700 overflow-hidden pt-20 lg:pt-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-400 dark:to-teal-400">Safety</span> is Our Priority
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Comprehensive safety measures, trained professionals, and real-time monitoring for peace of mind
            </p>
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                Comprehensive Safety Measures
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We go above and beyond to ensure every journey is safe, secure, and comfortable for all passengers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Driver Vetting */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Rigorous Driver Vetting</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Enhanced DBS background checks</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive driving history review</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Professional reference verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Ongoing monitoring and re-checks</span>
                  </li>
                </ul>
              </div>

              {/* Vehicle Standards */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <Car className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Vehicle Safety Standards</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Regular safety inspections</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Accessibility compliance verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>GPS tracking and monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Emergency response systems</span>
                  </li>
                </ul>
              </div>

              {/* Real-time Monitoring */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Real-time Monitoring</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Live GPS tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>24/7 support monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Emergency response protocols</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Journey completion verification</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Worker Training */}
      <section className="py-20 bg-gray-50 dark:bg-dark-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                Trained Support Workers
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Our support workers undergo comprehensive training to ensure they can provide the best care and assistance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Training & Certification</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Disability Awareness</h4>
                      <p className="text-gray-600 dark:text-gray-300">Comprehensive training on various disabilities and accessibility needs</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">First Aid Certification</h4>
                      <p className="text-gray-600 dark:text-gray-300">Current first aid and emergency response training</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Communication Skills</h4>
                      <p className="text-gray-600 dark:text-gray-300">Effective communication with diverse passenger needs</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Ongoing Support</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Regular Refresher Training</h4>
                      <p className="text-gray-600 dark:text-gray-300">Continuous education and skill development</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Performance Monitoring</h4>
                      <p className="text-gray-600 dark:text-gray-300">Regular assessment and feedback systems</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">24/7 Support Network</h4>
                      <p className="text-gray-600 dark:text-gray-300">Always available backup and assistance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Response */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              Emergency Response
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              We have comprehensive emergency protocols in place to ensure your safety at all times.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">Emergency Contacts</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Immediate access to emergency services and support</p>
                <a href="tel:01642089958" className="text-red-600 dark:text-red-400 font-semibold hover:underline">
                  01642 089 958
                </a>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">24/7 Monitoring</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Round-the-clock support and monitoring systems</p>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Always Available</span>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <Heart className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">Care Coordination</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Seamless coordination with healthcare providers</p>
                <span className="text-green-600 dark:text-green-400 font-semibold">Integrated Care</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h3>
              <p className="text-blue-100 mb-6">
                Our emergency support team is available 24/7 to help with any urgent situations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:01642089958"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Phone className="w-5 h-5 mr-2 inline-block" />
                  Emergency: 01642 089 958
                </a>
                <a
                  href="/contact"
                  className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Commitment */}
      <section className="py-20 bg-gray-50 dark:bg-dark-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              Our Safety Commitment
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              We are committed to maintaining the highest safety standards and continuously improving our processes.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Continuous Improvement</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-left">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Regular safety audits and assessments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Feedback integration and process updates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Technology upgrades and innovations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Industry best practice adoption</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 border border-gray-200 dark:border-dark-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Transparency & Trust</h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-left">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Clear safety policies and procedures</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Open communication channels</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Incident reporting and resolution</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Regular safety updates and notifications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SafetyPage;