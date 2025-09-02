import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Menu, X, Navigation, Users, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationCenter from './NotificationCenter';
import { scrollToTop, scrollToActionZone } from '../utils/scrollUtils';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Animate navbar on load
    gsap.fromTo('.navbar', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.2 }
    );
  }, []);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      scrollToTop('smooth');
    }
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: 'About', href: '/about', isAnchor: false },
    { name: 'Services', href: '/services', isAnchor: false },
    { name: 'Booking', href: '/booking', isAnchor: false },
    { name: 'Safety', href: '/safety', isAnchor: false },
    { name: 'Contact', href: '/contact', isAnchor: false }
  ];

  const handleNavClick = (href: string, isAnchor: boolean) => {
    setIsMenuOpen(false);
    
    if (isAnchor && location.pathname !== '/') {
      // If it's an anchor link and we're not on home page, navigate to home first
      window.location.href = href;
    } else if (!isAnchor) {
      // For regular navigation, scroll to top
      setTimeout(() => scrollToTop('instant'), 100);
    }
  };

  return (
    <nav className={`navbar sticky top-0 z-50 w-full transition-all duration-300 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800 rounded-lg p-2"
            aria-label="AbleGo Home"
          >
            <img
              src="/AbleGo.png"
              alt="AbleGo Logo"
              className="h-8 w-8 lg:h-10 lg:w-10 object-contain"
            />
            <span className={`text-xl lg:text-2xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-900 dark:text-gray-50' : 'text-gray-900 dark:text-gray-50'
            }`}>
              AbleGo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.isAnchor ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => handleNavClick(link.href, link.isAnchor)}
                  className={`font-medium transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300`}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-medium transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 ${location.pathname === link.href ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationCenter />
                <Link 
                  to="/dashboard"
                  className="px-4 py-2 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-full font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link 
                    to="/dashboard/admin"
                    className="px-4 py-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <Shield className="inline-block w-4 h-4 mr-2" />
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Login
              </Link>
            )}
            <Link 
              to="/booking"
              className="px-4 py-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-dark-800 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-dark-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Navigation className="inline-block w-4 h-4 mr-2" />
              Book Ride
            </Link>
            <Link 
              to="/join"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Join Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-4 bg-white/95 dark:bg-dark-800/95 backdrop-blur-md rounded-lg mt-2 shadow-lg">
            {navLinks.map((link) => (
              link.isAnchor ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => handleNavClick(link.href, link.isAnchor)}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-dark-700 transition-colors duration-300 font-medium"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-dark-700 transition-colors duration-300 font-medium ${
                    location.pathname === link.href ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-dark-700' : ''
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            <div className="px-4 pt-4 border-t border-gray-200 dark:border-dark-600 space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-4 py-3 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors duration-300 block text-center"
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full px-4 py-3 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-300 block text-center"
                    >
                      <Shield className="inline-block w-4 h-4 mr-2" />
                      Admin
                    </Link>
                  )}
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full px-4 py-3 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-300 block text-center"
                >
                  Login
                </Link>
              )}
              <Link 
                to="/booking"
                onClick={() => {
                  setIsMenuOpen(false);
                  setTimeout(() => scrollToActionZone('.booking-form, .guest-booking-form'), 100);
                }}
                className="w-full px-4 py-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-300 block text-center"
              >
                <Navigation className="inline-block w-4 h-4 mr-2" />
                Book Ride
              </Link>
              <Link 
                to="/register-driver"
                onClick={() => setIsMenuOpen(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 block text-center"
              >
                <Users className="inline-block w-4 h-4 mr-2" />
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;