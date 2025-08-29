import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Image, Loader } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import type { StorageBucket } from '../services/storageService';

interface FileUploadProps {
  bucket: StorageBucket;
  documentType: string;
  vehicleId?: string;
  onUploadComplete?: (result: { url: string; path: string }) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  documentType,
  vehicleId,
  onUploadComplete,
  onUploadError,
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ url: string; path: string } | null>(null);

  const { 
    uploadVehicleDocument, 
    uploadSupportDocument, 
    uploadProgress, 
    validateFile,
    resetUploadProgress 
  } = useStorage();

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = validateFile(file, maxSizeMB);
    if (!validation.valid) {
      onUploadError?.(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    resetUploadProgress();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      let result;
      
      if (bucket === 'vehicle-docs' && vehicleId) {
        result = await uploadVehicleDocument(
          vehicleId,
          documentType as 'photo' | 'license' | 'insurance' | 'mot',
          selectedFile
        );
      } else if (bucket === 'support-ids') {
        result = await uploadSupportDocument(
          documentType as 'dbs' | 'certification' | 'id' | 'photo',
          selectedFile
        );
      } else {
        onUploadError?.('Invalid upload configuration');
        return;
      }

      if (result.error) {
        onUploadError?.(result.error.message);
        setUploadResult(null);
      } else {
        setUploadResult(result.data);
        onUploadComplete?.(result.data);
        setSelectedFile(null);
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadResult(null);
    resetUploadProgress();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-600" />;
    }
    return <FileText className="w-8 h-8 text-red-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploadProgress.error
            ? 'border-red-300 bg-red-50'
            : uploadResult
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`Upload ${documentType} document`}
        />

        {uploadProgress.uploading ? (
          <div className="space-y-4">
            <Loader className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{uploadProgress.progress}%</p>
            </div>
          </div>
        ) : uploadResult ? (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-green-800">Upload Successful!</p>
              <p className="text-sm text-green-600">Document uploaded and ready for verification</p>
            </div>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Another
            </button>
          </div>
        ) : selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {getFileIcon(selectedFile)}
              <div className="text-left">
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={clearSelection}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleUpload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Upload Document
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Upload {documentType.charAt(0).toUpperCase() + documentType.slice(1)} Document
              </p>
              <p className="text-gray-600">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports: JPEG, PNG, WebP, PDF (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}

        {uploadProgress.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{uploadProgress.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Document Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {bucket === 'vehicle-docs' && (
            <>
              {documentType === 'photo' && (
                <>
                  <li>• Clear photo showing vehicle exterior</li>
                  <li>• License plate must be visible</li>
                  <li>• Good lighting and resolution</li>
                </>
              )}
              {documentType === 'license' && (
                <>
                  <li>• Valid UK driving license</li>
                  <li>• All details must be clearly visible</li>
                  <li>• Not expired or suspended</li>
                </>
              )}
              {documentType === 'insurance' && (
                <>
                  <li>• Current insurance certificate</li>
                  <li>• Must cover commercial use</li>
                  <li>• Valid for at least 30 days</li>
                </>
              )}
              {documentType === 'mot' && (
                <>
                  <li>• Valid MOT certificate</li>
                  <li>• Vehicle must pass all safety checks</li>
                  <li>• Not expired</li>
                </>
              )}
            </>
          )}
          {bucket === 'support-ids' && (
            <>
              {documentType === 'dbs' && (
                <>
                  <li>• Enhanced DBS check certificate</li>
                  <li>• Issued within last 3 years</li>
                  <li>• Clear criminal record check</li>
                </>
              )}
              {documentType === 'certification' && (
                <>
                  <li>• First aid or relevant certification</li>
                  <li>• From recognized training provider</li>
                  <li>• Current and not expired</li>
                </>
              )}
              {documentType === 'id' && (
                <>
                  <li>• Government-issued photo ID</li>
                  <li>• Passport or driving license</li>
                  <li>• Clear and not expired</li>
                </>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;