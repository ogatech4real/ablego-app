import React, { useState } from 'react';
import { Shield, Key, CheckCircle, ExternalLink, Copy, AlertTriangle } from 'lucide-react';

const AdminSetupGuide: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">Admin Access Setup Guide</h1>
          </div>
          <p className="text-purple-100 text-lg">
            Follow these steps to set up admin access for AbleGo
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Step 1: Database Setup */}
          <div className="border-l-4 border-purple-500 pl-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Database Migration</h2>
            </div>
            <p className="text-gray-600 mb-4">
              The database migration has created a bootstrap admin user. Check your Supabase database:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Bootstrap Admin Email:</p>
                  <code className="text-purple-600 bg-purple-50 px-2 py-1 rounded">admin@ablego.co.uk</code>
                </div>
                <button
                  onClick={() => copyToClipboard('admin@ablego.co.uk')}
                  className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copiedEmail ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Supabase Auth Setup */}
          <div className="border-l-4 border-blue-500 pl-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Supabase Auth Configuration</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Go to your Supabase dashboard and manually create the admin user in Authentication:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Open Supabase Dashboard → Authentication → Users</li>
                <li>Click "Add User" or "Invite User"</li>
                <li>Enter email: <code className="bg-gray-100 px-1 rounded">admin@ablego.co.uk</code></li>
                <li>Set a secure password</li>
                <li>Confirm email verification (or disable email confirmation)</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">Important:</p>
                    <p className="text-blue-700 text-sm">
                      The user ID in Supabase Auth must match the profile ID in the database. 
                      If they don't match, update the profile table with the correct auth user ID.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Login Process */}
          <div className="border-l-4 border-green-500 pl-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admin Login Process</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Once the auth user is created:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to the login page: <code className="bg-gray-100 px-1 rounded">/login</code></li>
                <li>Enter admin email and password</li>
                <li>After login, the "Admin" button will appear in the navbar</li>
                <li>Click "Admin" to access the dashboard</li>
              </ol>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800">
                    The admin dashboard includes user promotion features to create additional admins.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Creating Additional Admins */}
          <div className="border-l-4 border-teal-500 pl-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-teal-600 font-bold">4</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Creating Additional Admins</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Two methods to create more admin users:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-semibold text-teal-900 mb-2">Method 1: Promote Existing User</h3>
                  <ul className="text-sm text-teal-800 space-y-1">
                    <li>• User signs up normally</li>
                    <li>• Admin goes to Users tab</li>
                    <li>• Click promote button (UserPlus icon)</li>
                    <li>• User becomes admin instantly</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Method 2: Create New Admin</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Go to Admin Management tab</li>
                    <li>• Click "Create Admin" button</li>
                    <li>• Fill in admin details</li>
                    <li>• Manually add to Supabase Auth</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="/login"
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Key className="w-5 h-5 mr-2" />
                Go to Login Page
              </a>
              <button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open Supabase Dashboard
              </button>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Troubleshooting
            </h3>
            <div className="space-y-3 text-sm text-red-800">
              <p><strong>Admin button not showing?</strong> Check that the user's role is 'admin' in the profiles table.</p>
              <p><strong>Access denied error?</strong> Verify the user ID matches between auth.users and profiles tables.</p>
              <p><strong>Can't create admin?</strong> Ensure you're logged in as an existing admin user.</p>
              <p><strong>Login issues?</strong> Check Supabase Auth dashboard for user status and email verification.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupGuide;