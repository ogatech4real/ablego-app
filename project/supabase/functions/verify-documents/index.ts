import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  documentId: string;
  documentType: 'vehicle' | 'support_worker';
  entityId: string; // vehicleId or supportWorkerId
  verified: boolean;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'POST') {
      const verificationData: VerificationRequest = await req.json()

      if (verificationData.documentType === 'vehicle') {
        // Update vehicle verification status
        const { error: vehicleError } = await supabaseClient
          .from('vehicles')
          .update({
            verified: verificationData.verified,
            verification_notes: verificationData.notes,
            verified_at: verificationData.verified ? new Date().toISOString() : null,
            verified_by: verificationData.verified ? user.id : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationData.entityId)

        if (vehicleError) {
          return new Response(
            JSON.stringify({ error: vehicleError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Send notification to vehicle owner
        const { data: vehicle } = await supabaseClient
          .from('vehicles')
          .select('driver_id')
          .eq('id', verificationData.entityId)
          .single()

        if (vehicle) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: vehicle.driver_id,
              message: verificationData.verified 
                ? 'Your vehicle has been verified and is now active!'
                : 'Your vehicle verification requires attention. Please check your documents.',
              type: 'system',
              data: {
                vehicle_id: verificationData.entityId,
                verified: verificationData.verified,
                notes: verificationData.notes
              }
            })
        }
      } else if (verificationData.documentType === 'support_worker') {
        // Update support worker verification status
        const { error: supportError } = await supabaseClient
          .from('support_workers')
          .update({
            verified: verificationData.verified,
            verification_notes: verificationData.notes,
            verified_at: verificationData.verified ? new Date().toISOString() : null,
            verified_by: verificationData.verified ? user.id : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', verificationData.entityId)

        if (supportError) {
          return new Response(
            JSON.stringify({ error: supportError.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // Send notification to support worker
        const { data: supportWorker } = await supabaseClient
          .from('support_workers')
          .select('user_id')
          .eq('id', verificationData.entityId)
          .single()

        if (supportWorker) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: supportWorker.user_id,
              message: verificationData.verified 
                ? 'Your support worker profile has been verified! You can now accept bookings.'
                : 'Your support worker verification requires attention. Please check your documents.',
              type: 'system',
              data: {
                support_worker_id: verificationData.entityId,
                verified: verificationData.verified,
                notes: verificationData.notes
              }
            })
        }
      }

      return new Response(
        JSON.stringify({ message: 'Verification status updated successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const entityType = url.searchParams.get('entityType')
      const entityId = url.searchParams.get('entityId')

      if (!entityType || !entityId) {
        return new Response(
          JSON.stringify({ error: 'Missing entityType or entityId' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Get verification status and documents
      let verificationData
      if (entityType === 'vehicle') {
        const { data, error } = await supabaseClient
          .from('vehicles')
          .select('verified, verification_notes, verified_at, verified_by')
          .eq('id', entityId)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        verificationData = data
      } else if (entityType === 'support_worker') {
        const { data, error } = await supabaseClient
          .from('support_workers')
          .select('verified, verification_notes, verified_at, verified_by')
          .eq('id', entityId)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        verificationData = data
      }

      return new Response(
        JSON.stringify(verificationData),
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