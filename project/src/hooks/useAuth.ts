import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth, db, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: 'Database connection failed. Please check your environment variables in the .env file and restart the development server.'
          });
          return;
        }
        
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthState(prev => ({ 
            ...prev, 
            error: 'Unable to restore your session. Please sign in again.', 
            loading: false 
          }));
          return;
        }

        if (session?.user) {
          try {
            const { data: profile, error: profileError } = await db.getProfile(session.user.id);
            
            if (profileError) {
              console.error('Profile error:', profileError);
              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                error: 'Unable to load user profile. Please refresh the page.'
              });
              return;
            }

            if (!profile) {
              console.log('Profile not found, attempting to create...');
              
              // Try to create profile if it doesn't exist
              const { data: newProfile, error: createError } = await db.createProfile(session.user.id, {
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name,
                phone: session.user.user_metadata?.phone,
                role: session.user.user_metadata?.role || 'rider'
              });
              
              if (createError) {
                console.error('Profile creation error:', createError);
                setAuthState({
                  user: session.user,
                  profile: null,
                  session: session,
                  loading: false,
                  error: 'Unable to create user profile. Please contact support.'
                });
                return;
              }
              
              if (newProfile) {
                setAuthState({
                  user: session.user,
                  profile: newProfile,
                  session: session,
                  loading: false,
                  error: null
                });
                return;
              }
              
              // Wait a bit more and try again for database triggers
              await new Promise(resolve => setTimeout(resolve, 2000));
              const { data: retryProfile } = await db.getProfile(session.user.id);
              
              if (retryProfile) {
                setAuthState({
                  user: session.user,
                  profile: retryProfile,
                  session: session,
                  loading: false,
                  error: null
                });
                return;
              }
              

              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                error: 'Profile not found. Please contact support or try signing up again.'
              });
              return;
            }
          
            setAuthState({
              user: session.user,
              profile: profile,
              session: session,
              loading: false,
              error: null
            });
          } catch (error) {
            console.error('Profile fetch error:', error);
            setAuthState({
              user: session.user,
              profile: null,
              session: session,
              loading: false,
              error: 'Unable to load user profile. Please refresh the page.'
            });
          }
        } else {
          console.log('No session found, user signed out');
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Authentication error. Please try signing in again.'
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // For admin users, handle redirect immediately
        if (session.user.email === 'admin@ablego.co.uk') {
          console.log('Admin user signed in, setting minimal state and redirecting');
          
          // Set admin state immediately and stop further processing
          setAuthState({
            user: session.user,
            profile: { 
              id: session.user.id, 
              email: session.user.email, 
              name: 'AbleGo Admin',
              phone: null,
              address: null,
              date_of_birth: null,
              emergency_contact_name: null,
              emergency_contact_phone: null,
              medical_notes: null,
              accessibility_requirements: null,
              profile_image_url: null,
              is_verified: true,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              role: 'admin' 
            } as any,
            session: session,
            loading: false,
            error: null
          });
          
          // Don't redirect here - let the component handle it
          return;
        }
        
        try {
          const profile = await ensureProfileExists(session.user);
          setAuthState({
            user: session.user,
            profile: profile,
            session: session,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error handling sign in:', error);
          setAuthState({
            user: session.user,
            profile: null,
            session: session,
            loading: false,
            error: 'Unable to load user profile. Please refresh the page.'
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setAuthState(prev => ({
          ...prev,
          session: session,
          user: session.user
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (userData: {
    email: string;
    password: string;
    options?: {
      emailRedirectTo?: string;
      data?: {
        full_name?: string;
        phone?: string;
        role?: UserRole;
      };
    };
  }) => {
    try {
      // Clear any previous errors
      setAuthState(prev => ({ ...prev, error: null }));
      
      // Validate input - check the actual userData structure
      if (!userData.email?.trim() || !userData.password?.trim()) {
        const errorMsg = 'Please fill in all required fields.';
        setAuthState(prev => ({ ...prev, error: errorMsg }));
        return { data: null, error: { message: errorMsg } };
      }

      // Get full_name from options.data if present
      const fullName = userData.options?.data?.full_name;
      if (!fullName?.trim()) {
        const errorMsg = 'Please fill in all required fields.';
        setAuthState(prev => ({ ...prev, error: errorMsg }));
        return { data: null, error: { message: errorMsg } };
      }

      if (userData.password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters long.';
        setAuthState(prev => ({ ...prev, error: errorMsg }));
        return { data: null, error: { message: errorMsg } };
      }

      // Additional client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        const errorMsg = 'Please enter a valid email address.';
        setAuthState(prev => ({ ...prev, error: errorMsg }));
        return { data: null, error: { message: errorMsg } };
      }

      const { data, error } = await auth.signUp(userData);

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        return { data: null, error };
      }

      if (data.user) {
        console.log('SignUp successful in useAuth:', data);
        
        // Clear any previous errors on successful signup
        setAuthState(prev => ({ ...prev, error: null }));
        
        // With email confirmation enabled, always requires email confirmation
        return { 
          data: {
            ...data,
            needsEmailConfirmation: true,
            autoConfirmed: false
          }, 
          error: null 
        };
      }
      
      // Fallback case
      return { data, error: null };
    } catch (error) {
      console.error('SignUp exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Signup failed';
      setAuthState(prev => ({ ...prev, error: errorMsg }));
      return { data: null, error: { message: errorMsg } };
    }
  };

  const signUpLegacy = async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: UserRole;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      
      // Validate input
      if (!userData.email?.trim() || !userData.password?.trim() || !userData.full_name?.trim()) {
        setAuthState(prev => ({ 
          ...prev,
          error: 'Please fill in all required fields.'
        }));
        return { data: null, error: { message: 'Please fill in all required fields.' } };
      }

      if (userData.password.length < 6) {
        setAuthState(prev => ({ 
          ...prev,
          error: 'Password must be at least 6 characters long.'
        }));
        return { data: null, error: { message: 'Password must be at least 6 characters long.' } };
      }

      // Additional client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        setAuthState(prev => ({ 
          ...prev,
          error: 'Please enter a valid email address.'
        }));
        return { data: null, error: { message: 'Please enter a valid email address.' } };
      }

      const { data, error } = await auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role || 'rider'
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        return { data: null, error };
      }

      // If user was created and logged in, create role-specific records
      if (data.user && data.session) {
        try {
          // Create role-specific table entries
          if (userData.role === 'support_worker') {
            const { error: supportWorkerError } = await supabase
              .from('support_workers')
              .insert({
                user_id: data.user.id,
                bio: '',
                experience_years: 0,
                hourly_rate: 20.50,
                specializations: [],
                languages: ['English'],
                certifications: [],
                verified: false,
                is_active: true
              });
            
            if (supportWorkerError) {
              console.error('Error creating support worker record:', supportWorkerError);
            }
          }
          // Note: Vehicle records are created in the driver registration flow
          // since we need vehicle-specific information
        } catch (roleError) {
          console.error('Error creating role-specific records:', roleError);
          // Don't fail the signup for this, just log it
        }
      }
      // Clear any previous errors on successful signup
      setAuthState(prev => ({ ...prev, error: null }));

      return { data, error: null };
    } catch (error) {
      console.error('SignUp exception:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Signup failed' 
      }));
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Signup failed' }
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));

      // Validate input
      if (!email || !password) {
        setAuthState(prev => ({ ...prev, error: 'Please enter both email and password.' }));
        return { data: null, error: { message: 'Please enter both email and password.' } };
      }

      // Additional client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setAuthState(prev => ({ ...prev, error: 'Please enter a valid email address.' }));
        return { data: null, error: { message: 'Please enter a valid email address.' } };
      }

      const { data, error } = await auth.signIn(email, password);

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message }));
        return { data: null, error };
      }

      console.log('Sign in successful for:', email);
      
      // For admin users, do immediate redirect without waiting for profile
      if (email === 'admin@ablego.co.uk' && data?.user) {
        console.log('Admin user detected, redirecting immediately');
        setTimeout(() => {
          window.location.href = '/dashboard/admin';
        }, 100);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('SignIn exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState(prev => ({ ...prev, error: errorMsg }));
      return { 
        data: null, 
        error: { message: errorMsg }
      };
    }
  };

  const redirectToRoleDashboard = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'driver':
        return '/dashboard/driver';
      case 'support_worker':
        return '/dashboard/support';
      default:
        return '/dashboard/rider';
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, error: null }));
    
    const { error } = await auth.signOut();
    
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }));
      return { error };
    }

    setAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null
    });

    return { error: null };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) {
      setAuthState(prev => ({ ...prev, error: 'No authenticated user' }));
      return { data: null, error: { message: 'No authenticated user' } };
    }

    try {
      setAuthState(prev => ({ ...prev, error: null }));

      const { data, error } = await db.updateProfile(authState.user.id, updates);
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { data: null, error };
      }

      setAuthState(prev => ({ 
        ...prev, 
        profile: data,
        loading: false 
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Update profile exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Profile update failed';
      setAuthState(prev => ({ ...prev, error: errorMsg, loading: false }));
      return { data: null, error: { message: errorMsg } };
    }
  };

  const ensureProfileExists = async (user: User) => {
    try {
      // For admin users, create minimal profile immediately
      if (user.email === 'admin@ablego.co.uk') {
        return {
          id: user.id,
          email: user.email,
          name: 'AbleGo Admin',
          phone: null,
          address: null,
          date_of_birth: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          medical_notes: null,
          accessibility_requirements: null,
          profile_image_url: null,
          is_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile;
      }
      
      // First ensure user record exists in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          role: (user.user_metadata?.role as Database['public']['Enums']['user_role']) || 'rider',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (userError) {
        console.error('Error ensuring user record:', userError);
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await db.getProfile(user.id);
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return null;
      }

      if (!profile) {
        console.log('Profile not found, creating new profile...');
        
        // Get role from user metadata or default to rider
        const userRole = user.user_metadata?.role || 'rider';
        
        // Create profile
        const { data: newProfile, error: createError } = await db.createProfile(user.id, {
          email: user.email || '',
          name: user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
          role: userRole
        });
        
        if (createError) {
          console.error('Profile creation error:', createError);
          // Try one more time with just basic data
          const { data: retryProfile, error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || null,
              phone: user.user_metadata?.phone || null,
              is_verified: !!user.email_confirmed_at,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (retryError) {
            console.error('Profile retry creation error:', retryError);
            return null;
          }
          
          return retryProfile;
        }
        
        return newProfile;
      }
      
      return profile;
    } catch (error) {
      console.error('Ensure profile exists error:', error);
      return null;
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    ensureProfileExists,
    redirectToRoleDashboard,
    isAuthenticated: !!authState.user,
    isRider: authState.profile?.role === 'rider' || (!authState.profile && authState.user),
    isDriver: authState.profile?.role === 'driver',
    isSupportWorker: authState.profile?.role === 'support_worker',
    isAdmin: authState.profile?.role === 'admin' || authState.user?.email === 'admin@ablego.co.uk'
  };
};