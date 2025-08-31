# AbleGo Application - Current State Documentation

## 📋 **Documentation Backup - January 2025**

This document serves as a comprehensive backup of the current state of the AbleGo application, including all recent changes, configurations, and system status.

---

## 🏗️ **System Architecture Overview**

### **Technology Stack**
```
Frontend:
├── React 18 (TypeScript)
├── Vite (Build Tool)
├── Tailwind CSS (Styling)
├── React Router DOM v6 (Routing)
├── Framer Motion + GSAP (Animations)
├── React Helmet Async (SEO)
└── Lucide React (Icons)

Backend:
├── Supabase (PostgreSQL Database)
├── Supabase Auth (Authentication)
├── Supabase Edge Functions (Deno)
├── Supabase Storage (File Storage)
├── Supabase Realtime (Real-time Updates)
└── SMTP (Email Service)

Deployment:
├── Netlify (Frontend Hosting)
├── Supabase Cloud (Backend Services)
├── Custom Domain (ablego.co.uk)
└── Automatic SSL/HTTPS
```

### **Current Version Information**
- **Application Version**: 2.0.0
- **Last Major Update**: January 2025
- **Database Schema Version**: 20250101000021
- **Frontend Build**: Production Optimized
- **Backend Status**: Fully Operational

---

## 📊 **Database Schema (Current State)**

### **Core User Tables**
```sql
-- Users and Authentication
users (auth.users extension)
├── id (UUID, Primary Key)
├── email (VARCHAR, Unique)
├── role (user_role enum)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

profiles (Extended user data)
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── postcode (VARCHAR)
├── role (user_role enum)
└── created_at (TIMESTAMP)
```

### **Booking System Tables**
```sql
-- Guest Booking System
guest_riders
├── id (UUID, Primary Key)
├── email (VARCHAR)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── postcode (VARCHAR)
└── created_at (TIMESTAMP)

guest_bookings
├── id (UUID, Primary Key)
├── guest_rider_id (UUID, Foreign Key)
├── pickup_address (TEXT)
├── dropoff_address (TEXT)
├── pickup_time (TIMESTAMP)
├── fare_estimate (DECIMAL)
├── payment_method (VARCHAR)
├── payment_status (payment_status enum)
├── status (booking_status enum)
├── access_token (VARCHAR, Unique)
└── created_at (TIMESTAMP)

-- Registered User Bookings
bookings
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── pickup_address (TEXT)
├── dropoff_address (TEXT)
├── pickup_time (TIMESTAMP)
├── fare_estimate (DECIMAL)
├── payment_method (VARCHAR)
├── payment_status (payment_status enum)
├── status (booking_status enum)
└── created_at (TIMESTAMP)
```

### **Service Provider Tables**
```sql
-- Driver and Vehicle Management
vehicles
├── id (UUID, Primary Key)
├── driver_id (UUID, Foreign Key)
├── registration_number (VARCHAR)
├── make (VARCHAR)
├── model (VARCHAR)
├── year (INTEGER)
├── color (VARCHAR)
├── features (TEXT[])
├── insurance_expiry (DATE)
├── mot_expiry (DATE)
├── stripe_account_id (VARCHAR)
├── stripe_account_status (VARCHAR)
├── stripe_charges_enabled (BOOLEAN)
├── stripe_payouts_enabled (BOOLEAN)
└── created_at (TIMESTAMP)

support_workers
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── dbs_number (VARCHAR)
├── dbs_expiry (DATE)
├── first_aid_certified (BOOLEAN)
├── disability_training (BOOLEAN)
├── hourly_rate (DECIMAL)
├── stripe_account_id (VARCHAR)
├── stripe_account_status (VARCHAR)
├── stripe_charges_enabled (BOOLEAN)
├── stripe_payouts_enabled (BOOLEAN)
└── created_at (TIMESTAMP)
```

### **Financial Tables**
```sql
-- Payment and Revenue Management
payment_transactions
├── id (UUID, Primary Key)
├── booking_id (UUID, Foreign Key)
├── amount (DECIMAL)
├── currency (VARCHAR)
├── payment_method (VARCHAR)
├── stripe_payment_intent_id (VARCHAR)
├── status (payment_status enum)
└── created_at (TIMESTAMP)

payment_splits
├── id (UUID, Primary Key)
├── transaction_id (UUID, Foreign Key)
├── driver_amount (DECIMAL)
├── support_worker_amount (DECIMAL)
├── platform_fee (DECIMAL)
└── created_at (TIMESTAMP)

earnings_summary
├── id (UUID, Primary Key)
├── provider_id (UUID, Foreign Key)
├── provider_type (VARCHAR)
├── period_start (DATE)
├── period_end (DATE)
├── total_earnings (DECIMAL)
├── total_trips (INTEGER)
└── created_at (TIMESTAMP)
```

