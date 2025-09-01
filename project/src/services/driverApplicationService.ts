import { supabase } from '../lib/supabase';

export interface DriverApplicationData {
  user_id: string;
  personal_data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    drivingLicenseNumber: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  vehicle_data: {
    make: string;
    model: string;
    year: string;
    registrationNumber: string;
    color: string;
    fuelType: string;
    transmission: string;
    seats: number;
    wheelchairAccessible: boolean;
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiryDate: string;
    motExpiryDate?: string;
  };
  documents: {
    drivingLicenseUrl?: string;
    insuranceCertificateUrl?: string;
    motCertificateUrl?: string;
    vehicleRegistrationUrl?: string;
  };
}

export interface DriverApplicationResult {
  success: boolean;
  application_id?: string;
  vehicle_id?: string;
  message?: string;
  error?: string;
  next_steps?: string[];
}

class DriverApplicationService {
  /**
   * Submit a driver application
   */
  async submitApplication(applicationData: DriverApplicationData): Promise<DriverApplicationResult> {
    try {
      console.log('📝 Submitting driver application:', {
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

      // Call the Supabase function to create driver application
      const { data, error } = await supabase.functions.invoke('create-driver-application', {
        body: applicationData
      });

      if (error) {
        console.error('❌ Driver application error:', error);
        return {
          success: false,
          error: error.message || 'Failed to submit application'
        };
      }

      if (data && data.success) {
        console.log('✅ Driver application submitted successfully:', {
          application_id: data.application_id,
          vehicle_id: data.vehicle_id
        });

        return {
          success: true,
          application_id: data.application_id,
          vehicle_id: data.vehicle_id,
          message: data.message || 'Application submitted successfully',
          next_steps: data.next_steps || [
            'Document verification (24-48 hours)',
            'Background check completion',
            'Vehicle inspection scheduling',
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
      console.error('❌ Driver application service error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Validate application data
   */
  private validateApplicationData(data: DriverApplicationData): boolean {
    // Check required personal data
    if (!data.personal_data?.firstName || 
        !data.personal_data?.lastName || 
        !data.personal_data?.dateOfBirth || 
        !data.personal_data?.drivingLicenseNumber) {
      return false;
    }

    // Check required vehicle data
    if (!data.vehicle_data?.make || 
        !data.vehicle_data?.model || 
        !data.vehicle_data?.year || 
        !data.vehicle_data?.registrationNumber || 
        !data.vehicle_data?.color || 
        !data.vehicle_data?.fuelType || 
        !data.vehicle_data?.transmission || 
        !data.vehicle_data?.seats || 
        !data.vehicle_data?.insuranceProvider || 
        !data.vehicle_data?.insurancePolicyNumber || 
        !data.vehicle_data?.insuranceExpiryDate) {
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

    // Validate vehicle year (must be reasonable)
    const vehicleYear = parseInt(data.vehicle_data.year);
    const currentYear = new Date().getFullYear();
    if (vehicleYear < 1900 || vehicleYear > currentYear + 1) {
      return false;
    }

    // Validate seats (must be reasonable for passenger vehicle)
    if (data.vehicle_data.seats < 2 || data.vehicle_data.seats > 16) {
      return false;
    }

    return true;
  }

  /**
   * Get driver application status
   */
  async getApplicationStatus(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      console.error('❌ Error fetching driver application status:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all driver applications (admin function)
   */
  async getAllApplications(limit = 50): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select(`
          *,
          users (email, role),
          vehicles (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      console.error('❌ Error fetching all driver applications:', error);
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
        .from('driver_applications')
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
      console.error('❌ Error updating driver application status:', error);
      return { data: null, error };
    }
  }

  /**
   * Approve driver application (admin function)
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

      // Update user role to driver
      if (application?.user_id) {
        const { error: roleError } = await supabase
          .from('users')
          .update({ 
            role: 'driver',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.user_id);

        if (roleError) {
          console.error('❌ Error updating user role:', roleError);
          // Don't fail the approval for role update error
        }
      }

      // Update vehicle status
      if (application?.vehicles?.[0]?.id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ 
            is_verified: true,
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.vehicles[0].id);

        if (vehicleError) {
          console.error('❌ Error updating vehicle status:', vehicleError);
          // Don't fail the approval for vehicle update error
        }
      }

      return { data: application, error: null };
    } catch (error) {
      console.error('❌ Error approving driver application:', error);
      return { data: null, error };
    }
  }

  /**
   * Reject driver application (admin function)
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
      console.error('❌ Error rejecting driver application:', error);
      return { data: null, error };
    }
  }
}

export const driverApplicationService = new DriverApplicationService();
