import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Car, 
  Users, 
  Settings, 
  LogOut, 
  Shield,
  Heart,
  Navigation,
  User,
  FileText,
  MapPin
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationCenter from './NotificationCenter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, signOut, isAdmin, isDriver, isSupportWorker } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { 
        name: 'Dashboard', 
        href: user?.email === 'admin@ablego.co.uk' ? '/dashboard/admin' : `/dashboard/${profile?.role || 'rider'}`,
        icon: Home,
        exact: true
      }
    ];

    if (isAdmin || user?.email === 'admin@ablego.co.uk') {
      return [
        ...baseItems,
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
        { name: 'Applications', href: '/admin/applications', icon: FileText },
        { name: 'Vehicles', href: '/admin/vehicles', icon: Car },
        { name: 'Support Workers', href: '/admin/support-workers', icon: Heart }
      ];
    }

    if (isDriver) {
      return [
        ...baseItems,
        { name: 'My Trips', href: '/dashboard/driver', icon: MapPin },
        { name: 'Vehicle', href: '/register/driver', icon: Car },
        { name: 'Profile', href: '/dashboard/driver', icon: Settings }
      ];
    }

    if (isSupportWorker) {
      return [
        ...baseItems,
        { name: 'Assignments', href: '/dashboard/support', icon: Calendar },
        { name: 'Profile', href: '/register/support-worker', icon: Settings }
      ];
    }

    // Rider navigation
    return [
      ...baseItems,
      { name: 'My Bookings', href: '/dashboard/rider', icon: Calendar },
      { name: 'Book Ride', href: '/booking', icon: Navigation },
      { name: 'Profile', href: '/dashboard/rider', icon: User }
    ];
  };

  const navigationItems = getNavigationItems();

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const getRoleColor = () => {
    switch (profile?.role) {
      case 'admin':
        return 'from-purple-600 to-indigo-600';
      case 'driver':
        return 'from-blue-600 to-cyan-600';
      case 'support_worker':
        return 'from-teal-600 to-green-600';
      default:
        return 'from-blue-600 to-teal-600';
    }
  };

  const getRoleIcon = () => {
    switch (profile?.role) {
      case 'admin':
        return <Shield className="w-5 h-5" />;
      case 'driver':
        return <Car className="w-5 h-5" />;
      case 'support_worker':
        return <Heart className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
          {/* User Profile Section */}
          <div className={`bg-gradient-to-r ${getRoleColor()} p-6 text-white`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {getRoleIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {profile?.name || user?.email || 'User'}
                </h3>
                <p className="text-sm text-white/80 capitalize">
                  {profile?.role || 'rider'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href, item.exact);
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {profile?.role || 'rider'} Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome back, {profile?.name || user?.email}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <Link
                  to="/booking"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Book Ride
                </Link>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;