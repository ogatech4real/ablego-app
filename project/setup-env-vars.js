const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://myutbivamzrfccoljilo.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('Please add your service role key to .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Environment variables to set
const envVars = {
  SMTP_HOST: 'smtp.ionos.co.uk',
  SMTP_PORT: '587',
  SMTP_USER: 'admin@ablego.co.uk',
  SMTP_PASS: 'CareGold17',
  SMTP_FROM_NAME: 'AbleGo Ltd',
  SMTP_FROM_EMAIL: 'admin@ablego.co.uk'
};

async function setEnvironmentVariables() {
  console.log('🔧 Setting up environment variables in Supabase...');
  
  try {
    // Method 1: Try to set via RPC function (if available)
    console.log('📝 Attempting to set environment variables...');
    
    // Note: This is a workaround since Supabase doesn't expose env vars via client
    // We'll create a test function to verify the variables are accessible
    
    const { data, error } = await supabase.functions.invoke('test-email-system', {
      body: { test: 'environment_variables' }
    });
    
    if (error) {
      console.log('⚠️  Could not test environment variables via function');
      console.log('This is expected if variables are not set yet');
    } else {
      console.log('✅ Environment variables test completed');
      console.log('Result:', data);
    }
    
    console.log('\n📋 Manual Setup Required:');
    console.log('Since Supabase CLI doesn\'t support setting environment variables directly,');
    console.log('you need to set them manually in the Supabase Dashboard:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/myutbivamzrfccoljilo');
    console.log('2. Navigate to Settings → Environment Variables (or Secrets)');
    console.log('3. Add the following variables:');
    
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });
    
    console.log('\n🔍 Alternative Methods:');
    console.log('1. Check if "Secrets" section exists in Settings');
    console.log('2. Look for "Environment Variables" in the sidebar');
    console.log('3. Contact Supabase support if the option is not available');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
setEnvironmentVariables();
