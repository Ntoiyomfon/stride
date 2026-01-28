#!/usr/bin/env tsx

/**
 * Check existing auth users
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

async function checkAuthUsers() {
  try {
    console.log('👥 Checking auth.users table...')
    
    // Get users from auth.users table
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    console.log(`✅ Found ${users.users.length} users in auth.users:`)
    
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata)}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log('---')
    })
    
    // Now check which ones have profiles
    console.log('📋 Checking existing profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
      return
    }
    
    console.log(`✅ Found ${profiles.length} profiles in user_profiles`)
    
    // Find users without profiles
    const usersWithoutProfiles = users.users.filter(user => 
      !profiles.some(profile => profile.id === user.id)
    )
    
    if (usersWithoutProfiles.length > 0) {
      console.log(`🚨 ${usersWithoutProfiles.length} users without profiles:`)
      usersWithoutProfiles.forEach(user => {
        console.log(`- ${user.email} (${user.id})`)
      })
    } else {
      console.log('✅ All users have profiles')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAuthUsers()