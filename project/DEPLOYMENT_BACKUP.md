# AbleGo Deployment Backup Documentation

## 🚀 **Deployment Configuration Backup - January 2025**

This document serves as a comprehensive backup of all deployment configurations, procedures, and settings for the AbleGo application.

---

## 📋 **Deployment Overview**

### **Current Deployment Status**
- **Frontend**: ✅ Deployed on Netlify
- **Backend**: ✅ Deployed on Supabase Cloud
- **Domain**: ✅ Configured (ablego.co.uk)
- **SSL**: ✅ Automatic HTTPS
- **CDN**: ✅ Global content delivery
- **Last Deployment**: January 2025

### **Deployment Architecture**
```
Production Environment:
├── Frontend (Netlify)
│   ├── Domain: ablego.co.uk
│   ├── SSL: Automatic
│   ├── CDN: Global
│   └── Build: Automated from GitHub
├── Backend (Supabase)
│   ├── Database: PostgreSQL
│   ├── Auth: Supabase Auth
│   ├── Functions: Edge Functions
│   └── Storage: File Storage
└── External Services
    ├── Stripe: Payment Processing
    ├── Google Maps: Location Services
    └── SMTP: Email Service
```

---

## 🌐 **Netlify Configuration**

### **netlify.toml**
```toml
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
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"

[[headers]]
  for = "/admin/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/dashboard/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/login"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/signup"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/404"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/500"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.jpeg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.gif"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.svg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.ico"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.woff"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.ttf"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.eot"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### **Build Configuration**
```json
{
  "build": {
    "command": "npm run build",
    "publish": "dist",
    "environment": {
      "NODE_VERSION": "18"
    }
  },
  "functions": {
    "directory": "netlify/functions"
  },
  "redirects": [
    {
      "from": "/*",
      "to": "/index.html",
      "status": 200
    }
  ]
}
```

### **Environment Variables (Netlify)**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Application Configuration
VITE_SITE_URL=https://ablego.co.uk
VITE_APP_NAME=AbleGo
VITE_APP_VERSION=2.0.0
```

---

## 🗄️ **Supabase Configuration**

### **Project Settings**
```json
{
  "project_id": "your-project-id",
  "project_ref": "your-project-ref",
  "region": "eu-west-1",
  "organization_id": "your-org-id",
  "name": "ablego-app",
  "database": {
    "host": "db.your-project-ref.supabase.co",
    "port": 5432,
    "name": "postgres"
  }
}
```

### **Database Configuration**
```sql
-- Database Settings
SET timezone = 'UTC';
SET client_encoding = 'UTF8';

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Connection Settings
SET max_connections = 100;
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
```

### **Edge Functions Configuration**
```typescript
// Deno Configuration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment Variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### **Environment Variables (Supabase)**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=admin@ablego.co.uk

# Application Configuration
SITE_URL=https://ablego.co.uk
APP_NAME=AbleGo
APP_VERSION=2.0.0
```

---

## 🔧 **Build Configuration**

### **Vite Configuration (vite.config.ts)**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
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
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].[ext]`
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].[ext]`
          }
          return `assets/[name]-[hash].[ext]`
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
  },
  server: {
    port: 3000,
    host: true
  }
})
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🔐 **Security Configuration**

### **Content Security Policy**
```html
<!-- CSP Headers -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

### **Security Headers**
```toml
# Security Headers Configuration
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

---

## 📧 **Email Configuration**

### **SMTP Settings**
```typescript
// SMTP Configuration
const SMTP_CONFIG = {
  host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
  port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
  secure: false,
  auth: {
    user: Deno.env.get('SMTP_USER'),
    pass: Deno.env.get('SMTP_PASS')
  },
  tls: {
    rejectUnauthorized: false
  }
}

// Email Templates Configuration
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
```

---

## 💳 **Payment Configuration**

### **Stripe Configuration**
```typescript
// Stripe Settings
const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: Deno.env.get('STRIPE_SECRET_KEY'),
  webhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
  connectClientId: import.meta.env.VITE_STRIPE_CONNECT_CLIENT_ID,
  currency: 'gbp',
  paymentMethods: ['card', 'bank_transfer'],
  applicationFeePercent: 10
}

// Webhook Events
const WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'account.updated',
  'payout.paid',
  'payout.failed'
]
```

---

## 🗺️ **Domain Configuration**

