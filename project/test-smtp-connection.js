// Test SMTP connection to IONOS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myutbivamzrfccoljilo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSMTPConnection() {
  console.log('🧪 Testing SMTP Connection to IONOS...\n');

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

    // Test 2: Test the email delivery system
    console.log('\n📧 Test 2: Testing email delivery system...');
    const { data: deliveryResult, error: deliveryError } = await supabase.functions.invoke('email-delivery-system', {
      body: {}
    });

    if (deliveryError) {
      console.error('❌ Email delivery system failed:', deliveryError);
      
      // Check if it's an authentication error
      if (deliveryError.message?.includes('401') || deliveryError.status === 401) {
        console.log('\n🔐 Authentication Error Detected!');
        console.log('This usually means the Edge Function is missing proper authentication.');
        console.log('Please check:');
        console.log('1. The Edge Function has access to SUPABASE_SERVICE_ROLE_KEY');
        console.log('2. The function is properly deployed');
        console.log('3. The function logs for detailed error information');
      }
    } else {
      console.log('✅ Email delivery system response:', deliveryResult);
    }

    // Test 3: Check if there are any pending emails to process
    console.log('\n📧 Test 3: Checking for pending emails...');
    const { data: pendingEmails, error: pendingError } = await supabase
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'failed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (pendingError) {
      console.error('❌ Failed to check pending emails:', pendingError);
    } else {
      console.log('✅ Pending emails found:', {
        count: pendingEmails?.length || 0,
        emails: pendingEmails?.map(email => ({
          id: email.id,
          recipient: email.recipient_email,
          subject: email.subject,
          email_type: email.email_type,
          email_status: email.email_status,
          retry_count: email.retry_count,
          created_at: email.created_at
        })) || []
      });
    }

    console.log('\n✅ SMTP connection test completed!');

  } catch (error) {
    console.error('❌ SMTP connection test failed:', error);
  }
}

testSMTPConnection();
