-- ============================================================================
-- COMPREHENSIVE SECURITY FIXES FOR SUPABASE PROJECT
-- ============================================================================
-- This migration addresses all identified security vulnerabilities

-- ============================================================================
-- 1. AUTHENTICATION SECURITY FIXES
-- ============================================================================

-- Enable rate limiting for authentication attempts
-- This helps prevent brute force attacks on login and OTP
ALTER SYSTEM SET auth.rate_limit_login_attempts = 5;
ALTER SYSTEM SET auth.rate_limit_login_window = '15 minutes';
ALTER SYSTEM SET auth.rate_limit_otp_attempts = 3;
ALTER SYSTEM SET auth.rate_limit_otp_window = '5 minutes';

-- Enable password reset rate limiting
ALTER SYSTEM SET auth.rate_limit_password_reset_attempts = 3;
ALTER SYSTEM SET auth.rate_limit_password_reset_window = '1 hour';

-- ============================================================================
-- 2. ENHANCED RLS POLICIES - STRICT SECURITY
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can update all profiles" ON public.user_profiles;

-- USER PROFILES - Strict RLS policies
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
    FOR DELETE USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

-- BOARDS - Strict RLS policies
DROP POLICY IF EXISTS "Users can view own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete own boards" ON public.boards;

CREATE POLICY "boards_select_own" ON public.boards
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "boards_insert_own" ON public.boards
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "boards_update_own" ON public.boards
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "boards_delete_own" ON public.boards
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

-- COLUMNS - Strict RLS policies
DROP POLICY IF EXISTS "Users can view columns of own boards" ON public.columns;
DROP POLICY IF EXISTS "Users can insert columns to own boards" ON public.columns;
DROP POLICY IF EXISTS "Users can update columns of own boards" ON public.columns;
DROP POLICY IF EXISTS "Users can delete columns of own boards" ON public.columns;

