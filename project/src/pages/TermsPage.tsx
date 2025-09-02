import React from 'react';
import { Helmet } from 'react-helmet-async';

const TermsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - AbleGo</title>
        <meta name="description" content="Terms of service and conditions for using AbleGo transport services." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                Terms of Service
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Please read these terms carefully before using our services
              </p>
            </div>
            
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 md:p-12 shadow-lg border border-gray-100 dark:border-dark-700">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                  Terms and Conditions
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  These terms and conditions govern your use of AbleGo's transport services. By using our services, you accept these terms in full.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Service Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  AbleGo provides accessible transport services for individuals with disabilities and vulnerabilities across the UK. Our services include booking transport, support worker assistance, and real-time journey tracking.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  User Responsibilities
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Users are responsible for providing accurate information when booking, arriving on time for pickups, and treating our staff and drivers with respect and courtesy.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Privacy and Data Protection
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We are committed to protecting your privacy and personal data in accordance with UK data protection laws. Please refer to our Privacy Policy for detailed information.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Contact Information
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  If you have any questions about these terms, please contact us at{' '}
                  <a href="mailto:hello@ablego.co.uk" className="text-blue-600 dark:text-blue-400 hover:underline">
                    hello@ablego.co.uk
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
