import { useState } from 'react';
import { storageService, type StorageBucket, type FileUploadResult } from '../services/storageService';
import { useAuth } from './useAuth';

interface UploadProgress {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const useStorage = () => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploading: false,
    progress: 0,
    error: null
  });

  const uploadVehicleDocument = async (
    vehicleId: string,
    documentType: 'photo' | 'license' | 'insurance' | 'mot',
    file: File
  ): Promise<FileUploadResult> => {
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    // Validate file
    const validation = storageService.validateFile(file);
    if (!validation.valid) {
      return {
        data: null,
        error: { message: validation.error || 'Invalid file' }
      };
    }

    setUploadProgress({
      uploading: true,
      progress: 0,
      error: null
    });

    try {
      // Simulate upload progress (in real implementation, you'd track actual progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await storageService.uploadVehicleDocument(
        user.id,
        vehicleId,
        documentType,
        file
      );

      clearInterval(progressInterval);

      setUploadProgress({
        uploading: false,
        progress: result.error ? 0 : 100,
        error: result.error?.message || null
      });

      return result;
    } catch (error) {
      setUploadProgress({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      return {
        data: null,
        error: { message: 'Upload failed' }
      };
    }
  };

  const uploadSupportDocument = async (
    documentType: 'dbs' | 'certification' | 'id' | 'photo',
    file: File
  ): Promise<FileUploadResult> => {
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    // Validate file
    const validation = storageService.validateFile(file);
    if (!validation.valid) {
      return {
        data: null,
        error: { message: validation.error || 'Invalid file' }
      };
    }

    setUploadProgress({
      uploading: true,
      progress: 0,
      error: null
    });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await storageService.uploadSupportDocument(
        user.id,
        documentType,
        file
      );

      clearInterval(progressInterval);

      setUploadProgress({
        uploading: false,
        progress: result.error ? 0 : 100,
        error: result.error?.message || null
      });

      return result;
    } catch (error) {
      setUploadProgress({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      });

      return {
        data: null,
        error: { message: 'Upload failed' }
      };
    }
  };

  const getSignedUrl = async (bucket: StorageBucket, path: string, expiresIn = 3600) => {
    return storageService.getSignedUrl(bucket, path, expiresIn);
  };

  const deleteFile = async (bucket: StorageBucket, path: string) => {
    setUploadProgress({
      uploading: false,
      progress: 0,
      error: null
    });

    return storageService.deleteFile(bucket, path);
  };

  const listUserFiles = async (bucket: StorageBucket, folder?: string) => {
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    return storageService.listUserFiles(bucket, user.id, folder);
  };

  const resetUploadProgress = () => {
    setUploadProgress({
      uploading: false,
      progress: 0,
      error: null
    });
  };

  return {
    uploadVehicleDocument,
    uploadSupportDocument,
    getSignedUrl,
    deleteFile,
    listUserFiles,
    uploadProgress,
    resetUploadProgress,
    getPublicUrl: storageService.getPublicUrl.bind(storageService),
    validateFile: storageService.validateFile.bind(storageService)
  };
};