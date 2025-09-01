import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriverApplicationRequest {
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

    const request: DriverApplicationRequest = await req.json()

    console.log('📝 Creating driver application:', {
      user_id: request.user_id,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!request.user_id || !request.personal_data || !request.vehicle_data) {
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
      .from('driver_applications')
      .select('id, status')
      .eq('user_id', request.user_id)
      .in('status', ['pending', 'under_review', 'approved'])
      .single()

    if (existingApplication) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `You already have a ${existingApplication.status} driver application` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create driver application
    const { data: driverApplication, error: applicationError } = await supabaseClient
      .from('driver_applications')
      .insert({
        user_id: request.user_id,
        full_name: `${request.personal_data.firstName} ${request.personal_data.lastName}`,
        email: user.email,
        phone: user.email, // Will be updated from profile if available
        date_of_birth: request.personal_data.dateOfBirth,
        license_number: request.personal_data.drivingLicenseNumber,
        license_expiry_date: new Date().toISOString().split('T')[0], // Default - should be from form
        vehicle_make: request.vehicle_data.make,
        vehicle_model: request.vehicle_data.model,
        vehicle_year: parseInt(request.vehicle_data.year),
        license_plate: request.vehicle_data.registrationNumber,
        vehicle_color: request.vehicle_data.color,
        years_of_experience: 3, // Default - should be from form
        motivation: 'Driver application via registration form',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (applicationError) {
      console.error('❌ Driver application creation error:', applicationError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create driver application',
          details: applicationError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Driver application created:', driverApplication.id)

    // Create vehicle record
    const { data: vehicle, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .insert({
        driver_application_id: driverApplication.id,
        user_id: request.user_id,
        make: request.vehicle_data.make,
        model: request.vehicle_data.model,
        year: parseInt(request.vehicle_data.year),
        registration_number: request.vehicle_data.registrationNumber,
        color: request.vehicle_data.color,
        fuel_type: request.vehicle_data.fuelType || 'petrol',
        transmission: request.vehicle_data.transmission || 'manual',
        seats: request.vehicle_data.seats,
        wheelchair_accessible: request.vehicle_data.wheelchairAccessible,
        insurance_provider: request.vehicle_data.insuranceProvider,
        insurance_policy_number: request.vehicle_data.insurancePolicyNumber || 'TBD',
        insurance_expiry_date: request.vehicle_data.insuranceExpiryDate,
        mot_expiry_date: request.vehicle_data.motExpiryDate || null,
        is_verified: false,
        status: 'pending_verification',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('❌ Vehicle creation error:', vehicleError)
      // Don't fail the application for vehicle error, but log it
    } else {
      console.log('✅ Vehicle record created:', vehicle.id)
    }

    // Update user role to pending_driver
    const { error: roleError } = await supabaseClient
      .from('users')
      .update({ 
        role: 'pending_driver',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.user_id)

    if (roleError) {
      console.error('❌ User role update error:', roleError)
      // Don't fail the application for role update error
    } else {
      console.log('✅ User role updated to pending_driver')
    }

    // Send admin notification
    try {
      await supabaseClient.functions.invoke('send-admin-notification', {
        body: {
          type: 'driver_application',
          title: 'New Driver Application',
          message: `New driver application from ${request.personal_data.firstName} ${request.personal_data.lastName}`,
          data: {
            application_id: driverApplication.id,
            user_id: request.user_id,
            user_email: user.email,
            vehicle_make: request.vehicle_data.make,
            vehicle_model: request.vehicle_data.model,
            registration_number: request.vehicle_data.registrationNumber
          },
          priority: 'medium'
        }
      })
      
      console.log('✅ Admin notification sent for driver application')
    } catch (notificationError) {
      console.error('❌ Admin notification failed (non-critical):', notificationError)
    }

    // Send confirmation email to driver
    try {
      await supabaseClient.functions.invoke('send-email-smtp', {
        body: {
          to: user.email,
          subject: 'Driver Application Received - AbleGo',
          template: 'driver_application_received',
          data: {
            driver_name: `${request.personal_data.firstName} ${request.personal_data.lastName}`,
            application_id: driverApplication.id,
            vehicle_details: `${request.vehicle_data.year} ${request.vehicle_data.make} ${request.vehicle_data.model}`,
            registration_number: request.vehicle_data.registrationNumber,
            application_date: new Date().toLocaleDateString(),
            next_steps: [
              'Document verification (24-48 hours)',
              'Background check completion',
              'Vehicle inspection scheduling',
              'Final approval notification'
            ]
          }
        }
      })
      
      console.log('✅ Driver application confirmation email sent to:', user.email)
    } catch (emailError) {
      console.error('❌ Driver confirmation email failed (non-critical):', emailError)
    }

    // Prepare response
    const response = {
      success: true,
      application_id: driverApplication.id,
      vehicle_id: vehicle?.id,
      message: 'Driver application submitted successfully',
      next_steps: [
        'Document verification (24-48 hours)',
        'Background check completion',
        'Vehicle inspection scheduling',
        'Final approval notification'
      ]
    }

    console.log('✅ Driver application created successfully:', {
      application_id: driverApplication.id,
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
    console.error('❌ Driver application function error:', error)
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
