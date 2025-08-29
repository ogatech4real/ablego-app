import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log('Stripe webhook received:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabaseClient, event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabaseClient, event.data.object as Stripe.PaymentIntent)
        break
      
      case 'account.updated':
        await handleAccountUpdate(supabaseClient, event.data.object as Stripe.Account)
        break
      
      case 'transfer.created':
        await handleTransferCreated(supabaseClient, event.data.object as Stripe.Transfer)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handlePaymentSuccess(
  supabaseClient: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const bookingId = paymentIntent.metadata.booking_id

    if (!bookingId) {
      console.error('No booking ID in payment intent metadata')
      return
    }

    console.log('Processing successful payment for booking:', bookingId)

    // Update payment transaction
    await supabaseClient
      .from('payment_transactions')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        transaction_fee: (paymentIntent.application_fee_amount || 0) / 100,
        net_amount: (paymentIntent.amount - (paymentIntent.application_fee_amount || 0)) / 100
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('guest_bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select(`
        *,
        guest_rider:guest_riders (
          name,
          email,
          phone
        )
      `)
      .single()

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return
    }

    // Send payment receipt email using new system
    console.log('📧 Sending payment receipt email...')
    const { error: receiptError } = await supabaseClient.rpc('send_payment_receipt', {
      p_booking_id: bookingId,
      p_payment_amount: paymentIntent.amount / 100,
      p_payment_method: 'card'
    })

    if (receiptError) {
      console.error('Failed to queue payment receipt email:', receiptError)
    } else {
      console.log('✅ Payment receipt email queued successfully')
    }

    // Create additional transfers for multiple support workers if needed
    if (paymentIntent.metadata.support_worker_accounts) {
      const supportWorkerAccounts = JSON.parse(paymentIntent.metadata.support_worker_accounts)
      const supportWorkerShare = parseFloat(paymentIntent.metadata.support_worker_share || '0')
      
      if (supportWorkerAccounts.length > 1) {
        const sharePerWorker = Math.round((supportWorkerShare / supportWorkerAccounts.length) * 100)
        
        // Create additional transfers (skip first one as it's already in payment intent)
        for (let i = 1; i < supportWorkerAccounts.length; i++) {
          await stripe.transfers.create({
            amount: sharePerWorker,
            currency: 'gbp',
            destination: supportWorkerAccounts[i],
            metadata: {
              booking_id: bookingId,
              worker_index: i.toString(),
              type: 'support_worker_payment'
            }
          })
        }
      }
    }

    // Trigger driver assignment and notifications
    await triggerDriverAssignment(supabaseClient, updatedBooking)

    console.log('Payment processing completed for booking:', bookingId)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(
  supabaseClient: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const bookingId = paymentIntent.metadata.booking_id

    if (!bookingId) {
      console.error('No booking ID in payment intent metadata')
      return
    }

    console.log('Processing failed payment for booking:', bookingId)

    // Update payment transaction
    await supabaseClient
      .from('payment_transactions')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    // Send payment failure notification
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: paymentIntent.metadata.customer_email || 'unknown@example.com',
        subject: 'Payment Failed - AbleGo Booking',
        html_content: `
          <h2>Payment Failed</h2>
          <p>Unfortunately, your payment for booking ${bookingId} could not be processed.</p>
          <p>Please try again or contact our support team at admin@ablego.co.uk</p>
          <p>Booking Reference: ${bookingId.slice(0, 8).toUpperCase()}</p>
        `,
        booking_id: bookingId,
        notification_type: 'payment_failed',
        sent: false
      })

    console.log('Payment failure processed for booking:', bookingId)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleAccountUpdate(
  supabaseClient: ReturnType<typeof createClient>,
  account: Stripe.Account
) {
  try {
    const userId = account.metadata?.user_id
    const userType = account.metadata?.user_type

    if (!userId || !userType) {
      console.log('No user metadata in account update')
      return
    }

    // Determine account status
    let status = 'pending'
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'complete'
    } else if (account.requirements?.currently_due?.length === 0) {
      status = 'complete'
    }

    // Update database
    const tableName = userType === 'driver' ? 'vehicles' : 'support_workers'
    const idField = userType === 'driver' ? 'driver_id' : 'user_id'

    await supabaseClient
      .from(tableName)
      .update({
        stripe_account_status: status,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString()
      })
      .eq(idField, userId)

    // Send notification if account is now complete
    if (status === 'complete') {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          message: `Your payment account is now set up! You can start receiving payments from ${userType === 'driver' ? 'rides' : 'support assignments'}.`,
          type: 'system',
          data: {
            stripe_account_id: account.id,
            account_status: status
          }
        })
    }

    console.log('Account status updated:', { userId, userType, status })

  } catch (error) {
    console.error('Error handling account update:', error)
  }
}

async function handleTransferCreated(
  supabaseClient: ReturnType<typeof createClient>,
  transfer: Stripe.Transfer
) {
  try {
    const bookingId = transfer.metadata?.booking_id

    if (!bookingId) {
      return
    }

    // Log transfer for tracking
    console.log('Transfer created:', {
      booking_id: bookingId,
      destination: transfer.destination,
      amount: transfer.amount / 100,
      type: transfer.metadata?.type || 'unknown'
    })

    // You could store transfer details in a separate table for detailed tracking
    // await supabaseClient.from('payment_transfers').insert({...})

  } catch (error) {
    console.error('Error handling transfer creation:', error)
  }
}

async function triggerDriverAssignment(
  supabaseClient: ReturnType<typeof createClient>,
  booking: any
) {
  try {
    // Create booking assignment record
    await supabaseClient
      .from('booking_assignments')
      .insert({
        booking_id: booking.id,
        booking_type: 'guest',
        assigned_by: null, // System assignment
        status: 'assigned',
        admin_notes: 'Payment confirmed - automatic driver assignment triggered'
      })

    // Enhanced admin notification with better formatting
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `🚗 URGENT: Payment Confirmed - Assign Driver for ${booking.guest_rider.name}`,
        html_content: generateDriverAssignmentAdminEmail(booking),
        booking_id: booking.id,
        notification_type: 'admin_notification',
        email_type: 'admin_notification',
        email_status: 'queued',
        priority: 1, // Highest priority
        sent: false,
        retry_count: 0,
        max_retries: 5
      })

    console.log('✅ Admin driver assignment notification queued')

  } catch (error) {
    console.error('Error triggering driver assignment:', error)
  }
}

function generateDriverAssignmentAdminEmail(booking: any): string {
  const pickupTime = new Date(booking.pickup_time)
  const bookingRef = booking.id.slice(0, 8).toUpperCase()
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🚨 URGENT: Driver Assignment Required</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Payment confirmed - immediate action needed</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb;">
        <div style="background: #fef3c7; border: 2px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <p style="color: #92400e; font-weight: bold; margin: 0; font-size: 16px;">⚠️ PAYMENT CONFIRMED - ASSIGN DRIVER IMMEDIATELY</p>
          <p style="color: #b45309; margin: 5px 0 0 0; font-size: 14px;">Customer is waiting for driver assignment and dispatch</p>
        </div>
        
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Customer Details:</h3>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${booking.guest_rider.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.guest_rider.email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${booking.guest_rider.phone}</p>
          <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking.id}</p>
          <p style="margin: 5px 0;"><strong>Reference:</strong> ${bookingRef}</p>
        </div>
        
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Journey Details:</h3>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>From:</strong> ${booking.pickup_address}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${booking.dropoff_address}</p>
          <p style="margin: 5px 0;"><strong>Pickup:</strong> ${pickupTime.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Fare Paid:</strong> £${booking.fare_estimate}</p>
          <p style="margin: 5px 0;"><strong>Support Workers:</strong> ${booking.support_workers_count || 0}</p>
          <p style="margin: 5px 0;"><strong>Vehicle Features:</strong> ${(booking.vehicle_features || []).join(', ') || 'Standard'}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${booking.booking_type.replace('_', ' ')}</p>
        </div>
        
        <div style="background: #ecfdf5; border: 2px solid #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <p style="color: #065f46; font-weight: bold; margin: 0 0 10px 0;">✅ Required Actions:</p>
          <ol style="color: #047857; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 5px;">Assign suitable driver and vehicle immediately</li>
            <li style="margin-bottom: 5px;">Send driver details via SMS to ${booking.guest_rider.phone}</li>
            <li style="margin-bottom: 5px;">Activate live tracking for the journey</li>
            <li style="margin-bottom: 5px;">Confirm driver dispatch with customer</li>
          </ol>
        </div>
        
        <div style="text-align: center;">
          <a href="https://ablego.co.uk/dashboard/admin/bookings" 
             style="background: #DC2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            🚗 Assign Driver Now
          </a>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This is an automated notification. Customer payment has been processed successfully.
          </p>
        </div>
      </div>
    </div>
  `
}