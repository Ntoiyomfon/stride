#!/usr/bin/env tsx

/**
 * Supabase Setup Script
 * 
 * This script helps verify Supabase configuration and provides setup instructions.
 * Run with: npm run setup:supabase
 */

import { testSupabaseConnection } from '../lib/supabase/test-connection'

async function main() {
  console.log('🚀 Supabase Setup Verification\n')
  
  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.log('\n📝 Setup Instructions:')
    console.log('1. Go to https://supabase.com and create a new project')
    console.log('2. Get your project URL and API keys from Settings > API')
    console.log('3. Update your .env.local file with the actual values')
    console.log('4. Configure OAuth providers in Authentication > Providers')
    console.log('   - Google: Use existing GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
    console.log('   - GitHub: Use existing GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET')
    console.log('5. Run this script again to verify the connection\n')
    process.exit(1)
  }
  
  console.log('✅ All environment variables are set')
  
  // Test connection
  const connectionResult = await testSupabaseConnection()
  
  if (connectionResult.success) {
    console.log('✅ Supabase connection successful!')
    console.log('\n🎉 Setup complete! You can now proceed to the next migration task.')
  } else {
    console.error('❌ Supabase connection failed:', connectionResult.error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Verify your Supabase project URL and API keys')
    console.log('2. Check that your Supabase project is active')
    console.log('3. Ensure your network connection is working')
  }
}

main().catch(console.error)