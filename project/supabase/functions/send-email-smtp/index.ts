import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailData: EmailRequest = await req.json()

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required email fields',
          required: ['to', 'subject', 'html'],
          received: Object.keys(emailData)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpUsername = Deno.env.get('SMTP_USER')
    const smtpPassword = Deno.env.get('SMTP_PASS')
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME')
    const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL')

    // Validate SMTP configuration
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      console.error('❌ SMTP environment variables not configured')
      return new Response(
        JSON.stringify({ 
          error: 'SMTP configuration not found in environment variables',
          required_vars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
          configured: {
            host: !!smtpHost,
            port: !!smtpPort,
            username: !!smtpUsername,
            password: !!smtpPassword
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // IONOS SMTP Configuration from environment variables
    const smtpConfig = {
      hostname: smtpHost,
      port: parseInt(smtpPort),
      username: smtpUsername,
      password: smtpPassword,
      tls: true,
      auth: {
        username: smtpUsername,
        password: smtpPassword
      }
    }

    // Set default from address if not provided
    const fromEmail = emailData.from || smtpFromEmail || smtpUsername
    const fromName = emailData.fromName || smtpFromName || 'AbleGo Ltd'

    console.log('📧 SENDING EMAIL VIA SMTP:', {
      to: emailData.to,
      from: `${fromName} <${fromEmail}>`,
      subject: emailData.subject,
      smtp_host: smtpConfig.hostname,
      smtp_user: smtpConfig.username,
      smtp_port: smtpConfig.port,
      tls_enabled: smtpConfig.tls,
      timestamp: new Date().toISOString()
    })

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

    try {
      console.log('🔗 Connecting to SMTP server...')
      
      await client.send({
        from: `${fromName} <${fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.text || 'Please view this email in HTML format',
        html: emailData.html,
      });

      await client.close();
      
      console.log('✅ Email sent successfully via SMTP:', {
        recipient: emailData.to,
        subject: emailData.subject,
        method: 'smtp',
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipient: emailData.to,
          subject: emailData.subject,
          method: 'smtp',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (smtpError) {
      console.error('❌ SMTP Error:', smtpError)
      
      // Provide specific error details
      let errorCode = 'SMTP_ERROR'
      let errorDetails = 'Unknown SMTP error'
      
      if (smtpError.message.includes('authentication')) {
        errorCode = 'AUTH_ERROR'
        errorDetails = 'SMTP authentication failed - check username/password'
      } else if (smtpError.message.includes('connection')) {
        errorCode = 'CONNECTION_ERROR'
        errorDetails = 'Failed to connect to SMTP server'
      } else if (smtpError.message.includes('TLS')) {
        errorCode = 'TLS_ERROR'
        errorDetails = 'TLS connection failed'
      } else if (smtpError.message.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR'
        errorDetails = 'SMTP request timed out'
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorDetails,
          error_code: errorCode,
          details: smtpError.message,
          recipient: emailData.to,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('❌ Email function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
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