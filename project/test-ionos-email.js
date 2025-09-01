// Test IONOS SMTP configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myutbivamzrfccoljilo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIONOSEmail() {
  console.log('🧪 Testing IONOS SMTP Configuration...\n');

  try {
    // Test 1: Check SMTP configuration in database
    console.log('📧 Test 1: Checking SMTP configuration in database...');
    const { data: config, error: configError } = await supabase
      .from('email_configuration')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('❌ Failed to get SMTP configuration:', configError);
      return;
    }

    console.log('✅ SMTP Configuration found:', {
      host: config.smtp_host,
      port: config.smtp_port,
      username: config.smtp_username,
      from_email: config.smtp_from_email,
      from_name: config.smtp_from_name,
      secure: config.smtp_secure,
      is_active: config.is_active
    });

    // Test 2: Send a test email using the send-email function
    console.log('\n📧 Test 2: Sending test email via send-email function...');
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'test@example.com', // Replace with your test email
        subject: 'Test Email from AbleGo - IONOS SMTP',
        html: `
          <h1>Test Email from AbleGo</h1>
          <p>This is a test email sent using your IONOS SMTP configuration.</p>
          <p><strong>SMTP Details:</strong></p>
          <ul>
            <li>Host: ${config.smtp_host}</li>
            <li>Port: ${config.smtp_port}</li>
            <li>Username: ${config.smtp_username}</li>
            <li>From: ${config.smtp_from_email}</li>
            <li>Secure: ${config.smtp_secure}</li>
          </ul>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      }
    });

    if (error) {
      console.error('❌ Send-email function failed:', error);
    } else {
      console.log('✅ Send-email function response:', data);
    }

    // Test 3: Test the email delivery system
    console.log('\n📧 Test 3: Testing email delivery system...');
    const { data: deliveryResult, error: deliveryError } = await supabase.functions.invoke('email-delivery-system', {
      body: {}
    });

    if (deliveryError) {
      console.error('❌ Email delivery system failed:', deliveryError);
    } else {
      console.log('✅ Email delivery system response:', deliveryResult);
    }

    console.log('\n✅ IONOS SMTP test completed!');

  } catch (error) {
    console.error('❌ IONOS SMTP test failed:', error);
  }
}

testIONOSEmail();
