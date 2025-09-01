import { supabase } from '../lib/supabase';

export interface SupportWorkerApplicationData {
  user_id: string;
  personal_data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    address: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalNotes?: string;
    accessibilityRequirements?: string[];
  };
  qualifications: {
    certifications: string[];
    experience: string;
    specializations: string[];
    availability: string[];
    preferredHours: string;
  };
  documents: {
    dbsCertificateUrl?: string;
    firstAidCertificateUrl?: string;
    trainingCertificatesUrl?: string[];
    referencesUrl?: string[];
  };
}

export interface SupportWorkerApplicationResult {
  success: boolean;
  application_id?: string;
  support_worker_id?: string;
  message?: string;
  error?: string;
  next_steps?: string[];
}

class SupportWorkerApplicationService {
  /**
   * Submit a support worker application
   */
  async submitApplication(applicationData: SupportWorkerApplicationData): Promise<SupportWorkerApplicationResult> {
    try {
      console.log('📝 Submitting support worker application:', {
        user_id: applicationData.user_id,
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      if (!this.validateApplicationData(applicationData)) {
        return {
          success: false,
          error: 'Missing required application information'
        };
      }

      // Call the Supabase function to create support worker application
      const { data, error } = await supabase.functions.invoke('create-support-worker-application', {
        body: applicationData
      });

      if (error) {
        console.error('❌ Support worker application error:', error);
        return {
          success: false,
          error: error.message || 'Failed to submit application'
        };
      }

      if (data && data.success) {
        console.log('✅ Support worker application submitted successfully:', {
          application_id: data.application_id,
          support_worker_id: data.support_worker_id
        });

        return {
          success: true,
          application_id: data.application_id,
          support_worker_id: data.support_worker_id,
          message: data.message || 'Application submitted successfully',
          next_steps: data.next_steps || [
            'Document verification (24-48 hours)',
            'Background check completion',
            'Training assessment',
            'Final approval notification'
          ]
        };
      } else {
        return {
          success: false,
          error: data?.message || 'Failed to submit application'
        };
      }
    } catch (error) {
      console.error('❌ Support worker application service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Validate application data
   */
  private validateApplicationData(data: SupportWorkerApplicationData): boolean {
    // Check required personal data
    if (!data.personal_data?.firstName || 
        !data.personal_data?.lastName || 
        !data.personal_data?.dateOfBirth || 
        !data.personal_data?.phone || 
        !data.personal_data?.address) {
      return false;
    }

    // Check required qualifications
    if (!data.qualifications?.certifications || 
        data.qualifications.certifications.length === 0 ||
        !data.qualifications?.experience || 
        !data.qualifications?.specializations || 
        data.qualifications.specializations.length === 0 ||
        !data.qualifications?.availability || 
        data.qualifications.availability.length === 0 ||
        !data.qualifications?.preferredHours) {
      return false;
    }

    // Validate date of birth (must be 18 or older)
    const dob = new Date(data.personal_data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      return false;
    }

    // Validate phone number (basic UK format)
    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
    if (!phoneRegex.test(data.personal_data.phone.replace(/\s/g, ''))) {
      return false;
    }

    return true;
  }

  /**
   * Get support worker application status
   */
  async getApplicationStatus(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('support_worker_applications')
        .select(`
          *,
          support_workers (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error fetching support worker application status:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all support worker applications (admin function)
   */
  async getAllApplications(limit = 50): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('support_worker_applications')
        .select(`
          *,
          users (email, role),
          support_workers (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Error fetching all support worker applications:', error);
      return { data: null, error };
    }
  }

  /**
   * Update application status (admin function)
   */
  async updateApplicationStatus(
    applicationId: string, 
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    notes?: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('support_worker_applications')
        .update({ 
          status, 
          notes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', applicationId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error updating support worker application status:', error);
      return { data: null, error };
    }
  }

  /**
   * Approve support worker application (admin function)
   */
  async approveApplication(
    applicationId: string, 
    notes?: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      // Update application status
      const { data: application, error: appError } = await this.updateApplicationStatus(
        applicationId, 
        'approved', 
        notes
      );

      if (appError) {
        return { data: null, error: appError };
      }

      // Update user role to support_worker
      if (application?.user_id) {
        const { error: roleError } = await supabase
          .from('users')
          .update({ 
            role: 'support_worker',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.user_id);

        if (roleError) {
          console.error('❌ Error updating user role:', roleError);
          // Don't fail the approval for role update error
        }
      }

      // Update support worker status
      if (application?.support_workers?.[0]?.id) {
        const { error: supportWorkerError } = await supabase
          .from('support_workers')
          .update({ 
            is_verified: true,
            is_active: true,
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.support_workers[0].id);

        if (supportWorkerError) {
          console.error('❌ Error updating support worker status:', supportWorkerError);
          // Don't fail the approval for support worker update error
        }
      }

      return { data: application, error: null };
    } catch (error) {
      console.error('❌ Error approving support worker application:', error);
      return { data: null, error };
    }
  }

  /**
   * Reject support worker application (admin function)
   */
  async rejectApplication(
    applicationId: string, 
    reason: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      // Update application status
      const { data: application, error: appError } = await this.updateApplicationStatus(
        applicationId, 
        'rejected', 
        reason
      );

      if (appError) {
        return { data: null, error: appError };
      }

      // Update user role back to rider
      if (application?.user_id) {
        const { error: roleError } = await supabase
          .from('users')
          .update({ 
            role: 'rider',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.user_id);

        if (roleError) {
          console.error('❌ Error updating user role:', roleError);
          // Don't fail the rejection for role update error
        }
      }

      return { data: application, error: null };
    } catch (error) {
      console.error('❌ Error rejecting support worker application:', error);
      return { data: null, error };
    }
  }

  /**
   * Get support worker by user ID
   */
  async getSupportWorkerByUserId(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('support_workers')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error fetching support worker by user ID:', error);
      return { data: null, error };
    }
  }

  /**
   * Update support worker availability
   */
  async updateAvailability(
    supportWorkerId: string,
    availability: string[],
    preferredHours: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('support_workers')
        .update({ 
          availability,
          preferred_hours: preferredHours,
          updated_at: new Date().toISOString() 
        })
        .eq('id', supportWorkerId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error updating support worker availability:', error);
      return { data: null, error };
    }
  }

  /**
   * Get available support workers for booking
   */
  async getAvailableSupportWorkers(
    requiredSpecializations: string[],
    bookingTime: string,
    location?: { lat: number; lng: number }
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      let query = supabase
        .from('support_workers')
        .select(`
          *,
          users (email, name),
          profiles (phone, address)
        `)
        .eq('is_verified', true)
        .eq('is_active', true)
        .eq('status', 'approved');

      // Filter by specializations if provided
      if (requiredSpecializations && requiredSpecializations.length > 0) {
        query = query.overlaps('specializations', requiredSpecializations);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error };
      }

      // Filter by availability (simplified - in production, you'd want more sophisticated logic)
      const availableWorkers = data?.filter(worker => {
        const workerAvailability = worker.availability || [];
        const bookingDate = new Date(bookingTime);
        const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        return workerAvailability.includes(dayOfWeek);
      }) || [];

      return { data: availableWorkers, error: null };
    } catch (error) {
      console.error('❌ Error fetching available support workers:', error);
      return { data: null, error };
    }
  }
}

export const supportWorkerApplicationService = new SupportWorkerApplicationService();
