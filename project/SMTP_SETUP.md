# 🔒 SMTP Email Setup Guide

## Security Notice

**IMPORTANT**: SMTP credentials should NEVER be hardcoded in your code. They must be stored as environment variables in Supabase.

## Required Environment Variables

Set these environment variables in your Supabase project:

### Supabase Dashboard Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `myutbivamzrfccoljilo`
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

```env
# SMTP Configuration
SMTP_HOST=smtp.ionos.co.uk
SMTP_PORT=587
SMTP_USER=admin@ablego.co.uk
SMTP_PASS=CareGold17
SMTP_FROM_NAME=AbleGo Ltd
SMTP_FROM_EMAIL=admin@ablego.co.uk
```

## Environment Variables Explained

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `SMTP_HOST` | SMTP server hostname | `smtp.ionos.co.uk` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | `admin@ablego.co.uk` |
| `SMTP_PASS` | SMTP password | `your_password_here` |
| `SMTP_FROM_NAME` | Display name for emails | `AbleGo Ltd` |
| `SMTP_FROM_EMAIL` | From email address | `admin@ablego.co.uk` |

## Security Best Practices

✅ **DO:**
- Store credentials in Supabase environment variables
- Use strong, unique passwords
- Regularly rotate SMTP passwords
- Monitor email delivery logs
- Use TLS encryption (port 587)

❌ **DON'T:**
- Hardcode credentials in source code
- Commit credentials to Git repositories
- Share credentials in public forums
- Use weak passwords
- Use unencrypted connections

## Testing the Setup

After setting up environment variables, test the email system:

```bash
# Test the email system
curl -X POST https://myutbivamzrfccoljilo.supabase.co/functions/v1/test-email-system
```

## Troubleshooting

### Common Issues

1. **"SMTP environment variables not configured"**
   - Check that all required variables are set in Supabase
   - Ensure variable names match exactly (case-sensitive)

2. **"SMTP authentication failed"**
   - Verify username and password are correct
   - Check if 2FA is enabled (use app password)
   - Ensure account is not locked

3. **"Failed to connect to SMTP server"**
   - Verify SMTP host and port are correct
   - Check firewall settings
   - Ensure TLS is enabled

### Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify environment variables are set correctly
3. Test SMTP credentials manually
4. Contact your email provider for support

## Email System Features

- ✅ Professional HTML email templates
- ✅ Customer booking confirmations
- ✅ Admin notifications
- ✅ Email queue processing
- ✅ Error handling and retries
- ✅ Secure credential management
