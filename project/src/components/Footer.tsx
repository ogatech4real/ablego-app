import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Video,
  ArrowRight
} from 'lucide-react';
import { useNewsletter } from '../hooks/useNewsletter';
import { scrollToActionZone } from '../utils/scrollUtils';

const Footer: React.FC = () => {
  const { subscribe, isSubmitting, error, successMessage, clearMessages } = useNewsletter();
  const [email, setEmail] = React.useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    const result = await subscribe(email, 'footer_signup');
    
    if (result.success) {
      setEmail(''); // Clear input on success
      // Clear success message after 5 seconds
      // Scroll to show success message
      setTimeout(() => scrollToActionZone('.newsletter-success, .success-message'), 100);
      setTimeout(() => {
        clearMessages();
      }, 5000);
    } else {
      // Scroll to show error message
      setTimeout(() => scrollToActionZone('.newsletter-error, .error-message'), 100);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error || successMessage) {
      clearMessages();
    }
  };

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about', isExternal: false },
      { name: 'Our Mission', href: '/', isExternal: false },
      { name: 'Careers', href: '/join', isExternal: false },
      { name: 'Press', href: '/contact', isExternal: false }
    ],
    services: [
      { name: 'Book a Ride', href: '/book', isExternal: false },
      { name: 'Become a Partner', href: '/register-driver', isExternal: false },
      { name: 'Support Workers', href: '/register-support-worker', isExternal: false },
      { name: 'Vehicle Owners', href: '/register-driver', isExternal: false }
    ],
    support: [
      { name: 'Help Center', href: '/contact', isExternal: false },
      { name: 'Safety', href: '/safety', isExternal: false },
      { name: 'Accessibility', href: '/safety', isExternal: false },
      { name: 'Contact Us', href: '/contact', isExternal: false }
    ],
    legal: [
      { name: 'Terms of Service', href: '/contact', isExternal: false },
      { name: 'Privacy Policy', href: '/contact', isExternal: false },
      { name: 'Cookie Policy', href: '/contact', isExternal: false },
      { name: 'GDPR', href: '/safety', isExternal: false }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/share/19oLrpnUBQ/?mibextid=wwXIfr', name: 'Facebook' },
    { icon: Twitter, href: 'https://x.com/ablego', name: 'Twitter' },
    { icon: Instagram, href: 'https://www.instagram.com/ablego_ventures?igsh=djBha2QzYWdsc3pn&utm_source=qr', name: 'Instagram' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/ablego-ventures-57a8ba378/', name: 'LinkedIn' },
    { icon: Video, href: 'https://www.tiktok.com/@ablego_uk?_t=ZM-8yagCftRXoW&_r=1', name: 'TikTok' }
  ];

  return (
    <footer id="contact" className="bg-gray-900 dark:bg-dark-950 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Stay Connected</h3>
              <p className="text-blue-100">
                Get updates on new features, safety tips, and stories from our community
              </p>
            </div>
            <div>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isSubmitting}
                  required
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
              
              {/* Feedback Messages */}
              {(error || successMessage) && (
                <div className="mt-4">
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 newsletter-error">
                      <p className="text-red-100 text-sm">{error}</p>
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3 newsletter-success">
                      <p className="text-green-100 text-sm">{successMessage}</p>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-blue-200 text-xs mt-3">
                We respect your privacy. Unsubscribe at any time. 
                <Link to="/privacy-policy" className="underline hover:text-white">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AbleGo</span>
            </Link>
            
            <p className="text-gray-300 dark:text-gray-400 mb-6 leading-relaxed">
              Compassionate transport services designed for individuals with health challenges, 
              disabilities, and vulnerabilities. Safe, supportive, and always there when you need us.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300 dark:text-gray-400">
                <Phone className="w-5 h-5 mr-3 text-blue-400" />
                <span>01642 089 958</span>
              </div>
              <div className="flex items-center text-gray-300 dark:text-gray-400">
                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                <span>hello@ablego.co.uk</span>
              </div>
              <div className="flex items-center text-gray-300 dark:text-gray-400">
                <MapPin className="w-5 h-5 mr-3 text-blue-400" />
                <span>Middlesbrough, United Kingdom</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors hover:underline"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors hover:underline"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 dark:border-dark-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="text-gray-400 dark:text-gray-500 text-center md:text-left">
              <p>&copy; 2025 AbleGo. All rights reserved.</p>
              <p className="text-sm mt-1">
                Registered in England and Wales. Company No. 16619305
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 dark:text-gray-500 text-sm mr-2">Follow us:</span>
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 dark:bg-dark-800 rounded-full flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors group"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-white" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center items-center mt-8 pt-8 border-t border-gray-800 dark:border-dark-800">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 dark:text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>DBS Checked Staff</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Accessibility Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;