"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { initializeSessionTracking } from '@/lib/auth/session-initializer';

export function SessionSync() {
  useEffect(() => {
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Set HTTP cookies for server-side access
        const expires = new Date(session.expires_at! * 1000);
        
        document.cookie = `sb-access-token=${session.access_token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
        document.cookie = `sb-user=${JSON.stringify(session.user)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      } else {
        // Clear cookies if no session
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'sb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    };

    const initializeApp = async () => {
      // Sync session cookies first
      await syncSession();
      
      // Initialize session tracking
      await initializeSessionTracking();
    };

    // Initialize on mount
    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}