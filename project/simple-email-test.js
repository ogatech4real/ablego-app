// Simple test for email delivery system
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://myutbivamzrfccoljilo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailDelivery() {
  console.log('🧪 Testing Email Delivery System...\n');

  try {
    // Test 1: Call the email delivery system Edge Function
    console.log('📧 Test 1: Calling email-delivery-system Edge Function...');
    const { data, error } = await supabase.functions.invoke('email-delivery-system', {
      body: {}
    });

    if (error) {
      console.error('❌ Email delivery system failed:', error);
    } else {
      console.log('✅ Email delivery system response:', data);
    }

    // Test 2: Check email configuration
    console.log('\n📧 Test 2: Checking email configuration...');
    const { data: config, error: configError } = await supabase
      .from('email_configuration')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('❌ Failed to get email configuration:', configError);
    } else {
      console.log('✅ Email configuration found:', {
        host: config.smtp_host,
        port: config.smtp_port,
        username: config.smtp_username,
        from_email: config.smtp_from_email,
        is_active: config.is_active
      });
    }

    // Test 3: Check email queue
    console.log('\n📧 Test 3: Checking email queue...');
    const { data: emails, error: emailsError } = await supabase
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (emailsError) {
      console.error('❌ Failed to get email queue:', emailsError);
    } else {
      console.log('✅ Email queue status:', {
        pending_count: emails?.length || 0,
        emails: emails?.map(email => ({
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

    console.log('\n✅ Email delivery system test completed!');

  } catch (error) {
    console.error('❌ Email delivery system test failed:', error);
  }
}

testEmailDelivery();
