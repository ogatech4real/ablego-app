import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  booking_id: string | null;
  template_data: any;
  created_at: string;
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

    console.log('📧 Enhanced Email Processor - Starting batch processing')

    // Get pending emails ordered by priority and creation time
    const { data: pendingEmails, error: fetchError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'failed'])
      .lt('retry_count', 'max_retries')
      .order('priority', { ascending: false }) // Higher priority first
      .order('created_at', { ascending: true }) // Older emails first
      .limit(20)

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`)
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No pending emails to process',
          processed: 0,
          successful: 0,
          failed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📧 Processing ${pendingEmails.length} emails`)

    const results = []
    let successful = 0
    let failed = 0

    for (const email of pendingEmails) {
      try {
        // Mark as sending
        await supabaseClient
          .from('admin_email_notifications')
          .update({
            email_status: 'sending',
            last_retry_at: new Date().toISOString()
          })
          .eq('id', email.id)

        console.log(`📧 Sending ${email.email_type} email to ${email.recipient_email}`)

        // Send email using multiple methods
        const emailResult = await sendEmailWithFallback(email)

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
          const newStatus = newRetryCount >= email.max_retries ? 'failed' : 'queued'

          await supabaseClient
            .from('admin_email_notifications')
            .update({
              email_status: newStatus,
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              delivery_status_details: emailResult.error || {}
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

          console.log(`❌ Email failed: ${email.email_type} to ${email.recipient_email} (attempt ${newRetryCount}/${email.max_retries})`)
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
          email_type: email.email_type,
          recipient: email.recipient_email,
          success: false,
          error: emailError.message
        })
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${pendingEmails.length} emails`,
        processed: pendingEmails.length,
        successful,
        failed,
        results,
        email_service: 'Enhanced processor with fallback methods'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Enhanced email processor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendEmailWithFallback(email: EmailNotification): Promise<{
  success: boolean;
  method?: string;
  details?: any;
  error?: any;
}> {
  // Method 1: Try Supabase SMTP (admin@ablego.co.uk)
  try {
    console.log('📧 Attempting Supabase SMTP...')
    
    // Use Supabase's built-in email capabilities
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-smtp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email.recipient_email,
        from: 'admin@ablego.co.uk',
        subject: email.subject,
        html: email.html_content
      })
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        method: 'supabase_smtp',
        details: result
      }
    }
  } catch (error) {
    console.log('❌ Supabase SMTP failed:', error.message)
  }

  // Method 2: Try external email service (if configured)
  if (Deno.env.get('RESEND_API_KEY')) {
    try {
      console.log('📧 Attempting Resend API...')
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
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
      }
    } catch (error) {
      console.log('❌ Resend API failed:', error.message)
    }
  }

  // Method 3: Try SendGrid (if configured)
  if (Deno.env.get('SENDGRID_API_KEY')) {
    try {
      console.log('📧 Attempting SendGrid API...')
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
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
      }
    } catch (error) {
      console.log('❌ SendGrid API failed:', error.message)
    }
  }

  // All methods failed
  return {
    success: false,
    error: {
      message: 'All email sending methods failed',
      attempted_methods: ['supabase_smtp', 'resend', 'sendgrid'],
      email_type: email.email_type,
      retry_count: email.retry_count
    }
  }
}