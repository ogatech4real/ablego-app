import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  from: string;
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

    // Enhanced SMTP Configuration from environment variables
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || 'admin@ablego.co.uk',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      tls: true,
      auth: {
        username: Deno.env.get('SMTP_USERNAME') || 'admin@ablego.co.uk',
        password: Deno.env.get('SMTP_PASSWORD') || ''
      }
    }

    // Validate SMTP configuration
    if (!smtpConfig.password) {
      console.error('❌ SMTP password not configured')
      return new Response(
        JSON.stringify({ 
          error: 'SMTP password not configured',
          smtp_host: smtpConfig.hostname,
          smtp_user: smtpConfig.username,
          smtp_port: smtpConfig.port
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('📧 SENDING EMAIL VIA REAL SMTP:', {
      to: emailData.to,
      from: emailData.from,
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
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.text || 'Please view this email in HTML format',
        html: emailData.html,
      });

      await client.close();
      
      console.log('✅ Email sent successfully to:', {
        recipient: emailData.to,
        subject: emailData.subject,
        method: 'real_smtp',
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ 
          message: 'Email sent successfully via SMTP',
          recipient: emailData.to,
          subject: emailData.subject,
          method: 'real_smtp',
          smtp_config: {
            host: smtpConfig.hostname,
            port: smtpConfig.port,
            user: smtpConfig.username,
            tls: smtpConfig.tls
          },
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (smtpError) {
      console.error('❌ SMTP sending failed:', {
        error: smtpError.message,
        recipient: emailData.to,
        subject: emailData.subject,
        smtp_host: smtpConfig.hostname,
        smtp_user: smtpConfig.username,
        timestamp: new Date().toISOString()
      })
      
      await client.close();
      
      // Provide detailed error information
      let errorDetails = smtpError.message
      let errorCode = 'SMTP_ERROR'
      
      if (smtpError.message.includes('authentication')) {
        errorCode = 'SMTP_AUTH_ERROR'
        errorDetails = 'SMTP authentication failed. Please check username and password.'
      } else if (smtpError.message.includes('connection')) {
        errorCode = 'SMTP_CONNECTION_ERROR'
        errorDetails = 'Failed to connect to SMTP server. Please check host and port.'
      } else if (smtpError.message.includes('TLS')) {
        errorCode = 'SMTP_TLS_ERROR'
        errorDetails = 'TLS connection failed. Please check TLS configuration.'
      } else if (smtpError.message.includes('timeout')) {
        errorCode = 'SMTP_TIMEOUT_ERROR'
        errorDetails = 'SMTP operation timed out. Please try again.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email via SMTP',
          error_code: errorCode,
          details: errorDetails,
          recipient: emailData.to,
          subject: emailData.subject,
          smtp_config: {
            host: smtpConfig.hostname,
            port: smtpConfig.port,
            user: smtpConfig.username,
            tls: smtpConfig.tls
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('❌ SMTP email function error:', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ 
        error: 'SMTP function error',
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