### **DNS Settings**
```dns
# Domain: ablego.co.uk
# DNS Records
A     @     75.2.60.5
CNAME www   ablego-app.netlify.app
CNAME api   your-project.supabase.co

# Email Records
MX    @     mail.ablego.co.uk
TXT   @     v=spf1 include:_spf.google.com ~all
TXT   _dmarc v=DMARC1; p=quarantine; rua=mailto:dmarc@ablego.co.uk
```

### **SSL Configuration**
```toml
# SSL Settings (Automatic via Netlify)
[ssl]
  provider = "netlify"
  force_ssl = true
  redirect_http_to_https = true
  hsts = true
  hsts_max_age = 31536000
  hsts_include_subdomains = true
  hsts_preload = true
```

---

## 📊 **Monitoring Configuration**

### **Performance Monitoring**
```typescript
// Performance Tracking
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

### **Health Checks**
```typescript
// Health Check Endpoints
const HEALTH_ENDPOINTS = {
  database: '/health/database',
  auth: '/health/auth',
  email: '/health/email',
  payments: '/health/payments',
  storage: '/health/storage'
}

// Monitoring Configuration
const MONITORING_CONFIG = {
  checkInterval: 300000, // 5 minutes
  timeout: 10000, // 10 seconds
  retries: 3,
  alertThreshold: 0.95 // 95% success rate
}
```

---

## 🔄 **Deployment Procedures**

### **Frontend Deployment**
```bash
# 1. Build the application
npm run build

# 2. Test the build locally
npm run preview

# 3. Deploy to Netlify (automatic via GitHub)
git push origin master

# 4. Verify deployment
curl -I https://ablego.co.uk
```

### **Backend Deployment**
```bash
# 1. Deploy Edge Functions
npx supabase functions deploy

# 2. Run database migrations
npx supabase db push

# 3. Verify functions
npx supabase functions list

# 4. Test endpoints
curl https://your-project.supabase.co/functions/v1/health
```

### **Database Migration**
```bash
# 1. Create migration
npx supabase migration new migration_name

# 2. Apply migration
npx supabase db push

# 3. Verify migration
npx supabase db diff

# 4. Rollback if needed
npx supabase db reset
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**
1. **Build Failures**
   - Check Node.js version (18.x)
   - Verify environment variables
   - Check for TypeScript errors

2. **Deployment Issues**
   - Verify Git repository connection
   - Check build logs in Netlify
   - Verify environment variables

3. **Database Issues**
   - Check Supabase connection
   - Verify RLS policies
   - Check migration status

4. **Email Issues**
   - Verify SMTP credentials
   - Check email queue status
   - Verify template configuration

### **Recovery Procedures**
```bash
# 1. Rollback to previous deployment
git revert HEAD
git push origin master

# 2. Reset database
npx supabase db reset

# 3. Redeploy functions
npx supabase functions deploy --no-verify-jwt

# 4. Clear cache
npm run build -- --force
```

---

## 📋 **Backup Procedures**

### **Code Backup**
```bash
# 1. Create backup branch
git checkout -b backup-$(date +%Y%m%d)

# 2. Push backup branch
git push origin backup-$(date +%Y%m%d)

# 3. Create release tag
git tag -a v2.0.0 -m "Production Release 2.0.0"
git push origin v2.0.0
```

### **Database Backup**
```bash
# 1. Export database
npx supabase db dump --data-only > backup-$(date +%Y%m%d).sql

# 2. Export schema
npx supabase db dump --schema-only > schema-$(date +%Y%m%d).sql

# 3. Backup via Supabase Dashboard
# - Go to Supabase Dashboard
# - Navigate to Settings > Database
# - Click "Create backup"
```

### **Environment Backup**
```bash
# 1. Export environment variables
env | grep -E "(VITE_|SUPABASE_|STRIPE_|SMTP_)" > env-backup-$(date +%Y%m%d).txt

# 2. Document configurations
# - Netlify environment variables
# - Supabase environment variables
# - Domain DNS settings
# - SSL certificates
```

---

## 📞 **Emergency Contacts**

### **Technical Support**
- **Phone**: 01642 089 958
- **Email**: admin@ablego.co.uk
- **GitHub**: https://github.com/ogatech4real/ablego-app/issues

### **Service Providers**
- **Netlify Support**: https://support.netlify.com
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com
- **Domain Provider**: Your domain registrar

---

**Documentation Created**: January 2025  
**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Production Ready  
**Next Review**: February 2025
