import React, { useEffect } from 'react';
import { Shield, Lock, Eye, UserCheck, Mail, Phone } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';

const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-blue-200">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto prose prose-lg">
            {/* Introduction */}
            <div className="bg-blue-50 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-blue-600" />
                Our Commitment to Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed">
                AbleGo Ltd ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our transport services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-teal-600" />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Name, email address, and phone number</li>
                    <li>• Date of birth and emergency contact details</li>
                    <li>• Address and location data for pickup/dropoff</li>
                    <li>• Payment information (processed securely via Stripe)</li>
                    <li>• Medical notes and accessibility requirements (optional)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Data</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Booking details (pickup/dropoff locations, times, preferences)</li>
                    <li>• Trip tracking data (GPS location during active trips)</li>
                    <li>• Communication records with support workers and drivers</li>
                    <li>• Ratings and feedback for service improvement</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Device information and IP address</li>
                    <li>• App usage data and preferences</li>
                    <li>• Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <UserCheck className="w-6 h-6 mr-3 text-green-600" />
                How We Use Your Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Delivery</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Process and fulfill your booking requests</li>
                    <li>• Match you with appropriate vehicles and support workers</li>
                    <li>• Provide real-time tracking and updates</li>
                    <li>• Handle payments and billing</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Security</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Verify identity of drivers and support workers</li>
                    <li>• Monitor trips for safety and security</li>
                    <li>• Respond to emergencies and incidents</li>
                    <li>• Investigate complaints and disputes</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Send booking confirmations and updates</li>
                    <li>• Provide customer support</li>
                    <li>• Share important service announcements</li>
                    <li>• Send marketing communications (with consent)</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Improvement</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Analyze usage patterns to improve our service</li>
                    <li>• Develop new features and accessibility options</li>
                    <li>• Conduct research and analytics</li>
                    <li>• Ensure compliance with regulations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Information Sharing</h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">We Never Sell Your Data</h3>
                <p className="text-red-800">
                  AbleGo does not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>

              <p className="text-gray-700 mb-4">We may share your information only in these limited circumstances:</p>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                  <div>
                    <strong>Service Providers:</strong> With drivers and support workers assigned to your bookings
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                  <div>
                    <strong>Emergency Services:</strong> When necessary for safety or legal compliance
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                  <div>
                    <strong>Legal Requirements:</strong> When required by law or to protect our rights
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2"></div>
                  <div>
                    <strong>Business Partners:</strong> With payment processors and technology providers (under strict agreements)
                  </div>
                </li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Security</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• 256-bit SSL encryption for all data transmission</li>
                    <li>• Secure cloud storage with access controls</li>
                    <li>• Regular security audits and penetration testing</li>
                    <li>• Multi-factor authentication for admin access</li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Operational Safeguards</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Staff training on data protection</li>
                    <li>• Limited access on a need-to-know basis</li>
                    <li>• Regular backup and disaster recovery procedures</li>
                    <li>• Incident response and breach notification protocols</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Rights (GDPR)</h2>
              
              <div className="bg-purple-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">Under GDPR, you have the following rights:</p>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                  <li>• <strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li>• <strong>Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
                  <li>• <strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li>• <strong>Restriction:</strong> Limit how we process your data</li>
                  <li>• <strong>Objection:</strong> Object to processing for marketing purposes</li>
                  <li>• <strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
              
              <p className="text-gray-700 mb-6">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <a href="mailto:privacy@ablego.co.uk" className="text-blue-600 hover:underline">
                      privacy@ablego.co.uk
                    </a>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <a href="tel:08001234567" className="text-blue-600 hover:underline">
                      0800 123 4567
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Data Protection Officer:</strong> privacy@ablego.co.uk<br />
                  <strong>Company Registration:</strong> AbleGo Ltd, England and Wales<br />
                  <strong>ICO Registration:</strong> [Registration Number]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;