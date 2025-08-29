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

    // Create or get guest rider
    const { data: guestRider, error: guestRiderError } = await supabaseClient
      .from('guest_riders')
      .upsert({
        name: request.guest_name,
        email: request.guest_email,
        phone: request.guest_phone,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (guestRiderError) {
      console.error('Guest rider creation error:', guestRiderError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create guest rider' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create guest booking
    const { data: guestBooking, error: guestBookingError } = await supabaseClient
      .from('guest_bookings')
      .insert({
        guest_rider_id: guestRider.id,
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
      console.error('Guest booking creation error:', guestBookingError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create booking' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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
        console.error('Error creating stops:', stopsError)
        // Don't fail the booking for stops error
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
      console.error('Token creation error:', tokenError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create access token' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send confirmation email
    try {
      await supabaseClient.functions.invoke('send-booking-confirmation', {
        body: {
          booking_id: guestBooking.id,
          guest_email: request.guest_email,
          guest_name: request.guest_name,
          guest_phone: request.guest_phone,
          payment_method: request.booking_data.payment_method,
          access_token: accessToken,
          booking_details: guestBooking
        }
      })
    } catch (emailError) {
      console.error('Email sending failed (non-critical):', emailError)
      // Don't fail the booking for email errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: guestBooking.id,
        guest_rider_id: guestRider.id,
        access_token: accessToken,
        message: 'Booking created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Guest booking function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An unexpected error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
