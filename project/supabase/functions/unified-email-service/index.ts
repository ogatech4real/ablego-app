import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotification {
  id: string;
  recipient_email: string;
  subject: string;
  html_content: string;
  email_type: string;
  email_status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  booking_id?: string;
  template_data?: any;
  created_at: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  secure: boolean;
}

interface EmailResult {
  success: boolean;
  method: string;
  details?: any;
  error?: string;
}

const BATCH_SIZE = 15;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('📧 Unified Email Service - Starting processing...', {
      timestamp: new Date().toISOString(),
      function: 'unified-email-service'
    })

    // Get pending emails ordered by priority and creation time
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'failed'])
      .lt('retry_count', MAX_RETRIES)
      .order('priority', { ascending: false }) // Higher priority first
      .order('created_at', { ascending: true }) // Older emails first
      .limit(BATCH_SIZE)

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
          successful: 0,
          failed: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📧 Processing ${pendingEmails.length} emails...`)

    const results = []
    let successful = 0
    let failed = 0

    // Get SMTP configuration
    const smtpConfig = await getSMTPConfiguration(supabaseClient)

    for (const email of pendingEmails) {
      try {
        // Mark as processing
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            email_status: 'processing',
            last_retry_at: new Date().toISOString()
          })
          .eq('id', email.id)

        console.log(`📧 Sending ${email.email_type} email to ${email.recipient_email}`)

        // Send email using multiple methods with fallbacks
        const emailResult = await sendEmailWithFallbacks(email, smtpConfig)

        if (emailResult.success) {
          // Mark as sent
          await supabaseClient
            .from('admin_email_notifications')
            .update({
              email_status: 'sent',
              sent: true,
              sent_at: new Date().toISOString(),
              delivery_status_details: emailResult.details || {}
            })
            .eq('id', email.id)

          successful++
          results.push({
            email_id: email.id,
            email_type: email.email_type,
            recipient: email.recipient_email,
            success: true,
            method: emailResult.method
          })

          console.log(`✅ Email sent successfully: ${email.email_type} to ${email.recipient_email}`)

        } else {
          // Mark as failed and increment retry count
          const newRetryCount = email.retry_count + 1
          const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'queued'

          await supabaseClient
            .from('admin_email_notifications')
            .update({
              email_status: newStatus,
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              delivery_status_details: { error: emailResult.error }
            })
            .eq('id', email.id)

          failed++
          results.push({
            email_id: email.id,
            email_type: email.email_type,
            recipient: email.recipient_email,
            success: false,
            error: emailResult.error,
            retry_count: newRetryCount
          })

          console.log(`❌ Email failed: ${email.email_type} to ${email.recipient_email} (attempt ${newRetryCount}/${MAX_RETRIES})`)
        }

      } catch (emailError) {
        console.error('Email processing error:', emailError)
        
        // Mark as failed
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            email_status: 'failed',
            retry_count: email.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            delivery_status_details: { error: emailError.message }
          })
          .eq('id', email.id)

        failed++
        results.push({
          email_id: email.id,
          email_type: email.email_type || 'unknown',
          recipient: email.recipient_email,
          success: false,
          error: emailError.message
        })
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`📧 Email processing completed: ${successful} successful, ${failed} failed`)

    return new Response(
      JSON.stringify({
        message: `Email processing completed`,
        processed: pendingEmails.length,
        successful,
        failed,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Unified Email Service error:', error)
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

async function getSMTPConfiguration(supabaseClient: any): Promise<SMTPConfig | null> {
  try {
    const { data: config, error } = await supabaseClient
      .from('email_configuration')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !config) {
      console.log('⚠️ No SMTP configuration found, will use fallback methods')
      return null
    }

    return {
      host: config.smtp_host,
      port: config.smtp_port,
      username: config.smtp_username,
      password: config.smtp_password,
      from_email: config.smtp_from_email,
      from_name: config.smtp_from_name,
      secure: config.smtp_secure
    }
  } catch (error) {
    console.log('⚠️ Error getting SMTP configuration:', error)
    return null
  }
}

async function sendEmailWithFallbacks(email: EmailNotification, smtpConfig: SMTPConfig | null): Promise<EmailResult> {
  // Method 1: Try SMTP first (if configured)
  if (smtpConfig) {
    try {
      const result = await sendEmailViaSMTP(email, smtpConfig)
      if (result.success) {
        return { ...result, method: 'smtp' }
      }
    } catch (error) {
      console.log('⚠️ SMTP failed, trying fallback methods')
    }
  }

  // Method 2: Try Resend (if configured)
  try {
    const result = await sendEmailViaResend(email)
    if (result.success) {
      return { ...result, method: 'resend' }
    }
  } catch (error) {
    console.log('⚠️ Resend failed, trying next fallback')
  }

  // Method 3: Try SendGrid (if configured)
  try {
    const result = await sendEmailViaSendGrid(email)
    if (result.success) {
      return { ...result, method: 'sendgrid' }
    }
  } catch (error) {
    console.log('⚠️ SendGrid failed, trying final fallback')
  }

  // Method 4: Try Supabase Auth (as last resort)
  try {
    const result = await sendEmailViaSupabaseAuth(email)
    if (result.success) {
      return { ...result, method: 'supabase_auth' }
    }
  } catch (error) {
    console.log('⚠️ Supabase Auth failed')
  }

  return {
    success: false,
    method: 'none',
    error: 'All email methods failed'
  }
}

async function sendEmailViaSMTP(email: EmailNotification, config: SMTPConfig): Promise<EmailResult> {
  try {
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: {
          username: config.username,
          password: config.password,
        },
      },
    })

    await client.send({
      from: `${config.from_name} <${config.from_email}>`,
      to: email.recipient_email,
      subject: email.subject,
      content: email.html_content,
      html: email.html_content,
    })

    await client.close()

    return { success: true, details: { method: 'smtp' } }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendEmailViaResend(email: EmailNotification): Promise<EmailResult> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return { success: false, error: 'Resend API key not configured' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AbleGo <noreply@ablego.co.uk>',
        to: email.recipient_email,
        subject: email.subject,
        html: email.html_content,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Resend API error: ${error}` }
    }

    return { success: true, details: { method: 'resend' } }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendEmailViaSendGrid(email: EmailNotification): Promise<EmailResult> {
  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) {
      return { success: false, error: 'SendGrid API key not configured' }
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email.recipient_email }] }],
        from: { email: 'noreply@ablego.co.uk', name: 'AbleGo' },
        subject: email.subject,
        content: [{ type: 'text/html', value: email.html_content }],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `SendGrid API error: ${error}` }
    }

    return { success: true, details: { method: 'sendgrid' } }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function sendEmailViaSupabaseAuth(email: EmailNotification): Promise<EmailResult> {
  try {
    // This is a fallback that would require additional setup
    // For now, we'll return false to indicate it's not available
    return { success: false, error: 'Supabase Auth email not configured' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
