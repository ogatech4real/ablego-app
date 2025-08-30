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
  payment_method: string;
  access_token: string;
  tracking_url: string;
  user_account_created?: boolean;
  user_account_status?: string;
  booking_details: {
    pickup_address: string;
    dropoff_address: string;
    pickup_time: string;
    fare_estimate: number;
    vehicle_type?: string;
    special_requirements?: string;
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
    
    // Store customer booking confirmation email
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: confirmationData.guest_email,
        subject: `🎉 Booking Confirmed - AbleGo Ride on ${pickupDate.toLocaleDateString()}`,
        html_content: generateCustomerBookingEmail(confirmationData, bookingRef, formattedPickupTime),
        booking_id: confirmationData.booking_id,
        notification_type: 'booking_confirmation',
        sent: false
      })

    // Store admin notification email
    await supabaseClient
      .from('admin_email_notifications')
      .insert({
        recipient_email: 'admin@ablego.co.uk',
        subject: `🚗 New Booking - ${confirmationData.guest_name} - £${confirmationData.booking_details.fare_estimate.toFixed(2)}`,
        html_content: generateAdminNotificationEmail(confirmationData, bookingRef, formattedPickupTime),
        booking_id: confirmationData.booking_id,
        notification_type: 'admin_booking_notification',
        sent: false
      })

    console.log('✅ Booking confirmation emails queued for:', confirmationData.guest_email)

    return new Response(
      JSON.stringify({ 
        message: 'Booking confirmation emails queued successfully',
        booking_reference: bookingRef,
        tracking_url: confirmationData.tracking_url,
        customer_email: confirmationData.guest_email,
        admin_email: 'admin@ablego.co.uk'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Booking confirmation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to queue booking confirmation emails',
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
  const vehicleType = data.booking_details.vehicle_type || 'Standard Vehicle'
  
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

        <h2>Hello ${data.guest_name}!</h2>
        <p>Your AbleGo ride has been successfully booked and confirmed. Here are your booking details:</p>

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
                <span>Destination:</span>
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
                <span>Payment Method:</span>
                <span>${data.payment_method}</span>
            </div>
            <div class="detail-row">
                <span>Total Fare:</span>
                <span>£${fareAmount}</span>
            </div>
        </div>

        <div class="payment-info">
            <strong>💰 Payment Status:</strong> ${data.payment_method === 'card' ? 'Paid' : 'Cash Payment on Arrival'}
            ${data.payment_method === 'card' ? '<br><small>Your payment has been processed successfully.</small>' : '<br><small>Please have the exact amount ready for your driver.</small>'}
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
  const vehicleType = data.booking_details.vehicle_type || 'Standard Vehicle'
  
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
                <span>Booking Reference:</span>
                <span><strong>${bookingRef}</strong></span>
            </div>
        </div>

        <div class="booking-details">
            <h3>🚗 Journey Details</h3>
            <div class="detail-row">
                <span>Pickup Address:</span>
                <span>${data.booking_details.pickup_address}</span>
            </div>
            <div class="detail-row">
                <span>Destination:</span>
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
                <span>Payment Method:</span>
                <span>${data.payment_method}</span>
            </div>
            <div class="detail-row">
                <span>Total Fare:</span>
                <span>£${fareAmount}</span>
            </div>
        </div>

        ${data.booking_details.special_requirements ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>📝 Special Requirements:</strong><br>
            ${data.booking_details.special_requirements}
        </div>
        ` : ''}

        <div class="action-buttons">
            <a href="https://ablegobefore.netlify.app/admin/bookings" class="action-button">📋 View in Admin Dashboard</a>
            <a href="mailto:${data.guest_email}" class="action-button secondary-button">📧 Contact Customer</a>
        </div>

        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>📊 Quick Stats:</strong><br>
            • Booking ID: ${data.booking_id}<br>
            • Created: ${new Date().toLocaleString('en-GB')}<br>
            • Payment Status: ${data.payment_method === 'card' ? 'Paid' : 'Pending (Cash)'}<br>
            • User Account: ${data.user_account_created ? 'Created' : 'Guest Booking'}
        </div>

        <div class="footer">
            <p><strong>AbleGo Ltd - Admin Portal</strong><br>
            Professional Transport Services<br>
            admin@ablego.co.uk | www.ablego.co.uk</p>
            <small>This notification was automatically generated by the AbleGo booking system</small>
        </div>
    </div>
</body>
</html>
  `
}