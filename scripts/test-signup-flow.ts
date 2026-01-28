#!/usr/bin/env tsx

/**
 * Test the complete signup flow
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignupFlow() {
  try {
    console.log('🧪 Testing signup flow...')
    
    // Test signup with a temporary email
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`1. Attempting signup with email: ${testEmail}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          full_name: 'Test User'
        }
      }
    })
    
    if (error) {
      console.error('❌ Signup error:', error)
      return
    }
    
    console.log('✅ Signup successful!')
    console.log('User ID:', data.user?.id)
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
    console.log('Session:', data.session ? 'Created' : 'Not created')
    
    if (data.user) {
      // Check if profile was created automatically by the trigger
      console.log('2. Checking if profile was created automatically...')
      
      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      const { data: profile, error: profileError } = await serviceClient
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.log('❌ Profile not created automatically:', profileError.message)
        console.log('3. Attempting manual profile creation...')
        
        // Try to create profile manually using service role
        const profileData = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
          email: data.user.email!,
          theme: 'system',
          accent_color: 'blue',
          notifications: {
            emailNotifications: true,
            weeklySummary: false,
            defaultBoardView: 'kanban'
          },
          two_factor_enabled: false,
          two_factor_backup_codes: [],
          auth_providers: []
        }
        
        const { data: createdProfile, error: createError } = await serviceClient
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Manual profile creation failed:', createError)
        } else {
          console.log('✅ Manual profile creation successful:', createdProfile)
        }
      } else {
        console.log('✅ Profile created automatically:', profile)
      }
      
      // Clean up - delete the test user
      console.log('4. Cleaning up test user...')
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(data.user.id)
      
      if (deleteError) {
        console.error('❌ Failed to delete test user:', deleteError)
      } else {
        console.log('✅ Test user deleted successfully')
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testSignupFlow()