import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentIntentRequest {
  booking_id: string;
  amount: number; // in pence
  driver_account_id?: string;
  support_worker_account_ids?: string[];
  payment_breakdown?: {
    platformFee: number;
    driverShare: number;
    supportWorkerShare: number;
    stripeFee: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Stripe Create Payment Intent - Request received')
    
    // Check for Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY environment variable not set')
      return new Response(
        JSON.stringify({ 
          error: 'Payment system not configured. Please contact support.',
          code: 'STRIPE_KEY_MISSING'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const requestData: PaymentIntentRequest = await req.json()
    
    console.log('📋 Payment Intent Request:', {
      booking_id: requestData.booking_id,
      amount: requestData.amount,
      has_breakdown: !!requestData.payment_breakdown
    })

    // Validate request
    if (!requestData.booking_id || !requestData.amount) {
      console.error('❌ Missing required fields:', {
        has_booking_id: !!requestData.booking_id,
        has_amount: !!requestData.amount
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('guest_bookings')
      .select(`
        *,
        guest_rider:guest_riders (
          name,
          email,
          phone
        )
      `)
      .eq('id', requestData.booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', {
        booking_id: requestData.booking_id,
        error: bookingError?.message
      })
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ Booking found:', {
      id: booking.id,
      customer: booking.guest_rider?.name,
      amount: booking.fare_estimate
    })

    // Calculate transfers for Stripe Connect
    const transfers: Stripe.PaymentIntentCreateParams.TransferData[] = []
    
    if (requestData.driver_account_id && requestData.payment_breakdown?.driverShare && requestData.payment_breakdown.driverShare > 0) {
      transfers.push({
        destination: requestData.driver_account_id,
        amount: Math.round(requestData.payment_breakdown.driverShare * 100), // Convert to pence
      })
    }

    // Add support worker transfers
    if (requestData.support_worker_account_ids && requestData.payment_breakdown?.supportWorkerShare && requestData.payment_breakdown.supportWorkerShare > 0) {
      const supportWorkerCount = requestData.support_worker_account_ids.length
      const sharePerWorker = Math.round((requestData.payment_breakdown.supportWorkerShare / supportWorkerCount) * 100)
      
      requestData.support_worker_account_ids.forEach(accountId => {
        transfers.push({
          destination: accountId,
          amount: sharePerWorker,
        })
      })
    }

    console.log('💳 Creating Stripe Payment Intent:', {
      amount: requestData.amount,
      currency: 'gbp',
      transfers_count: transfers.length,
      customer_email: booking.guest_rider?.email
    })

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: requestData.amount,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: requestData.booking_id,
        customer_name: booking.guest_rider?.name || 'Guest',
        customer_email: booking.guest_rider?.email || '',
        customer_phone: booking.guest_rider?.phone || '',
        pickup_address: booking.pickup_address,
        dropoff_address: booking.dropoff_address,
        platform: 'ablego',
        booking_type: booking.booking_type || 'guest',
        support_workers: booking.support_workers_count?.toString() || '0'
      },
      description: `AbleGo ride from ${booking.pickup_address} to ${booking.dropoff_address}`,
      receipt_email: booking.guest_rider?.email || undefined,
      setup_future_usage: undefined, // Don't save payment methods for guests
    }

    // Add transfer data if available
    if (transfers.length > 0) {
      paymentIntentParams.transfer_data = transfers[0]
      // Note: For multiple transfers, we'll handle them in the webhook
      paymentIntentParams.application_fee_amount = Math.round((requestData.payment_breakdown?.platformFee || 0) * 100)
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    console.log('✅ Payment Intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      client_secret_exists: !!paymentIntent.client_secret
    })

    // Store payment intent in database
    const { error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        booking_id: requestData.booking_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_gbp: requestData.amount / 100,
        currency: 'GBP',
        status: 'pending',
        payment_method: 'card',
        platform_fee_gbp: requestData.payment_breakdown?.platformFee || null,
        driver_payout_gbp: requestData.payment_breakdown?.driverShare || null,
        support_worker_payout_gbp: requestData.payment_breakdown?.supportWorkerShare || null,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('⚠️ Failed to store payment transaction:', transactionError.message)
      // Don't fail the payment intent creation for this
    } else {
      console.log('✅ Payment transaction stored in database')
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: requestData.amount,
        currency: 'gbp',
        booking_id: requestData.booking_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Payment intent creation error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Payment setup failed'
    if (error instanceof Error) {
      if (error.message.includes('Invalid API Key')) {
        errorMessage = 'Payment system configuration error. Please contact support.'
      } else if (error.message.includes('amount')) {
        errorMessage = 'Invalid payment amount. Please refresh and try again.'
      } else {
        errorMessage = error.message
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})