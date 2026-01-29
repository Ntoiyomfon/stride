import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'

// Client-side Supabase client
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    // During build time, environment variables might not be available
    // Return a mock client that will be replaced at runtime
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables not available during build')
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient<Database>(url, anonKey, {
    auth: {
      flowType: 'pkce'
    }
  })
}

// Server-side Supabase client
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // Dynamic import to avoid issues with Next.js headers in client components
  const { cookies } = await import('next/headers')
  
  return createServerClient<Database>(url, anonKey, {
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
  })
}

// Alternative server client that doesn't use cookies (for API routes)
export async function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      async getAll() { return [] },
      async setAll() { /* no-op */ },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}