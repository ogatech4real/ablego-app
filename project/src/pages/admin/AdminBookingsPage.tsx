import React, { useEffect, useState } from 'react';
import { Calendar, Filter, Download, Eye, Search, ChevronLeft, ChevronRight, UserPlus, Users, Car, CheckCircle, X, Banknote, CreditCard, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { scrollToActionZone } from '../../utils/scrollUtils';

interface BookingData {
  id: string;
  booking_type: 'user' | 'guest';
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  status: string;
  fare_estimate: number;
  support_workers_count: number | null;
  created_at: string | null;
  vehicle_features: string[] | null;
  special_requirements: string | null;
  payment_method?: 'cash_bank' | 'stripe';
  payment_status?: 'pending' | 'confirmed' | 'failed';
  payment_confirmed_at?: string | null;
}

const AdminBookingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getAllBookings } = useAdmin();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    paymentStatus: '',
    paymentMethod: ''
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState<{
    booking: BookingData;
    type: 'driver' | 'support_worker';
  } | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [availableSupportWorkers, setAvailableSupportWorkers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedSupportWorkers, setSelectedSupportWorkers] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    document.title = 'Admin - Bookings - AbleGo';
    if (isAdmin) {
      loadBookings(1);
    }
  }, [isAdmin, filters]);

  const loadBookings = async (page = 1) => {
    try {
      setLoading(true);
      const result = await getAllBookings(page, 20, filters);

      if (!result.error) {
        setBookings(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
        // Scroll to show updated booking list
        setTimeout(() => scrollToActionZone('.bookings-table, table'), 100);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadBookings(page);
  };

  const openAssignmentModal = async (booking: BookingData, type: 'driver' | 'support_worker') => {
    setShowAssignmentModal({ booking, type });
    setSelectedDriver('');
    setSelectedSupportWorkers([]);
    setAssignmentNotes('');
    
    try {
      if (type === 'driver') {
        const { data, error } = await supabase.rpc('get_available_drivers_for_booking', {
          p_pickup_lat: 51.5074, // Default to London - in real app, extract from booking
          p_pickup_lng: -0.1278,
          p_vehicle_features: booking.vehicle_features || [],
          p_pickup_time: booking.pickup_time
        });
        
        if (!error) {
          setAvailableDrivers(data || []);
        }
      } else {
        const { data, error } = await supabase.rpc('get_available_support_workers_for_booking', {
          p_pickup_lat: 51.5074,
          p_pickup_lng: -0.1278,
          p_pickup_time: booking.pickup_time
        });
        
        if (!error) {
          setAvailableSupportWorkers(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading available staff:', error);
    }
  };

  const handleAssignment = async () => {
    if (!showAssignmentModal) return;
    
    const { booking, type } = showAssignmentModal;
    
    try {
      setIsAssigning(true);
      
      if (type === 'driver' && selectedDriver) {
        const { data, error } = await supabase.rpc('assign_booking_to_driver', {
          p_booking_id: booking.id,
          p_booking_type: booking.booking_type,
          p_driver_id: selectedDriver,
          p_admin_notes: assignmentNotes || null
        });
        
        if (error) {
          console.error('Driver assignment error:', error);
          return;
        }
      } else if (type === 'support_worker' && selectedSupportWorkers.length > 0) {
        const { data, error } = await supabase.rpc('assign_support_workers_to_booking', {
          p_booking_id: booking.id,
          p_booking_type: booking.booking_type,
          p_support_worker_ids: selectedSupportWorkers,
          p_admin_notes: assignmentNotes || null
        });
        
        if (error) {
          console.error('Support worker assignment error:', error);
          return;
        }
      }
      
      // Refresh bookings and close modal
      await loadBookings(currentPage);
      setShowAssignmentModal(null);
      
    } catch (error) {
      console.error('Assignment error:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const exportToCSV = () => {
    if (bookings.length === 0) return;

    const csvData = bookings.map(booking => ({
      id: booking.id,
      customer: booking.customer_name || 'N/A',
      pickup: booking.pickup_address,
      dropoff: booking.dropoff_address,
      pickup_time: booking.pickup_time,
      status: booking.status,
      fare: booking.fare_estimate,
      support_workers: booking.support_workers_count || 0,
      created_at: booking.created_at
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings Management</h1>
            <p className="text-gray-600">
              Monitor and manage all platform bookings ({pagination.total} total bookings)
            </p>
          </div>
          <button
            onClick={() => {
              exportToCSV();
              setTimeout(() => scrollToActionZone('.export-status, .download-status'), 100);
            }}
            disabled={bookings.length === 0}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
            <button
              onClick={() => {
                setFilters({ status: '', dateFrom: '', dateTo: '' });
                loadBookings(1);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => {
                loadBookings(1);
                setTimeout(() => scrollToActionZone('.bookings-table, table'), 100);
              }}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Apply Filters'
              )}
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden bookings-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading bookings...</p>
                    </td>
                  </tr>
                ) : bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.pickup_address} → {booking.dropoff_address}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.pickup_time).toLocaleString()}
                          </p>
                          {booking.vehicle_features && booking.vehicle_features.length > 0 && (
                            <p className="text-xs text-blue-600">
                              {booking.vehicle_features.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customer_name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{booking.customer_email}</p>
                          {booking.customer_phone && (
                            <p className="text-xs text-gray-500">{booking.customer_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.booking_type === 'user' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {booking.booking_type === 'user' ? 'Registered' : 'Guest'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">£{booking.fare_estimate}</p>
                        {booking.support_workers_count && booking.support_workers_count > 0 && (
                          <p className="text-xs text-gray-600">
                            {booking.support_workers_count} support worker{booking.support_workers_count > 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {booking.payment_method === 'cash_bank' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Banknote className="w-3 h-3 mr-1" />
                                Cash/Bank
                              </span>
                            ) : booking.payment_method === 'stripe' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Stripe
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Unknown
                              </span>
                            )}
                          </div>
                          {booking.payment_status && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              booking.payment_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.payment_status === 'confirmed' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : booking.payment_status === 'pending' ? (
                                <Clock className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {booking.payment_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openAssignmentModal(booking, 'driver')}
                                className="text-green-600 hover:text-green-700 p-1 rounded"
                                title="Assign driver"
                              >
                                <Car className="w-4 h-4" />
                              </button>
                              
                              {booking.support_workers_count && booking.support_workers_count > 0 && (
                                <button
                                  onClick={() => openAssignmentModal(booking, 'support_worker')}
                                  className="text-purple-600 hover:text-purple-700 p-1 rounded"
                                  title="Assign support workers"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} bookings
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 rounded-t-2xl ${
              showAssignmentModal.type === 'driver' ? 'bg-blue-600' : 'bg-purple-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Assign {showAssignmentModal.type === 'driver' ? 'Driver' : 'Support Workers'}
                  </h3>
                  <p className="text-sm opacity-90 mt-1">
                    {showAssignmentModal.booking.customer_name} - {showAssignmentModal.booking.pickup_address}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignmentModal(null)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">From:</span>
                    <p className="font-medium">{showAssignmentModal.booking.pickup_address}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">To:</span>
                    <p className="font-medium">{showAssignmentModal.booking.dropoff_address}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pickup Time:</span>
                    <p className="font-medium">{new Date(showAssignmentModal.booking.pickup_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fare:</span>
                    <p className="font-medium">£{showAssignmentModal.booking.fare_estimate}</p>
                  </div>
                </div>
              </div>

              {/* Driver Selection */}
              {showAssignmentModal.type === 'driver' && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Available Drivers</h4>
                  {availableDrivers.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableDrivers.map((driver) => (
                        <label
                          key={driver.driver_id}
                          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedDriver === driver.driver_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="driver"
                            value={driver.driver_id}
                            checked={selectedDriver === driver.driver_id}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{driver.driver_name}</p>
                                <p className="text-sm text-gray-600">{driver.vehicle_info}</p>
                                <p className="text-xs text-gray-500">{driver.license_plate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">⭐ {driver.accessible_rating}/5</p>
                                <p className="text-xs text-gray-500">{driver.passenger_capacity} seats</p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Car className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No available drivers found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Support Worker Selection */}
              {showAssignmentModal.type === 'support_worker' && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Available Support Workers (Select {showAssignmentModal.booking.support_workers_count})
                  </h4>
                  {availableSupportWorkers.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableSupportWorkers.map((worker) => (
                        <label
                          key={worker.support_worker_id}
                          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedSupportWorkers.includes(worker.support_worker_id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={worker.support_worker_id}
                            checked={selectedSupportWorkers.includes(worker.support_worker_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSupportWorkers(prev => [...prev, worker.support_worker_id]);
                              } else {
                                setSelectedSupportWorkers(prev => prev.filter(id => id !== worker.support_worker_id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{worker.worker_name}</p>
                                <p className="text-sm text-gray-600">{worker.specializations?.join(', ') || 'General support'}</p>
                                <p className="text-xs text-gray-500">{worker.experience_years} years experience</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">£{worker.hourly_rate}/hr</p>
                                <p className="text-xs text-gray-500">{worker.languages?.join(', ')}</p>
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No available support workers found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assignment Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Add any special instructions for the assigned staff..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignmentModal(null)}
                  disabled={isAssigning}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignment}
                  disabled={
                    isAssigning || 
                    (showAssignmentModal.type === 'driver' && !selectedDriver) ||
                    (showAssignmentModal.type === 'support_worker' && selectedSupportWorkers.length === 0)
                  }
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showAssignmentModal.type === 'driver' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isAssigning ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Assigning...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 inline-block" />
                      Assign {showAssignmentModal.type === 'driver' ? 'Driver' : 'Support Workers'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;