import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingInvoiceRequest {
  booking_id: string;
  guest_email: string;
  guest_name: string;
  guest_phone: string;
  payment_method: 'cash_bank' | 'stripe';
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

    const invoiceData: BookingInvoiceRequest = await req.json()

    // Create email content
    const pickupDate = new Date(invoiceData.booking_details.pickup_time)
    const bookingRef = invoiceData.booking_id.slice(0, 8).toUpperCase()
    
    // Determine email subject and content based on payment method
    const isCashBankPayment = invoiceData.payment_method === 'cash_bank'
    const emailSubject = isCashBankPayment 
      ? `🧾 Booking Invoice - Payment Required - AbleGo Ride on ${pickupDate.toLocaleDateString()}`
      : `🧾 Invoice & Booking Confirmation - AbleGo Ride on ${pickupDate.toLocaleDateString()}`
    
    const emailContent = {
      to: invoiceData.guest_email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice & Booking Confirmation - AbleGo</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 24px;">🧾</span>
              </div>
              <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">Invoice & Booking Confirmation</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Your AbleGo ride has been successfully booked</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; margin-bottom: 30px;">Dear ${invoiceData.guest_name},</p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">Thank you for choosing AbleGo! Your booking has been confirmed. Please complete payment to have your driver dispatched.</p>

              <!-- Invoice Details -->
              <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #d1d5db; padding-bottom: 15px;">
                  <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">INVOICE</h2>
                  <div style="text-align: right;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Invoice #</p>
                    <p style="margin: 0; color: #1f2937; font-weight: bold; font-family: monospace;">${bookingRef}</p>
                  </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Bill To:</h3>
                  <p style="margin: 0; color: #1f2937; font-weight: 500;">${invoiceData.guest_name}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoiceData.guest_email}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoiceData.guest_phone}</p>
                </div>

                <div style="margin-bottom: 20px;">
                  <h3 style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Service Details:</h3>
                  <div style="background: white; border-radius: 8px; padding: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                      <div>
                        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">From</span>
                        <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${invoiceData.booking_details.pickup_address}</p>
                      </div>
                      <div>
                        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">To</span>
                        <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${invoiceData.booking_details.dropoff_address}</p>
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Pickup Date & Time</span>
                        <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${pickupDate.toLocaleString()}</p>
                      </div>
                      <div>
                        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Booking Type</span>
                        <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px; text-transform: capitalize;">${invoiceData.booking_details.booking_type.replace('_', ' ')}</p>
                      </div>
                    </div>

                    ${invoiceData.booking_details.support_workers_count > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Support Workers</span>
                      <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${invoiceData.booking_details.support_workers_count} trained companion${invoiceData.booking_details.support_workers_count > 1 ? 's' : ''}</p>
                    </div>
                    ` : ''}

                    ${invoiceData.booking_details.vehicle_features.length > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Vehicle Features</span>
                      <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${invoiceData.booking_details.vehicle_features.join(', ')}</p>
                    </div>
                    ` : ''}

                    ${invoiceData.booking_details.special_requirements ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Special Requirements</span>
                      <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${invoiceData.booking_details.special_requirements}</p>
                    </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Total Amount -->
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); color: white; border-radius: 8px; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 14px; opacity: 0.9;">Total Amount Due</p>
                  <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">£${invoiceData.booking_details.fare_estimate.toFixed(2)}</p>
                </div>
              </div>

                            <!-- Payment Instructions -->
              ${isCashBankPayment ? `
              <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #92400e; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">💳 Payment Required</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
                    <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">💵 Cash Payment</h4>
                    <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Pay cash to driver on pickup (before drop-off)</p>
                    <div style="background: #fef3c7; padding: 10px; border-radius: 6px; text-align: center;">
                      <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: bold;">Driver will confirm payment received</p>
                    </div>
                  </div>
                  
                  <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
                    <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🏦 Bank Transfer</h4>
                    <div style="color: #b45309; font-size: 12px; margin-bottom: 10px;">
                      <p style="margin: 2px 0;"><strong>Account Name:</strong> ABLEGO VENTURES LTD</p>
                      <p style="margin: 2px 0;"><strong>Sort Code:</strong> 040003</p>
                      <p style="margin: 2px 0;"><strong>Account Number:</strong> 53674174</p>
                      <p style="margin: 2px 0;"><strong>Reference:</strong> ${invoiceData.guest_email}</p>
                    </div>
                    <p style="color: #b45309; font-size: 11px; margin: 0; font-style: italic;">Transfer before pickup for confirmation</p>
                  </div>
                </div>

                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; text-align: center;">
                  <p style="color: #92400e; font-size: 14px; font-weight: bold; margin: 0;">🚗 Payment due on pickup (before drop-off)</p>
                  <p style="color: #b45309; font-size: 12px; margin: 5px 0 0 0;">Driver will confirm payment received. No booking fees or card charges.</p>
                </div>
              </div>
              ` : `
              <div style="background-color: #ecfdf5; border: 2px solid #d1fae5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #065f46; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">✅ Payment Confirmed</h3>
                
                <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #d1fae5;">
                  <h4 style="color: #065f46; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">💳 Card Payment Processed</h4>
                  <p style="color: #047857; font-size: 14px; margin: 0 0 15px 0;">Your payment has been successfully processed. Driver will be dispatched immediately.</p>
                  <div style="background: #ecfdf5; padding: 10px; border-radius: 6px; text-align: center;">
                    <p style="color: #065f46; font-size: 12px; margin: 0; font-weight: bold;">Digital receipt provided</p>
                  </div>
                </div>

                <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; text-align: center; margin-top: 15px;">
                  <p style="color: #065f46; font-size: 14px; font-weight: bold; margin: 0;">🚗 Driver dispatched - You'll receive contact details shortly</p>
                  <p style="color: #047857; font-size: 12px; margin: 5px 0 0 0;">Secure payment processed. No additional charges.</p>
                </div>
              </div>
              `}

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

              <!-- Track Booking Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${invoiceData.tracking_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                  📱 Track Your Booking
                </a>
              </div>

              <!-- Optional Account Creation -->
              <div style="background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #1e40af; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">📱 Want to track all your bookings?</h3>
                <p style="color: #1d4ed8; font-size: 14px; margin: 0 0 15px 0;">Create a free AbleGo account to manage all your bookings in one place, view history, and get personalized service.</p>
                <div style="text-align: center;">
                  <a href="https://ablego.co.uk/signup?email=${encodeURIComponent(invoiceData.guest_email)}&name=${encodeURIComponent(invoiceData.guest_name)}" 
                     style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                    Create Free Account
                  </a>
                </div>
              </div>

              <!-- Support -->
              <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🆘 Need Help?</h3>
                <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Our 24/7 support team is here to assist you:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <strong style="color: #92400e;">📞 Phone:</strong><br>
                    <a href="tel:01642089958" style="color: #b45309; text-decoration: none; font-weight: bold;">01642 089 958</a>
                  </div>
                  <div>
                    <strong style="color: #92400e;">📧 Email:</strong><br>
                    <a href="mailto:support@ablego.co.uk" style="color: #b45309; text-decoration: none; font-weight: bold;">support@ablego.co.uk</a>
                  </div>
                </div>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">⚠️ Important Notes</h3>
                <ul style="color: #dc2626; font-size: 14px; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 5px;">Payment must be completed before your pickup time</li>
                  <li style="margin-bottom: 5px;">Driver assignment happens after payment confirmation</li>
                  <li style="margin-bottom: 5px;">Cancellations must be made at least 2 hours before pickup</li>
                  <li style="margin-bottom: 5px;">Keep this email as your receipt for the journey</li>
                </ul>
              </div>

              <p style="font-size: 16px; margin-bottom: 20px;">We're excited to provide you with safe, compassionate transport. Thank you for choosing AbleGo!</p>
              
              <p style="font-size: 16px; margin: 0;">Best regards,<br><strong>The AbleGo Team</strong></p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                This invoice was sent to ${invoiceData.guest_email} for booking reference ${bookingRef}
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

    // Store email in admin notifications table for processing
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: invoiceData.guest_email,
        subject: emailContent.subject,
        html_content: emailContent.html,
        booking_id: invoiceData.booking_id,
        notification_type: 'booking_invoice',
        email_type: 'booking_invoice',
        email_status: 'queued',
        priority: 2,
        retry_count: 0,
        max_retries: 3,
        sent: false
      })

    // Also notify admin about new booking
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `🚗 New Booking Received - ${invoiceData.guest_name}`,
        html_content: `
          <h2>New Booking Received</h2>
          <p><strong>Customer:</strong> ${invoiceData.guest_name}</p>
          <p><strong>Email:</strong> ${invoiceData.guest_email}</p>
          <p><strong>Phone:</strong> ${invoiceData.guest_phone}</p>
          <p><strong>Booking ID:</strong> ${invoiceData.booking_id}</p>
          <p><strong>From:</strong> ${invoiceData.booking_details.pickup_address}</p>
          <p><strong>To:</strong> ${invoiceData.booking_details.dropoff_address}</p>
          <p><strong>Pickup:</strong> ${pickupDate.toLocaleString()}</p>
          <p><strong>Fare:</strong> £${invoiceData.booking_details.fare_estimate.toFixed(2)}</p>
          <p><strong>Support Workers:</strong> ${invoiceData.booking_details.support_workers_count}</p>
          
          <p>Please assign a suitable driver and vehicle for this booking.</p>
          
          <a href="https://ablego.co.uk/admin/bookings" 
             style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Manage Booking
          </a>
        `,
        booking_id: invoiceData.booking_id,
        notification_type: 'admin_booking_notification',
        email_type: 'admin_notification',
        email_status: 'queued',
        priority: 3,
        retry_count: 0,
        max_retries: 3,
        sent: false
      })

    console.log('Invoice email queued for:', invoiceData.guest_email)

    return new Response(
      JSON.stringify({ 
        message: 'Invoice email sent successfully',
        booking_reference: bookingRef
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Invoice email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})