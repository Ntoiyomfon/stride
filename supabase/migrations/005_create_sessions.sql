-- Create sessions table for custom session tracking
-- This complements Supabase's built-in auth.sessions with additional metadata

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    browser TEXT,
    os TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    location JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Indexes for efficient queries
    CONSTRAINT sessions_session_id_key UNIQUE (session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON public.sessions(user_id, is_revoked, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup ON public.sessions(is_revoked, last_active_at);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions older than 90 days or revoked sessions older than 30 days
    DELETE FROM public.sessions 
    WHERE 
        (is_revoked = true AND last_active_at < NOW() - INTERVAL '30 days')
        OR (last_active_at < NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(session_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.sessions 
    SET last_active_at = NOW()
    WHERE session_id = session_id_param AND is_revoked = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke session
CREATE OR REPLACE FUNCTION revoke_session(session_id_param TEXT, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.sessions 
    WHERE session_id = session_id_param 
    AND user_id = user_id_param 
    AND is_revoked = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all other sessions for a user
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(current_session_id TEXT, user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    DELETE FROM public.sessions 
    WHERE user_id = user_id_param 
    AND session_id != current_session_id 
    AND is_revoked = false;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;