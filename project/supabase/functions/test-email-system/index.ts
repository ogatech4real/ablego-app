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

    console.log('🧪 Starting email system test...', {
      timestamp: new Date().toISOString(),
      function: 'test-email-system'
    })

    // Test 1: Check SMTP Configuration
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || 'admin@ablego.co.uk',
      password: Deno.env.get('SMTP_PASSWORD') || '',
      tls: true
    }

    const configTest = {
      smtp_host: smtpConfig.hostname,
      smtp_port: smtpConfig.port,
      smtp_user: smtpConfig.username,
      smtp_password_configured: !!smtpConfig.password,
      tls_enabled: smtpConfig.tls
    }

    console.log('📧 SMTP Configuration:', configTest)

    // Test 2: Test SMTP Connection
    let smtpTest = { success: false, error: null }
    
    if (smtpConfig.password) {
      try {
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

        await client.send({
          from: smtpConfig.username,
          to: 'test@example.com',
          subject: 'AbleGo Email System Test',
          content: 'This is a test email to verify SMTP configuration.',
          html: `
            <html>
              <body>
                <h2>AbleGo Email System Test</h2>
                <p>This is a test email to verify SMTP configuration is working properly.</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>SMTP Host: ${smtpConfig.hostname}</li>
                  <li>SMTP Port: ${smtpConfig.port}</li>
                  <li>SMTP User: ${smtpConfig.username}</li>
                  <li>TLS Enabled: ${smtpConfig.tls}</li>
                  <li>Test Time: ${new Date().toISOString()}</li>
                </ul>
                <p>If you receive this email, the SMTP configuration is working correctly!</p>
              </body>
            </html>
          `
        });

        await client.close();
        smtpTest = { success: true, error: null }
        console.log('✅ SMTP test successful')
      } catch (error) {
        smtpTest = { success: false, error: error.message }
        console.error('❌ SMTP test failed:', error.message)
      }
    } else {
      smtpTest = { success: false, error: 'SMTP password not configured' }
      console.error('❌ SMTP password not configured')
    }

    // Test 3: Check Email Queue Status
    const { data: queueStatus, error: queueError } = await supabaseClient
      .from('admin_email_notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: false })
      .limit(5)

    const queueTest = {
      success: !queueError,
      error: queueError?.message,
      pending_emails: queueStatus?.length || 0,
      recent_emails: queueStatus?.map(email => ({
        id: email.id,
        recipient: email.recipient_email,
        subject: email.subject,
        status: email.delivery_status,
        created_at: email.created_at
      })) || []
    }

    console.log('📧 Email Queue Status:', queueTest)

    // Test 4: Test Email Queue Processing Function
    let queueProcessingTest = { success: false, error: null, result: null }
    
    try {
      const { data: processingResult, error: processingError } = await supabaseClient.functions.invoke('process-email-queue', {
        body: {}
      })

      if (processingError) {
        queueProcessingTest = { success: false, error: processingError.message, result: null }
        console.error('❌ Email queue processing test failed:', processingError.message)
      } else {
        queueProcessingTest = { success: true, error: null, result: processingResult }
        console.log('✅ Email queue processing test successful')
      }
    } catch (error) {
      queueProcessingTest = { success: false, error: error.message, result: null }
      console.error('❌ Email queue processing test failed:', error.message)
    }

    // Test 5: Check Database Functions
    const { data: functions, error: functionsError } = await supabaseClient
      .rpc('manual_process_email_queue')

    const functionsTest = {
      success: !functionsError,
      error: functionsError?.message,
      result: functions
    }

    console.log('📧 Database Functions Test:', functionsTest)

    // Compile test results
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {
        smtp_configuration: configTest,
        smtp_connection: smtpTest,
        email_queue_status: queueTest,
        queue_processing_function: queueProcessingTest,
        database_functions: functionsTest
      },
      summary: {
        total_tests: 5,
        passed_tests: [
          configTest.smtp_password_configured,
          smtpTest.success,
          queueTest.success,
          queueProcessingTest.success,
          functionsTest.success
        ].filter(Boolean).length,
        failed_tests: [
          !configTest.smtp_password_configured,
          !smtpTest.success,
          !queueTest.success,
          !queueProcessingTest.success,
          !functionsTest.success
        ].filter(Boolean).length
      },
      recommendations: []
    }

    // Generate recommendations based on test results
    if (!configTest.smtp_password_configured) {
      testResults.recommendations.push('Configure SMTP_PASSWORD environment variable')
    }
    if (!smtpTest.success) {
      testResults.recommendations.push('Check SMTP credentials and server configuration')
    }
    if (queueTest.pending_emails > 0) {
      testResults.recommendations.push(`Process ${queueTest.pending_emails} pending emails`)
    }
    if (!queueProcessingTest.success) {
      testResults.recommendations.push('Check process-email-queue function configuration')
    }

    console.log('🧪 Email system test completed:', testResults.summary)

    return new Response(
      JSON.stringify(testResults),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Email system test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Email system test failed',
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
