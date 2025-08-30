import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GuestBookingRequest {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  create_account?: boolean;
  password?: string;
  booking_data: {
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;
    pickup_postcode: string;
    pickup_place_id: string;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lng: number;
    dropoff_postcode: string;
    dropoff_place_id: string;
    stops: Array<{
      address: string;
      lat: number;
      lng: number;
      postcode: string;
      place_id: string;
    }>;
    pickup_time: string;
    dropoff_time?: string | null;
    vehicle_features: string[];
    support_workers_count: number;
    fare_estimate: number;
    booking_type: 'on_demand' | 'scheduled' | 'advance';
    lead_time_hours: number;
    time_multiplier: number;
    booking_type_discount: number;
    special_requirements?: string | null;
    notes?: string | null;
    payment_method: 'cash_bank' | 'stripe';
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

    const request: GuestBookingRequest = await req.json()

    console.log('📝 Creating guest booking:', {
      guest_email: request.guest_email,
      guest_name: request.guest_name,
      create_account: request.create_account,
      has_password: !!request.password,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!request.guest_name || !request.guest_email || !request.guest_phone) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required guest information' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!request.booking_data.pickup_address || !request.booking_data.dropoff_address) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required booking information' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user account creation is requested
    let userAccountResult = null;
    let userAccountStatus = 'none';

    if (request.create_account && request.password) {
      console.log('🔐 Handling user account creation for guest booking...')
      
      try {
        // Check if user already exists
        const { data: existingUser, error: userCheckError } = await supabaseClient
          .from('users')
          .select('id, email, role')
          .eq('email', request.guest_email)
          .single()

        if (existingUser) {
          // User already exists - link guest booking to existing account
          userAccountStatus = 'linked_existing';
          userAccountResult = {
            success: true,
            user_id: existingUser.id,
            account_status: 'linked',
            message: 'Linked to existing user account',
            action: 'linked_existing'
          };
          
          console.log('✅ Linked to existing user account:', existingUser.id)
        } else {
          // For now, just mark as pending - we'll handle account creation separately
          userAccountStatus = 'pending';
          userAccountResult = {
            success: true,
            account_status: 'pending',
            message: 'Account creation pending - will be processed separately',
            action: 'pending_creation'
          };
          console.log('⏳ User account creation marked as pending')
        }
      } catch (accountError) {
        console.error('❌ User account check error:', accountError)
        userAccountStatus = 'failed';
        userAccountResult = {
          success: false,
          error: accountError.message
        };
      }
    }

    // Create or get guest rider
    const { data: guestRider, error: guestRiderError } = await supabaseClient
      .from('guest_riders')
      .upsert({
        name: request.guest_name,
        email: request.guest_email,
        phone: request.guest_phone,
        linked_user_id: userAccountResult?.user_id || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (guestRiderError) {
      console.error('❌ Guest rider creation error:', guestRiderError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create guest rider',
          details: guestRiderError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Guest rider created/updated:', guestRider.id)

    // Create guest booking
    const { data: guestBooking, error: guestBookingError } = await supabaseClient
      .from('guest_bookings')
      .insert({
        guest_rider_id: guestRider.id,
        linked_user_id: userAccountResult?.user_id || null,
        pickup_address: request.booking_data.pickup_address,
        pickup_lat: request.booking_data.pickup_lat,
        pickup_lng: request.booking_data.pickup_lng,
        pickup_postcode: request.booking_data.pickup_postcode,
        pickup_place_id: request.booking_data.pickup_place_id,
        dropoff_address: request.booking_data.dropoff_address,
        dropoff_lat: request.booking_data.dropoff_lat,
        dropoff_lng: request.booking_data.dropoff_lng,
        dropoff_postcode: request.booking_data.dropoff_postcode,
        dropoff_place_id: request.booking_data.dropoff_place_id,
        pickup_time: request.booking_data.pickup_time,
        dropoff_time: request.booking_data.dropoff_time,
        vehicle_features: request.booking_data.vehicle_features,
        support_workers_count: request.booking_data.support_workers_count,
        fare_estimate: request.booking_data.fare_estimate,
        booking_type: request.booking_data.booking_type,
        lead_time_hours: request.booking_data.lead_time_hours,
        time_multiplier: request.booking_data.time_multiplier,
        booking_type_discount: request.booking_data.booking_type_discount,
        special_requirements: request.booking_data.special_requirements,
        notes: request.booking_data.notes,
        payment_method: request.booking_data.payment_method,
        status: 'pending'
      })
      .select()
      .single()

    if (guestBookingError) {
      console.error('❌ Guest booking creation error:', guestBookingError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create booking',
          details: guestBookingError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Guest booking created:', guestBooking.id)

    // Create stops if any
    if (request.booking_data.stops && request.booking_data.stops.length > 0) {
      const stopsData = request.booking_data.stops.map((stop, index) => ({
        booking_id: guestBooking.id,
        order_index: index + 1,
        stop_address: stop.address,
        latitude: stop.lat,
        longitude: stop.lng
      }))

      const { error: stopsError } = await supabaseClient
        .from('stops')
        .insert(stopsData)

      if (stopsError) {
        console.error('❌ Error creating stops:', stopsError)
        // Don't fail the booking for stops error
      } else {
        console.log('✅ Stops created successfully')
      }
    }

    // Generate access token
    const accessToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('booking_access_tokens')
      .insert({
        guest_booking_id: guestBooking.id,
        token: accessToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single()

    if (tokenError) {
      console.error('❌ Token creation error:', tokenError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create access token',
          details: tokenError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Access token created:', accessToken)

    // Send confirmation email
    try {
      const trackingUrl = `${Deno.env.get('SITE_URL') || 'https://ablegobefore.netlify.app'}/booking-status/${accessToken}`
      
      await supabaseClient.functions.invoke('send-booking-confirmation', {
        body: {
          booking_id: guestBooking.id,
          guest_email: request.guest_email,
          guest_name: request.guest_name,
          guest_phone: request.guest_phone,
          payment_method: request.booking_data.payment_method,
          access_token: accessToken,
          tracking_url: trackingUrl,
          user_account_created: userAccountResult?.success || false,
          user_account_status: userAccountStatus,
          booking_details: {
            pickup_address: guestBooking.pickup_address,
            dropoff_address: guestBooking.dropoff_address,
            pickup_time: guestBooking.pickup_time,
            fare_estimate: guestBooking.fare_estimate,
            support_workers_count: guestBooking.support_workers_count,
            vehicle_features: guestBooking.vehicle_features,
            special_requirements: guestBooking.special_requirements,
            booking_type: guestBooking.booking_type,
            lead_time_hours: guestBooking.lead_time_hours
          }
        }
      })
      
      console.log('✅ Booking confirmation email sent successfully to:', request.guest_email)
    } catch (emailError) {
      console.error('❌ Email sending failed (non-critical):', emailError)
      // Don't fail the booking for email errors
    }

    // Prepare response
    const response = {
      success: true,
      booking_id: guestBooking.id,
      guest_rider_id: guestRider.id,
      access_token: accessToken,
      message: 'Booking created successfully',
      user_account: userAccountResult
    }

    console.log('✅ Guest booking created successfully:', {
      booking_id: guestBooking.id,
      guest_rider_id: guestRider.id,
      user_account_status: userAccountStatus,
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
    console.error('❌ Guest booking function error:', error)
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
