// Email Templates Configuration for AbleGo
// This file contains reusable email templates and styling

export const EMAIL_CONFIG = {
  sender: 'admin@ablego.co.uk',
  company: 'AbleGo Ltd',
  website: 'https://ablego.co.uk',
  support: {
    phone: '01642 089 958',
    email: 'admin@ablego.co.uk'
  },
  bankDetails: {
    accountName: 'AbleGo Ltd',
    sortCode: '77-71-43',
    accountNumber: '00968562'
  },
  address: 'Victoria Building, Teesside University, Launchpad, Middlesbrough TS1 3BA'
}

export const EMAIL_STYLES = {
  primaryColor: '#3B82F6',
  secondaryColor: '#14B8A6',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  textColor: '#374151',
  lightTextColor: '#6B7280',
  backgroundColor: '#F9FAFB',
  borderColor: '#E5E7EB'
}

export function generateEmailHeader(title: string, subtitle?: string): string {
  return `
    <div style="background: linear-gradient(135deg, ${EMAIL_STYLES.primaryColor} 0%, ${EMAIL_STYLES.secondaryColor} 100%); padding: 40px 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="color: white; font-size: 24px;">🚗</span>
      </div>
      <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">${title}</h1>
      ${subtitle ? `<p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">${subtitle}</p>` : ''}
    </div>
  `
}

export function generateEmailFooter(): string {
  return `
    <div style="background-color: ${EMAIL_STYLES.backgroundColor}; padding: 30px; text-align: center; border-top: 1px solid ${EMAIL_STYLES.borderColor};">
      <p style="color: ${EMAIL_STYLES.lightTextColor}; font-size: 12px; margin: 0 0 10px 0;">
        This email was sent from ${EMAIL_CONFIG.sender}
      </p>
      <p style="color: ${EMAIL_STYLES.lightTextColor}; font-size: 12px; margin: 0;">
        ${EMAIL_CONFIG.company} • ${EMAIL_CONFIG.address} • Company No. 16619305<br>
        <a href="${EMAIL_CONFIG.website}/privacy-policy" style="color: ${EMAIL_STYLES.primaryColor}; text-decoration: none;">Privacy Policy</a> • 
        <a href="${EMAIL_CONFIG.website}/contact" style="color: ${EMAIL_STYLES.primaryColor}; text-decoration: none;">Contact Us</a>
      </p>
    </div>
  `
}

export function generatePaymentInstructions(fare: number, bookingRef: string, trackingUrl: string): string {
  return `
    <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #92400e; font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">💳 Payment Instructions</h3>
      
      <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">🚗 Automatic Driver Dispatch</p>
        <p style="color: #b45309; font-size: 13px; margin: 0;">Your driver will be automatically assigned and dispatched within 15 minutes of payment confirmation. No need to call or email us!</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
          <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">💳 Card Payment (Instant)</h4>
          <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Pay now and get immediate driver dispatch</p>
          <a href="${trackingUrl}#payment" style="display: block; background: ${EMAIL_STYLES.primaryColor}; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; font-size: 14px;">Pay £${fare.toFixed(2)} Now</a>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 15px; border: 1px solid #fcd34d;">
          <h4 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🏦 Bank Transfer</h4>
          <div style="color: #b45309; font-size: 12px; margin-bottom: 10px;">
            <p style="margin: 2px 0;"><strong>Account Name:</strong> ${EMAIL_CONFIG.bankDetails.accountName}</p>
            <p style="margin: 2px 0;"><strong>Sort Code:</strong> ${EMAIL_CONFIG.bankDetails.sortCode}</p>
            <p style="margin: 2px 0;"><strong>Account Number:</strong> ${EMAIL_CONFIG.bankDetails.accountNumber}</p>
            <p style="margin: 2px 0;"><strong>Reference:</strong> ${bookingRef}</p>
            <p style="margin: 2px 0;"><strong>Amount:</strong> £${fare.toFixed(2)}</p>
          </div>
          <p style="color: #b45309; font-size: 11px; margin: 0; font-style: italic;">Confirmed within 2 hours (business hours)</p>
        </div>
      </div>
    </div>
  `
}

export function generateBookingDetails(booking: any, bookingRef: string): string {
  const pickupDate = new Date(booking.pickup_time)
  
  return `
    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 2px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #d1d5db; padding-bottom: 15px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">BOOKING DETAILS</h2>
        <div style="text-align: right;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Booking Reference</p>
          <p style="margin: 0; color: #1f2937; font-weight: bold; font-family: monospace;">${bookingRef}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Journey Details:</h3>
        <div style="background: white; border-radius: 8px; padding: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">From</span>
              <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${booking.pickup_address}</p>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">To</span>
              <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${booking.dropoff_address}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Pickup Date & Time</span>
              <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${pickupDate.toLocaleString()}</p>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Total Fare</span>
              <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">£${booking.fare_estimate.toFixed(2)}</p>
            </div>
          </div>

          ${booking.support_workers_count > 0 ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Support Workers</span>
            <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${booking.support_workers_count} trained companion${booking.support_workers_count > 1 ? 's' : ''}</p>
          </div>
          ` : ''}

          ${booking.vehicle_features && booking.vehicle_features.length > 0 ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Vehicle Features</span>
            <p style="color: #1f2937; font-weight: 500; margin: 5px 0 0 0; font-size: 14px;">${Array.isArray(booking.vehicle_features) ? booking.vehicle_features.join(', ') : booking.vehicle_features}</p>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `
}

export function generateSupportSection(): string {
  return `
    <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">🆘 Need Help?</h3>
      <p style="color: #b45309; font-size: 14px; margin: 0 0 15px 0;">Our 24/7 support team is here to assist you:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <strong style="color: #92400e;">📞 Phone:</strong><br>
          <a href="tel:${EMAIL_CONFIG.support.phone}" style="color: #b45309; text-decoration: none; font-weight: bold;">${EMAIL_CONFIG.support.phone}</a>
        </div>
        <div>
          <strong style="color: #92400e;">📧 Email:</strong><br>
          <a href="mailto:${EMAIL_CONFIG.support.email}" style="color: #b45309; text-decoration: none; font-weight: bold;">${EMAIL_CONFIG.support.email}</a>
        </div>
      </div>
    </div>
  `
}
