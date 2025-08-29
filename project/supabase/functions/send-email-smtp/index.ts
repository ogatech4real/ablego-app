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
        JSON.stringify({ error: 'Missing required email fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // SMTP Configuration from environment variables
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || 'admin@ablego.co.uk',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      tls: true
    }

    console.log('📧 SENDING EMAIL VIA REAL SMTP:', {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      smtp_host: smtpConfig.hostname,
      smtp_user: smtpConfig.username,
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
      await client.send({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        content: emailData.text || 'Please view this email in HTML format',
        html: emailData.html,
      });

      await client.close();
      
      console.log('✅ Email sent successfully to:', emailData.to)

      return new Response(
        JSON.stringify({ 
          message: 'Email sent successfully via SMTP',
          recipient: emailData.to,
          subject: emailData.subject,
          method: 'real_smtp',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (smtpError) {
      console.error('❌ SMTP sending failed:', smtpError)
      await client.close();
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email via SMTP',
          details: smtpError.message,
          recipient: emailData.to
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('SMTP email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})