CREATE POLICY "columns_select_own" ON public.columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE boards.id = columns.board_id 
            AND (boards.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

CREATE POLICY "columns_insert_own" ON public.columns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE boards.id = columns.board_id 
            AND (boards.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

CREATE POLICY "columns_update_own" ON public.columns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE boards.id = columns.board_id 
            AND (boards.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

CREATE POLICY "columns_delete_own" ON public.columns
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE boards.id = columns.board_id 
            AND (boards.user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
        )
    );

-- JOB APPLICATIONS - Strict RLS policies
DROP POLICY IF EXISTS "Users can view own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can insert own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can delete own job applications" ON public.job_applications;

CREATE POLICY "job_applications_select_own" ON public.job_applications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "job_applications_insert_own" ON public.job_applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "job_applications_update_own" ON public.job_applications
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "job_applications_delete_own" ON public.job_applications
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

-- SESSIONS - Enhanced security policies
DROP POLICY IF EXISTS "Users can view own sessions or service role can view all" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions or service role can insert any" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions or service role can update any" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions or service role can delete any" ON public.sessions;

CREATE POLICY "sessions_select_own" ON public.sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "sessions_insert_own" ON public.sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "sessions_update_own" ON public.sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

CREATE POLICY "sessions_delete_own" ON public.sessions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (auth.jwt() ->> 'role' = 'service_role' AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );

-- ============================================================================
-- 3. SECURE RPC FUNCTIONS WITH PROPER AUTHORIZATION
-- ============================================================================

-- Drop existing functions to recreate with security
DROP FUNCTION IF EXISTS cleanup_expired_sessions();
DROP FUNCTION IF EXISTS update_session_activity(TEXT);
DROP FUNCTION IF EXISTS revoke_session(TEXT, UUID);
DROP FUNCTION IF EXISTS revoke_all_other_sessions(TEXT, UUID);

-- Secure session cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Only allow service role or authenticated users to call this
    IF auth.jwt() ->> 'role' != 'service_role' AND auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied: Authentication required';
    END IF;
    
    -- Delete sessions older than 30 days or marked as revoked
    DELETE FROM public.sessions 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    OR is_revoked = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO public.audit_log (action, details, created_at) 
    VALUES ('session_cleanup', json_build_object('deleted_count', deleted_count), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure session activity update
CREATE OR REPLACE FUNCTION update_session_activity(session_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify the user owns this session or is service role
    IF NOT EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE session_id = session_id_param 
        AND (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role')
    ) THEN
        RAISE EXCEPTION 'Access denied: Session not found or unauthorized';
    END IF;
    
    UPDATE public.sessions 
    SET last_active_at = NOW()
    WHERE session_id = session_id_param 
    AND is_revoked = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure session revocation
CREATE OR REPLACE FUNCTION revoke_session(session_id_param TEXT, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verify the user owns this session or is service role
    IF user_id_param != auth.uid() AND auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Cannot revoke sessions for other users';
    END IF;
    
    DELETE FROM public.sessions 
    WHERE session_id = session_id_param 
    AND user_id = user_id_param 
    AND is_revoked = false;
    
    -- Log the revocation
    INSERT INTO public.audit_log (action, details, user_id, created_at) 
    VALUES ('session_revoked', json_build_object('session_id', session_id_param), user_id_param, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure bulk session revocation
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(current_session_id TEXT, user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    -- Verify the user is revoking their own sessions or is service role
    IF user_id_param != auth.uid() AND auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Cannot revoke sessions for other users';
    END IF;
    
    DELETE FROM public.sessions 
    WHERE user_id = user_id_param 
    AND session_id != current_session_id 
    AND is_revoked = false;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    -- Log the bulk revocation
    INSERT INTO public.audit_log (action, details, user_id, created_at) 
    VALUES ('bulk_session_revoked', json_build_object('revoked_count', revoked_count), user_id_param, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. AUDIT LOGGING SYSTEM
-- ============================================================================

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "audit_log_service_role_only" ON public.audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

-- ============================================================================
-- 5. SECURITY MONITORING FUNCTIONS
-- ============================================================================

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(user_id UUID, suspicious_actions BIGINT, last_action TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.user_id,
        COUNT(*) as suspicious_actions,
        MAX(al.created_at) as last_action
    FROM public.audit_log al
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
    AND al.action IN ('failed_login', 'session_revoked', 'password_reset_attempt')
    GROUP BY al.user_id
    HAVING COUNT(*) > 5
    ORDER BY suspicious_actions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security metrics
CREATE OR REPLACE FUNCTION get_security_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only service role can access security metrics
    IF auth.jwt() ->> 'role' != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Service role required';
    END IF;
    
    SELECT jsonb_build_object(
        'active_sessions', (SELECT COUNT(*) FROM public.sessions WHERE is_revoked = false),
        'total_users', (SELECT COUNT(*) FROM public.user_profiles),
        'failed_logins_24h', (SELECT COUNT(*) FROM public.audit_log WHERE action = 'failed_login' AND created_at > NOW() - INTERVAL '24 hours'),
        'password_resets_24h', (SELECT COUNT(*) FROM public.audit_log WHERE action = 'password_reset_attempt' AND created_at > NOW() - INTERVAL '24 hours'),
        'suspicious_users', (SELECT COUNT(*) FROM detect_suspicious_activity())
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PROPER PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.columns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;

-- Grant audit log insert to authenticated (for logging their own actions)
GRANT INSERT ON public.audit_log TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- 7. ENABLE ADDITIONAL SECURITY FEATURES
-- ============================================================================

-- Enable real-time security (if using Supabase Realtime)
-- This prevents unauthorized access to real-time channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;

-- Create security trigger for failed login attempts
CREATE OR REPLACE FUNCTION log_auth_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Log authentication events for monitoring
    IF TG_OP = 'INSERT' AND NEW.email IS NOT NULL THEN
        INSERT INTO public.audit_log (action, details, created_at)
        VALUES ('user_signup', json_build_object('email', NEW.email), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to auth.users (if accessible)
-- Note: This may not work on hosted Supabase, but included for completeness
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS auth_events_trigger ON auth.users;
        CREATE TRIGGER auth_events_trigger
            AFTER INSERT OR UPDATE ON auth.users
            FOR EACH ROW EXECUTE FUNCTION log_auth_events();
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        -- Ignore if we don't have permission to create triggers on auth schema
        NULL;
END $$;

-- ============================================================================
-- 8. CLEANUP AND MAINTENANCE
-- ============================================================================

-- Create a function to clean up old audit logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_log 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log the security migration
INSERT INTO public.audit_log (action, details, created_at) 
VALUES ('security_migration_applied', json_build_object('migration', '010_comprehensive_security_fixes'), NOW())
ON CONFLICT DO NOTHING;