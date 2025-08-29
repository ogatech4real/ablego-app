import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Eye, Download, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { scrollToActionZone } from '../../utils/scrollUtils';

interface SupportWorkerData {
  id: string;
  verified: boolean | null;
  experience_years: number | null;
  hourly_rate: number | null;
  dbs_uploaded: boolean | null;
  specializations: string[] | null;
  profile?: {
    name: string | null;
    email: string;
  };
}

const AdminSupportWorkersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { verifySupportWorker } = useAdmin();
  const [supportWorkers, setSupportWorkers] = useState<SupportWorkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingWorker, setVerifyingWorker] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<{ workerId: string; action: 'approve' | 'reject' } | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    document.title = 'Admin - Support Workers - AbleGo';
    if (isAdmin) {
      loadSupportWorkers();
    }
  }, [isAdmin]);

  const loadSupportWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_workers')
        .select(`
          *,
          user:users!user_id (
            id,
            email,
            role
          ),
          user_profile:profiles!user_id (
            name,
            phone,
            email
          ),
          certifications (*)
        `)
        .order('created_at', { ascending: false });

      if (!error) {
        setSupportWorkers(data || []);
      }
    } catch (error) {
      console.error('Error loading support workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (id: string, verified: boolean, notes?: string) => {
    try {
      setVerifyingWorker(id);
      const result = await verifySupportWorker(id, verified, notes);

      if (!result.error) {
        loadSupportWorkers();
        setShowNotesModal(null);
        setVerificationNotes('');
        // Scroll to show updated support workers list
        setTimeout(() => scrollToActionZone('.support-workers-table, table'), 100);
      }
    } catch (error) {
      console.error('Error updating verification:', error);
    } finally {
      setVerifyingWorker(null);
    }
  };

  const openNotesModal = (workerId: string, action: 'approve' | 'reject') => {
    setShowNotesModal({ workerId, action });
    setVerificationNotes('');
  };

  const handleNotesSubmit = () => {
    if (showNotesModal) {
      handleVerification(
        showNotesModal.workerId, 
        showNotesModal.action === 'approve',
        verificationNotes || undefined
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
                          <p className="font-medium text-gray-900">{worker.user_profile?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{worker.user_profile?.email}</p>
                          <p className="text-xs text-gray-500">
                            {worker.specializations?.join(', ') || 'General support'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{worker.experience_years} years</p>
                        <p className="text-xs text-gray-500">
                          DBS: {worker.dbs_uploaded ? 'Uploaded' : 'Missing'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          worker.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {worker.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">£{worker.hourly_rate}/hour</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4" />
                          </button>
                          {!worker.verified && (
                            <>
                              <button
                                onClick={() => openNotesModal(worker.id, 'approve')}
                                disabled={verifyingWorker === worker.id}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                title="Approve support worker"
                              >
                                {verifyingWorker === worker.id ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openNotesModal(worker.id, 'reject')}
                                disabled={verifyingWorker === worker.id}
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

      {/* Verification Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className={`p-6 rounded-t-2xl ${
              showNotesModal.action === 'approve' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <h3 className="text-xl font-bold">
                {showNotesModal.action === 'approve' ? 'Approve Support Worker' : 'Reject Support Worker'}
              </h3>
              <p className="text-sm opacity-90 mt-1">
                {showNotesModal.action === 'approve' 
                  ? 'Add any notes about the approval (optional)'
                  : 'Please provide a reason for rejection'
                }
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showNotesModal.action === 'approve' ? 'Approval Notes' : 'Rejection Reason'} 
                  {showNotesModal.action === 'reject' && ' *'}
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder={
                    showNotesModal.action === 'approve' 
                      ? 'Optional notes about the approval...'
                      : 'Please explain why this application is being rejected...'
                  }
                  required={showNotesModal.action === 'reject'}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNotesModal(null);
                    setVerificationNotes('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotesSubmit}
                  disabled={showNotesModal.action === 'reject' && !verificationNotes.trim()}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showNotesModal.action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showNotesModal.action === 'approve' ? 'Approve' : 'Reject'}
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