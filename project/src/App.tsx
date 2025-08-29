import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { setupScrollAnimations } from './utils/animations';
import { scrollToTopOnRouteChange } from './utils/scrollUtils';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import DriverRegistrationPage from './pages/DriverRegistrationPage';
import SupportWorkerRegistrationPage from './pages/SupportWorkerRegistrationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminSupportWorkersPage from './pages/admin/AdminSupportWorkersPage';
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import PublicDriverRegistration from './pages/PublicDriverRegistration';
import PublicSupportWorkerRegistration from './pages/PublicSupportWorkerRegistration';
import BookingStatusPage from './pages/BookingStatusPage';

import JoinPage from './pages/JoinPage';
import SafetyPage from './pages/SafetyPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AdminSetupGuide from './components/AdminSetupGuide';
import Footer from './components/Footer';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './components/DashboardLayout';
import RiderDashboard from './pages/dashboard/RiderDashboard';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import SupportWorkerDashboard from './pages/dashboard/SupportWorkerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

function App() {
  useEffect(() => {
    try {
      // Setup scroll animations
      setupScrollAnimations();
    } catch (error) {
      console.warn('Animation setup failed:', error);
    }
  }, []);

  // Add route change listener for scroll to top
  useEffect(() => {
    const handleRouteChange = () => {
      scrollToTopOnRouteChange();
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  return (
    <ErrorBoundary>
      <Helmet>
        <title>AbleGo - Inclusive Transport with Compassion</title>
        <meta name="description" content="AbleGo provides safe, supportive transport services with trained companions for individuals with health challenges, disabilities, and vulnerabilities across the UK." />
      </Helmet>
      <Router>
        <div className="min-h-screen bg-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Centralized Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/rider" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RiderDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/driver" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DriverDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/support" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SupportWorkerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/admin" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Legacy admin routes - redirect to new structure */}
            <Route path="/admin" element={
              <AdminRoute>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </AdminRoute>
            } />
            
            <Route path="/register/driver" element={<DriverRegistrationPage />} />
            <Route path="/register/support-worker" element={<SupportWorkerRegistrationPage />} />
            <Route path="/register-driver" element={<PublicDriverRegistration />} />
            <Route path="/register-support-worker" element={<PublicSupportWorkerRegistration />} />
            <Route path="/booking-status" element={<BookingStatusPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/auth/confirm" element={<EmailConfirmationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
            <Route path="/admin-setup" element={<AdminSetupGuide />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin/bookings" element={
              <AdminRoute>
                <AdminBookingsPage />
              </AdminRoute>
            } />
            <Route path="/admin/support-workers" element={
              <AdminRoute>
                <AdminSupportWorkersPage />
              </AdminRoute>
            } />
            <Route path="/admin/vehicles" element={
              <AdminRoute>
                <AdminVehiclesPage />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            } />
            <Route path="/admin/applications" element={
              <AdminRoute>
                <AdminApplicationsPage />
              </AdminRoute>
            } />
          </Routes>
          <Footer />
          <ThemeToggle />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;