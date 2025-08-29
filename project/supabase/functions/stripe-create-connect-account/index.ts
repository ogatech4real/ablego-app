import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

interface CreateAccountRequest {
  user_id: string;
  user_type: 'driver' | 'support_worker';
  email: string;
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

    // Verify user authentication
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

    const requestData: CreateAccountRequest = await req.json()

    // Validate request
    if (requestData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user profile for additional details
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, phone, address')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get user profile' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB',
      email: requestData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: requestData.email,
        first_name: profile.name?.split(' ')[0] || '',
        last_name: profile.name?.split(' ').slice(1).join(' ') || '',
        phone: profile.phone || undefined,
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily',
          },
        },
      },
      metadata: {
        user_id: requestData.user_id,
        user_type: requestData.user_type,
        platform: 'ablego'
      }
    })

    // Store Stripe account ID in database
    const tableName = requestData.user_type === 'driver' ? 'vehicles' : 'support_workers'
    const idField = requestData.user_type === 'driver' ? 'driver_id' : 'user_id'

    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq(idField, requestData.user_id)

    if (updateError) {
      // If update fails, try to delete the Stripe account
      try {
        await stripe.accounts.del(account.id)
      } catch (deleteError) {
        console.error('Failed to cleanup Stripe account:', deleteError)
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to save Stripe account' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${Deno.env.get('SITE_URL') || 'https://ablego.co.uk'}/dashboard/${requestData.user_type}?stripe_refresh=true`,
      return_url: `${Deno.env.get('SITE_URL') || 'https://ablego.co.uk'}/dashboard/${requestData.user_type}?stripe_success=true`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({
        account_id: account.id,
        onboarding_url: accountLink.url,
        message: 'Stripe Connect account created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Stripe Connect account creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})