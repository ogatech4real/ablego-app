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

    console.log('📧 Starting email queue processing...', {
      timestamp: new Date().toISOString(),
      function: 'process-email-queue'
    })

    // Get pending email notifications with better filtering
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .eq('sent', false)
      .in('delivery_status', ['pending', 'processing'])
      .lt('retry_count', 3) // Only process emails that haven't exceeded max retries
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('❌ Failed to fetch pending emails:', fetchError)
      throw new Error(`Failed to fetch emails: ${fetchError.message}`)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('📭 No pending emails to process')
      return new Response(
        JSON.stringify({ 
          message: 'No pending emails to process',
          processed: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📧 Processing ${pendingEmails.length} pending emails...`)

    const results = []
    let successfulEmails = 0
    let failedEmails = 0

    for (const email of pendingEmails) {
      try {
        // Mark email as processing
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            delivery_status: 'processing',
            processing_attempts: (email.processing_attempts || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id)

        console.log('📧 PROCESSING EMAIL:', {
          id: email.id,
          to: email.recipient_email,
          from: 'admin@ablego.co.uk',
          subject: email.subject,
          booking_id: email.booking_id,
          type: email.notification_type,
          retry_count: email.retry_count || 0,
          timestamp: new Date().toISOString()
        })

        // Use real SMTP function to send email
        let emailSent = false
        let smtpError = null
        
        try {
          const { data: emailResult, error: emailError } = await supabaseClient.functions.invoke('send-email-smtp', {
            body: {
              to: email.recipient_email,
              from: 'admin@ablego.co.uk',
              subject: email.subject,
              html: email.html_content
            }
          })

          if (!emailError && emailResult?.message) {
            emailSent = true
            console.log('✅ Email sent successfully via SMTP:', {
              recipient: email.recipient_email,
              subject: email.subject,
              method: 'real_smtp'
            })
          } else {
            smtpError = emailError?.message || 'Unknown SMTP error'
            console.log('❌ SMTP function failed:', smtpError)
          }
        } catch (smtpError) {
          smtpError = smtpError.message
          console.log('❌ SMTP function error:', smtpError)
        }

        // Fallback: Try Supabase auth invite method if SMTP fails
        if (!emailSent) {
          try {
            console.log('🔄 Trying fallback email method...')
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
              console.log('✅ Email sent via fallback method:', email.recipient_email)
            } else {
              console.log('❌ Fallback method failed:', inviteError.message)
              smtpError = smtpError || inviteError.message
            }
          } catch (inviteError) {
            console.log('❌ Fallback method error:', inviteError.message)
            smtpError = smtpError || inviteError.message
          }
        }

        if (emailSent) {
          // Mark email as sent successfully
          const { error: updateError } = await supabaseClient
            .from('admin_email_notifications')
            .update({
              sent: true,
              sent_at: new Date().toISOString(),
              delivery_status: 'sent',
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)

          if (updateError) {
            console.error('Failed to mark email as sent:', updateError)
            results.push({
              email_id: email.id,
              success: false,
              error: updateError.message,
              recipient: email.recipient_email
            })
            failedEmails++
          } else {
            results.push({
              email_id: email.id,
              success: true,
              recipient: email.recipient_email,
              type: email.notification_type,
              subject: email.subject,
              method: 'real_smtp',
              sent_at: new Date().toISOString()
            })
            successfulEmails++
          }
        } else {
          // Mark email as failed and increment retry count
          const newRetryCount = (email.retry_count || 0) + 1
          const deliveryStatus = newRetryCount >= (email.max_retries || 3) ? 'failed' : 'pending'
          
          const { error: updateError } = await supabaseClient
            .from('admin_email_notifications')
            .update({
              delivery_status: deliveryStatus,
              delivery_error: smtpError,
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)

          if (updateError) {
            console.error('Failed to update email retry status:', updateError)
          }

          results.push({
            email_id: email.id,
            success: false,
            recipient: email.recipient_email,
            error: smtpError || 'All email methods failed',
            retry_count: newRetryCount,
            delivery_status: deliveryStatus
          })
          failedEmails++
        }
      } catch (emailError) {
        console.error('Error processing email:', emailError)
        results.push({
          email_id: email.id,
          success: false,
          error: emailError.message,
          recipient: email.recipient_email
        })
        failedEmails++
      }
    }

    // Log processing summary
    console.log('📧 Email processing completed:', {
      total_processed: pendingEmails.length,
      successful: successfulEmails,
      failed: failedEmails,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        message: `Processed ${pendingEmails.length} emails using admin@ablego.co.uk SMTP`,
        results,
        summary: {
          total_processed: pendingEmails.length,
          successful: successfulEmails,
          failed: failedEmails,
          success_rate: pendingEmails.length > 0 ? ((successfulEmails / pendingEmails.length) * 100).toFixed(2) + '%' : '0%'
        },
        smtp_config: 'Using admin@ablego.co.uk SMTP setup from Supabase',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Email processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})