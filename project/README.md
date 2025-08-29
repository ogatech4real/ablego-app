# AbleGo - Comprehensive Transport Platform Documentation

## 🚀 **Overview**

AbleGo is a comprehensive, production-ready transport platform designed specifically for individuals with health challenges, disabilities, and vulnerabilities. The platform provides safe, supportive transport services with trained companions, featuring real-time tracking, accessible vehicles, and compassionate care.

## 📋 **Table of Contents**

1. [Project Architecture](#project-architecture)
2. [Technology Stack](#technology-stack)
3. [Environment Setup](#environment-setup)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Booking System](#booking-system)
8. [Payment Processing](#payment-processing)
9. [Email Notification System](#email-notification-system)
10. [Real-time Features](#real-time-features)
11. [Admin Dashboard](#admin-dashboard)
12. [API Documentation](#api-documentation)
13. [Security Features](#security-features)
14. [Deployment](#deployment)
15. [Development Guide](#development-guide)
16. [Troubleshooting](#troubleshooting)

---

## 🏗️ **Project Architecture**

### **Frontend Architecture**
```
src/
├── components/          # Reusable UI components
├── pages/              # Route-based page components
├── hooks/              # Custom React hooks
├── services/           # Business logic and API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── lib/                # Core libraries (Supabase, Stripe)
```

### **Backend Architecture**
```
supabase/
├── functions/          # Edge Functions (serverless)
├── migrations/         # Database schema migrations
└── (configured via dashboard)
```

### **Key Design Patterns**
- **Component-based architecture** with clear separation of concerns
- **Custom hooks** for state management and API interactions
- **Service layer** for business logic abstraction
- **Type-safe** development with comprehensive TypeScript definitions
- **Responsive design** with mobile-first approach
- **Accessibility-focused** UI/UX design

---

## 🛠️ **Technology Stack**

### **Frontend Technologies**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Framer Motion** - Animation library
- **GSAP** - Advanced animations and scroll triggers
- **Lucide React** - Icon library
- **React Helmet Async** - SEO and meta tag management

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication and user management
  - Real-time subscriptions
  - Edge Functions (serverless)
  - File storage
- **Stripe** - Payment processing and Connect platform
- **Google Maps API** - Location services and mapping

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### **Deployment & Infrastructure**
- **Netlify** - Frontend hosting and deployment
- **Netlify Functions** - Serverless functions for UK postcode lookup
- **CDN** - Global content delivery
- **SSL/TLS** - Automatic HTTPS

---

## ⚙️ **Environment Setup**

### **Required Environment Variables**

#### **Local Development (.env)**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key_here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### **Production Environment Variables (Netlify)**
All environment variables are configured in Netlify dashboard and automatically injected at build time.

### **Installation & Setup**

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ablego-transport-platform
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🗄️ **Database Schema**

### **Core Tables**

#### **Users & Authentication**
- **`users`** - Core user records with roles
- **`profiles`** - Extended user profile information
- **`guest_riders`** - Non-registered users for guest bookings

#### **Booking System**
- **`bookings`** - Registered user bookings
- **`guest_bookings`** - Guest user bookings
- **`stops`** - Multi-stop journey waypoints
- **`booking_access_tokens`** - Guest booking access tokens
- **`booking_assignments`** - Driver/support worker assignments

#### **Service Providers**
- **`vehicles`** - Driver vehicles and specifications
- **`support_workers`** - Support worker profiles and availability
- **`certifications`** - Support worker certifications
- **`vehicle_insurance`** - Vehicle insurance records

#### **Trip Management**
- **`trip_logs`** - Completed trip records
- **`trip_tracking`** - Real-time GPS tracking data
- **`pricing_logs`** - Fare calculations and breakdowns

#### **Payment System**
- **`payment_transactions`** - Payment records
- **`payment_splits`** - Revenue distribution records
- **`earnings_summary`** - Periodic earnings summaries

#### **Communication**
- **`notifications`** - In-app notifications
- **`admin_email_notifications`** - Email queue system
- **`email_templates`** - Reusable email templates
- **`newsletter_subscribers`** - Newsletter subscription management

#### **Applications**
- **`driver_applications`** - Driver registration applications
- **`support_worker_applications`** - Support worker applications

### **Enums**
- **`user_role`** - rider, driver, support_worker, admin
- **`booking_status`** - pending, confirmed, in_progress, completed, cancelled
- **`booking_type`** - on_demand, scheduled, advance
- **`notification_type`** - Various notification categories
- **`email_type`** - Email categorization for processing
- **`email_status`** - Email delivery status tracking

### **Views & Analytics**
- **`dashboard_overview`** - Admin dashboard statistics
- **`unified_bookings`** - Combined view of all booking types
- **`revenue_analytics`** - Financial analytics and reporting

---

## 🔐 **Authentication System**

### **Authentication Flow**
1. **User Registration** - Email/password with role selection
2. **Email Confirmation** - PKCE flow with automatic profile creation
3. **Role-based Routing** - Automatic dashboard redirection
4. **Session Management** - Persistent sessions with auto-refresh

### **User Roles**

#### **Rider (Default)**
- Book rides and manage bookings
- View trip history and receipts
- Update profile and preferences
- Access: `/dashboard/rider`

#### **Driver**
- Manage vehicle registration
- Accept booking assignments
- Track earnings and payments
- Real-time location sharing
- Access: `/dashboard/driver`

#### **Support Worker**
- Manage professional profile
- Accept support assignments
- Track earnings and ratings
- Availability management
- Access: `/dashboard/support`

#### **Admin**
- Full platform management
- User and application management
- Vehicle and support worker verification
- Analytics and reporting
- Payment and revenue oversight
- Access: `/dashboard/admin`

### **Authentication Features**
- **Email confirmation** required for all new accounts
- **Password reset** with secure token-based flow
- **Role-based access control** with RLS policies
- **Session persistence** across browser sessions
- **Automatic profile creation** via database triggers

---

## 📱 **Booking System**

### **Booking Types**

#### **Guest Bookings**
- **No registration required** - immediate booking capability
- **Email confirmation** with payment instructions
- **Access tokens** for booking tracking (30-day expiry)
- **SMS notifications** for driver details
- **Bank transfer or card payment** options

#### **Registered User Bookings**
- **Account-based booking** with saved preferences
- **Booking history** and management
- **Integrated payment** with saved methods
- **Real-time notifications** and updates

### **Booking Features**

#### **Multi-Stop Journeys**
- **Up to 2 intermediate stops** supported
- **Route optimization** with Google Maps integration
- **Dynamic fare calculation** based on total distance
- **Stop-by-stop tracking** during journey

#### **Accessibility Options**
- **Wheelchair accessible vehicles** with ramps/lifts
- **Wide door access** for easier entry/exit
- **Patient lift assistance** for mobility challenges
- **Oxygen support** for medical transport
- **Hearing loop systems** for hearing impaired
- **Visual aids** for sight-impaired passengers

#### **Support Worker Services**
- **0-4 trained companions** per booking
- **Specialized care** (mobility, visual, hearing, mental health)
- **Multi-language support** available
- **Professional certifications** verified
- **Hourly rates** from £15.00-£25.00

### **Pricing System**

#### **Dynamic Pricing Model**
- **Base fare**: £8.50 per booking
- **Distance rate**: £2.20 per mile
- **Vehicle features**: £3.50-£15.00 per feature
- **Support workers**: £15.00-£25.00 per hour
- **Peak time surcharge**: +15% (6-9am, 3-6pm)

#### **Booking Type Pricing**
- **On-demand** (≤3 hours): +50% surcharge
- **Scheduled** (3-12 hours): Standard rate
- **Advance** (>12 hours): 10% discount

#### **Revenue Distribution**
- **Platform fee**: 30% of total fare
- **Driver share**: 70% of base fare + distance
- **Support worker share**: 70% of support fees
- **Stripe fees**: 2.9% + 30p per transaction

---

## 💳 **Payment Processing**

### **Stripe Integration**

#### **Payment Methods**
- **Card payments** - Instant processing with Stripe Elements
- **Bank transfers** - Manual confirmation with reference codes
- **Stripe Connect** - Automatic revenue distribution
- **Multi-party payments** - Simultaneous payouts to drivers and support workers

#### **Payment Security**
- **PCI DSS compliant** processing
- **256-bit SSL encryption** for all transactions
- **Tokenized card storage** (no card data stored by AbleGo)
- **3D Secure authentication** for enhanced security
- **Fraud detection** via Stripe Radar

#### **Revenue Distribution**
```
Total Payment (100%)
├── Platform Fee (30%)
├── Driver Share (70% of base + distance)
├── Support Worker Share (70% of support fees)
└── Stripe Processing Fee (2.9% + 30p)
```

### **Payment Flow**
1. **Fare calculation** with transparent breakdown
2. **Payment intent creation** with metadata
3. **Secure card processing** via Stripe Elements
4. **Automatic revenue splits** via Stripe Connect
5. **Instant confirmation** and receipt generation
6. **Driver dispatch** triggered automatically

---

## 📧 **Email Notification System**

### **Email Architecture**

#### **Email Queue System**
- **`admin_email_notifications`** table for email queue
- **Priority-based processing** (1=highest, 5=lowest)
- **Retry logic** with configurable attempts
- **Delivery status tracking** (queued, sending, sent, delivered, failed)
- **Template-based generation** for consistency

#### **Email Types**
- **`booking_invoice`** - Booking confirmation with payment instructions
- **`payment_receipt`** - Payment confirmation and driver dispatch
- **`driver_assignment`** - Driver details and contact information
- **`trip_update`** - Journey status updates
- **`admin_notification`** - Administrative alerts and notifications

### **Email Processing**

#### **Automatic Triggers**
- **Booking created** → Invoice email with payment instructions
- **Payment confirmed** → Receipt email + driver dispatch notification
- **Driver assigned** → Driver details email + SMS notification
- **Trip completed** → Journey summary and rating request

#### **Email Service Integration**
- **Primary**: Supabase SMTP (admin@ablego.co.uk)
- **Fallback 1**: Resend API
- **Fallback 2**: SendGrid API
- **Manual processing** via admin dashboard

#### **Email Templates**
```sql
-- Template variables support
{{customer_name}} - Customer's full name
{{booking_reference}} - 8-character booking reference
{{pickup_address}} - Pickup location
{{dropoff_address}} - Destination
{{pickup_time}} - Formatted pickup date/time
{{fare_amount}} - Total fare amount
{{tracking_url}} - Live tracking link
{{driver_name}} - Assigned driver name
{{vehicle_details}} - Vehicle make/model/color
```

---

## 🔄 **Real-time Features**

### **Live Tracking System**
- **GPS tracking** during active trips
- **Real-time location updates** every 30 seconds
- **Route monitoring** with deviation alerts
- **ETA calculations** based on current location
- **Family sharing** of tracking links

### **Real-time Notifications**
- **WebSocket connections** via Supabase Realtime
- **Instant booking updates** for status changes
- **Driver assignment notifications** 
- **Trip progress updates** (pickup, en route, arrived)
- **Emergency alerts** with immediate notification

### **Location Services**
- **Driver location tracking** when online
- **Support worker availability** based on location
- **Proximity matching** for optimal assignments
- **Geofencing** for pickup/dropoff confirmations

---

## 👨‍💼 **Admin Dashboard**

### **User Management**
- **User promotion** to admin roles
- **Role management** and permissions
- **Account verification** and status management
- **User analytics** and activity monitoring

### **Application Processing**
- **Driver applications** review and approval
- **Support worker applications** with certification verification
- **Document management** and verification workflow
- **Background check** coordination

### **Vehicle Management**
- **Vehicle registration** verification
- **Insurance and MOT** document validation
- **Accessibility rating** assignment
- **Fleet monitoring** and status tracking

### **Booking Management**
- **Real-time booking** monitoring
- **Driver assignment** interface
- **Support worker allocation** 
- **Trip tracking** and management
- **Customer communication** tools

### **Analytics & Reporting**
- **Revenue analytics** with detailed breakdowns
- **Performance metrics** for drivers and support workers
- **Customer satisfaction** tracking
- **Platform usage** statistics
- **Financial reporting** and export capabilities

### **Newsletter Management**
- **Subscriber management** with GDPR compliance
- **Export functionality** for marketing campaigns
- **Preference management** for targeted communications
- **Unsubscribe handling** with audit trails

---

## 🔌 **API Documentation**

### **Supabase Edge Functions**

#### **Booking Management**
- **`create-booking`** - Create new authenticated user bookings
- **`trip-tracking`** - Real-time location updates during trips

#### **Payment Processing**
- **`stripe-create-payment-intent`** - Create Stripe payment intents
- **`stripe-create-connect-account`** - Set up driver/support worker payouts
- **`stripe-webhook`** - Handle Stripe payment events
- **`payment-webhook`** - Process manual payment confirmations

#### **Email System**
- **`send-booking-invoice`** - Send booking confirmation emails
- **`send-booking-confirmation`** - Send booking creation notifications
- **`process-email-queue`** - Process pending email notifications
- **`enhanced-email-processor`** - Advanced email processing with fallbacks
- **`send-admin-notification`** - Send administrative notifications

#### **Analytics & Admin**
- **`admin-analytics`** - Comprehensive analytics endpoints
- **`admin-dashboard`** - Dashboard data aggregation
- **`verify-documents`** - Document verification workflow

### **Netlify Functions**

#### **UK Postcode Services**
- **`postcode`** - Postcode lookup and validation
- **`postcode-validate`** - Quick postcode format validation
- **`postcode-reverse`** - Reverse geocoding (coordinates to postcode)

### **API Endpoints Structure**

#### **Authentication Endpoints**
```typescript
// User registration
POST /auth/signup
{
  email: string,
  password: string,
  options: {
    data: {
      full_name: string,
      phone?: string,
      role: 'rider' | 'driver' | 'support_worker'
    }
  }
}

// User login
POST /auth/signin
{
  email: string,
  password: string
}
```

#### **Booking Endpoints**
```typescript
// Create guest booking
POST /functions/v1/create-guest-booking
{
  pickup_address: string,
  dropoff_address: string,
  pickup_time: string,
  vehicle_features: string[],
  support_workers_count: number,
  guest_info: {
    name: string,
    email: string,
    phone: string
  }
}

// Get booking status
GET /booking-status?token={access_token}
```

#### **Payment Endpoints**
```typescript
// Create payment intent
POST /functions/v1/stripe-create-payment-intent
{
  booking_id: string,
  amount: number,
  payment_breakdown: PaymentBreakdown
}

// Stripe webhook
POST /functions/v1/stripe-webhook
// Handles all Stripe events
```

---

## 🛡️ **Security Features**

### **Data Protection**
- **GDPR compliant** data handling
- **Row Level Security (RLS)** on all database tables
- **Encrypted data transmission** (256-bit SSL)
- **Secure file storage** with access controls
- **PCI DSS compliant** payment processing

### **Authentication Security**
- **PKCE flow** for secure authentication
- **Email confirmation** required for all accounts
- **Password strength** requirements and validation
- **Session management** with automatic refresh
- **Role-based access control** with strict permissions

### **API Security**
- **JWT token authentication** for all API calls
- **Rate limiting** on sensitive endpoints
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests
- **Webhook signature verification** for Stripe events

### **Privacy Features**
- **Data minimization** - only collect necessary information
- **Consent management** for data processing
- **Right to erasure** implementation
- **Data portability** for user data export
- **Audit trails** for all data modifications

---

## 🚀 **Deployment**

### **Production Environment**

#### **Netlify Configuration**
```toml
[build]
  publish = "dist"
  command = "npm ci --include=dev && npm run build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"
```

#### **Performance Optimizations**
- **Code splitting** with manual chunks
- **Asset optimization** with Vite
- **CDN delivery** via Netlify
- **Caching strategies** for static assets
- **Bundle analysis** and optimization

#### **SEO & Accessibility**
- **Meta tag management** with React Helmet
- **Structured data** for rich snippets
- **Sitemap generation** for search engines
- **Accessibility compliance** (WCAG 2.1)
- **Performance optimization** (Core Web Vitals)

### **Monitoring & Analytics**
- **Error tracking** via browser console
- **Performance monitoring** via Lighthouse
- **User analytics** via Supabase
- **Payment monitoring** via Stripe Dashboard
- **Email delivery tracking** via notification system

---

## 🧪 **Development Guide**

### **Code Organization**

#### **Component Structure**
```typescript
// Standard component pattern
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // Hooks
  // State management
  // Event handlers
  // Effects
  
  return (
    // JSX with Tailwind classes
  );
};

export default Component;
```

#### **Custom Hooks Pattern**
```typescript
// Custom hook for data fetching
export const useDataHook = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data fetching logic
  // Error handling
  // Loading states
  
  return { data, loading, error, /* methods */ };
};
```

#### **Service Layer Pattern**
```typescript
// Service for business logic
class ServiceClass {
  async methodName(params: Type): Promise<Result> {
    try {
      // Business logic
      // API calls
      // Data transformation
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const serviceInstance = new ServiceClass();
```

### **State Management**
- **React hooks** for local component state
- **Custom hooks** for shared state logic
- **Supabase Realtime** for real-time data synchronization
- **Local storage** for user preferences
- **Session storage** for temporary data

### **Error Handling**
- **Error boundaries** for component error catching
- **Try-catch blocks** in async operations
- **User-friendly error messages** with actionable guidance
- **Fallback UI states** for error scenarios
- **Logging** for debugging and monitoring

---

## 🎨 **UI/UX Design System**

### **Design Principles**
- **Accessibility-first** design approach
- **Mobile-responsive** with breakpoint system
- **High contrast** color schemes for visibility
- **Large touch targets** for easy interaction
- **Clear visual hierarchy** with consistent typography

### **Color System**
```css
/* Primary Colors */
--blue-600: #3B82F6    /* Primary brand color */
--teal-600: #14B8A6    /* Secondary brand color */
--green-600: #059669   /* Success states */
--red-600: #DC2626     /* Error states */
--yellow-600: #D97706  /* Warning states */
--purple-600: #9333EA  /* Admin features */

/* Neutral Colors */
--gray-50 to --gray-900  /* Text and background variations */
```

### **Typography**
- **Font family**: Inter (primary), system fonts (fallback)
- **Font weights**: 300, 400, 500, 600, 700, 800, 900
- **Line heights**: 150% for body text, 120% for headings
- **Responsive sizing** with clamp() functions

### **Animation System**
- **GSAP** for complex animations
- **Framer Motion** for component transitions
- **CSS transitions** for hover states
- **Reduced motion** support for accessibility
- **Performance-optimized** animations

---

## 📊 **Analytics & Monitoring**

### **Business Metrics**
- **Total users** by role and verification status
- **Booking volume** and completion rates
- **Revenue tracking** with detailed breakdowns
- **Customer satisfaction** ratings and feedback
- **Platform utilization** statistics

### **Performance Metrics**
- **Driver performance** (ratings, completion rates, earnings)
- **Support worker performance** (ratings, assignments, availability)
- **Vehicle utilization** and efficiency
- **Response times** for booking assignments
- **Customer retention** and repeat usage

### **Financial Analytics**
- **Revenue by period** (daily, weekly, monthly)
- **Payment method** distribution
- **Refund and chargeback** tracking
- **Driver and support worker** earnings
- **Platform profitability** analysis

---

## 🔧 **Configuration Management**

### **Environment-Specific Settings**

#### **Development**
- **Local Supabase** connection
- **Test Stripe keys** for safe testing
- **Debug logging** enabled
- **Hot reload** for rapid development
- **Source maps** for debugging

#### **Production**
- **Production Supabase** instance
- **Live Stripe keys** for real payments
- **Error logging** only
- **Optimized builds** with minification
- **CDN delivery** for performance

### **Feature Flags**
- **Email confirmation** toggle
- **Payment methods** availability
- **Real-time features** enable/disable
- **Admin features** access control
- **Maintenance mode** for updates

---

## 🚨 **Error Handling & Logging**

### **Frontend Error Handling**
- **Error boundaries** for component crashes
- **Async error handling** with try-catch
- **User feedback** for error states
- **Retry mechanisms** for failed operations
- **Graceful degradation** for missing features

### **Backend Error Handling**
- **Database transaction** rollbacks
- **API error responses** with proper HTTP codes
- **Webhook retry logic** for failed events
- **Email delivery** retry mechanisms
- **Logging** for debugging and monitoring

### **Common Error Scenarios**
- **Network connectivity** issues
- **Payment processing** failures
- **Email delivery** problems
- **Authentication** errors
- **Database** connection issues

---

## 🧪 **Testing Strategy**

### **Testing Approach**
- **Component testing** with React Testing Library
- **Integration testing** for user flows
- **API testing** for Edge Functions
- **Database testing** for RLS policies
- **Payment testing** with Stripe test mode

### **Test Coverage Areas**
- **Authentication flows** (signup, login, password reset)
- **Booking creation** and management
- **Payment processing** end-to-end
- **Email notification** delivery
- **Admin functionality** and permissions

---

## 📱 **Mobile Responsiveness**

### **Responsive Design**
- **Mobile-first** approach with progressive enhancement
- **Breakpoint system** (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Touch-friendly** interface with large tap targets
- **Optimized forms** for mobile input
- **Accessible navigation** with proper focus management

### **Progressive Web App (PWA)**
- **Service worker** for offline functionality
- **App manifest** for installation
- **Push notifications** for real-time updates
- **Offline fallbacks** for critical features

---

## 🔍 **SEO & Performance**

### **SEO Optimization**
- **Meta tags** management with React Helmet
- **Open Graph** tags for social sharing
- **Structured data** for rich snippets
- **Sitemap** generation and submission
- **Canonical URLs** for duplicate content prevention

### **Performance Optimization**
- **Code splitting** for faster initial loads
- **Image optimization** with WebP format
- **Font optimization** with preload hints
- **Bundle optimization** with tree shaking
- **CDN delivery** for global performance

### **Core Web Vitals**
- **Largest Contentful Paint (LCP)** < 2.5s
- **First Input Delay (FID)** < 100ms
- **Cumulative Layout Shift (CLS)** < 0.1
- **Time to First Byte (TTFB)** optimization

---

## 🛠️ **Development Commands**

### **Local Development**
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Database Management**
```bash
# Run migrations
supabase db push

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > src/lib/database.types.ts
```

### **Deployment**
```bash
# Deploy to Netlify
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Authentication Problems**
```bash
# Clear browser storage
localStorage.clear()
sessionStorage.clear()

# Check Supabase connection
# Verify environment variables
# Confirm email settings
```

#### **Payment Issues**
```bash
# Verify Stripe keys
# Check webhook endpoints
# Validate payment amounts
# Test with Stripe test cards
```

#### **Email Delivery Problems**
```bash
# Check email queue
SELECT * FROM admin_email_notifications WHERE sent = false;

# Process email queue manually
curl -X POST https://your-project.supabase.co/functions/v1/enhanced-email-processor

# Verify SMTP configuration
```

#### **Database Connection Issues**
```bash
# Check environment variables
# Verify Supabase project status
# Test database connectivity
# Review RLS policies
```

### **Debug Tools**
- **Browser DevTools** for frontend debugging
- **Supabase Dashboard** for database inspection
- **Stripe Dashboard** for payment monitoring
- **Netlify Dashboard** for deployment logs
- **Console logging** for application flow tracking

---

## 📞 **Support & Contact**

### **Technical Support**
- **Email**: admin@ablego.co.uk
- **Phone**: 0800 123 4567
- **Documentation**: This README file
- **Issue Tracking**: Via repository issues

### **Business Contact**
- **General Inquiries**: hello@ablego.co.uk
- **Partnerships**: join@ablego.co.uk
- **Privacy**: privacy@ablego.co.uk
- **Support**: support@ablego.co.uk

---

## 📄 **License & Legal**

### **Company Information**
- **Company Name**: AbleGo Ltd
- **Registration**: England and Wales
- **Company Number**: 16619305
- **Registered Office**: Middlesbrough, United Kingdom

### **Compliance**
- **GDPR** compliant data processing
- **PCI DSS** compliant payment handling
- **Accessibility** standards compliance (WCAG 2.1)
- **UK transport** regulations compliance

---

## 🔄 **Version History**

### **Current Version**: 1.0.0
- ✅ Complete booking system with guest and registered users
- ✅ Multi-role authentication with admin dashboard
- ✅ Stripe payment processing with Connect integration
- ✅ Enhanced email notification system
- ✅ Real-time tracking and notifications
- ✅ Comprehensive admin management tools
- ✅ Mobile-responsive design with PWA features
- ✅ SEO optimization and performance tuning

### **Planned Features**
- 🔄 SMS integration for driver notifications
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app development
- 🔄 API rate limiting and throttling
- 🔄 Advanced booking scheduling
- 🔄 Customer loyalty program
- 🔄 Multi-language support
- 🔄 Advanced accessibility features

---

## 📚 **Additional Resources**

### **External Documentation**
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### **API References**
- [Google Maps API](https://developers.google.com/maps/documentation)
- [Postcodes.io API](https://postcodes.io)
- [Netlify Functions](https://docs.netlify.com/functions/overview)

---

## 🎯 **Getting Started Checklist**

### **For Developers**
- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Configure Supabase project
- [ ] Set up Stripe account and keys
- [ ] Configure Google Maps API
- [ ] Run database migrations
- [ ] Start development server
- [ ] Test core functionality

### **For Administrators**
- [ ] Create admin user account
- [ ] Configure email settings
- [ ] Set up payment processing
- [ ] Configure notification preferences
- [ ] Test booking and payment flow
- [ ] Verify email delivery
- [ ] Set up monitoring and alerts

### **For Production Deployment**
- [ ] Configure production environment variables
- [ ] Set up Netlify deployment
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure email service
- [ ] Test production payment flow
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures

---

This comprehensive documentation covers every aspect of the AbleGo platform, from technical implementation to business processes. The application is production-ready with robust security, scalable architecture, and comprehensive feature set designed specifically for accessible transport services.