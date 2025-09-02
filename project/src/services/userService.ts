import { supabase, auth, db } from '../lib/supabase';
import { handleError, handleAuthError } from '../utils/errorHandler';
import { validateForm, formSchemas } from '../utils/validation';
import { sanitizeInput, validateEmail, validatePassword } from '../utils/security';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
type User = Database['public']['Tables']['users']['Row'];

export interface UserCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  address?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  accessibilityRequirements?: string;
}

export interface UserProfileData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  address?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  accessibilityRequirements?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  profile?: UserProfileData;
  error?: string;
  requiresVerification?: boolean;
}

export class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Create a new user account with full profile
   */
  async createUserAccount(userData: UserCreationData): Promise<AuthResult> {
    try {
      // Validate input data
      const validation = validateForm(userData, formSchemas.userRegistration);
      if (!validation.isValid) {
        return {
          success: false,
          error: Object.values(validation.errors).flat().join(', ')
        };
      }

      // Sanitize inputs
      const sanitizedData = {
        email: sanitizeInput(userData.email.toLowerCase()),
        password: userData.password,
        firstName: sanitizeInput(userData.firstName),
        lastName: sanitizeInput(userData.lastName),
        phone: userData.phone ? sanitizeInput(userData.phone) : undefined,
        role: userData.role || 'rider',
        address: userData.address ? sanitizeInput(userData.address) : undefined,
        dateOfBirth: userData.dateOfBirth,
        emergencyContactName: userData.emergencyContactName ? sanitizeInput(userData.emergencyContactName) : undefined,
        emergencyContactPhone: userData.emergencyContactPhone ? sanitizeInput(userData.emergencyContactPhone) : undefined,
        medicalNotes: userData.medicalNotes ? sanitizeInput(userData.medicalNotes) : undefined,
        accessibilityRequirements: userData.accessibilityRequirements ? sanitizeInput(userData.accessibilityRequirements) : undefined
      };

      // Validate email format
      const emailValidation = validateEmail(sanitizedData.email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.error || 'Invalid email format'
        };
      }

      // Validate password strength
      const passwordValidation = validatePassword(sanitizedData.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password does not meet requirements'
        };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(sanitizedData.email);
      if (existingUser.user) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: sanitizedData.email,
        password: sanitizedData.password,
        email_confirm: true,
        user_metadata: {
          full_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
          first_name: sanitizedData.firstName,
          last_name: sanitizedData.lastName,
          phone: sanitizedData.phone,
          role: sanitizedData.role
        }
      });

      if (authError || !authUser.user) {
        console.error('Auth user creation failed:', authError);
        return {
          success: false,
          error: authError?.message || 'Failed to create user account'
        };
      }

      // Create profile in public.profiles
      const profileData = {
        id: authUser.user.id,
        email: sanitizedData.email,
        name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
        phone: sanitizedData.phone,
        role: sanitizedData.role,
        address: sanitizedData.address,
        date_of_birth: sanitizedData.dateOfBirth,
        emergency_contact_name: sanitizedData.emergencyContactName,
        emergency_contact_phone: sanitizedData.emergencyContactPhone,
        medical_notes: sanitizedData.medicalNotes,
        accessibility_requirements: sanitizedData.accessibilityRequirements,
        profile_image_url: null,
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError || !profile) {
        console.error('Profile creation failed:', profileError);
        
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        
        return {
          success: false,
          error: profileError?.message || 'Failed to create user profile'
        };
      }

      // Create user record in public.users if needed
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: sanitizedData.email,
          role: sanitizedData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        console.warn('User record creation failed:', userError);
        // Don't fail the entire process for this
      }

      // Send welcome email
      await this.sendWelcomeEmail(sanitizedData.email, profileData.name);

      // Send admin notification
      await this.sendAdminNotification('new_user_registration', {
        user_id: authUser.user.id,
        email: sanitizedData.email,
        role: sanitizedData.role
      });

      return {
        success: true,
        user: authUser.user,
        profile: this.mapProfileToUserProfile(profile),
        requiresVerification: !authUser.user.email_confirmed_at
      };

    } catch (error) {
      console.error('User creation error:', error);
      return {
        success: false,
        error: handleError(error, 'User Creation').message
      };
    }
  }

  /**
   * Create user account during guest booking
   */
  async createUserFromGuestBooking(
    email: string, 
    password: string, 
    guestRiderId: string,
    guestBookingId: string
  ): Promise<AuthResult> {
    try {
      // Validate inputs
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.error || 'Invalid email format'
        };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.error || 'Password does not meet requirements'
        };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      if (existingUser.user) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }

      // Get guest rider data
      const { data: guestRider, error: guestError } = await supabase
        .from('guest_riders')
        .select('*')
        .eq('id', guestRiderId)
        .single();

      if (guestError || !guestRider) {
        return {
          success: false,
          error: 'Guest rider data not found'
        };
      }

      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: guestRider.full_name,
          first_name: guestRider.full_name.split(' ')[0],
          last_name: guestRider.full_name.split(' ').slice(1).join(' '),
          phone: guestRider.phone,
          role: 'rider'
        }
      });

      if (authError || !authUser.user) {
        console.error('Auth user creation failed:', authError);
        return {
          success: false,
          error: authError?.message || 'Failed to create user account'
        };
      }

      // Create profile
      const profileData = {
        id: authUser.user.id,
        email: email.toLowerCase(),
        name: guestRider.full_name,
        phone: guestRider.phone,
        role: 'rider' as UserRole,
        address: guestRider.address,
        date_of_birth: guestRider.date_of_birth,
        emergency_contact_name: guestRider.emergency_contact_name,
        emergency_contact_phone: guestRider.emergency_contact_phone,
        medical_notes: guestRider.medical_notes,
        accessibility_requirements: guestRider.accessibility_requirements,
        profile_image_url: null,
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError || !profile) {
        console.error('Profile creation failed:', profileError);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return {
          success: false,
          error: profileError?.message || 'Failed to create user profile'
        };
      }

      // Link guest booking to new user
      const { error: linkError } = await supabase
        .from('guest_bookings')
        .update({
          user_id: authUser.user.id,
          linked_at: new Date().toISOString()
        })
        .eq('id', guestBookingId);

      if (linkError) {
        console.warn('Failed to link guest booking:', linkError);
      }

      // Send welcome email
      await this.sendWelcomeEmail(email, guestRider.full_name);

      // Send admin notification
      await this.sendAdminNotification('guest_user_conversion', {
        user_id: authUser.user.id,
        email: email,
        guest_rider_id: guestRiderId,
        guest_booking_id: guestBookingId
      });

      return {
        success: true,
        user: authUser.user,
        profile: this.mapProfileToUserProfile(profile)
      };

    } catch (error) {
      console.error('Guest user creation error:', error);
      return {
        success: false,
        error: handleError(error, 'Guest User Creation').message
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signInUser(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Sign in failed'
        };
      }

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);
      if (!profile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      return {
        success: true,
        user: data.user,
        profile: profile,
        session: data.session
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: handleError(error, 'Sign In').message
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      return this.mapProfileToUserProfile(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfileData>): Promise<AuthResult> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !profile) {
        return {
          success: false,
          error: error?.message || 'Failed to update profile'
        };
      }

      return {
        success: true,
        profile: this.mapProfileToUserProfile(profile)
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: handleError(error, 'Profile Update').message
      };
    }
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete from public tables first
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.from('users').delete().eq('id', userId);

      // Delete from auth.users
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Auth user deletion failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      console.error('User deletion error:', error);
      return {
        success: false,
        error: handleError(error, 'User Deletion').message
      };
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await supabase.functions.invoke('unified-email-service', {
        body: {
          type: 'welcome_email',
          recipient_email: email,
          template_data: { name }
        }
      });
    } catch (error) {
      console.warn('Welcome email failed:', error);
    }
  }

  /**
   * Send admin notification
   */
  private async sendAdminNotification(type: string, data: any): Promise<void> {
    try {
      await supabase
        .from('admin_email_notifications')
        .insert({
          recipient_email: 'admin@ablego.co.uk',
          subject: `New ${type.replace(/_/g, ' ')}`,
          html_content: `<p>New ${type.replace(/_/g, ' ')}: ${JSON.stringify(data)}</p>`,
          email_type: type,
          email_status: 'queued',
          priority: 1,
          retry_count: 0,
          max_retries: 3
        });
    } catch (error) {
      console.warn('Admin notification failed:', error);
    }
  }

  /**
   * Map database profile to UserProfileData interface
   */
  private mapProfileToUserProfile(profile: any): UserProfileData {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      address: profile.address,
      dateOfBirth: profile.date_of_birth,
      emergencyContactName: profile.emergency_contact_name,
      emergencyContactPhone: profile.emergency_contact_phone,
      medicalNotes: profile.medical_notes,
      accessibilityRequirements: profile.accessibility_requirements,
      profileImageUrl: profile.profile_image_url,
      isVerified: profile.is_verified,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }
}

// Export singleton instance
export const userService = UserService.getInstance();

// Convenience functions
export const createUserAccount = (userData: UserCreationData) =>
  userService.createUserAccount(userData);

export const createUserFromGuestBooking = (email: string, password: string, guestRiderId: string, guestBookingId: string) =>
  userService.createUserFromGuestBooking(email, password, guestRiderId, guestBookingId);

export const signInUser = (email: string, password: string) =>
  userService.signInUser(email, password);

export const getUserProfile = (userId: string) =>
  userService.getUserProfile(userId);

export const updateUserProfile = (userId: string, updates: Partial<UserProfileData>) =>
  userService.updateUserProfile(userId, updates);

export const deleteUserAccount = (userId: string) =>
  userService.deleteUserAccount(userId);
