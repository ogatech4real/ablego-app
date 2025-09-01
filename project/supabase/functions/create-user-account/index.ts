import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserAccountRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  guest_rider_id?: string;
  guest_booking_id?: string;
  role?: 'rider' | 'driver' | 'support_worker';
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

    const request: CreateUserAccountRequest = await req.json()

    console.log('🔐 Creating user account:', {
      email: request.email,
      role: request.role || 'rider',
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!request.email || !request.password || !request.name || !request.phone) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required account information' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id, email, role')
      .eq('email', request.email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User account already exists with this email',
          user_id: existingUser.id,
          action: 'login_required'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create authenticated user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: request.email,
      password: request.password,
      email_confirm: true,
      user_metadata: {
        name: request.name,
        phone: request.phone,
        role: request.role || 'rider'
      }
    })

    if (authError) {
      console.error('❌ Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create authenticated user',
          details: authError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Create user record in users table
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: request.email,
        role: request.role || 'rider',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ User record creation error:', userError)
      // Try to clean up auth user if user record creation fails
      try {
        await supabaseClient.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create user record',
          details: userError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ User record created:', user.id)

    // Create profile record
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: user.id,
        email: request.email,
        name: request.name,
        phone: request.phone,
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      // Don't fail the account creation for profile error, but log it
    } else {
      console.log('✅ Profile created:', profile.id)
    }

    // Link guest rider if provided
    if (request.guest_rider_id) {
      const { error: guestLinkError } = await supabaseClient
        .from('guest_riders')
        .update({
          linked_user_id: user.id,
          account_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.guest_rider_id)

      if (guestLinkError) {
        console.error('❌ Guest rider linking error:', guestLinkError)
      } else {
        console.log('✅ Guest rider linked to user account')
      }
    }

    // Link guest booking if provided
    if (request.guest_booking_id) {
      const { error: bookingLinkError } = await supabaseClient
        .from('guest_bookings')
        .update({
          linked_user_id: user.id,
          account_linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.guest_booking_id)

      if (bookingLinkError) {
        console.error('❌ Guest booking linking error:', bookingLinkError)
      } else {
        console.log('✅ Guest booking linked to user account')
      }
    }

    // Send welcome email
    try {
      await supabaseClient.functions.invoke('send-email-smtp', {
        body: {
          to: request.email,
          subject: 'Welcome to AbleGo - Your Account is Ready!',
          template: 'welcome_new_user',
          data: {
            user_name: request.name,
            user_email: request.email,
            account_role: request.role || 'rider',
            welcome_message: `Welcome to AbleGo! Your ${request.role || 'rider'} account has been created successfully.`,
            next_steps: [
              'Complete your profile',
              'Browse available services',
              'Make your first booking',
              'Download our mobile app'
            ],
            support_contact: {
              phone: '01642 089 958',
              email: 'hello@ablego.co.uk'
            }
          }
        }
      })
      
      console.log('✅ Welcome email sent to:', request.email)
    } catch (emailError) {
      console.error('❌ Welcome email failed (non-critical):', emailError)
    }

    // Send admin notification for new user
    try {
      await supabaseClient.functions.invoke('send-admin-notification', {
        body: {
          type: 'new_user_registration',
          title: 'New User Registration',
          message: `New ${request.role || 'rider'} account created: ${request.name} (${request.email})`,
          data: {
            user_id: user.id,
            user_email: request.email,
            user_name: request.name,
            user_role: request.role || 'rider',
            guest_rider_linked: !!request.guest_rider_id,
            guest_booking_linked: !!request.guest_booking_id
          },
          priority: 'low'
        }
      })
      
      console.log('✅ Admin notification sent for new user')
    } catch (notificationError) {
      console.error('❌ Admin notification failed (non-critical):', notificationError)
    }

    // Prepare response
    const response = {
      success: true,
      user_id: user.id,
      email: request.email,
      role: request.role || 'rider',
      message: 'User account created successfully',
      guest_rider_linked: !!request.guest_rider_id,
      guest_booking_linked: !!request.guest_booking_id,
      next_steps: [
        'Complete your profile',
        'Browse available services',
        'Make your first booking'
      ]
    }

    console.log('✅ User account created successfully:', {
      user_id: user.id,
      email: request.email,
      role: request.role || 'rider',
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
    console.error('❌ User account creation function error:', error)
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
