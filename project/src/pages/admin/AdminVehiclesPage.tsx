import React, { useEffect, useState } from 'react';
import {
  Car,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { scrollToActionZone } from '../../utils/scrollUtils';

interface VehicleData {
  id: string;
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  year: number;
  license_plate: string;
  color: string;
  is_verified: boolean;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
    phone: string;
  };
}

const AdminVehiclesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getVehicleRegistrations, verifyVehicle } = useAdmin();
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
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
    search: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ vehicle: VehicleData; action: 'approve' | 'reject' } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    document.title = 'Admin - Vehicles - AbleGo';
    if (isAdmin) {
      loadVehicles(1);
    }
  }, [isAdmin, filters]);

  const loadVehicles = async (page = 1) => {
    try {
      setLoading(true);

      const result = await getVehicleRegistrations(page, 20);

      if (!result.error && result.data) {
        // Apply filters
        let filteredVehicles = result.data;

        if (filters.status) {
          filteredVehicles = filteredVehicles.filter(vehicle => {
            if (filters.status === 'verified') return vehicle.is_verified;
            if (filters.status === 'pending') return !vehicle.is_verified;
            return true;
          });
        }

        if (filters.search) {
          filteredVehicles = filteredVehicles.filter(vehicle =>
            vehicle.vehicle_make?.toLowerCase().includes(filters.search.toLowerCase()) ||
            vehicle.vehicle_model?.toLowerCase().includes(filters.search.toLowerCase()) ||
            vehicle.license_plate?.toLowerCase().includes(filters.search.toLowerCase()) ||
            vehicle.profiles?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            vehicle.profiles?.email?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setVehicles(filteredVehicles);
        setPagination(result.pagination);
        setCurrentPage(page);

        // Scroll to show updated vehicles list
        setTimeout(() => scrollToActionZone('.vehicles-table, table'), 100);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (id: string, verified: boolean, notes?: string) => {
    try {
      setProcessingAction(true);
      const result = await verifyVehicle(id, verified, notes);

      if (!result.error) {
        loadVehicles(currentPage); // Reload current page to show updated status
        setShowActionModal(null);
        setActionNotes('');
        // Scroll to show updated vehicle list
        setTimeout(() => scrollToActionZone('.vehicles-table, table'), 100);
      }
    } catch (error) {
      console.error('Error updating verification:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const openActionModal = (vehicle: VehicleData, action: 'approve' | 'reject') => {
    setShowActionModal({ vehicle, action });
    setActionNotes('');
  };

  const handleActionSubmit = () => {
    if (showActionModal) {
      handleVerification(
        showActionModal.vehicle.id,
        showActionModal.action === 'approve',
        actionNotes || undefined
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicles Management</h1>
            <p className="text-gray-600">Manage and verify vehicle registrations</p>
          </div>
          <button
            onClick={() => {
              // Export functionality would go here
              setTimeout(() => scrollToActionZone('.export-status, .download-status'), 100);
            }}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden vehicles-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading vehicles...</p>
                    </td>
                  </tr>
                ) : vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle.vehicle_make} {vehicle.vehicle_model} ({vehicle.year})
                          </p>
                          <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                          <p className="text-xs text-gray-500">{vehicle.color}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{vehicle.profiles?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{vehicle.profiles?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          vehicle.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vehicle.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">5/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          {!vehicle.is_verified && (
                            <>
                              <button
                                onClick={() => openActionModal(vehicle, 'approve')}
                                disabled={processingAction}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                title="Approve vehicle"
                              >
                                {processingAction ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openActionModal(vehicle, 'reject')}
                                disabled={processingAction}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                title="Reject vehicle"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No vehicles found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Notes Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className={`p-6 rounded-t-2xl ${
              showActionModal.action === 'approve' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <h3 className="text-xl font-bold">
                {showActionModal.action === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {showActionModal.action === 'approve'
                  ? 'Add any notes about the approval (optional)'
                  : 'Please provide a reason for rejection'
                }
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showActionModal.action === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
                  {showActionModal.action === 'reject' && ' *'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder={
                    showActionModal.action === 'approve'
                      ? 'Optional notes about the approval...'
                      : 'Please explain why this vehicle is being rejected...'
                  }
                  required={showActionModal.action === 'reject'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(null);
                    setActionNotes('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionSubmit}
                  disabled={showActionModal.action === 'reject' && !actionNotes.trim()}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showActionModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showActionModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehiclesPage;