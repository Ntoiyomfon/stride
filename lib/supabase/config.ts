export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'job-application-tracker'
    }
  }
}

// Environment-specific configurations
export const getSupabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  const baseConfig = {
    ...supabaseConfig,
    auth: {
      ...supabaseConfig.auth,
      debug: env === 'development'
    }
  }
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        global: {
          ...baseConfig.global,
          headers: {
            ...baseConfig.global.headers,
            'X-Environment': 'development'
          }
        }
      }
    
    case 'production':
      return {
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          debug: false
        },
        global: {
          ...baseConfig.global,
          headers: {
            ...baseConfig.global.headers,
            'X-Environment': 'production'
          }
        }
      }
    
    case 'test':
      return {
        ...baseConfig,
        auth: {
          ...baseConfig.auth,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          ...baseConfig.global,
          headers: {
            ...baseConfig.global.headers,
            'X-Environment': 'test'
          }
        }
      }
    
    default:
      return baseConfig
  }
}

// Validate required environment variables
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
  if (!supabaseConfig.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!supabaseConfig.anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (!supabaseConfig.serviceRoleKey && process.env.NODE_ENV !== 'test') {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is missing - some features may not work')
  }
}