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

    // IONOS SMTP Configuration
    const smtpConfig = {
      hostname: 'smtp.ionos.co.uk',
      port: 587,
      username: 'admin@ablego.co.uk',
      password: 'CareGold17',
      tls: true,
      auth: {
        username: 'admin@ablego.co.uk',
        password: 'CareGold17'
      }
    }

    // Set default from address if not provided
    const fromEmail = emailData.from || 'admin@ablego.co.uk'
    const fromName = emailData.fromName || 'AbleGo Ltd'

    console.log('📧 SENDING EMAIL VIA IONOS SMTP:', {
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
      console.log('🔗 Connecting to IONOS SMTP server...')
      
      await client.send({
        from: `${fromName} <${fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.text || 'Please view this email in HTML format',
        html: emailData.html,
      });

      await client.close();
      
      console.log('✅ Email sent successfully via IONOS SMTP:', {
        recipient: emailData.to,
        subject: emailData.subject,
        method: 'ionos_smtp',
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipient: emailData.to,
          subject: emailData.subject,
          method: 'ionos_smtp',
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