#!/usr/bin/env tsx

/**
 * Update user profile with connected providers from auth metadata
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

async function updateUserProviders() {
  try {
    console.log('🔧 Updating user providers...')
    
    // Get users from auth.users table
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    for (const user of users.users) {
      console.log(`\n📋 Processing user: ${user.email}`)
      
      const providers = user.app_metadata?.providers || []
      console.log('Connected providers:', providers)
      
      if (providers.length > 0) {
        // Update user profile with connected providers
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            auth_providers: providers
          })
          .eq('id', user.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('❌ Error updating profile:', updateError)
        } else {
          console.log('✅ Updated profile auth_providers:', updatedProfile.auth_providers)
        }
      } else {
        console.log('ℹ️ No providers to update')
      }
    }
    
    console.log('\n🎉 User providers update complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateUserProviders()