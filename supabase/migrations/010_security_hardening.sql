-- Security Hardening Migration
-- This migration addresses the 11 security vulnerabilities found in the security scan

-- ============================================================================
-- 1. LOGIN RATE LIMITING (HIGH PRIORITY)
-- ============================================================================

-- Create rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or email
    attempt_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset', 'otp'
    attempts INTEGER DEFAULT 1,
    first_attempt_at TI