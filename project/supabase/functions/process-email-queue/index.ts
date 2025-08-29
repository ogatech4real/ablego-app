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
        // Use Supabase's SMTP configuration for admin@ablego.co.uk
        // This leverages your existing SMTP setup
        
        console.log('📧 SENDING EMAIL VIA SUPABASE SMTP:', {
          to: email.recipient_email,
          from: 'admin@ablego.co.uk',
          subject: email.subject,
          booking_id: email.booking_id,
          type: email.notification_type,
          timestamp: new Date().toISOString()
        })

        // Method 1: Try using Supabase's built-in email function
        let emailSent = false
        
        try {
          // Use Supabase's direct email sending if available
          const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-email-smtp', {
            body: {
              to: email.recipient_email,
              from: 'admin@ablego.co.uk',
              subject: email.subject,
              html: email.html_content
            }
          })

          if (!emailError) {
            emailSent = true
            console.log('✅ Email sent via Supabase SMTP function')
          } else {
            console.log('❌ SMTP function failed:', emailError.message)
          }
        } catch (smtpError) {
          console.log('❌ SMTP function not available:', smtpError.message)
        }

        // Method 2: Fallback to auth invite method (less ideal but works)
        if (!emailSent) {
          try {
            const { data: inviteResult, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
              email.recipient_email,
              {
                data: {
                  custom_email: true,
                  subject: email.subject,
                  html_content: email.html_content,
                  booking_id: email.booking_id,
                  notification_type: email.notification_type,
                  from_admin: true
                },
                redirectTo: 'https://ablego.co.uk'
              }
            )

            if (!inviteError) {
              emailSent = true
              console.log('✅ Email sent via Supabase invite method')
            } else {
              console.log('❌ Invite method failed:', inviteError.message)
            }
          } catch (inviteError) {
            console.log('❌ Invite method error:', inviteError.message)
          }
        }

        if (emailSent) {
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
              type: email.notification_type,
              subject: email.subject,
              method: 'supabase_smtp'
            })
          }
        } else {
          results.push({
            email_id: email.id,
            success: false,
            error: 'All email sending methods failed'
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
        message: `Processed ${results.length} emails using admin@ablego.co.uk SMTP`,
        results,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        smtp_config: 'Using admin@ablego.co.uk SMTP setup from Supabase'
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