import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get pending email notifications
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to process' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const results = []

    for (const email of pendingEmails) {
      try {
        // In a real implementation, you would integrate with an email service like:
        // - SendGrid
        // - Resend
        // - AWS SES
        // - Postmark
        
        // For now, we'll simulate email sending and log the content
        console.log('Sending email:', {
          to: email.recipient_email,
          subject: email.subject,
          booking_id: email.booking_id,
          type: email.notification_type
        })

        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 100))

        // Mark email as sent
        const { error: updateError } = await supabaseClient
          .from('admin_email_notifications')
          .update({
            sent: true,
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id)

        if (updateError) {
          console.error('Failed to mark email as sent:', updateError)
          results.push({
            email_id: email.id,
            success: false,
            error: updateError.message
          })
        } else {
          results.push({
            email_id: email.id,
            success: true,
            recipient: email.recipient_email,
            type: email.notification_type
          })
        }

      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        results.push({
          email_id: email.id,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} emails`,
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Email processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper function to integrate with actual email service
async function sendEmailViaService(emailData: {
  to: string;
  subject: string;
  html: string;
}) {
  // Example integration with Resend (you can replace with your preferred service)
  /*
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AbleGo <noreply@ablego.co.uk>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email service error: ${response.status}`)
  }

  return await response.json()
  */
  
  // For now, just log the email content
  console.log('Email would be sent:', emailData)
  return { success: true }
}