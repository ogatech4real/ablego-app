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

    const testResults = {
      smtp_connection: false,
      email_sending: false,
      database_connection: false,
      email_queue: false,
      environment_variables: false,
      errors: [] as string[]
    }

    // Test 0: Environment Variables
    try {
      const smtpHost = Deno.env.get('SMTP_HOST')
      const smtpPort = Deno.env.get('SMTP_PORT')
      const smtpUsername = Deno.env.get('SMTP_USER')
      const smtpPassword = Deno.env.get('SMTP_PASS')
      const smtpFromName = Deno.env.get('SMTP_FROM_NAME')
      const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL')

      if (smtpHost && smtpPort && smtpUsername && smtpPassword) {
        testResults.environment_variables = true
        console.log('✅ Environment variables configured')
      } else {
        testResults.errors.push('SMTP environment variables not configured')
        console.error('❌ Missing environment variables:', {
          host: !!smtpHost,
          port: !!smtpPort,
          username: !!smtpUsername,
          password: !!smtpPassword,
          fromName: !!smtpFromName,
          fromEmail: !!smtpFromEmail
        })
      }
    } catch (error) {
      testResults.errors.push(`Environment variables test error: ${error.message}`)
    }

    // Test 1: Database Connection
    try {
      const { data: testData, error: dbError } = await supabaseClient
        .from('admin_email_notifications')
        .select('count')
        .limit(1)

      if (dbError) {
        testResults.errors.push(`Database connection failed: ${dbError.message}`)
      } else {
        testResults.database_connection = true
        console.log('✅ Database connection successful')
      }
    } catch (error) {
      testResults.errors.push(`Database test error: ${error.message}`)
    }

    // Test 2: SMTP Connection and Email Sending
    if (testResults.environment_variables) {
      try {
        const smtpHost = Deno.env.get('SMTP_HOST')
        const smtpPort = Deno.env.get('SMTP_PORT')
        const smtpUsername = Deno.env.get('SMTP_USER')
        const smtpPassword = Deno.env.get('SMTP_PASS')
        const smtpFromName = Deno.env.get('SMTP_FROM_NAME')
        const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL')

        console.log('🔗 Testing SMTP connection...')

        const client = new SMTPClient({
          connection: {
            hostname: smtpHost!,
            port: parseInt(smtpPort!),
            tls: true,
            auth: {
              username: smtpUsername!,
              password: smtpPassword!,
            },
          },
        });

        // Test email content
        const testEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Email System Test - AbleGo</title>
          </head>
          <body>
              <h2>🧪 Email System Test</h2>
              <p>This is a test email to verify the SMTP configuration is working correctly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                  <li>SMTP Host: ${smtpHost}</li>
                  <li>Port: ${smtpPort}</li>
                  <li>Username: ${smtpUsername}</li>
                  <li>Test Time: ${new Date().toISOString()}</li>
              </ul>
              <p>If you receive this email, the email system is working correctly! 🎉</p>
              <hr>
              <p><small>AbleGo Ltd - Professional Transport Services</small></p>
          </body>
          </html>
        `

        const fromName = smtpFromName || 'AbleGo Ltd'
        const fromEmail = smtpFromEmail || smtpUsername

        await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: 'admin@ablego.co.uk',
          subject: '🧪 Email System Test - AbleGo',
          content: 'This is a test email to verify the email system is working.',
          html: testEmailHtml,
        });

        await client.close();

        testResults.smtp_connection = true
        testResults.email_sending = true
        console.log('✅ SMTP connection and email sending successful')

      } catch (smtpError) {
        testResults.errors.push(`SMTP test failed: ${smtpError.message}`)
        console.error('❌ SMTP test failed:', smtpError)
      }
    } else {
      testResults.errors.push('Skipping SMTP test - environment variables not configured')
    }

    // Test 3: Email Queue System
    try {
      // Add a test email to the queue
      const { data: queueResult, error: queueError } = await supabaseClient
        .from('admin_email_notifications')
        .insert({
          recipient_email: 'admin@ablego.co.uk',
          subject: '🧪 Email Queue Test - AbleGo',
          html_content: `
            <h2>Email Queue Test</h2>
            <p>This email was added to the queue for testing purposes.</p>
            <p>Test Time: ${new Date().toISOString()}</p>
          `,
          notification_type: 'test',
          sent: false
        })
        .select()
        .single()

      if (queueError) {
        testResults.errors.push(`Email queue test failed: ${queueError.message}`)
      } else {
        testResults.email_queue = true
        console.log('✅ Email queue system working')

        // Clean up test email
        await supabaseClient
          .from('admin_email_notifications')
          .delete()
          .eq('id', queueResult.id)
      }
    } catch (error) {
      testResults.errors.push(`Email queue test error: ${error.message}`)
    }

    // Generate test summary
    const allTestsPassed = testResults.database_connection && 
                          testResults.environment_variables &&
                          testResults.smtp_connection && 
                          testResults.email_sending && 
                          testResults.email_queue

    console.log('🧪 Email system test completed:', {
      all_tests_passed: allTestsPassed,
      results: testResults,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: allTestsPassed,
        message: allTestsPassed ? 'All email system tests passed!' : 'Some tests failed',
        results: testResults,
        recommendations: allTestsPassed ? [
          '✅ Email system is ready for production use',
          '✅ SMTP configuration is working correctly',
          '✅ Database connections are functioning',
          '✅ Email queue system is operational'
        ] : [
          '❌ Check the error details above',
          '❌ Verify SMTP environment variables are set',
          '❌ Ensure database is accessible',
          '❌ Review Supabase Edge Function logs'
        ],
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Email system test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
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
