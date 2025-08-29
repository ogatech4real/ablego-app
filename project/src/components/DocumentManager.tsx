import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Image, 
  CheckCircle, 
  Clock, 
  Trash2,
  Eye
} from 'lucide-react';
import FileUpload from './FileUpload';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import type { StorageBucket } from '../services/storageService';

interface Document {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
  verified: boolean;
  verificationNotes?: string;
}

interface DocumentManagerProps {
  bucket: StorageBucket;
  entityId?: string; // vehicleId for vehicle docs
  entityType: 'vehicle' | 'support_worker';
  className?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  bucket,
  entityId,
  entityType,
  className = ''
}) => {
  const { user } = useAuth();
  const { listUserFiles, getSignedUrl, deleteFile } = useStorage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, bucket]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await listUserFiles(bucket);
      
      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      // Transform storage files to document format
      const docs: Document[] = (data || []).map(file => ({
        id: file.id || file.name,
        name: file.name,
        path: file.name,
        type: file.metadata?.mimetype || 'unknown',
        size: file.metadata?.size || 0,
        uploadedAt: file.created_at || new Date().toISOString(),
        verified: false, // This would come from your verification system
        verificationNotes: undefined
      }));

      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (result: any) => {
    // Refresh document list
    loadDocuments();
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete ${document.name}?`)) {
      return;
    }

    try {
      const { error } = await deleteFile(bucket, document.path);
      
      if (error) {
        console.error('Error deleting file:', error);
        return;
      }

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleView = async (document: Document) => {
    try {
      const { data, error } = await getSignedUrl(bucket, document.path);
      
      if (error || !data) {
        console.error('Error getting signed URL:', error);
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const getDocumentIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-blue-600" />;
    }
    return <FileText className="w-6 h-6 text-red-600" />;
  };

  const getVerificationStatus = (document: Document) => {
    if (document.verified) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Verified</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-orange-600">
        <Clock className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">Pending Review</span>
      </div>
    );
  };

  const documentTypes = entityType === 'vehicle' 
    ? [
        { key: 'photo', label: 'Vehicle Photo', required: true },
        { key: 'license', label: 'Driving License', required: true },
        { key: 'insurance', label: 'Insurance Certificate', required: true },
        { key: 'mot', label: 'MOT Certificate', required: true }
      ]
    : [
        { key: 'dbs', label: 'DBS Check', required: true },
        { key: 'certification', label: 'Certifications', required: true },
        { key: 'id', label: 'Photo ID', required: true },
        { key: 'photo', label: 'Profile Photo', required: false }
      ];

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
          <h3 className="text-xl font-bold">
            {entityType === 'vehicle' ? 'Vehicle Documents' : 'Support Worker Documents'}
          </h3>
          <p className="text-blue-100 mt-1">
            Upload and manage your required documents for verification
          </p>
        </div>

        <div className="p-6">
          {/* Document Types */}
          <div className="grid gap-8">
            {documentTypes.map((docType) => {
              const userDocs = documents.filter(doc => 
                doc.path.includes(`/${docType.key}s/`)
              );

              return (
                <div key={docType.key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      {getDocumentIcon({ type: 'application/pdf' })}
                      <span className="ml-2">{docType.label}</span>
                      {docType.required && (
                        <span className="ml-2 text-red-500 text-sm">*</span>
                      )}
                    </h4>
                    <div className="text-sm text-gray-500">
                      {userDocs.length} uploaded
                    </div>
                  </div>

                  {/* Existing Documents */}
                  {userDocs.length > 0 && (
                    <div className="space-y-2">
                      {userDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {getDocumentIcon(doc.type)}
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-sm text-gray-500">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {getVerificationStatus(doc)}
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(doc)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {!doc.verified && (
                                <button
                                  onClick={() => handleDelete(doc)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Area */}
                  <FileUpload
                    bucket={bucket}
                    documentType={docType.key}
                    vehicleId={entityId}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={(error) => console.error('Upload error:', error)}
                    accept={docType.key === 'photo' ? 'image/*' : 'image/*,application/pdf'}
                  />
                </div>
              );
            })}
          </div>

          {/* Verification Status */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-3">Verification Process</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Documents are reviewed within 24-48 hours</p>
              <p>• You'll receive email notification when verification is complete</p>
              <p>• Verified documents cannot be deleted (contact support if needed)</p>
              <p>• All documents are securely encrypted and GDPR compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;