import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('🔧 Environment Variables Setup Function')

    // Check if environment variables are accessible
    const envVars = {
      SMTP_HOST: Deno.env.get('SMTP_HOST'),
      SMTP_PORT: Deno.env.get('SMTP_PORT'),
      SMTP_USER: Deno.env.get('SMTP_USER'),
      SMTP_PASS: Deno.env.get('SMTP_PASS'),
      SMTP_FROM_NAME: Deno.env.get('SMTP_FROM_NAME'),
      SMTP_FROM_EMAIL: Deno.env.get('SMTP_FROM_EMAIL')
    }

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    const configuredVars = Object.entries(envVars)
      .filter(([key, value]) => value)
      .map(([key]) => key)

    console.log('📊 Environment Variables Status:', {
      configured: configuredVars,
      missing: missingVars,
      total_configured: configuredVars.length,
      total_missing: missingVars.length
    })

    // Create a configuration table to store SMTP settings as a workaround
    try {
      // Create a configuration table if it doesn't exist
      await supabaseClient.rpc('create_config_table_if_not_exists')
    } catch (error) {
      console.log('⚠️  Could not create config table, trying alternative approach')
    }

    // Store SMTP configuration in a database table as a workaround
    const smtpConfig = {
      smtp_host: 'smtp.ionos.co.uk',
      smtp_port: '587',
      smtp_user: 'admin@ablego.co.uk',
      smtp_pass: 'CareGold17',
      smtp_from_name: 'AbleGo Ltd',
      smtp_from_email: 'admin@ablego.co.uk',
      updated_at: new Date().toISOString()
    }

    // Try to store in a configuration table
    const { data: configData, error: configError } = await supabaseClient
      .from('smtp_config')
      .upsert({
        id: 1, // Single config record
        ...smtpConfig
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (configError) {
      console.log('⚠️  Could not store SMTP config in database:', configError.message)
    } else {
      console.log('✅ SMTP configuration stored in database')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Environment variables setup check completed',
        environment_variables: {
          configured: configuredVars,
          missing: missingVars,
          total_configured: configuredVars.length,
          total_missing: missingVars.length
        },
        smtp_config_stored: !configError,
        recommendations: missingVars.length > 0 ? [
          '❌ Environment variables are not configured in Supabase',
          '📋 You need to set them manually in the Supabase Dashboard',
          '🔗 Go to: https://supabase.com/dashboard/project/myutbivamzrfccoljilo',
          '📝 Look for "Environment Variables" or "Secrets" in Settings',
          '⚙️  Add the missing variables: ' + missingVars.join(', ')
        ] : [
          '✅ All environment variables are configured',
          '✅ SMTP system should be working',
          '🧪 Test the email system with: test-email-system function'
        ],
        required_variables: {
          SMTP_HOST: 'smtp.ionos.co.uk',
          SMTP_PORT: '587',
          SMTP_USER: 'admin@ablego.co.uk',
          SMTP_PASS: 'CareGold17',
          SMTP_FROM_NAME: 'AbleGo Ltd',
          SMTP_FROM_EMAIL: 'admin@ablego.co.uk'
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Environment variables setup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check environment variables',
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
