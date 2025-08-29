import React, { useEffect, useState } from 'react';
import {
  Users,
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

interface SupportWorkerData {
  id: string;
  user_id: string;
  experience_years: number;
  desired_hourly_rate: number;
  specializations: string[];
  bio: string;
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

const AdminSupportWorkersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getSupportWorkerApplications, verifySupportWorker } = useAdmin();
  const [supportWorkers, setSupportWorkers] = useState<SupportWorkerData[]>([]);
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
  const [selectedSupportWorker, setSelectedSupportWorker] = useState<SupportWorkerData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ supportWorker: SupportWorkerData; action: 'approve' | 'reject' } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    document.title = 'Admin - Support Workers - AbleGo';
    if (isAdmin) {
      loadSupportWorkers(1);
    }
  }, [isAdmin, filters]);

  const loadSupportWorkers = async (page = 1) => {
    try {
      setLoading(true);

      const result = await getSupportWorkerApplications(page, 20);

      if (!result.error && result.data) {
        // Apply filters
        let filteredSupportWorkers = result.data;

        if (filters.status) {
          filteredSupportWorkers = filteredSupportWorkers.filter(worker => {
            if (filters.status === 'verified') return worker.is_verified;
            if (filters.status === 'pending') return !worker.is_verified;
            return true;
          });
        }

        if (filters.search) {
          filteredSupportWorkers = filteredSupportWorkers.filter(worker =>
            worker.profiles?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            worker.profiles?.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
            worker.profiles?.phone?.includes(filters.search) ||
            worker.specializations?.some(spec => spec.toLowerCase().includes(filters.search.toLowerCase()))
          );
        }

        setSupportWorkers(filteredSupportWorkers);
        setPagination(result.pagination);
        setCurrentPage(page);

        // Scroll to show updated support workers list
        setTimeout(() => scrollToActionZone('.support-workers-table, table'), 100);
      }
    } catch (error) {
      console.error('Error loading support workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (id: string, verified: boolean, notes?: string) => {
    try {
      setProcessingAction(true);
      const result = await verifySupportWorker(id, verified, notes);

      if (!result.error) {
        loadSupportWorkers(currentPage); // Reload current page
        setShowActionModal(null);
        setActionNotes('');
        // Scroll to show updated support workers list
        setTimeout(() => scrollToActionZone('.support-workers-table, table'), 100);
      }
    } catch (error) {
      console.error('Error updating verification:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const openActionModal = (worker: SupportWorkerData, action: 'approve' | 'reject') => {
    setShowActionModal({ supportWorker: worker, action });
    setActionNotes('');
  };

  const handleActionSubmit = () => {
    if (showActionModal) {
      handleVerification(
        showActionModal.supportWorker.id,
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Workers Management</h1>
            <p className="text-gray-600">Manage and verify support worker applications</p>
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

        {/* Support Workers Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden support-workers-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Support Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
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
                      <p className="text-gray-600">Loading support workers...</p>
                    </td>
                  </tr>
                ) : supportWorkers.length > 0 ? (
                  supportWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{worker.profiles?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{worker.profiles?.email}</p>
                          <p className="text-xs text-gray-500">
                            {worker.specializations?.join(', ') || 'General support'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{worker.experience_years} years</p>
                        <p className="text-xs text-gray-500">
                          DBS: {worker.is_verified ? 'Verified' : 'Pending'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          worker.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {worker.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">£{worker.desired_hourly_rate}/hour</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          {!worker.is_verified && (
                            <>
                              <button
                                onClick={() => openActionModal(worker, 'approve')}
                                disabled={processingAction}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                title="Approve support worker"
                              >
                                {processingAction ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openActionModal(worker, 'reject')}
                                disabled={processingAction}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                title="Reject support worker"
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
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No support workers found</p>
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
                {showActionModal.action === 'approve' ? 'Approve Support Worker' : 'Reject Support Worker'}
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
                      : 'Please explain why this application is being rejected...'
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

export default AdminSupportWorkersPage;