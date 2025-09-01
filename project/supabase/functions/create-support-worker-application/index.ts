import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupportWorkerApplicationRequest {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const request: SupportWorkerApplicationRequest = await req.json()

    console.log('📝 Creating support worker application:', {
      user_id: request.user_id,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!request.user_id || !request.personal_data || !request.qualifications) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required application information' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user exists and is authenticated
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, role')
      .eq('id', request.user_id)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User not found or not authenticated' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already has a pending or approved application
    const { data: existingApplication, error: existingError } = await supabaseClient
      .from('support_worker_applications')
      .select('id, status')
      .eq('user_id', request.user_id)
      .in('status', ['pending', 'under_review', 'approved'])
      .single()

    if (existingApplication) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `You already have a ${existingApplication.status} support worker application` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create support worker application
    const { data: supportWorkerApplication, error: applicationError } = await supabaseClient
      .from('support_worker_applications')
      .insert({
        user_id: request.user_id,
        full_name: `${request.personal_data.firstName} ${request.personal_data.lastName}`,
        email: user.email,
        phone: request.personal_data.phone,
        date_of_birth: request.personal_data.dateOfBirth,
        address: request.personal_data.address,
        experience_years: 1, // Default - should be from form
        desired_hourly_rate: 18.50, // Default - should be from form
        specializations: request.qualifications.specializations,
        certifications: request.qualifications.certifications,
        languages: ['English'], // Default - should be from form
        bio: request.qualifications.experience,
        motivation: 'Support worker application via registration form',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('❌ Support worker application creation error:', applicationError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create support worker application',
          details: applicationError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Support worker application created:', supportWorkerApplication.id)

    // Create support worker record
    const { data: supportWorker, error: supportWorkerError } = await supabaseClient
      .from('support_workers')
      .insert({
        support_worker_application_id: supportWorkerApplication.id,
        user_id: request.user_id,
        full_name: `${request.personal_data.firstName} ${request.personal_data.lastName}`,
        phone: request.personal_data.phone,
        address: request.personal_data.address,
        certifications: request.qualifications.certifications,
        experience: request.qualifications.experience,
        specializations: request.qualifications.specializations,
        availability: request.qualifications.availability,
        preferred_hours: request.qualifications.preferredHours,
        is_verified: false,
        is_active: false,
        status: 'pending_verification',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (supportWorkerError) {
      console.error('❌ Support worker creation error:', supportWorkerError)
      // Don't fail the application for support worker error, but log it
    } else {
      console.log('✅ Support worker record created:', supportWorker.id)
    }

    // Update user role to pending_support_worker
    const { error: roleError } = await supabaseClient
      .from('users')
      .update({ 
        role: 'pending_support_worker',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.user_id)

    if (roleError) {
      console.error('❌ User role update error:', roleError)
      // Don't fail the application for role update error
    } else {
      console.log('✅ User role updated to pending_support_worker')
    }

    // Send admin notification
    try {
      await supabaseClient.functions.invoke('send-admin-notification', {
        body: {
          type: 'support_worker_application',
          title: 'New Support Worker Application',
          message: `New support worker application from ${request.personal_data.firstName} ${request.personal_data.lastName}`,
          data: {
            application_id: supportWorkerApplication.id,
            user_id: request.user_id,
            user_email: user.email,
            specializations: request.qualifications.specializations,
            experience: request.qualifications.experience,
            certifications: request.qualifications.certifications
          },
          priority: 'medium'
        }
      })
      
      console.log('✅ Admin notification sent for support worker application')
    } catch (notificationError) {
      console.error('❌ Admin notification failed (non-critical):', notificationError)
    }

    // Send confirmation email to support worker
    try {
      await supabaseClient.functions.invoke('send-email-smtp', {
        body: {
          to: user.email,
          subject: 'Support Worker Application Received - AbleGo',
          template: 'support_worker_application_received',
          data: {
            support_worker_name: `${request.personal_data.firstName} ${request.personal_data.lastName}`,
            application_id: supportWorkerApplication.id,
            specializations: request.qualifications.specializations.join(', '),
            experience: request.qualifications.experience,
            certifications: request.qualifications.certifications.join(', '),
            application_date: new Date().toLocaleDateString(),
            next_steps: [
              'Document verification (24-48 hours)',
              'Background check completion',
              'Training assessment',
              'Final approval notification'
            ]
          }
        }
      })
      
      console.log('✅ Support worker application confirmation email sent to:', user.email)
    } catch (emailError) {
      console.error('❌ Support worker confirmation email failed (non-critical):', emailError)
    }

    // Prepare response
    const response = {
      success: true,
      application_id: supportWorkerApplication.id,
      support_worker_id: supportWorker?.id,
      message: 'Support worker application submitted successfully',
      next_steps: [
        'Document verification (24-48 hours)',
        'Background check completion',
        'Training assessment',
        'Final approval notification'
      ]
    }

    console.log('✅ Support worker application created successfully:', {
      application_id: supportWorkerApplication.id,
      user_id: request.user_id,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Support worker application function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
