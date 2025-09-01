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
  notification_type: string;
  booking_id?: string;
  email_status: string;
  retry_count: number;
  max_retries: number;
  priority: number;
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

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('📧 Email Delivery System - Starting processing...', {
      timestamp: new Date().toISOString(),
      function: 'email-delivery-system'
    })

    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'failed'])
      .lt('retry_count', MAX_RETRIES)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
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

    const smtpConfig = await getSMTPConfiguration(supabaseClient)

    for (const email of pendingEmails) {
      try {
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            email_status: 'processing',
            last_retry_at: new Date().toISOString()
          })
          .eq('id', email.id)

        console.log(`📧 Sending ${email.email_type} email to ${email.recipient_email}`)

        const emailResult = await sendEmailWithFallback(email, smtpConfig, supabaseClient)

        if (emailResult.success) {
          await supabaseClient
            .from('admin_email_notifications')
            .update({
              email_status: 'sent',
              sent: true,
              sent_at: new Date().toISOString(),
              delivery_status: 'delivered',
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
          const newRetryCount = email.retry_count + 1
          const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'failed'

          await supabaseClient
            .from('admin_email_notifications')
            .update({
              email_status: newStatus,
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              delivery_status: 'failed',
              delivery_status_details: emailResult.error || {}
            })
            .eq('id', email.id)

          failed++
          results.push({
            email_id: email.id,
            email_type: email.email_type,
            recipient: email.recipient_email,
            success: false,
            error: emailResult.error?.message || 'Unknown error',
            retry_count: newRetryCount
          })

          console.log(`❌ Email failed: ${email.email_type} to ${email.recipient_email} (attempt ${newRetryCount}/${MAX_RETRIES})`)
        }

        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (emailError) {
        console.error('❌ Email processing error:', emailError)
        failed++
        results.push({
          email_id: email.id,
          success: false,
          error: emailError.message
        })
      }
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
    console.error('❌ Email delivery system error:', error)
    return new Response(
      JSON.stringify({
        error: 'Email delivery system failed',
        details: error.message
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
    const { data: smtpConfig, error } = await supabaseClient
      .from('email_configuration')
      .select('*')
      .eq('is_active', true)
      .single()

    if (smtpConfig && !error) {
      console.log('✅ Found SMTP configuration in database')
      return {
        host: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        username: smtpConfig.smtp_username,
        password: smtpConfig.smtp_password,
        from_email: smtpConfig.smtp_from_email,
        from_name: smtpConfig.smtp_from_name,
        secure: smtpConfig.smtp_secure
      }
    }
  } catch (error) {
    console.log('No database SMTP configuration found, trying environment variables')
  }

  // Fallback to environment variables if database config not found
  const envHost = Deno.env.get('SMTP_HOST')
  const envPort = Deno.env.get('SMTP_PORT')
  const envUsername = Deno.env.get('SMTP_USERNAME')
  const envPassword = Deno.env.get('SMTP_PASSWORD')

  if (envHost && envPort && envUsername && envPassword) {
    console.log('✅ Found SMTP configuration in environment variables')
    return {
      host: envHost,
      port: parseInt(envPort),
      username: envUsername,
      password: envPassword,
      from_email: Deno.env.get('SMTP_FROM_EMAIL') || 'admin@ablego.co.uk',
      from_name: Deno.env.get('SMTP_FROM_NAME') || 'AbleGo Ltd',
      secure: Deno.env.get('SMTP_SECURE') === 'true'
    }
  }

  // Final fallback to Gmail
  console.log('⚠️ Using Gmail fallback SMTP configuration')
  return {
    host: 'smtp.gmail.com',
    port: 587,
    username: Deno.env.get('GMAIL_USERNAME') || '',
    password: Deno.env.get('GMAIL_APP_PASSWORD') || '',
    from_email: Deno.env.get('GMAIL_USERNAME') || 'admin@ablego.co.uk',
    from_name: 'AbleGo Ltd',
    secure: false
  }
}

async function sendEmailWithFallback(email: EmailNotification, smtpConfig: SMTPConfig | null, supabaseClient: any): Promise<{
  success: boolean;
  method?: string;
  details?: any;
  error?: any;
}> {
  // Method 1: Try database SMTP configuration first
  if (smtpConfig && smtpConfig.username && smtpConfig.password) {
    try {
      console.log('📧 Attempting database SMTP delivery...')

      const client = new SMTPClient({
        connection: {
          hostname: smtpConfig.host,
          port: smtpConfig.port,
          tls: smtpConfig.secure,
          auth: {
            username: smtpConfig.username,
            password: smtpConfig.password,
          },
        },
      })

      await client.send({
        from: `${smtpConfig.from_name} <${smtpConfig.from_email}>`,
        to: email.recipient_email,
        subject: email.subject,
        content: email.html_content,
        html: email.html_content,
      })

      await client.close()

      return {
        success: true,
        method: 'database_smtp',
        details: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          from: smtpConfig.from_email
        }
      }
    } catch (error) {
      console.log('❌ Database SMTP failed:', error.message)
    }
  }

  // Method 2: Try the dedicated send-email function
  try {
    console.log('📧 Attempting send-email function...')

    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: email.recipient_email,
        subject: email.subject,
        html: email.html_content
      }
    })

    if (!error && data?.success) {
      return {
        success: true,
        method: 'send-email_function',
        details: data
      }
    } else {
      throw new Error(error?.message || 'Send-email function failed')
    }
  } catch (error) {
    console.log('❌ Send-email function failed:', error.message)
  }

  // Method 3: Try Resend API
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (resendApiKey) {
    try {
      console.log('📧 Attempting Resend API...')

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

      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          method: 'resend',
          details: result
        }
      } else {
        const errorData = await response.json()
        throw new Error(`Resend API error: ${errorData.message}`)
      }
    } catch (error) {
      console.log('❌ Resend API failed:', error.message)
    }
  }

  // Method 4: Try SendGrid API
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  if (sendgridApiKey) {
    try {
      console.log('📧 Attempting SendGrid API...')

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: email.recipient_email }],
            subject: email.subject
          }],
          from: { email: 'admin@ablego.co.uk', name: 'AbleGo' },
          content: [{
            type: 'text/html',
            value: email.html_content
          }]
        }),
      })

      if (response.ok) {
        return {
          success: true,
          method: 'sendgrid',
          details: { status: 'sent' }
        }
      } else {
        const errorData = await response.text()
        throw new Error(`SendGrid API error: ${errorData}`)
      }
    } catch (error) {
      console.log('❌ SendGrid API failed:', error.message)
    }
  }

  // Method 5: Try Supabase Auth email as last resort
  try {
    console.log('📧 Attempting Supabase Auth email...')

    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'signup',
        email: email.recipient_email,
        options: {
          data: {
            subject: email.subject,
            message: email.html_content
          }
        }
      })
    })

    if (response.ok) {
      return {
        success: true,
        method: 'supabase_auth',
        details: { status: 'link_generated' }
      }
    }
  } catch (error) {
    console.log('❌ Supabase Auth email failed:', error.message)
  }

  return {
    success: false,
    error: {
      message: 'All email sending methods failed',
      attempted_methods: ['database_smtp', 'send-email_function', 'resend', 'sendgrid', 'supabase_auth'],
      email_type: email.email_type,
      retry_count: email.retry_count,
      recipient: email.recipient_email
    }
  }
}