### **Communication Tables**
```sql
-- Email and Notification System
admin_email_notifications
├── id (UUID, Primary Key)
├── recipient_email (VARCHAR)
├── subject (VARCHAR)
├── content (TEXT)
├── email_type (email_type enum)
├── email_status (email_status enum)
├── delivery_status (email_delivery_status enum)
├── sent (BOOLEAN)
├── sent_at (TIMESTAMP)
├── retry_count (INTEGER)
├── delivery_error (TEXT)
├── processing_attempts (INTEGER)
└── created_at (TIMESTAMP)

email_templates
├── id (UUID, Primary Key)
├── template_name (VARCHAR)
├── subject_template (VARCHAR)
├── content_template (TEXT)
├── variables (JSONB)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMP)

notifications
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── title (VARCHAR)
├── message (TEXT)
├── notification_type (notification_type enum)
├── read (BOOLEAN)
├── read_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

---

## 🔐 **Security Configuration**

### **Row Level Security (RLS) Policies**
```sql
-- Users Table Policies
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin users can read all users" ON users
  FOR SELECT USING (is_admin_from_jwt());

CREATE POLICY "Admin users can update all users" ON users
  FOR UPDATE USING (is_admin_from_jwt());

-- Guest Access Policies
CREATE POLICY "Anyone can create guest rider records" ON guest_riders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read guest rider records" ON guest_riders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create guest bookings" ON guest_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read guest bookings by token" ON guest_bookings
  FOR SELECT USING (true);
```

### **Authentication Configuration**
```typescript
// Supabase Client Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### **API Security Headers**
```toml
# Netlify Security Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
```

---

## 📧 **Email System Configuration**

### **Email Templates Structure**
```typescript
// Email Configuration
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
  }
}

// Email Types
export enum EMAIL_TYPE {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  PAYMENT_RECEIPT = 'payment_receipt',
  DRIVER_ASSIGNMENT = 'driver_assignment',
  ADMIN_NOTIFICATION = 'admin_notification',
  WELCOME_EMAIL = 'welcome_email'
}
```

### **Email Processing System**
```typescript
// Batch Processing Configuration
const BATCH_SIZE = 5; // Emails per batch
const BATCH_DELAY = 1000; // 1 second between batches
const MAX_RETRIES = 3; // Maximum retry attempts

// Email Queue Processing
async function processEmailQueue() {
  const { data: pendingEmails } = await supabase
    .from('admin_email_notifications')
    .select('*')
    .eq('sent', false)
    .in('delivery_status', ['pending', 'processing'])
    .lt('retry_count', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(50);
}
```

---

## 💳 **Payment System Configuration**

### **Stripe Integration**
```typescript
// Stripe Configuration
const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY,
  webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET,
  connectClientId: import.meta.env.VITE_STRIPE_CONNECT_CLIENT_ID
}

// Payment Methods
export enum PAYMENT_METHOD {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash'
}

// Payment Status
export enum PAYMENT_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
```

### **Fare Calculation**
```typescript
// Base Fare Structure
const BASE_FARE = 5.00; // Base fare in GBP
const PER_KM_RATE = 1.50; // Rate per kilometer
const SUPPORT_WORKER_RATE = 15.00; // Per support worker per hour
const VEHICLE_FEATURE_RATE = 2.00; // Per vehicle feature

// Fare Calculation Function
function calculateFare(distance: number, duration: number, supportWorkers: number, features: string[]): number {
  const distanceFare = distance * PER_KM_RATE;
  const supportWorkerFare = supportWorkers * SUPPORT_WORKER_RATE * (duration / 60);
  const featureFare = features.length * VEHICLE_FEATURE_RATE;
  
  return BASE_FARE + distanceFare + supportWorkerFare + featureFare;
}
```

---

## 🚗 **Booking System Configuration**

### **Booking Status Flow**
```typescript
export enum BOOKING_STATUS {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DRIVER_ASSIGNED = 'driver_assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Booking Status Transitions
const STATUS_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.DRIVER_ASSIGNED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.DRIVER_ASSIGNED]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CANCELLED]: []
}
```

### **Vehicle Features**
```typescript
export const VEHICLE_FEATURES = {
  WHEELCHAIR_ACCESSIBLE: 'wheelchair_accessible',
  RAMP_ACCESS: 'ramp_access',
  LIFT_SYSTEM: 'lift_system',
  SECUREMENT_SYSTEM: 'securement_system',
  OXYGEN_SUPPORT: 'oxygen_support',
  MEDICAL_EQUIPMENT: 'medical_equipment',
  AIR_CONDITIONING: 'air_conditioning',
  HEATING: 'heating'
}
```

---

## 📱 **Frontend Configuration**

### **Route Structure**
```typescript
// Main Application Routes
const ROUTES = {
  HOME: '/',
  BOOKING: '/booking',
  BOOKING_STATUS: '/booking-status',
  SIGNUP: '/signup',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  CONTACT: '/contact',
  SAFETY: '/safety',
  PRIVACY: '/privacy-policy',
  JOIN: '/join'
}

// Admin Routes
const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  BOOKINGS: '/admin/bookings',
  USERS: '/admin/users',
  VEHICLES: '/admin/vehicles',
  SUPPORT_WORKERS: '/admin/support-workers',
  APPLICATIONS: '/admin/applications'
}
```

