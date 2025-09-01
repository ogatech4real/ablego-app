/**
 * End-to-End Flow Test Script
 * This script tests the complete booking flow, email delivery, and admin dashboard functionality
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data
const testBookingData = {
  guest_name: 'Test User',
  guest_email: 'test@example.com',
  guest_phone: '+44123456789',
  create_account: true,
  password: 'TestPassword123!',
  booking_data: {
    pickup_address: '123 Test Street, London, UK',
    pickup_lat: 51.5074,
    pickup_lng: -0.1278,
    pickup_postcode: 'SW1A 1AA',
    pickup_place_id: 'test_place_id_1',
    dropoff_address: '456 Destination Road, London, UK',
    dropoff_lat: 51.5074,
    dropoff_lng: -0.1278,
    dropoff_postcode: 'SW1A 2BB',
    dropoff_place_id: 'test_place_id_2',
    stops: [],
    pickup_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    dropoff_time: null,
    vehicle_features: ['wheelchair_accessible', 'air_conditioning'],
    support_workers_count: 2,
    fare_estimate: 45.50,
    booking_type: 'scheduled',
    lead_time_hours: 24,
    time_multiplier: 1.0,
    booking_type_discount: 0.0,
    special_requirements: 'Wheelchair accessible vehicle required',
    notes: 'Test booking for end-to-end flow verification',
    payment_method: 'stripe'
  }
}

const testDriverApplication = {
  personal_data: {
    firstName: 'John',
    lastName: 'Driver',
    email: 'john.driver@example.com',
    phone: '+44123456788',
    dateOfBirth: '1985-05-15',
    address: '789 Driver Street, London, UK',
    drivingLicenseNumber: 'DRIVER123456',
    yearsOfExperience: 5
  },
  vehicle_data: {
    make: 'Ford',
    model: 'Transit',
    year: 2020,
    registrationNumber: 'AB12 CDE',
    wheelchairAccessible: true,
    fuelType: 'diesel',
    transmission: 'manual',
    insurancePolicyNumber: 'INS123456'
  },
  documents: {
    drivingLicense: 'data:image/jpeg;base64,test_base64_data',
    insuranceCertificate: 'data:image/jpeg;base64,test_base64_data',
    motCertificate: 'data:image/jpeg;base64,test_base64_data'
  }
}

const testSupportWorkerApplication = {
  personal_data: {
    firstName: 'Jane',
    lastName: 'Support',
    email: 'jane.support@example.com',
    phone: '+44123456787',
    dateOfBirth: '1990-08-20',
    address: '321 Support Avenue, London, UK'
  },
  qualifications: {
    specializations: ['elderly_care', 'disability_support'],
    certifications: ['NVQ Level 3', 'First Aid'],
    experience: '5 years of experience in elderly care and disability support',
    preferredHours: 'Monday to Friday, 9 AM to 5 PM',
    medicalNotes: 'None',
    accessibilityRequirements: 'None'
  },
  documents: {
    cv: 'data:application/pdf;base64,test_base64_data',
    certifications: 'data:application/pdf;base64,test_base64_data',
    references: 'data:application/pdf;base64,test_base64_data'
  }
}

class EndToEndFlowTest {
  constructor() {
    this.testResults = []
    this.startTime = new Date()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Starting test: ${testName}`)
      const result = await testFunction()
      this.testResults.push({ name: testName, status: 'PASSED', result })
      this.log(`Test passed: ${testName}`, 'success')
      return result
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message })
      this.log(`Test failed: ${testName} - ${error.message}`, 'error')
      throw error
    }
  }

  async testGuestBookingWithoutAccount() {
    const bookingData = {
      ...testBookingData,
      create_account: false,
      password: undefined,
      guest_email: 'guest@example.com'
    }

    const { data, error } = await supabase.functions.invoke('create-guest-booking', {
      body: bookingData
    })

    if (error) throw new Error(`Guest booking failed: ${error.message}`)
    if (!data.success) throw new Error(`Guest booking failed: ${data.message}`)

    return {
      booking_id: data.booking_id,
      guest_rider_id: data.guest_rider_id,
      access_token: data.access_token,
      user_account: data.user_account
    }
  }

  async testGuestBookingWithAccount() {
    const { data, error } = await supabase.functions.invoke('create-guest-booking', {
      body: testBookingData
    })

    if (error) throw new Error(`Guest booking with account failed: ${error.message}`)
    if (!data.success) throw new Error(`Guest booking with account failed: ${data.message}`)

    return {
      booking_id: data.booking_id,
      guest_rider_id: data.guest_rider_id,
      access_token: data.access_token,
      user_account: data.user_account
    }
  }

  async testDriverApplication() {
    const { data, error } = await supabase.functions.invoke('create-driver-application', {
      body: testDriverApplication
    })

    if (error) throw new Error(`Driver application failed: ${error.message}`)
    if (!data.success) throw new Error(`Driver application failed: ${data.message}`)

    return {
      application_id: data.application_id,
      user_id: data.user_id,
      vehicle_id: data.vehicle_id
    }
  }

  async testSupportWorkerApplication() {
    const { data, error } = await supabase.functions.invoke('create-support-worker-application', {
      body: testSupportWorkerApplication
    })

    if (error) throw new Error(`Support worker application failed: ${error.message}`)
    if (!data.success) throw new Error(`Support worker application failed: ${data.message}`)

    return {
      application_id: data.application_id,
      user_id: data.user_id,
      support_worker_id: data.support_worker_id
    }
  }

  async testEmailDelivery() {
    // Trigger email delivery system
    const { data, error } = await supabaseAdmin.functions.invoke('email-delivery-system', {
      body: {}
    })

    if (error) throw new Error(`Email delivery failed: ${error.message}`)

    return {
      processed: data.processed,
      successful: data.successful,
      failed: data.failed,
      results: data.results
    }
  }

  async testAdminDashboardVisibility() {
    // Test admin dashboard stats
    const { data: stats, error: statsError } = await supabaseAdmin.rpc('get_admin_dashboard_stats')
    if (statsError) throw new Error(`Admin dashboard stats failed: ${statsError.message}`)

    // Test admin notifications
    const { data: notifications, error: notificationsError } = await supabaseAdmin.rpc('get_admin_notifications', {
      limit_count: 10,
      offset_count: 0
    })
    if (notificationsError) throw new Error(`Admin notifications failed: ${notificationsError.message}`)

    // Test recent activity view
    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('admin_recent_activity')
      .select('*')
      .limit(10)
    if (activityError) throw new Error(`Recent activity failed: ${activityError.message}`)

    return {
      stats,
      notifications_count: notifications?.length || 0,
      recent_activity_count: recentActivity?.length || 0
    }
  }

  async testEmailQueueStatus() {
    // Check email queue status
    const { data: pendingEmails, error: pendingError } = await supabaseAdmin
      .from('admin_email_notifications')
      .select('*')
      .in('email_status', ['queued', 'processing'])
      .order('created_at', { ascending: false })

    if (pendingError) throw new Error(`Email queue check failed: ${pendingError.message}`)

    const { data: sentEmails, error: sentError } = await supabaseAdmin
      .from('admin_email_notifications')
      .select('*')
      .eq('email_status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(10)

    if (sentError) throw new Error(`Sent emails check failed: ${sentError.message}`)

    return {
      pending_count: pendingEmails?.length || 0,
      sent_count: sentEmails?.length || 0,
      recent_sent_emails: sentEmails || []
    }
  }

  async runAllTests() {
    this.log('🚀 Starting End-to-End Flow Tests')
    this.log('=' * 50)

    try {
      // Test 1: Guest booking without account
      const guestBookingResult = await this.runTest(
        'Guest Booking Without Account',
        () => this.testGuestBookingWithoutAccount()
      )

      // Test 2: Guest booking with account creation
      const accountBookingResult = await this.runTest(
        'Guest Booking With Account Creation',
        () => this.testGuestBookingWithAccount()
      )

      // Test 3: Driver application
      const driverApplicationResult = await this.runTest(
        'Driver Application',
        () => this.testDriverApplication()
      )

      // Test 4: Support worker application
      const supportWorkerResult = await this.runTest(
        'Support Worker Application',
        () => this.testSupportWorkerApplication()
      )

      // Test 5: Email delivery
      const emailDeliveryResult = await this.runTest(
        'Email Delivery System',
        () => this.testEmailDelivery()
      )

      // Test 6: Admin dashboard visibility
      const adminDashboardResult = await this.runTest(
        'Admin Dashboard Visibility',
        () => this.testAdminDashboardVisibility()
      )

      // Test 7: Email queue status
      const emailQueueResult = await this.runTest(
        'Email Queue Status',
        () => this.testEmailQueueStatus()
      )

      // Summary
      this.log('=' * 50)
      this.log('📊 Test Results Summary')
      this.log('=' * 50)

      const passedTests = this.testResults.filter(r => r.status === 'PASSED').length
      const failedTests = this.testResults.filter(r => r.status === 'FAILED').length
      const totalTests = this.testResults.length

      this.log(`Total Tests: ${totalTests}`)
      this.log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'info')
      this.log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info')

      if (failedTests === 0) {
        this.log('🎉 All tests passed! End-to-end flow is working correctly.', 'success')
      } else {
        this.log('⚠️ Some tests failed. Please check the errors above.', 'error')
      }

      // Detailed results
      this.log('\n📋 Detailed Test Results:')
      this.testResults.forEach(result => {
        const status = result.status === 'PASSED' ? '✅' : '❌'
        this.log(`${status} ${result.name}: ${result.status}`)
        if (result.error) {
          this.log(`   Error: ${result.error}`, 'error')
        }
      })

      return {
        success: failedTests === 0,
        totalTests,
        passedTests,
        failedTests,
        results: this.testResults,
        duration: new Date() - this.startTime
      }

    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error')
      return {
        success: false,
        error: error.message,
        results: this.testResults,
        duration: new Date() - this.startTime
      }
    }
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new EndToEndFlowTest()
  testRunner.runAllTests().then(result => {
    process.exit(result.success ? 0 : 1)
  }).catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

export default EndToEndFlowTest
