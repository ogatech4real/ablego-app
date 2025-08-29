import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Car,
  Users,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { scrollToActionZone } from '../../utils/scrollUtils';

interface ApplicationData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  application_type: string;
  submitted_at: string;
  reviewed_at: string | null;
  motivation: string;
  // Driver specific
  vehicle_make?: string;
  vehicle_model?: string;
  license_plate?: string;
  years_of_experience?: number;
  // Support worker specific
  experience_years?: number;
  desired_hourly_rate?: number;
  specializations?: string[];
  bio?: string;
}

const AdminApplicationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { getDriverApplications, getSupportWorkerApplications } = useAdmin();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ application: ApplicationData; action: 'approve' | 'reject' } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    document.title = 'Admin - Applications - AbleGo';
    if (isAdmin) {
      loadApplications(1);
    }
  }, [isAdmin, filters]);

  const loadApplications = async (page = 1) => {
    try {
      setLoading(true);
      
      let allApplications: ApplicationData[] = [];
      let totalCount = 0;

      // Load driver applications
      if (filters.type === '' || filters.type === 'driver') {
        const driverResult = await getDriverApplications(page, 20);
        if (!driverResult.error && driverResult.data) {
          const driverApps = driverResult.data.map(app => ({
            ...app,
            application_type: 'driver',
            submitted_at: app.created_at || app.submitted_at,
            full_name: app.profiles?.name || app.full_name,
            email: app.profiles?.email || app.email,
            phone: app.profiles?.phone || app.phone
          }));
          allApplications = [...allApplications, ...driverApps];
          totalCount += driverResult.pagination.total;
        }
      }

      // Load support worker applications
      if (filters.type === '' || filters.type === 'support_worker') {
        const supportResult = await getSupportWorkerApplications(page, 20);
        if (!supportResult.error && supportResult.data) {
          const supportApps = supportResult.data.map(app => ({
            ...app,
            application_type: 'support_worker',
            submitted_at: app.created_at || app.submitted_at,
            full_name: app.profiles?.name || app.full_name,
            email: app.profiles?.email || app.email,
            phone: app.profiles?.phone || app.phone
          }));
          allApplications = [...allApplications, ...supportApps];
          totalCount += supportResult.pagination.total;
        }
      }

      // Sort by submission date
      allApplications.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      // Apply search filter
      if (filters.search) {
        allApplications = allApplications.filter(app =>
          app.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.phone?.includes(filters.search)
        );
      }

      // Apply status filter
      if (filters.status) {
        allApplications = allApplications.filter(app => app.status === filters.status);
      }

      setApplications(allApplications);
      setPagination({
        page,
        limit: 20,
        total: totalCount,
        pages: Math.ceil(totalCount / 20)
      });
      setCurrentPage(page);

      // Scroll to show updated applications list
      setTimeout(() => scrollToActionZone('.applications-table, table'), 100);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (application: ApplicationData, action: 'approve' | 'reject', notes: string) => {
    try {
      setProcessingAction(true);
      
      const tableName = application.application_type === 'driver' 
        ? 'driver_applications' 
        : 'support_worker_applications';

      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
        ...(action === 'reject' && { rejection_reason: notes })
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', application.id);

      if (error) {
        console.error('Error updating application:', error);
        return;
      }

      // Send notification email
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: action === 'approve' ? 'application_approved' : 'application_rejected',
          applicationId: application.id,
          applicantName: application.full_name,
          applicantEmail: application.email,
          adminNotes: action === 'approve' ? notes : undefined,
          rejectionReason: action === 'reject' ? notes : undefined
        }
      });

      // Refresh applications list
      await loadApplications(currentPage);
      setShowActionModal(null);
      setActionNotes('');
      // Scroll to show updated applications list
      setTimeout(() => scrollToActionZone('.applications-table, table'), 100);

    } catch (error) {
      console.error('Error processing application action:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const exportApplications = () => {
    if (applications.length === 0) return;

    const csvData = applications.map(app => ({
      id: app.id,
      type: app.application_type,
      name: app.full_name,
      email: app.email,
      phone: app.phone,
      status: app.status,
      submitted_at: app.submitted_at,
      vehicle: app.application_type === 'driver' ? `${app.vehicle_make} ${app.vehicle_model}` : 'N/A',
      experience: app.application_type === 'driver' ? `${app.years_of_experience} years` : `${app.experience_years} years`,
      rate: app.application_type === 'support_worker' ? `£${app.desired_hourly_rate}` : 'N/A'
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
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'driver' ? <Car className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications Management</h1>
            <p className="text-gray-600">
              Review and manage driver and support worker applications ({pagination.total} total)
            </p>
          </div>
          <button
            onClick={() => {
              exportApplications();
              setTimeout(() => scrollToActionZone('.export-status, .download-status'), 100);
            }}
            disabled={applications.length === 0}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
                setFilters({ type: '', status: '', search: '' });
                loadApplications(1);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="driver">Driver Applications</option>
              <option value="support_worker">Support Worker Applications</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name or email..."
              />
            </div>

            <button
              onClick={() => {
                loadApplications(1);
                setTimeout(() => scrollToActionZone('.applications-table, table'), 100);
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

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden applications-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                      <p className="text-gray-600">Loading applications...</p>
                    </td>
                  </tr>
                ) : applications.length > 0 ? (
                  applications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{application.full_name}</p>
                          <p className="text-sm text-gray-600">{application.email}</p>
                          <p className="text-xs text-gray-500">{application.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getTypeIcon(application.application_type)}
                          <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                            {application.application_type.replace('_', ' ')}
                          </span>
                        </div>
                        {application.application_type === 'driver' && application.vehicle_make && (
                          <p className="text-xs text-gray-500">
                            {application.vehicle_make} {application.vehicle_model}
                          </p>
                        )}
                        {application.application_type === 'support_worker' && application.specializations && (
                          <p className="text-xs text-gray-500">
                            {application.specializations.slice(0, 2).join(', ')}
                            {application.specializations.length > 2 && '...'}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(application.submitted_at).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-gray-500">
                          {Math.floor((Date.now() - new Date(application.submitted_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setShowActionModal({ application, action: 'approve' })}
                                className="text-green-600 hover:text-green-700 p-1 rounded"
                                title="Approve application"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowActionModal({ application, action: 'reject' })}
                                className="text-red-600 hover:text-red-700 p-1 rounded"
                                title="Reject application"
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
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {Object.values(filters).some(f => f) ? 'No applications match your filters' : 'No applications found'}
                      </p>
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
                Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} applications
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadApplications(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => loadApplications(currentPage + 1)}
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

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedApplication.full_name}</h3>
                  <p className="text-blue-100 capitalize">
                    {selectedApplication.application_type.replace('_', ' ')} Application
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedApplication.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{selectedApplication.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">Address on file</span>
                    </div>
                  </div>
                </div>

                {/* Application Specific Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    {selectedApplication.application_type === 'driver' ? (
                      <Car className="w-5 h-5 mr-2" />
                    ) : (
                      <Users className="w-5 h-5 mr-2" />
                    )}
                    {selectedApplication.application_type === 'driver' ? 'Vehicle Details' : 'Professional Details'}
                  </h4>
                  
                  {selectedApplication.application_type === 'driver' ? (
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Vehicle:</span> {selectedApplication.vehicle_make} {selectedApplication.vehicle_model}
                      </div>
                      <div>
                        <span className="font-medium">License Plate:</span> {selectedApplication.license_plate}
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {selectedApplication.years_of_experience} years
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Experience:</span> {selectedApplication.experience_years} years
                      </div>
                      <div>
                        <span className="font-medium">Desired Rate:</span> £{selectedApplication.desired_hourly_rate}/hour
                      </div>
                      <div>
                        <span className="font-medium">Specializations:</span> {selectedApplication.specializations?.join(', ') || 'None specified'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivation */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Motivation</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedApplication.motivation}</p>
                </div>
              </div>

              {/* Bio for Support Workers */}
              {selectedApplication.application_type === 'support_worker' && selectedApplication.bio && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Bio</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedApplication.bio}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowActionModal({ application: selectedApplication, action: 'approve' });
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowActionModal({ application: selectedApplication, action: 'reject' });
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject) */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className={`p-6 rounded-t-2xl ${
              showActionModal.action === 'approve' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <h3 className="text-xl font-bold">
                {showActionModal.action === 'approve' ? 'Approve Application' : 'Reject Application'}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {showActionModal.application.full_name} - {showActionModal.application.application_type.replace('_', ' ')}
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showActionModal.action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
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
                  disabled={processingAction}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplicationAction(showActionModal.application, showActionModal.action, actionNotes)}
                  disabled={processingAction || (showActionModal.action === 'reject' && !actionNotes.trim())}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showActionModal.action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingAction ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    showActionModal.action === 'approve' ? 'Approve' : 'Reject'
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

export default AdminApplicationsPage;