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
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              
              {error && (
                <p className="text-red-200 text-sm mt-2 newsletter-error">
                  {error}
                </p>
              )}
              
              {successMessage && (
                <p className="text-green-200 text-sm mt-2 newsletter-success">
                  {successMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/AbleGo.png"
                alt="AbleGo Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold">AbleGo</span>
            </div>
            <p className="text-gray-300 mb-4">
              Inclusive transport services with trained companions for individuals with health challenges, disabilities, and vulnerabilities.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-800 pt-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <a href="tel:01642089958" className="text-white hover:text-blue-400 transition-colors duration-300">
                  01642 089 958
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <a href="mailto:hello@ablego.co.uk" className="text-white hover:text-blue-400 transition-colors duration-300">
                  hello@ablego.co.uk
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white">Victoria Building, Teesside University, Launchpad, Middlesbrough TS1 3BA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Made with compassion for our community</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="hover:text-white transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2024 AbleGo Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;