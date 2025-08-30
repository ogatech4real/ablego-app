// Test script for email system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://myutbivamzrfccoljilo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  try {
    // Test 1: Check email queue status
    console.log('📧 Test 1: Checking email queue status...');
    const { data: queueStatus, error: queueError } = await supabase
      .from('admin_email_notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (queueError) {
      console.error('❌ Failed to check email queue:', queueError);
    } else {
      console.log('✅ Email queue status:', {
        pending_emails: queueStatus?.length || 0,
        recent_emails: queueStatus?.map(email => ({
          id: email.id,
          recipient: email.recipient_email,
          subject: email.subject,
          status: email.delivery_status,
          created_at: email.created_at
        })) || []
      });
    }

    // Test 2: Test email queue processing function
    console.log('\n📧 Test 2: Testing email queue processing function...');
    const { data: processingResult, error: processingError } = await supabase.functions.invoke('process-email-queue', {
      body: {}
    });

    if (processingError) {
      console.error('❌ Email queue processing failed:', processingError);
    } else {
      console.log('✅ Email queue processing result:', processingResult);
    }

    // Test 3: Test manual email queue processing
    console.log('\n📧 Test 3: Testing manual email queue processing...');
    const { data: manualResult, error: manualError } = await supabase
      .rpc('manual_process_email_queue');

    if (manualError) {
      console.error('❌ Manual email queue processing failed:', manualError);
    } else {
      console.log('✅ Manual email queue processing result:', manualResult);
    }

    // Test 4: Check email queue status after processing
    console.log('\n📧 Test 4: Checking email queue status after processing...');
    const { data: finalQueueStatus, error: finalQueueError } = await supabase
      .from('admin_email_notifications')
      .select('*')
      .eq('sent', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (finalQueueError) {
      console.error('❌ Failed to check final email queue:', finalQueueError);
    } else {
      console.log('✅ Final email queue status:', {
        pending_emails: finalQueueStatus?.length || 0,
        recent_emails: finalQueueStatus?.map(email => ({
          id: email.id,
          recipient: email.recipient_email,
          subject: email.subject,
          status: email.delivery_status,
          retry_count: email.retry_count,
          created_at: email.created_at
        })) || []
      });
    }

    console.log('\n✅ Email system test completed!');

  } catch (error) {
    console.error('❌ Email system test failed:', error);
  }
}

testEmailSystem();
