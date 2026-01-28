#!/usr/bin/env tsx

/**
 * Check user authentication data to understand what providers are connected
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

async function checkUserAuthData() {
  try {
    console.log('🔍 Checking user authentication data...')
    
    // Get users from auth.users table
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`👥 Found ${users.users.length} users:`)
    
    for (const user of users.users) {
      console.log(`\n📋 User: ${user.email} (${user.id})`)
      console.log('Auth metadata:', JSON.stringify(user.user_metadata, null, 2))
      console.log('App metadata:', JSON.stringify(user.app_metadata, null, 2))
      console.log('Identities:', JSON.stringify(user.identities, null, 2))
      console.log('Providers:', user.identities?.map(i => i.provider) || [])
      console.log('Created via:', user.app_metadata?.provider || 'unknown')
      console.log('Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log('  ❌ No profile found:', profileError.message)
      } else {
        console.log('  ✅ Profile auth_providers:', profile.auth_providers)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUserAuthData()