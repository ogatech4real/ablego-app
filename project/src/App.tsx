import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTheme } from './hooks/useTheme';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load admin pages for better performance
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminSupportWorkersPage = lazy(() => import('./pages/admin/AdminSupportWorkersPage'));
const AdminVehiclesPage = lazy(() => import('./pages/admin/AdminVehiclesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage'));

// Loading component for lazy-loaded routes
const AdminPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

// Admin route wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add admin authentication logic here
  return <>{children}</>;
};

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    // Set initial theme to prevent flash
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ErrorBoundary>
      <Helmet>
        <html lang="en" />
        <body className={theme === 'dark' ? 'dark' : ''} />
        <meta name="theme-color" content={theme === 'dark' ? '#0f172a' : '#ffffff'} />
      </Helmet>
      <Router>
        <div className="min-h-screen bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking-status" element={<BookingStatusPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/auth/confirm" element={<EmailConfirmationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
            <Route path="/admin-setup" element={<AdminSetupGuide />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            
            {/* Lazy-loaded admin routes */}
            <Route path="/admin/bookings" element={
              <AdminRoute>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminBookingsPage />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="/admin/support-workers" element={
              <AdminRoute>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminSupportWorkersPage />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="/admin/vehicles" element={
              <AdminRoute>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminVehiclesPage />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminUsersPage />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="/admin/applications" element={
              <AdminRoute>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminApplicationsPage />
                </Suspense>
              </AdminRoute>
            } />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/driver" element={<DriverDashboard />} />
            <Route path="/dashboard/support" element={<SupportWorkerDashboard />} />
            <Route path="/dashboard/rider" element={<RiderDashboard />} />
            
            {/* Registration routes */}
            <Route path="/register-driver" element={<RegisterDriverPage />} />
            <Route path="/register-support-worker" element={<RegisterSupportWorkerPage />} />
            <Route path="/join" element={<JoinPage />} />
            
            {/* Authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Legal pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/accessibility" element={<AccessibilityPage />} />
            
            {/* Error pages */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/500" element={<ServerErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Footer />
          <ThemeToggle />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// Import all pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import BookingStatusPage from './pages/BookingStatusPage';
import ContactPage from './pages/ContactPage';
import SafetyPage from './pages/SafetyPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminSetupGuide from './pages/AdminSetupGuide';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import SupportWorkerDashboard from './pages/dashboard/SupportWorkerDashboard';
import RiderDashboard from './pages/dashboard/RiderDashboard';
import RegisterDriverPage from './pages/RegisterDriverPage';
import RegisterSupportWorkerPage from './pages/RegisterSupportWorkerPage';
import JoinPage from './pages/JoinPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import AccessibilityPage from './pages/AccessibilityPage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';

export default App;