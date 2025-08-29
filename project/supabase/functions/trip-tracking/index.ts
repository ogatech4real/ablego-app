import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationUpdate {
  tripId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
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

    if (req.method === 'POST') {
      const locationUpdate: LocationUpdate = await req.json()

      // Validate required fields
      if (!locationUpdate.tripId || !locationUpdate.lat || !locationUpdate.lng) {
        return new Response(
          JSON.stringify({ error: 'Missing required location data' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Verify user is the driver for this trip
      const { data: trip, error: tripError } = await supabaseClient
        .from('trips')
        .select('driver_id')
        .eq('id', locationUpdate.tripId)
        .single()

      if (tripError || trip.driver_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized to update this trip' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update trip location
      const { error: updateError } = await supabaseClient
        .from('trips')
        .update({
          live_location_lat: locationUpdate.lat,
          live_location_lng: locationUpdate.lng,
          last_location_update: new Date().toISOString()
        })
        .eq('id', locationUpdate.tripId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Insert tracking record
      const { error: trackingError } = await supabaseClient
        .from('trip_tracking')
        .insert({
          trip_id: locationUpdate.tripId,
          lat: locationUpdate.lat,
          lng: locationUpdate.lng,
          speed_mph: locationUpdate.speed || null,
          heading: locationUpdate.heading || null,
          accuracy_meters: locationUpdate.accuracy || null,
          timestamp: new Date().toISOString()
        })

      if (trackingError) {
        return new Response(
          JSON.stringify({ error: trackingError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Location updated successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const tripId = url.searchParams.get('tripId')

      if (!tripId) {
        return new Response(
          JSON.stringify({ error: 'Trip ID required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Get trip tracking data
      const { data: tracking, error: trackingError } = await supabaseClient
        .from('trip_tracking')
        .select('*')
        .eq('trip_id', tripId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (trackingError) {
        return new Response(
          JSON.stringify({ error: trackingError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ tracking }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
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