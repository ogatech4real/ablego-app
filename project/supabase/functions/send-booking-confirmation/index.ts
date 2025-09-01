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
  payment_method: 'cash_bank' | 'stripe';
  access_token: string;
  tracking_url: string;
  user_account_created?: boolean;
  user_account_status?: string;
  booking_details: {
    pickup_address: string;
    dropoff_address: string;
    pickup_time: string;
    fare_estimate: number;
    support_workers_count: number;
    vehicle_features: string[];
    special_requirements?: string | null;
    booking_type: string;
    lead_time_hours: number;
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
    )

    const confirmationData: BookingConfirmationRequest = await req.json()

    console.log('📧 Processing booking confirmation:', {
      booking_id: confirmationData.booking_id,
      guest_email: confirmationData.guest_email,
      user_account_created: confirmationData.user_account_created,
      timestamp: new Date().toISOString()
    })

    // Create email content
    const pickupDate = new Date(confirmationData.booking_details.pickup_time)
    const bookingRef = confirmationData.booking_id.slice(0, 8).toUpperCase()
    const formattedPickupTime = pickupDate.toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Generate customer booking confirmation email
    const customerEmailContent = generateCustomerBookingEmail(confirmationData, bookingRef, formattedPickupTime)
    
    // Generate admin notification email
    const adminEmailContent = generateAdminNotificationEmail(confirmationData, bookingRef, formattedPickupTime)
    
    // Store customer booking confirmation email with proper status
    const { data: customerEmail, error: customerEmailError } = await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: confirmationData.guest_email,
        subject: `🎉 Booking Confirmed - AbleGo Ride on ${pickupDate.toLocaleDateString()}`,
        html_content: customerEmailContent,
        booking_id: confirmationData.booking_id,
        notification_type: 'booking_confirmation',
        email_type: 'booking_confirmation',
        email_status: 'queued',
        priority: 1, // High priority for customer emails
        retry_count: 0,
        max_retries: 3,
        sent: false
      })
      .select()
      .single()

    if (customerEmailError) {
      console.error('❌ Failed to queue customer email:', customerEmailError)
    } else {
      console.log('✅ Customer email queued:', customerEmail.id)
    }

    // Store admin notification email with proper status
    const { data: adminEmail, error: adminEmailError } = await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `🚗 New Booking - ${confirmationData.guest_name} - £${confirmationData.booking_details.fare_estimate.toFixed(2)}`,
        html_content: adminEmailContent,
        booking_id: confirmationData.booking_id,
        notification_type: 'admin_booking_notification',
        email_type: 'admin_notification',
        email_status: 'queued',
        priority: 2, // Medium priority for admin notifications
        retry_count: 0,
        max_retries: 3,
        sent: false
      })
      .select()
      .single()

    if (adminEmailError) {
      console.error('❌ Failed to queue admin email:', adminEmailError)
    } else {
      console.log('✅ Admin email queued:', adminEmail.id)
    }

    // Immediately trigger email delivery
    try {
      console.log('📧 Triggering immediate email delivery...')
      
      const { data: deliveryResult, error: deliveryError } = await supabaseClient.functions.invoke('email-delivery-system', {
        body: {}
      })

      if (deliveryError) {
        console.error('❌ Email delivery trigger failed:', deliveryError)
      } else {
        console.log('✅ Email delivery triggered successfully:', deliveryResult)
      }
    } catch (deliveryError) {
      console.error('❌ Email delivery trigger error:', deliveryError)
    }

    console.log('✅ Booking confirmation emails processed for:', confirmationData.guest_email)

    return new Response(
      JSON.stringify({ 
        message: 'Booking confirmation emails processed successfully',
        booking_reference: bookingRef,
        tracking_url: confirmationData.tracking_url,
        emails_queued: {
          customer: !!customerEmail,
          admin: !!adminEmail
        },
        user_account_status: confirmationData.user_account_status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Booking confirmation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process booking confirmation emails',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateCustomerBookingEmail(data: BookingConfirmationRequest, bookingRef: string, formattedPickupTime: string): string {
  const fareAmount = data.booking_details.fare_estimate.toFixed(2)
  const vehicleType = data.booking_details.vehicle_features?.length > 0 
    ? data.booking_details.vehicle_features.join(', ') 
    : 'Standard Vehicle'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - AbleGo</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container { 
            background: white; 
            border-radius: 12px; 
            padding: 30px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #e9ecef;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 10px;
        }
        .status-badge { 
            background: #10b981; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600;
            display: inline-block;
        }
        .booking-details { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child { 
            border-bottom: none; 
            font-weight: bold; 
            font-size: 18px;
            color: #2563eb;
        }
        .cta-button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #6c757d; 
            font-size: 14px;
        }
        .contact-info { 
            background: #e3f2fd; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        .payment-info {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .account-info {
            background: #d1ecf1;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #17a2b8;
        }
        @media (max-width: 600px) {
            .detail-row { flex-direction: column; }
            .detail-row span:first-child { font-weight: bold; margin-bottom: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚗 AbleGo</div>
            <div class="status-badge">✅ Booking Confirmed</div>
        </div>

        <h2>Hello ${data.guest_name},</h2>
        
        <p>Your booking has been confirmed! Here are your journey details:</p>

        <div class="booking-details">
            <div class="detail-row">
                <span>Booking Reference:</span>
                <span><strong>${bookingRef}</strong></span>
            </div>
            <div class="detail-row">
                <span>Pickup Address:</span>
                <span>${data.booking_details.pickup_address}</span>
            </div>
            <div class="detail-row">
                <span>Drop-off Address:</span>
                <span>${data.booking_details.dropoff_address}</span>
            </div>
            <div class="detail-row">
                <span>Pickup Date & Time:</span>
                <span>${formattedPickupTime}</span>
            </div>
            <div class="detail-row">
                <span>Vehicle Type:</span>
                <span>${vehicleType}</span>
            </div>
            <div class="detail-row">
                <span>Support Workers:</span>
                <span>${data.booking_details.support_workers_count}</span>
            </div>
            <div class="detail-row">
                <span>Total Fare:</span>
                <span><strong>£${fareAmount}</strong></span>
            </div>
        </div>

        ${data.user_account_created ? `
        <div class="account-info">
            <strong>🎉 Account Created!</strong><br>
            We've created an account for you using your email address. You can now:
            <ul>
                <li>Track all your bookings in one place</li>
                <li>Save your preferences for future rides</li>
                <li>Access exclusive member benefits</li>
            </ul>
        </div>
        ` : ''}

        <div class="payment-info">
            <strong>💳 Payment Method:</strong> ${data.payment_method === 'stripe' ? 'Card Payment' : 'Cash/Bank Transfer'}<br>
            ${data.payment_method === 'cash_bank' ? 'Please have the exact fare amount ready (£' + fareAmount + ')' : 'Payment has been processed successfully'}
        </div>

        <div class="contact-info">
            <strong>📞 Need to Contact Us?</strong><br>
            Email: admin@ablego.co.uk<br>
            Phone: +44 (0) 20 1234 5678<br>
            <small>Available 24/7 for urgent matters</small>
        </div>

        <a href="${data.tracking_url}" class="cta-button">📱 Track Your Ride</a>

        ${data.booking_details.special_requirements ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>📝 Special Requirements:</strong><br>
            ${data.booking_details.special_requirements}
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>AbleGo Ltd</strong><br>
            Professional Transport Services<br>
            admin@ablego.co.uk | www.ablego.co.uk</p>
            <small>This email was sent to ${data.guest_email}</small>
        </div>
    </div>
</body>
</html>
  `
}

function generateAdminNotificationEmail(data: BookingConfirmationRequest, bookingRef: string, formattedPickupTime: string): string {
  const fareAmount = data.booking_details.fare_estimate.toFixed(2)
  const vehicleType = data.booking_details.vehicle_features?.length > 0 
    ? data.booking_details.vehicle_features.join(', ') 
    : 'Standard Vehicle'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Notification - AbleGo Admin</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 700px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container { 
            background: white; 
            border-radius: 12px; 
            padding: 30px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #e9ecef;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #dc2626; 
            margin-bottom: 10px;
        }
        .alert-badge { 
            background: #dc2626; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600;
            display: inline-block;
        }
        .booking-details { 
            background: #fef2f2; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }
        .customer-details { 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child { 
            border-bottom: none; 
            font-weight: bold; 
            font-size: 18px;
            color: #dc2626;
        }
        .action-buttons { 
            text-align: center; 
            margin: 30px 0;
        }
        .action-button { 
            display: inline-block; 
            background: #dc2626; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            margin: 0 10px;
        }
        .secondary-button { 
            background: #6b7280; 
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #e9ecef; 
            color: #6c757d; 
            font-size: 14px;
        }
        .priority-high {
            background: #fef2f2;
            color: #dc2626;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #dc2626;
        }
        .account-status {
            background: #d1ecf1;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #17a2b8;
        }
        @media (max-width: 600px) {
            .detail-row { flex-direction: column; }
            .detail-row span:first-child { font-weight: bold; margin-bottom: 5px; }
            .action-button { display: block; margin: 10px 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚗 AbleGo Admin</div>
            <div class="alert-badge">🚨 New Booking Alert</div>
        </div>

        <div class="priority-high">
            <strong>⚠️ ACTION REQUIRED:</strong> New booking received - Driver assignment needed
        </div>

        <h2>New Booking Details</h2>

        <div class="customer-details">
            <h3>👤 Customer Information</h3>
            <div class="detail-row">
                <span>Name:</span>
                <span><strong>${data.guest_name}</strong></span>
            </div>
            <div class="detail-row">
                <span>Email:</span>
                <span>${data.guest_email}</span>
            </div>
            <div class="detail-row">
                <span>Phone:</span>
                <span>${data.guest_phone}</span>
            </div>
            <div class="detail-row">
                <span>Account Status:</span>
                <span>${data.user_account_created ? '✅ Account Created' : '👤 Guest User'}</span>
            </div>
        </div>

        <div class="booking-details">
            <h3>🚗 Journey Details</h3>
            <div class="detail-row">
                <span>Booking Reference:</span>
                <span><strong>${bookingRef}</strong></span>
            </div>
            <div class="detail-row">
                <span>Pickup Address:</span>
                <span>${data.booking_details.pickup_address}</span>
            </div>
            <div class="detail-row">
                <span>Drop-off Address:</span>
                <span>${data.booking_details.dropoff_address}</span>
            </div>
            <div class="detail-row">
                <span>Pickup Date & Time:</span>
                <span>${formattedPickupTime}</span>
            </div>
            <div class="detail-row">
                <span>Vehicle Requirements:</span>
                <span>${vehicleType}</span>
            </div>
            <div class="detail-row">
                <span>Support Workers:</span>
                <span>${data.booking_details.support_workers_count}</span>
            </div>
            <div class="detail-row">
                <span>Payment Method:</span>
                <span>${data.payment_method === 'stripe' ? 'Card Payment' : 'Cash/Bank Transfer'}</span>
            </div>
            <div class="detail-row">
                <span>Total Fare:</span>
                <span><strong>£${fareAmount}</strong></span>
            </div>
        </div>

        ${data.booking_details.special_requirements ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>📝 Special Requirements:</strong><br>
            ${data.booking_details.special_requirements}
        </div>
        ` : ''}

        <div class="action-buttons">
            <a href="https://ablego.co.uk/admin/bookings/${data.booking_id}" class="action-button">
                📋 View Booking Details
            </a>
            <a href="https://ablego.co.uk/admin/drivers" class="action-button secondary-button">
                🚗 Assign Driver
            </a>
        </div>

        <div class="footer">
            <p><strong>AbleGo Admin Dashboard</strong><br>
            Professional Transport Services<br>
            admin@ablego.co.uk | www.ablego.co.uk</p>
            <small>This is an automated notification from the AbleGo booking system</small>
        </div>
    </div>
</body>
</html>
  `
}