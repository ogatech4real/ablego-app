import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'new_driver_application' | 'new_support_worker_application' | 'application_approved' | 'application_rejected';
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  adminNotes?: string;
  rejectionReason?: string;
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

    const notificationData: NotificationRequest = await req.json()

    // Send email based on notification type
    switch (notificationData.type) {
      case 'new_driver_application':
        await sendNewDriverApplicationEmail(supabaseClient, notificationData)
        break
      case 'new_support_worker_application':
        await sendNewSupportWorkerApplicationEmail(supabaseClient, notificationData)
        break
      case 'application_approved':
        await sendApplicationApprovedEmail(supabaseClient, notificationData)
        break
      case 'application_rejected':
        await sendApplicationRejectedEmail(supabaseClient, notificationData)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }

    return new Response(
      JSON.stringify({ message: 'Notification sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendNewDriverApplicationEmail(
  supabaseClient: ReturnType<typeof createClient>,
  data: NotificationRequest
) {
  // In a real implementation, you would use a service like SendGrid, Resend, or Supabase Edge Functions
  // For now, we'll create a notification record that can be processed by your email service
  
  const emailContent = {
    to: 'admin@ablego.co.uk',
    subject: `New Driver Application - ${data.applicantName}`,
    html: `
      <h2>New Driver Application Received</h2>
      <p><strong>Applicant:</strong> ${data.applicantName}</p>
      <p><strong>Email:</strong> ${data.applicantEmail}</p>
      <p><strong>Application ID:</strong> ${data.applicationId}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      
      <p>Please review this application in the admin dashboard:</p>
      <a href="https://ablego.co.uk/admin/applications?id=${data.applicationId}" 
         style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Review Application
      </a>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from AbleGo. Please do not reply to this email.
      </p>
    `
  }

  // Store email in notifications table for processing
  await supabaseClient
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      message: `New driver application from ${data.applicantName}`,
      type: 'system',
      data: {
        email_content: emailContent,
        application_id: data.applicationId,
        notification_type: 'admin_email'
      }
    })

  console.log('Admin notification created for new driver application:', data.applicationId)
}

async function sendNewSupportWorkerApplicationEmail(
  supabaseClient: ReturnType<typeof createClient>,
  data: NotificationRequest
) {
  const emailContent = {
    to: 'admin@ablego.co.uk',
    subject: `New Support Worker Application - ${data.applicantName}`,
    html: `
      <h2>New Support Worker Application Received</h2>
      <p><strong>Applicant:</strong> ${data.applicantName}</p>
      <p><strong>Email:</strong> ${data.applicantEmail}</p>
      <p><strong>Application ID:</strong> ${data.applicationId}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      
      <p>Please review this application in the admin dashboard:</p>
      <a href="https://ablego.co.uk/admin/applications?id=${data.applicationId}" 
         style="background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Review Application
      </a>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from AbleGo. Please do not reply to this email.
      </p>
    `
  }

  await supabaseClient
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      message: `New support worker application from ${data.applicantName}`,
      type: 'system',
      data: {
        email_content: emailContent,
        application_id: data.applicationId,
        notification_type: 'admin_email'
      }
    })

  console.log('Admin notification created for new support worker application:', data.applicationId)
}

async function sendApplicationApprovedEmail(
  supabaseClient: ReturnType<typeof createClient>,
  data: NotificationRequest
) {
  const emailContent = {
    to: data.applicantEmail,
    subject: 'Welcome to AbleGo - Application Approved!',
    html: `
      <h2>Congratulations! Your Application Has Been Approved</h2>
      <p>Dear ${data.applicantName},</p>
      
      <p>We're excited to inform you that your application to join AbleGo has been approved!</p>
      
      <p>You can now create your account and access your dashboard:</p>
      <a href="https://ablego.co.uk/signup?ref=${data.applicationId}" 
         style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Create Your Account
      </a>
      
      ${data.adminNotes ? `<p><strong>Admin Notes:</strong> ${data.adminNotes}</p>` : ''}
      
      <p>Welcome to the AbleGo family!</p>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        If you have any questions, please contact us at support@ablego.co.uk
      </p>
    `
  }

  await supabaseClient
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      message: `Application approved notification sent to ${data.applicantEmail}`,
      type: 'system',
      data: {
        email_content: emailContent,
        application_id: data.applicationId,
        notification_type: 'applicant_email'
      }
    })

  console.log('Approval notification created for application:', data.applicationId)
}

async function sendApplicationRejectedEmail(
  supabaseClient: ReturnType<typeof createClient>,
  data: NotificationRequest
) {
  const emailContent = {
    to: data.applicantEmail,
    subject: 'AbleGo Application Update',
    html: `
      <h2>Application Status Update</h2>
      <p>Dear ${data.applicantName},</p>
      
      <p>Thank you for your interest in joining AbleGo. After careful review, we are unable to approve your application at this time.</p>
      
      ${data.rejectionReason ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>` : ''}
      
      <p>You are welcome to reapply in the future once you have addressed any concerns mentioned above.</p>
      
      <p>If you have any questions about this decision, please contact us at support@ablego.co.uk</p>
      
      <p>Thank you for your understanding.</p>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from AbleGo.
      </p>
    `
  }

  await supabaseClient
    .from('notifications')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      message: `Application rejection notification sent to ${data.applicantEmail}`,
      type: 'system',
      data: {
        email_content: emailContent,
        application_id: data.applicationId,
        notification_type: 'applicant_email'
      }
    })

  console.log('Rejection notification created for application:', data.applicationId)
}