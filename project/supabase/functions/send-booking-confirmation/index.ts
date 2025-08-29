import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingConfirmationRequest {
  booking_id: string;
  guest_email: string;
  guest_name: string;
  guest_phone: string;
  booking_details: {
    pickup_address: string;
    dropoff_address: string;
    pickup_time: string;
    fare_estimate: number;
    support_workers_count: number;
    vehicle_features: string[];
    special_requirements?: string;
    booking_type: string;
    lead_time_hours: number;
  };
  access_token: string;
  tracking_url: string;
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

    const confirmationData: BookingConfirmationRequest = await req.json()

    // Create email content
    const pickupDate = new Date(confirmationData.booking_details.pickup_time)
    const bookingRef = confirmationData.booking_id.slice(0, 8).toUpperCase()
    
    // Store customer booking confirmation email
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: confirmationData.guest_email,
        subject: `🎉 Booking Created & Payment Instructions - AbleGo Ride on ${pickupDate.toLocaleDateString()}`,
        html_content: generateCustomerBookingEmail(confirmationData, bookingRef),
        booking_id: confirmationData.booking_id,
        notification_type: 'booking_confirmation',
        sent: false
      })

    // Store admin notification email
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `🚗 New Booking Created - ${confirmationData.guest_name} (Payment Pending)`,
        html_content: generateAdminNotificationEmail(confirmationData, bookingRef),
        booking_id: confirmationData.booking_id,
        notification_type: 'admin_booking_notification',
        sent: false
      })

    console.log('Booking confirmation emails queued for:', confirmationData.guest_email)

    return new Response(
      JSON.stringify({ 
        message: 'Booking confirmation emails queued successfully',
        booking_reference: bookingRef,
        tracking_url: confirmationData.tracking_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Booking confirmation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateCustomerBookingEmail(data: BookingConfirmationRequest, bookingRef: string): string {
  const pickupDate = new Date(data.booking_details.pickup_time)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Created & Payment Instructions - AbleGo</title>
    </head>
    <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-size: 24px;">🎉</span>
          </div>
          <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">Booking Created Successfully!</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Complete payment to dispatch your driver</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; margin-bottom: 30px;">Dear ${data.guest_name},</p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">Great news! Your AbleGo booking has been created successfully. <strong>Your driver will be automatically assigned and dispatched as soon as payment is confirmed.</strong></p>

          <!-- Booking Details -->
          <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #d1d5db; padding-bottom: 15px;">
              <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">BOOKING DETAILS</h2>
              <div style="text-align: right;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Booking Reference</p>
                <p style="margin: 0; color: #1f2937; font-weight: bold; font-family: monospace;">${bookingRef}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Journey Details:</h3>
              <div style="background: white; border-radius: 8px; padding: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                  <div>
                    <span style="color: #6b7280; font-size: 14px; font-weight: 500;">From</span>
                    <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${data.booking_details.pickup_address}</p>
                  </div>
                  <div>
                    <span style="color: #6b7280; font-size: 14px; font-weight: 500;">To</span>
                    <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${data.booking_details.dropoff_address}</p>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Pickup Date & Time</span>
                    <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${pickupDate.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Total Fare</span>
                    <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">£${data.booking_details.fare_estimate.toFixed(2)}</p>
                  </div>
                </div>

                ${data.booking_details.support_workers_count > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Support Workers</span>
                  <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${data.booking_details.support_workers_count} trained companion${data.booking_details.support_workers_count > 1 ? 's' : ''}</p>
                </div>
                ` : ''}

                ${data.booking_details.vehicle_features.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Vehicle Features</span>
                  <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${data.booking_details.vehicle_features.join(', ')}</p>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Payment Instructions -->
          <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #92400e; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">💳 Payment Instructions</h3>
            
            <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="color: #92400e; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">🚗 Automatic Driver Dispatch</p>
              <p style="color: #b45309; font-size: 13px; margin: 0;">Your driver will be automatically assigned and dispatched within 15 minutes of payment confirmation. No need to call or email us!</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
                <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">💳 Card Payment (Instant)</h4>
                <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Pay now and get immediate driver dispatch</p>
                <a href="${data.tracking_url}#payment" style="display: block; background: #3B82F6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; font-size: 14px;">Pay £${data.booking_details.fare_estimate.toFixed(2)} Now</a>
              </div>
              
              <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
                <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🏦 Bank Transfer</h4>
                <div style="color: #b45309; font-size: 12px; margin-bottom: 10px;">
                  <p style="margin: 2px 0;"><strong>Account Name:</strong> AbleGo Ltd</p>
                  <p style="margin: 2px 0;"><strong>Sort Code:</strong> 77-71-43</p>
                  <p style="margin: 2px 0;"><strong>Account Number:</strong> 00968562</p>
                  <p style="margin: 2px 0;"><strong>Reference:</strong> ${bookingRef}</p>
                  <p style="margin: 2px 0;"><strong>Amount:</strong> £${data.booking_details.fare_estimate.toFixed(2)}</p>
                </div>
                <p style="color: #b45309; font-size: 11px; margin: 0; font-style: italic;">Confirmed within 2 hours (business hours)</p>
              </div>
            </div>
          </div>

          <!-- Track Booking Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${data.tracking_url}" 
               style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              📱 Track Booking & Payment Status
            </a>
          </div>

          <!-- What's Next -->
          <div style="background-color: #ecfdf5; border: 2px solid #d1fae5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
            <h3 style="color: #065f46; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">📋 What happens next:</h3>
            <ul style="color: #047857; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">💳 <strong>Complete payment</strong> using your preferred method above</li>
              <li style="margin-bottom: 8px;">🚗 <strong>Driver assignment</strong> - We'll match you with a suitable driver and vehicle</li>
              <li style="margin-bottom: 8px;">📱 <strong>Driver details</strong> - You'll receive driver contact info 30 minutes before pickup</li>
              <li style="margin-bottom: 8px;">🗺️ <strong>Live tracking</strong> - Track your journey in real-time during the ride</li>
              <li style="margin-bottom: 8px;">✅ <strong>Safe arrival</strong> - Confirmation when you reach your destination</li>
            </ul>
          </div>

          <!-- Support -->
          <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🆘 Need Help?</h3>
            <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Our 24/7 support team is here to assist you:</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #92400e;">📞 Phone:</strong><br>
                <a href="tel:08001234567" style="color: #b45309; text-decoration: none; font-weight: bold;">0800 123 4567</a>
              </div>
              <div>
                <strong style="color: #92400e;">📧 Email:</strong><br>
                <a href="mailto:admin@ablego.co.uk" style="color: #b45309; text-decoration: none; font-weight: bold;">admin@ablego.co.uk</a>
              </div>
            </div>
          </div>

          <p style="font-size: 16px; margin-bottom: 20px;">We're excited to provide you with safe, compassionate transport. Thank you for choosing AbleGo!</p>
          
          <p style="font-size: 16px; margin: 0;">Best regards,<br><strong>The AbleGo Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
            This confirmation was sent to ${data.guest_email} for booking reference ${bookingRef}
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            AbleGo Ltd • Middlesbrough, United Kingdom • Company No. 16619305<br>
            <a href="https://ablego.co.uk/privacy-policy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> • 
            <a href="https://ablego.co.uk/contact" style="color: #3b82f6; text-decoration: none;">Contact Us</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminNotificationEmail(data: BookingConfirmationRequest, bookingRef: string): string {
  const pickupDate = new Date(data.booking_details.pickup_time)
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">🚗 New Booking Created</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Payment pending - driver dispatch on payment confirmation</p>
      </div>
      
      <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #92400e; font-weight: bold; margin: 0; font-size: 14px;">⚠️ PAYMENT PENDING - Driver will be auto-assigned after payment</p>
        </div>
        
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Customer Details:</h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
          <li><strong>Name:</strong> ${data.guest_name}</li>
          <li><strong>Email:</strong> ${data.guest_email}</li>
          <li><strong>Phone:</strong> ${data.guest_phone}</li>
          <li><strong>Booking ID:</strong> ${data.booking_id}</li>
          <li><strong>Reference:</strong> ${bookingRef}</li>
        </ul>
        
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">Journey Details:</h3>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
          <li><strong>From:</strong> ${data.booking_details.pickup_address}</li>
          <li><strong>To:</strong> ${data.booking_details.dropoff_address}</li>
          <li><strong>Pickup:</strong> ${pickupDate.toLocaleString()}</li>
          <li><strong>Fare:</strong> £${data.booking_details.fare_estimate.toFixed(2)}</li>
          <li><strong>Support Workers:</strong> ${data.booking_details.support_workers_count}</li>
          <li><strong>Type:</strong> ${data.booking_details.booking_type.replace('_', ' ')}</li>
        </ul>
        
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <p style="color: #065f46; font-weight: bold; margin: 0 0 5px 0;">✅ Next Steps:</p>
          <p style="color: #047857; font-size: 14px; margin: 0;">Monitor payment status and assign driver automatically when payment is confirmed. Customer will receive SMS with driver details.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://ablego.co.uk/dashboard/admin/bookings" 
             style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            View in Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  `
}