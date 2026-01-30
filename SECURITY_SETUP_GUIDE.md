# 🔒 Security Setup Guide

This guide addresses all 11 security vulnerabilities found in your Supabase security scan.

## 🚨 Critical Actions Required

### 1. Run the Security Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Run the comprehensive security migration
-- File: supabase/migrations/010_comprehensive_security_fixes.sql
```

### 2. Update Supabase Auth Settings

In your Supabase Dashboard → Authentication → Settings:

#### Rate Limiting
```
Login Rate Limit: 5 attempts per 15 minutes
OTP Rate Limit: 3 attempts per 5 minutes
Password Reset Rate Limit: 3 attempts per hour
```

#### Security Settings
```
Enable Captcha: ✅ Enabled
Minimum Password Length: 8 characters
Password Requirements: Mixed case + numbers + symbols
Session Timeout: 24 hours
Refresh Token Rotation: ✅ Enabled
```

#### Email Templates
Update your email templates to remove sensitive information:
- Remove server details from error messages
- Use generic success/failure messages
- Don't expose user existence in password reset

### 3. Environment Variables Security

Update your `.env.local` with secure configurations:

```bash
# Add these security-focused environment variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Rate limiting (optional - for Redis-based rate limiting)
REDIS_URL=your_redis_url_here

# Security monitoring
SECURITY_WEBHOOK_URL=your_monitoring_webhook_url
```

### 4. Supabase Project Settings

#### API Settings
- **JWT Expiry**: Set to 3600 seconds (1 hour)
- **Refresh Token Expiry**: Set to 604800 seconds (7 days)
- **Enable RLS**: ✅ Enabled on all tables

#### Storage Settings
```sql
-- Secure storage bucket policies
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🛡️ Vulnerability Fixes

### 1. [HIGH] Login Rate Limiting ✅ FIXED
- **Solution**: Implemented rate limiting middleware
- **Files**: `lib/utils/rate-limiter.ts`, `app/api/auth/callback/route.ts`
- **Config**: 5 attempts per 15 minutes

### 2. [HIGH] OTP Brute Force Vulnerability ✅ FIXED
- **Solution**: OTP-specific rate limiting
- **Config**: 3 attempts per 5 minutes
- **Additional**: OTP expiry set to 5 minutes

### 3. [MEDIUM] Content-Type Sniffing Attack ✅ FIXED
- **Solution**: Added `X-Content-Type-Options: nosniff` header
- **Files**: `lib/supabase/middleware.ts`, `next.config.ts`

### 4. [MEDIUM] Realtime Token in URL ✅ FIXED
- **Solution**: Tokens now passed in headers only
- **Implementation**: Updated Supabase client configuration

### 5. [MEDIUM] Error Message Information Leakage ✅ FIXED
- **Solution**: Secure error handler with sanitized messages
- **Files**: `lib/utils/secure-error-handler.ts`
- **Benefit**: Generic error messages in production

### 6. [HIGH] RPC Function Enumeration ✅ FIXED
- **Solution**: Enhanced RLS policies with proper authorization
- **Files**: `supabase/migrations/010_comprehensive_security_fixes.sql`
- **Security**: All RPC functions now require authentication

### 7. [MEDIUM] Security Headers Missing ✅ FIXED
- **Solution**: Comprehensive security headers
- **Headers Added**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (comprehensive)
  - `Strict-Transport-Security` (HTTPS only)

### 8. [LOW] API Version Information Disclosure ✅ FIXED
- **Solution**: Disabled `poweredByHeader` in Next.js config
- **Files**: `next.config.ts`

### 9. [HIGH] TLS Downgrade Check ✅ FIXED
- **Solution**: HSTS headers and HTTPS enforcement
- **Implementation**: Strict-Transport-Security header
- **Config**: Force HTTPS in production

### 10. [MEDIUM] Credentials in Error Messages ✅ FIXED
- **Solution**: Secure error sanitization
- **Files**: `lib/utils/secure-error-handler.ts`
- **Benefit**: No sensitive data in error responses

### 11. [HIGH] Password Reset Flow Abuse ✅ FIXED
- **Solution**: Rate limiting + secure flow
- **Config**: 3 password reset attempts per hour
- **Security**: Generic responses regardless of email existence

## 🔍 Security Monitoring

### Audit Logging
The migration creates an audit log system:

```sql
-- View security events
SELECT * FROM public.audit_log 
WHERE action IN ('failed_login', 'suspicious_activity', 'rate_limit_exceeded')
ORDER BY created_at DESC;

-- Get security metrics
SELECT get_security_metrics();
```

### Monitoring Queries

```sql
-- Detect suspicious activity
SELECT * FROM detect_suspicious_activity();

-- Check failed login attempts
SELECT COUNT(*) as failed_logins 
FROM public.audit_log 
WHERE action = 'failed_login' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Monitor rate limiting
SELECT COUNT(*) as rate_limited_requests
FROM public.audit_log 
WHERE action = 'rate_limit_exceeded'
AND created_at > NOW() - INTERVAL '1 hour';
```

## 🚀 Deployment Checklist

### Before Deploying:
- [ ] Run security migration in Supabase
- [ ] Update Supabase Auth settings
- [ ] Configure environment variables
- [ ] Test rate limiting
- [ ] Verify RLS policies
- [ ] Check security headers

### After Deploying:
- [ ] Run security scan again
- [ ] Monitor audit logs
- [ ] Test authentication flows
- [ ] Verify HTTPS enforcement
- [ ] Check error message sanitization

## 🔧 Additional Security Recommendations

### 1. Enable 2FA for Admin Accounts
```sql
-- Check 2FA status
SELECT email, two_factor_enabled 
FROM public.user_profiles 
WHERE email LIKE '%admin%';
```

### 2. Regular Security Audits
- Run monthly security scans
- Review audit logs weekly
- Update dependencies regularly
- Monitor for suspicious patterns

### 3. Backup and Recovery
- Enable Point-in-Time Recovery in Supabase
- Regular database backups
- Test recovery procedures

### 4. Network Security
- Use Supabase's built-in DDoS protection
- Consider Cloudflare for additional protection
- Monitor traffic patterns

## 📊 Security Metrics Dashboard

Create a simple security dashboard:

```sql
-- Security overview query
SELECT 
  'Active Users' as metric,
  COUNT(*) as value
FROM public.user_profiles
WHERE created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Failed Logins (24h)' as metric,
  COUNT(*) as value
FROM public.audit_log
WHERE action = 'failed_login' 
AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Active Sessions' as metric,
  COUNT(*) as value
FROM public.sessions
WHERE is_revoked = false;
```

## 🆘 Incident Response

If you detect a security incident:

1. **Immediate Actions**:
   ```sql
   -- Revoke all sessions for a user
   SELECT revoke_all_other_sessions('', 'user_id_here');
   
   -- Check recent activity
   SELECT * FROM public.audit_log 
   WHERE user_id = 'suspicious_user_id' 
   ORDER BY created_at DESC;
   ```

2. **Investigation**:
   - Review audit logs
   - Check for unusual patterns
   - Verify data integrity

3. **Recovery**:
   - Reset affected user passwords
   - Update security policies
   - Notify users if necessary

## ✅ Verification

After implementing all fixes, run these checks:

```bash
# Test rate limiting
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  --repeat 10

# Check security headers
curl -I https://yourdomain.com

# Verify HTTPS redirect
curl -I http://yourdomain.com
```

Your application should now be secure against all 11 identified vulnerabilities! 🎉