import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

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
          from: 'AbleGo Ltd <admin@ablego.co.uk>',
          subject: email.subject,
          booking_id: email.booking_id,
          type: email.notification_type,
          retry_count: email.retry_count || 0,
          timestamp: new Date().toISOString()
        })

        // Send email using SMTP with environment variables
        const emailResult = await sendEmailViaSMTP(email)

        if (emailResult.success) {
          // Mark email as sent
          await supabaseClient
            .from('admin_email_notifications')
            .update({
              sent: true,
              sent_at: new Date().toISOString(),
              delivery_status: 'sent',
              delivery_error: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)

          successfulEmails++
          results.push({
            id: email.id,
            recipient: email.recipient_email,
            status: 'sent',
            method: 'smtp'
          })

          console.log('✅ Email sent successfully:', {
            id: email.id,
            recipient: email.recipient_email,
            subject: email.subject,
            method: 'smtp'
          })

        } else {
          // Mark email as failed
          await supabaseClient
            .from('admin_email_notifications')
            .update({
              delivery_status: 'failed',
              delivery_error: emailResult.error,
              retry_count: (email.retry_count || 0) + 1,
              last_retry_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id)

          failedEmails++
          results.push({
            id: email.id,
            recipient: email.recipient_email,
            status: 'failed',
            error: emailResult.error
          })

          console.error('❌ Email sending failed:', {
            id: email.id,
            recipient: email.recipient_email,
            error: emailResult.error
          })
        }

      } catch (emailError) {
        console.error('❌ Email processing error:', emailError)

        // Mark email as failed
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            delivery_status: 'failed',
            delivery_error: emailError.message,
            retry_count: (email.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id)

        failedEmails++
        results.push({
          id: email.id,
          recipient: email.recipient_email,
          status: 'failed',
          error: emailError.message
        })
      }
    }

    console.log('📧 Email processing completed:', {
      total: pendingEmails.length,
      successful: successfulEmails,
      failed: failedEmails,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        message: 'Email queue processing completed',
        summary: {
          total_processed: pendingEmails.length,
          successful: successfulEmails,
          failed: failedEmails
        },
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Email queue processing error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process email queue',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendEmailViaSMTP(email: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpUsername = Deno.env.get('SMTP_USER')
    const smtpPassword = Deno.env.get('SMTP_PASS')
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME')
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL')

    // Validate SMTP configuration
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      throw new Error('SMTP environment variables not configured')
    }

    const smtpConfig = {
      hostname: smtpHost,
      port: parseInt(smtpPort),
      username: smtpUsername,
      password: smtpPassword,
      tls: true
    }

    console.log('🔗 Connecting to SMTP server...')

    // Create SMTP client and send email
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.hostname,
        port: smtpConfig.port,
        tls: smtpConfig.tls,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    });

    const fromName = smtpFromName || 'AbleGo Ltd'
    const fromEmail = smtpFromEmail || smtpUsername

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: email.recipient_email,
      subject: email.subject,
      content: 'Please view this email in HTML format',
      html: email.html_content,
    });

    await client.close();

    console.log('✅ Email sent successfully via SMTP:', {
      recipient: email.recipient_email,
      subject: email.subject,
      method: 'smtp'
    })

    return { success: true }

  } catch (smtpError) {
    console.error('❌ SMTP Error:', smtpError)
    
    // Provide specific error details
    let errorDetails = 'Unknown SMTP error'
    
    if (smtpError.message.includes('authentication')) {
      errorDetails = 'SMTP authentication failed - check username/password'
    } else if (smtpError.message.includes('connection')) {
      errorDetails = 'Failed to connect to SMTP server'
    } else if (smtpError.message.includes('TLS')) {
      errorDetails = 'TLS connection failed'
    } else if (smtpError.message.includes('timeout')) {
      errorDetails = 'SMTP request timed out'
    } else {
      errorDetails = smtpError.message
    }

    return { 
      success: false, 
      error: errorDetails 
    }
  }
}