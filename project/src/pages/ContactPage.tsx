import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { scrollToTop } from '../utils/scrollUtils';

const ContactPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact Us - AbleGo';
    scrollToTop('instant');
  }, []);

  return (
    <>
      <Helmet>
        <title>Contact Us - AbleGo</title>
        <meta name="description" content="Get in touch with AbleGo for support, bookings, or general inquiries. We're here to help with all your accessible transport needs." />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section relative py-20 bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-6">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-400 dark:to-teal-400">Touch</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              We're here to help with all your accessible transport needs
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white dark:bg-dark-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">Send us a Message</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a subject</option>
                      <option value="booking">Booking Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-dark-800 transition-all duration-300 flex items-center justify-center"
                  >
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                  </button>
                </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6">Contact Information</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    We're here to help with all your accessible transport needs. Get in touch with us through any of the channels below.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Phone Support */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-start">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                        <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Phone Support</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">24/7 customer service and emergency support</p>
                        <a href="tel:01642089958" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          01642 089 958
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Email Support */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-start">
                      <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mr-4">
                        <Mail className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Email Support</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">General inquiries and support</p>
                        <a href="mailto:hello@ablego.co.uk" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
                        hello@ablego.co.uk
                      </a>
                      </div>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-start">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                        <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Office Hours</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">When we're available to help</p>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                          <p>Saturday: 9:00 AM - 6:00 PM</p>
                          <p>Sunday: 10:00 AM - 4:00 PM</p>
                          <p className="text-green-600 dark:text-green-400 font-medium mt-1">Emergency support available 24/7</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                  <div className="flex items-start">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-4">
                        <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">Our Location</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">Headquarters and main office</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Victoria Building, Teesside University, Launchpad, Middlesbrough TS1 3BA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 dark:text-gray-300">Find quick answers to common questions</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">How do I book a ride?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can book a ride through our website, mobile app, or by calling our support line. Simply provide your pickup and dropoff locations, preferred time, and any special requirements.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">What types of vehicles do you offer?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We offer a range of accessible vehicles including wheelchair-accessible vans, standard vehicles, and vehicles equipped with various accessibility features to meet your specific needs.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Do you provide support workers?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, we can arrange for trained support workers to accompany you on your journey. This service can be requested during the booking process.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">What areas do you serve?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We currently serve the entire United Kingdom, with extensive coverage in major cities and surrounding areas. Contact us to confirm availability in your specific location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your first ride today and experience our accessible, supportive transport service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/booking"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Book a Ride
            </a>
            <a
              href="tel:01642089958"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Call Now
            </a>
          </div>
    </div>
      </section>
    </>
  );
};

export default ContactPage;