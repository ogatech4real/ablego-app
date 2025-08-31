import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentWebhookData {
  booking_id: string;
  payment_method: 'card' | 'bank_transfer';
  amount: number;
  currency: string;
  payment_reference: string;
  customer_email: string;
  customer_name: string;
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

    const paymentData: PaymentWebhookData = await req.json()

    console.log('💳 Payment webhook received:', {
      booking_id: paymentData.booking_id,
      method: paymentData.payment_method,
      amount: paymentData.amount,
      customer: paymentData.customer_email
    })

    // Update booking status to confirmed
    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('guest_bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.booking_id)
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
      console.error('Error updating booking status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update booking status' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create payment transaction record
    await supabaseClient
      .from('payment_transactions')
      .insert({
        booking_id: paymentData.booking_id,
        amount_gbp: paymentData.amount,
        currency: paymentData.currency,
        status: 'completed',
        payment_method: paymentData.payment_method,
        processed_at: new Date().toISOString()
      })

    // Trigger automatic driver assignment
    await triggerDriverAssignment(supabaseClient, updatedBooking)

    // Send payment confirmation email
    await sendPaymentConfirmationEmail(supabaseClient, updatedBooking, paymentData)

    // Send SMS with driver details (simulated)
    await sendDriverDetailsSMS(supabaseClient, updatedBooking)

    return new Response(
      JSON.stringify({ 
        message: 'Payment processed and driver assignment triggered',
        booking_id: paymentData.booking_id,
        status: 'confirmed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Payment webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function triggerDriverAssignment(
  supabaseClient: ReturnType<typeof createClient>,
  booking: any
) {
  try {
    console.log('🚗 Triggering automatic driver assignment for booking:', booking.id)

    // In production, this would:
    // 1. Find available drivers near pickup location
    // 2. Match vehicle features with booking requirements
    // 3. Assign closest available driver
    // 4. Send driver notification
    // 5. Update booking with driver assignment

    // For now, we'll create a booking assignment record
    const { error: assignmentError } = await supabaseClient
      .from('booking_assignments')
      .insert({
        booking_id: booking.id,
        booking_type: 'guest',
        assigned_by: null, // System assignment
        status: 'assigned',
        driver_notes: 'Automatically assigned after payment confirmation',
        admin_notes: `Payment confirmed via ${booking.payment_method || 'unknown method'} - auto-dispatch triggered`
      })

    if (assignmentError) {
      console.error('Error creating booking assignment:', assignmentError)
    } else {
      console.log('✅ Driver assignment record created')
    }

    // Notify admin about successful assignment
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `✅ Payment Confirmed & Driver Assignment Needed - ${booking.guest_rider.name}`,
        html_content: `
          <h2>Payment Confirmed - Driver Assignment Required</h2>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
          <p><strong>Customer:</strong> ${booking.guest_rider.name} (${booking.guest_rider.email})</p>
          <p><strong>Amount Paid:</strong> £${booking.fare_estimate}</p>
          <p><strong>Pickup:</strong> ${new Date(booking.pickup_time).toLocaleString()}</p>
          
          <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; font-weight: bold; margin: 0;">🚗 ACTION REQUIRED: Please assign a suitable driver immediately</p>
          </div>
          
          <a href="https://ablego.co.uk/dashboard/admin/bookings" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Assign Driver Now
          </a>
        `,
        booking_id: booking.id,
        notification_type: 'admin_driver_assignment',
        sent: false
      })

  } catch (error) {
    console.error('Error in driver assignment process:', error)
  }
}

async function sendPaymentConfirmationEmail(
  supabaseClient: ReturnType<typeof createClient>,
  booking: any,
  paymentData: PaymentWebhookData
) {
  try {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ Payment Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your driver is being assigned now</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${booking.guest_rider.name},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">Great news! Your payment has been confirmed and we're now assigning a suitable driver for your journey.</p>
          
          <div style="background: #ecfdf5; border: 2px solid #d1fae5; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0;">🚗 What happens next (within 15 minutes):</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Driver assignment based on your location and requirements</li>
              <li style="margin-bottom: 8px;">SMS sent to ${booking.guest_rider.phone} with driver details</li>
              <li style="margin-bottom: 8px;">Driver contact information and vehicle details</li>
              <li style="margin-bottom: 8px;">Live tracking link activated for your journey</li>
            </ul>
          </div>
          
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Payment Details:</h3>
            <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> £${paymentData.amount.toFixed(2)}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Method:</strong> ${paymentData.payment_method === 'card' ? 'Card Payment' : 'Bank Transfer'}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Reference:</strong> ${paymentData.payment_reference}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Confirmed ✅</span></p>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${Deno.env.get('SITE_URL') || 'https://ablego.co.uk'}/booking-status?token=${booking.access_token}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Track Your Booking
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>📱 Check your phone for driver details!</strong></p>
            <p style="color: #b45309; font-size: 12px; margin: 5px 0 0 0;">SMS will be sent to ${booking.guest_rider.phone} with driver information</p>
          </div>
          
          <p style="font-size: 16px; margin: 25px 0 20px 0;">Thank you for choosing AbleGo. We're excited to provide you with safe, compassionate transport!</p>
          
          <p style="font-size: 16px; margin: 0;">Best regards,<br><strong>The AbleGo Team</strong></p>
        </div>
      </div>
    `

    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: booking.guest_rider.email,
        subject: `✅ Payment Confirmed - Driver Being Assigned | AbleGo`,
        html_content: emailContent,
        booking_id: booking.id,
        notification_type: 'payment_confirmation',
        sent: false
      })

    console.log('✅ Payment confirmation email queued')

  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
  }
}

async function sendDriverDetailsSMS(
  supabaseClient: ReturnType<typeof createClient>,
  booking: any
) {
  try {
    // In production, integrate with SMS service like:
    // - Twilio
    // - AWS SNS
    // - Vonage (Nexmo)
    // - TextLocal (UK-specific)

    const smsContent = `
AbleGo Driver Assigned! 🚗

Driver: John Smith ⭐4.9
Vehicle: Blue Ford Transit (AB12 CDE)
Phone: 07700 900123

Pickup: ${new Date(booking.pickup_time).toLocaleTimeString()} from ${booking.pickup_address}

Track live: ${Deno.env.get('SITE_URL') || 'https://ablego.co.uk'}/booking-status?token=${booking.access_token}

Questions? Call 01642 089 958
- AbleGo Team
    `

    // PRODUCTION SMS INTEGRATION:
    /*
    // Twilio example:
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: Deno.env.get('TWILIO_PHONE_NUMBER') || '+441234567890',
        To: booking.guest_rider.phone,
        Body: smsContent.trim()
      }),
    })
    */

    console.log('📱 SMS TO SEND:', {
      to: booking.guest_rider.phone,
      content: smsContent.trim(),
      booking_id: booking.id
    })

    // Log SMS sending for demo purposes
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `📱 SMS Sent - Driver Details to ${booking.guest_rider.name}`,
        html_content: `
          <h3>SMS Driver Details Sent</h3>
          <p><strong>Recipient:</strong> ${booking.guest_rider.phone}</p>
          <p><strong>Booking:</strong> ${booking.id}</p>
          <p><strong>Customer:</strong> ${booking.guest_rider.name}</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4>SMS Content:</h4>
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${smsContent.trim()}</pre>
          </div>
        `,
        booking_id: booking.id,
        notification_type: 'sms_notification',
        sent: false
      })

    console.log('📱 Driver details SMS logged for admin review')

  } catch (error) {
    console.error('Error sending driver details SMS:', error)
  }
}