# 🔒 Security Setup Guide for Production

## Critical Security Configurations Required

### 1. Google Maps API Key Security

#### Current API Key: `AIzaSyCt3tEVN2fXMAkx8qpX1nk9G2nugAumB28`

**URGENT: Configure API Key Restrictions**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to APIs & Services > Credentials**
3. **Find your API key and click "Edit"**
4. **Set Application restrictions**:
   - Choose "HTTP referrers (web sites)"
   - Add these domains:
     ```
     *.netlify.app/*
     *.ablego.co.uk/*
     localhost:*
     ```
5. **Set API restrictions**:
   - Choose "Restrict key"
   - Select only these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
6. **Save changes**

### 2. Environment Variables Setup

#### Netlify Environment Variables

Set these in your Netlify dashboard under **Site settings > Environment variables**:

```
VITE_SUPABASE_URL=https://myutbivamzrfccoljilo.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCt3tEVN2fXMAkx8qpX1nk9G2nugAumB28
VITE_SITE_URL=https://ablego.co.uk
```

#### Supabase Environment Variables

Set these in your Supabase dashboard under **Settings > API**:

```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=admin@ablego.co.uk
SMTP_PASSWORD=your-smtp-password
```

### 3. Database Security

#### Row Level Security (RLS) Policies

Ensure these policies are active in Supabase:

1. **Users table**: Only users can access their own data
2. **Bookings table**: Users can only see their own bookings
3. **Profiles table**: Users can only access their own profile
4. **Admin tables**: Only admin users can access

#### Service Role Key Protection

- **NEVER expose service role key in client-side code**
- **Use only in Supabase Edge Functions**
- **Rotate keys regularly**

### 4. Content Security Policy

The application includes CSP headers in `netlify.toml`:

```toml
[headers]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
```

### 5. SSL/TLS Configuration

- **Netlify automatically provides SSL certificates**
- **Force HTTPS redirects enabled**
- **HSTS headers configured**

### 6. Rate Limiting

Consider implementing rate limiting for:
- API endpoints
- Authentication attempts
- Booking submissions

### 7. Monitoring & Alerting

Set up monitoring for:
- Failed authentication attempts
- Unusual API usage patterns
- Database query performance
- Error rates

## Security Checklist

- [ ] Google Maps API key restrictions configured
- [ ] Environment variables set in Netlify
- [ ] Environment variables set in Supabase
- [ ] RLS policies active
- [ ] Service role key protected
- [ ] CSP headers active
- [ ] SSL/TLS configured
- [ ] Error monitoring set up

## Emergency Contacts

- **Google Cloud Support**: https://cloud.google.com/support
- **Netlify Support**: https://www.netlify.com/support/
- **Supabase Support**: https://supabase.com/support

## Security Incident Response

1. **Immediate**: Rotate compromised keys
2. **Investigation**: Review logs and access patterns
3. **Containment**: Disable affected services if necessary
4. **Recovery**: Restore from backups if needed
5. **Post-mortem**: Document lessons learned
