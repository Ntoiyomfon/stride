import { createSupabaseServiceClient } from '../lib/supabase/utils';

async function applySessionRevocationFix() {
  try {
    console.log('🔧 Applying session revocation fix...');
    
    const supabase = await createSupabaseServiceClient();
    
    // Update revoke_session function
    const revokeSessionFunction = `
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
    `;
    
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: revokeSessionFunction });
    if (error1) {
      console.error('❌ Failed to update revoke_session function:', error1);
    } else {
      console.log('✅ Updated revoke_session function');
    }
    
    // Update revoke_all_other_sessions function
    const revokeAllFunction = `
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
    `;
    
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: revokeAllFunction });
    if (error2) {
      console.error('❌ Failed to update revoke_all_other_sessions function:', error2);
    } else {
      console.log('✅ Updated revoke_all_other_sessions function');
    }
    
    console.log('🎉 Session revocation fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying session revocation fix:', error);
  }
}

applySessionRevocationFix();