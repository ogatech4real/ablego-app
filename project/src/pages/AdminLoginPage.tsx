import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@ablego.co.uk');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Admin Login - AbleGo';
    
    // Clear any existing sessions to avoid conflicts
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 Admin login attempt starting...');
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create completely fresh Supabase client
      const adminSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
            flowType: 'implicit'
          }
        }
      );
      
      console.log('🔐 Attempting auth with fresh client...');
      
      const { data, error: authError } = await adminSupabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      console.log('🔐 Auth response:', { 
        success: !authError, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userEmail: data?.user?.email,
        error: authError?.message 
      });
      
      if (authError) {
        console.error('❌ Auth failed:', authError);
        setError(authError.message);
        setIsSubmitting(false);
        return;
      }
      
      if (!data?.user || !data?.session) {
        console.error('❌ No user or session returned');
        setError('Login failed - no session created');
        setIsSubmitting(false);
        return;
      }
      
      console.log('✅ Auth successful! Setting session and redirecting...');
      
      // Store session data manually
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user
      }));
      
      // Force immediate redirect without waiting for anything
      console.log('🔄 Forcing redirect to admin dashboard...');
      
      // Use multiple redirect methods to ensure it works
      setTimeout(() => {
        window.location.href = '/dashboard/admin';
      }, 100);
      
      setTimeout(() => {
        window.location.replace('/dashboard/admin');
      }, 200);
      
      // Fallback redirect
      setTimeout(() => {
        window.location.assign('/dashboard/admin');
      }, 300);
      
    } catch (error) {
      console.error('❌ Login exception:', error);
      setError('Login failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center pt-20 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Direct admin access</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="admin@ablego.co.uk"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <Shield className="inline-block w-5 h-5 mr-2" />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Admin access only • Isolated login
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-blue-600 hover:text-blue-700 text-sm mt-2"
            >
              Regular user login →
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p><strong>Debug:</strong> This is an isolated admin login that bypasses the auth hook</p>
            <p><strong>Expected:</strong> Direct redirect to /dashboard/admin after successful auth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;