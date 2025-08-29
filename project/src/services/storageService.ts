import { supabase } from '../lib/supabase';

export type StorageBucket = 'vehicle-docs' | 'support-ids';

export interface FileUploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  upsert?: boolean;
}

export interface FileUploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl?: string;
  } | null;
  error: unknown;
}

class StorageService {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile({ bucket, path, file, upsert = false }: FileUploadOptions): Promise<FileUploadResult> {
    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return {
          data: null,
          error: { message: 'File size must be less than 10MB' }
        };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return {
          data: null,
          error: { message: 'File type not allowed. Please use JPEG, PNG, WebP, or PDF' }
        };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert
        });

      if (error) {
        return { data: null, error };
      }

      const fullPath = `${bucket}/${data.path}`;
      let publicUrl: string | undefined;

      // Get public URL for vehicle photos if they're verified
      if (bucket === 'vehicle-docs' && path.includes('/photos/')) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        publicUrl = urlData.publicUrl;
      }

      return {
        data: {
          path: data.path,
          fullPath,
          publicUrl
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : { message: 'Unknown error' }
      };
    }
  }

  /**
   * Upload vehicle document
   */
  async uploadVehicleDocument(
    userId: string,
    vehicleId: string,
    documentType: 'photo' | 'license' | 'insurance' | 'mot',
    file: File
  ): Promise<FileUploadResult> {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const path = `${userId}/${documentType}s/${vehicleId}_${timestamp}.${fileExt}`;

    return this.uploadFile({
      bucket: 'vehicle-docs',
      path,
      file,
      upsert: true
    });
  }

  /**
   * Upload support worker ID document
   */
  async uploadSupportDocument(
    userId: string,
    documentType: 'dbs' | 'certification' | 'id' | 'photo',
    file: File
  ): Promise<FileUploadResult> {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const path = `${userId}/${documentType}s/${documentType}_${timestamp}.${fileExt}`;

    return this.uploadFile({
      bucket: 'support-ids',
      path,
      file,
      upsert: true
    });
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Get public URL for verified vehicle photos
   */
  getPublicUrl(bucket: StorageBucket, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Delete a file
   */
  async deleteFile(bucket: StorageBucket, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : { message: 'Unknown error' }
      };
    }
  }

  /**
   * List files in a user's folder
   */
  async listUserFiles(bucket: StorageBucket, userId: string, folder?: string) {
    try {
      const path = folder ? `${userId}/${folder}` : userId;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(bucket: StorageBucket, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', {
          search: path
        });

      if (error || !data || data.length === 0) {
        return { data: null, error: error || { message: 'File not found' } };
      }

      return { data: data[0], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : { message: 'Unknown error' }
      };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB = 10): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed. Please use JPEG, PNG, WebP, or PDF'
      };
    }

    return { valid: true };
  }

  /**
   * Generate file path for organized storage
   */
  generateFilePath(
    userId: string,
    category: string,
    filename: string,
    entityId?: string
  ): string {
    const timestamp = Date.now();
    const fileExt = filename.split('.').pop();
    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    if (entityId) {
      return `${userId}/${category}/${entityId}_${baseName}_${timestamp}.${fileExt}`;
    }
    
    return `${userId}/${category}/${baseName}_${timestamp}.${fileExt}`;
  }
}

export const storageService = new StorageService();