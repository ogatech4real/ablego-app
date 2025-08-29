import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/database.types';
import { scrollToActionZone } from '../utils/scrollUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'rider' as Database['public']['Enums']['user_role']
  });

  const { signIn, signUp, loading, error, user, profile } = useAuth();

  // Monitor auth state changes for redirect
  React.useEffect(() => {
    if (user && profile && !loading && !isSubmitting) {
      console.log('Auth state ready for redirect:', { 
        user: !!user, 
        profile: profile, 
        loading: loading 
      });
      
      // Redirect based on role from database
      const rolePath = getRoleDashboardPath(profile.role);
      console.log('Redirecting to:', rolePath);
      
      onClose();
      resetForm();
      window.location.href = rolePath;
    }
  }, [user, profile, loading, isSubmitting]);

  const getRoleDashboardPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'driver':
        return '/dashboard/driver';
      case 'support_worker':
        return '/dashboard/support';
      default:
        return '/dashboard/rider';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setSuccessMessage('');

      if (mode === 'signin') {
        console.log('Starting sign in process for:', formData.email);
        const result = await signIn(formData.email, formData.password);
        
        console.log('Sign in result:', { 
          success: !result.error, 
          error: result.error?.message,
          hasUser: !!result.data?.user 
        });
        
        // Always reset loading state first
        setIsSubmitting(false);
        
        if (result.error) {
          console.error('Sign in failed:', result.error);
          setTimeout(() => scrollToActionZone('.error-message', 'smooth', 20), 100);
          return;
        }
        
        console.log('Sign in successful, waiting for profile to load...');
        setSuccessMessage('Sign in successful! Redirecting...');
        setTimeout(() => scrollToActionZone('.success-message', 'smooth', 20), 100);
        
        // The useEffect above will handle the redirect once profile loads
        
      } else {
        // Signup flow
        if (!formData.email.trim() || !formData.password.trim() || !formData.fullName.trim()) {
          setIsSubmitting(false);
          return;
        }
        
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              role: formData.role
            }
          }
        });
        
        // Always reset loading state immediately
        setIsSubmitting(false);
        
        if (result.error) {
          console.error('Signup failed:', result.error);
          setTimeout(() => scrollToActionZone('.error-message', 'smooth', 20), 100);
          return;
        }
        
        console.log('Signup successful:', result.data);
        
        // With email confirmation enabled, always redirect to login
        setSuccessMessage('Account created! Please check your email to confirm your account before signing in.');
        setTimeout(() => scrollToActionZone('.success-message', 'smooth', 20), 100);
        
        setTimeout(() => {
          onClose();
          resetForm();
          window.location.href = '/login';
        }, 3000);
      }
    } catch (error) {
      console.error('Auth exception:', error);
      setIsSubmitting(false);
      setTimeout(() => scrollToActionZone('.error-message', 'smooth', 20), 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'rider'
    });
    setShowPassword(false);
    setSuccessMessage('');
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome Back' : 'Join AbleGo'}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 success-message">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 error-message" role="alert">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to *
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="rider">Book rides (Rider)</option>
                    <option value="driver">Drive my vehicle (Driver)</option>
                    <option value="support_worker">Provide support (Support Worker)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                disabled={isSubmitting}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={switchMode}
              disabled={isSubmitting}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {mode === 'signup' && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                All users undergo verification for safety and security.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;