-- Update session revocation functions to delete sessions instead of marking as revoked
-- This ensures sessions are immediately removed from the database when revoked

-- Function to revoke session (delete instead of mark as revoked)
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

-- Function to revoke all other sessions for a user (delete instead of mark as revoked)
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