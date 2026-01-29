"use client";

import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function AuthDebug() {
  const { user, session, loading, initialized } = useSupabaseAuth();
  const [clientSession, setClientSession] = useState<any>(null);

  useEffect(() => {
    // Get session directly from client
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setClientSession(session);
    });
  }, []);

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Initialized: {initialized ? 'Yes' : 'No'}</div>
      <div>Hook User: {user ? user.id.slice(0, 8) + '...' : 'None'}</div>
      <div>Hook Session: {session ? 'Yes' : 'No'}</div>
      <div>Client Session: {clientSession ? 'Yes' : 'No'}</div>
      <div>Client User: {clientSession?.user ? clientSession.user.id.slice(0, 8) + '...' : 'None'}</div>
    </div>
  );
}