### **Component Structure**
```
src/
├── components/
│   ├── AuthModal.tsx
│   ├── BookingPreview.tsx
│   ├── GuestBookingForm.tsx
│   ├── PaymentMethodSelector.tsx
│   ├── GoogleMap.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── LoadingSpinner.tsx
├── pages/
│   ├── BookingPage.tsx
│   ├── BookingStatusPage.tsx
│   ├── AdminDashboard.tsx
│   ├── ContactPage.tsx
│   └── SafetyPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useBooking.ts
│   └── useAdmin.ts
├── services/
│   ├── bookingService.ts
│   ├── paymentService.ts
│   └── adminService.ts
└── utils/
    ├── validationUtils.ts
    ├── errorUtils.ts
    └── cacheUtils.ts
```

---

## 🔧 **Performance Optimizations**

### **Code Splitting Configuration**
```typescript
// Vite Build Configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react', 'framer-motion'],
          'maps': ['@googlemaps/js-api-loader'],
          'payments': ['@stripe/stripe-js'],
          'animations': ['gsap'],
          'utils': ['date-fns', 'lodash']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

### **API Caching System**
```typescript
// Cache Configuration
class APICache {
  private cache = new Map<string, CacheEntry>();
  private defaultExpiry = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, expiry?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.defaultExpiry
    };
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
}
```

---

## 📊 **Monitoring and Analytics**

### **Performance Tracking**
```typescript
// Performance Metrics
interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  successRate: number;
  slowRequests: number;
  errors: number;
}

// Error Tracking
interface ErrorResponse {
  error: string;
  code: string;
  requestId: string;
  timestamp: string;
  details?: any;
  context?: {
    function?: string;
    endpoint?: string;
    userId?: string;
  };
}
```

### **Admin Dashboard Metrics**
```typescript
// Dashboard Data Structure
interface DashboardData {
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  activeDrivers: number;
  activeSupportWorkers: number;
  pendingApplications: number;
  recentBookings: Booking[];
  revenueChart: RevenueData[];
  userGrowth: UserGrowthData[];
}
```

---

## 🚀 **Deployment Configuration**

### **Netlify Configuration**
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Content-Security-Policy = "default-src 'self'"
```

### **Environment Variables**
```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_CONNECT_CLIENT_ID=your_stripe_connect_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_SITE_URL=https://ablego.co.uk

# Backend Environment Variables (Supabase)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

---

## 📋 **Current Issues and Resolutions**

### **Recently Resolved Issues**
1. **Infinite Recursion in RLS Policies**
   - **Issue**: Admin policies causing infinite recursion
   - **Resolution**: Created `is_admin_from_jwt()` function for efficient role checking

2. **Missing Database Columns**
   - **Issue**: `payment_method` and `role` columns missing
   - **Resolution**: Added columns with proper defaults and updated existing data

3. **Email Trigger Errors**
   - **Issue**: Schema 'net' does not exist error
   - **Resolution**: Updated triggers to log instead of HTTP calls

4. **RPC Function Errors**
   - **Issue**: 400 errors on dashboard data functions
   - **Resolution**: Recreated functions with improved error handling

### **Current System Status**
- ✅ **Database**: Fully operational
- ✅ **Authentication**: Working correctly
- ✅ **Booking System**: Functional
- ✅ **Payment Processing**: Operational
- ✅ **Email System**: Processing correctly
- ✅ **Admin Dashboard**: Fully functional
- ✅ **Frontend**: Optimized and responsive

---

## 🔄 **Backup and Recovery**

### **Database Backup**
- **Automatic Backups**: Daily via Supabase
- **Manual Backups**: Available via Supabase dashboard
- **Point-in-time Recovery**: Available for 7 days
- **Export Options**: CSV, JSON, SQL formats

### **Code Backup**
- **Version Control**: GitHub repository
- **Branch Protection**: Master branch protected
- **Deployment History**: Netlify deployment logs
- **Environment Backup**: Configuration documented

### **Recovery Procedures**
1. **Database Recovery**: Restore from Supabase backup
2. **Code Recovery**: Clone from GitHub repository
3. **Environment Recovery**: Reconfigure from documentation
4. **Domain Recovery**: Update DNS settings

---

## 📞 **Contact Information (Current)**

### **Primary Contacts**
- **Phone**: 01642 089 958
- **Email**: hello@ablego.co.uk
- **Admin Email**: admin@ablego.co.uk
- **Website**: https://ablego.co.uk

### **Technical Support**
- **Developer Contact**: Via GitHub issues
- **Documentation**: This file and README.md
- **Emergency Contact**: 01642 089 958

---

**Documentation Created**: January 2025  
**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Production Ready  
**Next Review**: February 2025
