#!/usr/bin/env tsx

/**
 * Test Profile Creation with Service Role
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testProfileCreation() {
  try {
    console.log('🧪 Testing profile creation with service role...')
    
    // First, let's check if we can read existing profiles
    console.log('1. Testing read access...')
    const { data: profiles, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (readError) {
      console.error('❌ Read error:', readError)
    } else {
      console.log('✅ Read successful. Found', profiles?.length || 0, 'profiles')
      if (profiles && profiles.length > 0) {
        console.log('Sample profile:', profiles[0])
      }
    }
    
    // Test creating a dummy profile (we'll delete it after)
    console.log('2. Testing profile creation...')
    const testUserId = '00000000-0000-0000-0000-000000000001' // Dummy UUID
    const testProfile = {
      id: testUserId,
      name: 'Test User',
      email: 'test@example.com',
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
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)
      
      // Clean up - delete the test profile
      console.log('3. Cleaning up test profile...')
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId)
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError)
      } else {
        console.log('✅ Test profile deleted successfully')
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testProfileCreation()