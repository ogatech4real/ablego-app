import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  pickup: {
    address: string;
    postcode: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    address: string;
    postcode: string;
    lat: number;
    lng: number;
  };
  stops?: Array<{
    address: string;
    postcode: string;
    lat: number;
    lng: number;
  }>;
  scheduledPickupTime: string;
  estimatedDurationMinutes: number;
  estimatedDistanceMiles: number;
  vehicleFeatures: string[];
  supportWorkerCount: number;
  specialRequirements?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const bookingRequest: BookingRequest = await req.json()

    // Validate required fields
    if (!bookingRequest.pickup || !bookingRequest.dropoff || !bookingRequest.scheduledPickupTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required booking information' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calculate pricing
    const baseFare = 8.50
    const distanceCost = bookingRequest.estimatedDistanceMiles * 2.20
    const vehicleFeaturesCost = bookingRequest.vehicleFeatures.length * 5.00 // Simplified
    const supportWorkersCost = bookingRequest.supportWorkerCount * 18.50 * Math.ceil(bookingRequest.estimatedDurationMinutes / 60)
    
    const estimatedFare = baseFare + distanceCost + vehicleFeaturesCost + supportWorkersCost

    // Create booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        customer_id: user.id,
        pickup_address: bookingRequest.pickup.address,
        pickup_postcode: bookingRequest.pickup.postcode,
        pickup_lat: bookingRequest.pickup.lat,
        pickup_lng: bookingRequest.pickup.lng,
        dropoff_address: bookingRequest.dropoff.address,
        dropoff_postcode: bookingRequest.dropoff.postcode,
        dropoff_lat: bookingRequest.dropoff.lat,
        dropoff_lng: bookingRequest.dropoff.lng,
        stops: bookingRequest.stops || [],
        scheduled_pickup_time: bookingRequest.scheduledPickupTime,
        estimated_duration_minutes: bookingRequest.estimatedDurationMinutes,
        estimated_distance_miles: bookingRequest.estimatedDistanceMiles,
        vehicle_features: bookingRequest.vehicleFeatures,
        support_worker_count: bookingRequest.supportWorkerCount,
        special_requirements: bookingRequest.specialRequirements,
        estimated_fare_gbp: estimatedFare,
        notes: bookingRequest.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      return new Response(
        JSON.stringify({ error: bookingError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Find and notify nearby drivers
    const { data: nearbyVehicles } = await supabaseClient
      .from('vehicles')
      .select(`
        *,
        owner:profiles!vehicles_owner_id_fkey (
          id,
          full_name
        )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .not('current_location_lat', 'is', null)

    // Send notifications to nearby drivers
    if (nearbyVehicles) {
      for (const vehicle of nearbyVehicles) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: vehicle.owner_id,
            title: 'New Booking Available',
            message: `New booking from ${bookingRequest.pickup.address} to ${bookingRequest.dropoff.address}`,
            type: 'booking_request',
            data: {
              booking_id: booking.id,
              pickup_time: bookingRequest.scheduledPickupTime,
              estimated_fare: estimatedFare
            }
          })
      }
    }

    return new Response(
      JSON.stringify({
        booking,
        estimatedFare,
        message: 'Booking created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})