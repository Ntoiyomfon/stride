#!/usr/bin/env tsx

/**
 * Test script to debug MFA setup issues
 */

import { createSupabaseServiceClient } from '../lib/supabase/utils'
import { mfaService } from '../lib/auth/mfa-service'

async function testMFASetup() {
  console.log('🔍 Testing MFA Setup...\n')

  try {
    // Test 1: Check if we can create a service client
    console.log('1. Testing Supabase service client creation...')
    const serviceClient = await createSupabaseServiceClient()
    console.log('✅ Service client created successfully\n')

    // Test 2: Check if MFA enrollment works
    console.log('2. Testing MFA enrollment (this should fail without a user session)...')
    try {
      const enrollResult = await mfaService.enrollMFA('totp', 'Test Authenticator')
      console.log('❌ Unexpected success:', enrollResult)
    } catch (error) {
      console.log('✅ Expected error (no user session):', error instanceof Error ? error.message : error)
    }
    console.log('')

    // Test 3: Check if we can list factors (should also fail without session)
    console.log('3. Testing MFA factor listing (this should fail without a user session)...')
    try {
      const factorsResult = await mfaService.listFactors()
      console.log('❌ Unexpected success:', factorsResult)
    } catch (error) {
      console.log('✅ Expected error (no user session):', error instanceof Error ? error.message : error)
    }
    console.log('')

    // Test 4: Check Supabase project MFA settings
    console.log('4. Testing Supabase project configuration...')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    console.log('')

    // Test 5: Try to check auth configuration
    console.log('5. Testing auth configuration access...')
    try {
      // This might not work without proper admin access, but let's try
      const { data, error } = await serviceClient.auth.admin.listUsers()
      if (error) {
        console.log('⚠️  Auth admin access error:', error.message)
      } else {
        console.log('✅ Auth admin access working, found', data.users?.length || 0, 'users')
      }
    } catch (error) {
      console.log('⚠️  Auth admin access error:', error instanceof Error ? error.message : error)
    }
    console.log('')

    console.log('🎯 MFA Test Summary:')
    console.log('   - MFA is enabled by default on all Supabase projects')
    console.log('   - The errors above are expected when no user is signed in')
    console.log('   - The real issue is likely in the client-side implementation')
    console.log('   - Check browser console for actual MFA enrollment errors')
    console.log('')
    console.log('💡 Next steps:')
    console.log('   1. Test MFA enrollment from the browser (signed-in user)')
    console.log('   2. Check browser network tab for API errors')
    console.log('   3. Verify user has a valid session when attempting MFA setup')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testMFASetup().catch(console.error)