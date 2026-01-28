-- Fix RLS policies for sessions table to allow proper session management

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;

-- Create new policies that work with both authenticated users and service role

-- Users can view their own sessions OR service role can view all
CREATE POLICY "Users can view own sessions or service role can view all" ON public.sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can insert their own sessions OR service role can insert any
CREATE POLICY "Users can insert own sessions or service role can insert any" ON public.sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can update their own sessions OR service role can update any
CREATE POLICY "Users can update own sessions or service role can update any" ON public.sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can delete their own sessions OR service role can delete any
CREATE POLICY "Users can delete own sessions or service role can delete any" ON public.sessions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Grant permissions to service role
GRANT ALL ON public.sessions TO service_role;