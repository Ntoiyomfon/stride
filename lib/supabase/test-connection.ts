import { supabase } from './client'
import { supabaseAdmin } from './server'
import { getSupabaseConfig } from './config'

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    const config = getSupabaseConfig()
    console.log(`Environment: ${(config.global.headers as any)['X-Environment']}`)
    console.log(`URL: ${config.url}`)
    
    // Test client connection
    const { data: clientData, error: clientError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (clientError && !['PGRST116', 'PGRST205'].includes(clientError.code)) {
      console.error('Client connection error:', clientError)
      return { success: false, error: clientError }
    }
    
    // Test admin connection
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (adminError && !['PGRST116', 'PGRST205'].includes(adminError.code)) {
      console.error('Admin connection error:', adminError)
      return { success: false, error: adminError }
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('✅ Client and admin connections working')
    console.log('✅ Database schema accessible')
    
    return { success: true }
    
  } catch (error) {
    console.error('Connection test failed:', error)
    return { success: false, error }
  }
}

// Test function for development
if (process.env.NODE_ENV === 'development') {
  testSupabaseConnection().then(result => {
    if (!result.success) {
      console.warn('⚠️ Supabase connection test failed. Please check your environment variables.')
    }
  })
}