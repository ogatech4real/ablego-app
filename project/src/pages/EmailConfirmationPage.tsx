import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader, Mail, ArrowRight } from 'lucide-react';
import { supabase, db, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { scrollToTop, scrollToActionZone } from '../utils/scrollUtils';

const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error' | 'already_confirmed'>('confirming');
  const [errorMessage, setErrorMessage] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [userRole, setUserRole] = useState<string>('rider');

  useEffect(() => {
    document.title = 'Confirm Email - AbleGo';
    scrollToTop('instant');
    
    // Don't start confirmation if auth is still loading
    if (!authLoading) {
      handleEmailConfirmation();
    }
  }, [authLoading]);

  const handleEmailConfirmation = async () => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setStatus('error');
        setErrorMessage('Database connection not configured. Please contact support.');
        scrollToActionZone('.error-message');
        return;
      }

      // Check for existing session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionData.session && sessionData.user) {
        console.log('User already has active session:', sessionData.user.email);
        
        // Get user role from profile
        const { data: profile } = await db.getProfile(sessionData.user.id);
        const role = profile?.role || sessionData.user.user_metadata?.role || 'rider';
        setUserRole(role);
        setStatus('already_confirmed');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
        
        scrollToActionZone('.success-message');
        return;
      }

      // Parse URL parameters - prioritize query params for PKCE flow
      const urlParams = new URLSearchParams(window.location.search);
      const hashFragment = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashFragment);
      
      // Check for error parameters
      const error = urlParams.get('error') || hashParams.get('error');
      const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      if (error) {
        console.error('Email confirmation error:', { error, errorCode, errorDescription });
        setStatus('error');
        setErrorMessage(
          errorDescription 
            ? decodeURIComponent(errorDescription)
            : 'Email confirmation failed. The link may have expired or already been used.'
        );
        scrollToActionZone('.error-message');
        return;
      }

      // Get confirmation code from URL (PKCE flow)
      const code = urlParams.get('code');
      const type = urlParams.get('type');

      console.log('Confirmation parameters found:', { code: !!code, type });

      if (!code) {
        setStatus('error');
        setErrorMessage('Invalid confirmation link. Missing confirmation code.');
        scrollToActionZone('.error-message');
        return;
      }

      // Handle PKCE flow (modern Supabase auth)
      const { data: confirmationData, error: confirmationError } = await supabase.auth.exchangeCodeForSession(code);

      if (confirmationError) {
        console.error('Confirmation error:', confirmationError);
        setStatus('error');
        
        // Handle specific error cases
        if (confirmationError.message.includes('expired')) {
          setErrorMessage('This confirmation link has expired. Please request a new confirmation email.');
        } else if (confirmationError.message.includes('invalid')) {
          setErrorMessage('This confirmation link is invalid. Please check your email for the correct link.');
        } else if (confirmationError.message.includes('already')) {
          setErrorMessage('This email has already been confirmed. You can sign in now.');
        } else {
          setErrorMessage(`Email confirmation failed: ${confirmationError.message}`);
        }
        scrollToActionZone('.error-message');
        return;
      }

      if (!confirmationData.user) {
        setStatus('error');
        setErrorMessage('No user session found. Please try signing up again.');
        scrollToActionZone('.error-message');
        return;
      }

      console.log('Email confirmed successfully for user:', confirmationData.user.email);

      // Wait for database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ensure profile exists - try multiple times if needed
      let profile = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!profile && attempts < maxAttempts) {
        attempts++;
        console.log(`Checking for profile, attempt ${attempts}...`);
        
        const { data: existingProfile, error: profileError } = await db.getProfile(confirmationData.user.id);
        
        if (existingProfile) {
          console.log('Profile found:', existingProfile);
          profile = existingProfile;
          break;
        }
        
        if (attempts === 1) {
          // First attempt - try to create profile if it doesn't exist
          console.log('Profile not found, creating new profile...');
          const userMetadata = confirmationData.user.user_metadata || {};
          const userRole = userMetadata.role || 'rider';
          
          const { data: newProfile, error: createError } = await db.createProfile(confirmationData.user.id, {
            email: confirmationData.user.email || '',
            name: userMetadata.full_name || null,
            phone: userMetadata.phone || null,
            role: userRole
          });

          if (newProfile) {
            console.log('Profile created successfully:', newProfile);
            profile = newProfile;
            break;
          } else if (createError) {
            console.error('Profile creation error:', createError);
          }
        }
        
        // Wait before next attempt
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!profile) {
        console.error('Failed to create or find profile after', maxAttempts, 'attempts');
        setStatus('error');
        setErrorMessage('Email confirmed but profile setup failed. Please try signing in or contact support.');
        scrollToActionZone('.error-message');
        return;
      }

      setStatus('success');
      scrollToActionZone('.success-message');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (error) {
      console.error('Email confirmation error:', error);
      setStatus('error');
      setErrorMessage(
        `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`
      );
      scrollToActionZone('.error-message');
    }
  };

  const handleManualRedirect = () => {
    navigate('/login', { replace: true });
  };

  const handleResendConfirmation = async () => {
    // Redirect to signup page to resend confirmation
    navigate('/signup', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center pt-20 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center content-section">
          {status === 'confirming' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Confirming Your Email
              </h1>
              <p className="text-gray-600 mb-6">
                Please wait while we confirm your email address and set up your account...
              </p>
            </>
          )}

          {status === 'success' && (
            <div className="success-message">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Email Confirmed!
              </h1>
              <p className="text-gray-600 mb-6">
                Your account has been successfully verified! You can now sign in to access your dashboard.
                {redirecting ? ' Redirecting you to sign in...' : ' You will be redirected to the login page shortly.'}
              </p>
              {redirecting && (
                <div className="flex items-center justify-center mb-4">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin mr-2" />
                  <span className="text-blue-600 font-medium">Redirecting to login page...</span>
                </div>
              )}
              <button
                onClick={handleManualRedirect}
                disabled={redirecting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
              >
                Go to Login Page
                <ArrowRight className="w-4 h-4 ml-2 inline-block" />
              </button>
            </div>
          )}

          {status === 'already_confirmed' && (
            <div className="success-message">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Already Confirmed
              </h1>
              <p className="text-gray-600 mb-6">
                Your email has already been confirmed. Redirecting you to the login page...
              </p>
              <div className="flex items-center justify-center">
                <Loader className="w-5 h-5 text-teal-600 animate-spin mr-2" />
                <span className="text-teal-600 font-medium">Redirecting to login...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="error-message">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Confirmation Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request New Confirmation Email
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Try Signing In
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center text-gray-500 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">Need help?</span>
            </div>
            <p className="text-xs text-gray-500">
              Contact us at{' '}
              <a href="mailto:support@ablego.co.uk" className="text-blue-600 hover:underline">
                support@ablego.co.uk
              </a>
              {' '}or call{' '}
              <a href="tel:08001234567" className="text-blue-600 hover:underline">
                0800 123 4567
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;