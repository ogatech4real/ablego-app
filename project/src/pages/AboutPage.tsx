import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { scrollToTop } from '../utils/scrollUtils';

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About Us - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <>
      <Helmet>
        <title>About Us - AbleGo</title>
        <meta name="description" content="Learn about AbleGo's mission to provide inclusive, supportive transport services for individuals with disabilities and vulnerabilities across the UK." />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section relative py-20 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-400 dark:to-teal-400">AbleGo</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              We're on a mission to make transport accessible, supportive, and dignified for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                Our Story
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-teal-600 mx-auto mb-8"></div>
            </div>

            <div className="prose prose-xl max-w-none">
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-dark-800 dark:to-dark-700 rounded-3xl p-8 md:p-12 shadow-lg border border-blue-100 dark:border-blue-900/30">
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  AbleGo is a UK-based on-demand transport service designed to support individuals with health challenges, 
                  disabilities, or anyone needing extra assistance when travelling. Whether it's a medical appointment, 
                  a social outing, or a daily errand, we go beyond just rides — we provide trusted, trained companions 
                  who ensure safety, comfort, and confidence from door to destination.
                </p>
                
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  With both our own accessible vehicles and a network of verified partners, AbleGo gives you the freedom 
                  to book the right support for your journey — including professional support workers if needed.
                </p>
                
                <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border-l-4 border-blue-600 dark:border-blue-400">
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-50 italic">
                    "We believe mobility is dignity, and we're here to make sure no one is left behind."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="mission-section py-20 bg-gray-50 dark:bg-dark-800">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                Our Mission & Values
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We're driven by compassion, innovation, and an unwavering commitment to accessibility.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-dark-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Compassion First</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Every journey is personal. We treat each passenger with dignity, respect, and genuine care.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-dark-700">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Safety & Trust</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Rigorous vetting, training, and monitoring ensure every journey is safe and secure.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-dark-700">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Innovation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We continuously improve our technology and services to better serve our community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              Meet the dedicated professionals behind AbleGo's mission.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">JD</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">John Doe</h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">Founder & CEO</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Former healthcare professional with 15+ years experience in accessible transport solutions.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">JS</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Jane Smith</h3>
                <p className="text-teal-600 dark:text-teal-400 font-semibold mb-4">Head of Operations</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Specialized in disability support services with expertise in community care coordination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you need transport or want to help provide it, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/booking"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Book a Ride
            </a>
            <a
              href="/contact"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;