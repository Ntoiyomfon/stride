import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Client-side Supabase client
export function createSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce'
      }
    }
  )
}

// Server-side Supabase client
export async function createSupabaseServerClient() {
  // Dynamic import to avoid issues with Next.js headers in client components
  const { cookies } = await import('next/headers')
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore = await cookies()
            return cookieStore.getAll()
          } catch (error) {
            // During prerendering, cookies() is not available
            return []
          }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component during prerendering.
          }
        },
      },
    }
  )
}

// Alternative server client that doesn't use cookies (for API routes)
export async function createSupabaseServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async getAll() { return [] },
        async setAll() { /* no-op */ },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}