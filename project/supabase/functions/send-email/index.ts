import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed",
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { to, subject, text, html } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return new Response(JSON.stringify({
        error: "Missing required fields: to, subject, and either text or html content",
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get SMTP configuration from database
    const { data: smtpData, error: smtpError } = await supabase
      .from("email_configuration")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (smtpError || !smtpData) {
      console.error("Error fetching SMTP config:", smtpError);
      return new Response(JSON.stringify({
        error: "Could not retrieve SMTP configuration from database",
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const smtpConfig: SmtpConfig = {
      host: smtpData.smtp_host,
      port: smtpData.smtp_port,
      username: smtpData.smtp_username,
      password: smtpData.smtp_password,
      fromEmail: smtpData.smtp_from_email,
      fromName: smtpData.smtp_from_name,
      secure: smtpData.smtp_secure,
    };

    console.log('📧 Sending email using SMTP configuration:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username,
      fromEmail: smtpConfig.fromEmail,
      to: to,
      subject: subject
    });

    // Initialize SMTP client
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
    });

    // Format the from address with name if provided
    const from = smtpConfig.fromName 
      ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail;

    // Send the email
    await client.send({
      from: from,
      to: to,
      subject: subject,
      content: text || '',
      html: html || '',
    });

    // Close the connection
    await client.close();

    console.log('✅ Email sent successfully to:', to);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      recipient: to,
      subject: subject,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Error sending email:", error);
    
    return new Response(JSON.stringify({
      error: "Failed to send email",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
