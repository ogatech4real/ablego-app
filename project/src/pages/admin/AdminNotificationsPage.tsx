import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  Filter, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  User, 
  Car, 
  Clock, 
  Eye,
  Trash2,
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';

const AdminNotificationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { 
    notifications, 
    loading, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    loadNotifications 
  } = useAdmin();
  
  const [filteredNotifications, setFilteredNotifications] = useState(notifications);
  const [filters, setFilters] = useState({
    type: 'all',
    read: 'all',
    search: ''
  });

  useEffect(() => {
    document.title = 'Admin Notifications - AbleGo';
    if (isAdmin) {
      loadNotifications();
    }
  }, [isAdmin]);

  useEffect(() => {
    let filtered = [...notifications];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Filter by read status
    if (filters.read === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filters.read === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'application':
        return <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'user':
        return <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'system':
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'application':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'user':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'system':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-dark-700">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                You don't have permission to access the admin notifications page.
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Notifications - AbleGo</title>
        <meta name="description" content="Manage and view all admin notifications" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-dark-700">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-300 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  {unreadCount} unread notifications
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <button
                  onClick={loadNotifications}
                  disabled={loading}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  title="Refresh notifications"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark All Read
                  </button>
                )}
                <Link
                  to="/admin"
                  className="px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-dark-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value="booking">Bookings</option>
                  <option value="application">Applications</option>
                  <option value="user">Users</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Read Status Filter */}
              <div className="flex items-center space-x-2">
                <select
                  value={filters.read}
                  onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-700">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                  No notifications found
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  {filters.search || filters.type !== 'all' || filters.read !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'You\'re all caught up!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors duration-200 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-gray-50' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {notification.action_url && (
                              <Link
                                to={notification.action_url}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Link>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-100 dark:border-dark-700 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-100 dark:border-dark-700 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {unreadCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Unread</div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-100 dark:border-dark-700 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {notifications.filter(n => n.type === 'booking').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Bookings</div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-gray-100 dark:border-dark-700 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {notifications.filter(n => n.type === 'application').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Applications</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminNotificationsPage;
