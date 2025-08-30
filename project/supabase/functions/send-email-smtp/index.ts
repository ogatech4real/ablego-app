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

    // Get SMTP configuration from environment variables first, then database
    let smtpConfig = await getSMTPConfiguration()

    if (!smtpConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'SMTP configuration not found',
          details: 'Neither environment variables nor database configuration are available'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Set default from address if not provided
    const fromEmail = emailData.from || smtpConfig.smtp_from_email || smtpConfig.smtp_user
    const fromName = emailData.fromName || smtpConfig.smtp_from_name || 'AbleGo Ltd'

    console.log('📧 SENDING EMAIL VIA SMTP:', {
      to: emailData.to,
      from: `${fromName} <${fromEmail}>`,
      subject: emailData.subject,
      smtp_host: smtpConfig.smtp_host,
      smtp_user: smtpConfig.smtp_user,
      smtp_port: smtpConfig.smtp_port,
      tls_enabled: true,
      config_source: smtpConfig.source,
      timestamp: new Date().toISOString()
    })

    // Create SMTP client and send email
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.smtp_host,
        port: parseInt(smtpConfig.smtp_port),
        tls: true,
        auth: {
          username: smtpConfig.smtp_user,
          password: smtpConfig.smtp_pass,
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
        config_source: smtpConfig.source,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipient: emailData.to,
          subject: emailData.subject,
          method: 'smtp',
          config_source: smtpConfig.source,
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
          config_source: smtpConfig.source,
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

async function getSMTPConfiguration() {
  // First, try environment variables
  const envHost = Deno.env.get('SMTP_HOST')
  const envPort = Deno.env.get('SMTP_PORT')
  const envUser = Deno.env.get('SMTP_USER')
  const envPass = Deno.env.get('SMTP_PASS')
  const envFromName = Deno.env.get('SMTP_FROM_NAME')
  const envFromEmail = Deno.env.get('SMTP_FROM_EMAIL')

  if (envHost && envPort && envUser && envPass) {
    console.log('✅ Using environment variables for SMTP configuration')
    return {
      smtp_host: envHost,
      smtp_port: envPort,
      smtp_user: envUser,
      smtp_pass: envPass,
      smtp_from_name: envFromName || 'AbleGo Ltd',
      smtp_from_email: envFromEmail || envUser,
      source: 'environment_variables'
    }
  }

  // Fallback to database configuration
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: configData, error: configError } = await supabaseClient
      .rpc('get_smtp_config')

    if (configError || !configData?.success) {
      console.error('❌ Failed to get SMTP config from database:', configError)
      return null
    }

    const config = configData.config
    console.log('✅ Using database configuration for SMTP')
    return {
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_user: config.smtp_user,
      smtp_pass: config.smtp_pass,
      smtp_from_name: config.smtp_from_name,
      smtp_from_email: config.smtp_from_email,
      source: 'database'
    }
  } catch (error) {
    console.error('❌ Error getting SMTP config from database:', error)
    return null
  }
}