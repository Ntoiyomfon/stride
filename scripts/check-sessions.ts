#!/usr/bin/env tsx

/**
 * Check existing sessions
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

async function checkSessions() {
  try {
    console.log('🔐 Checking sessions table...')
    
    // Check sessions in our custom sessions table
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching sessions:', error)
      return
    }
    
    console.log(`✅ Found ${sessions.length} sessions:`)
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. User ID: ${session.user_id}`)
      console.log(`   Token: ${session.access_token?.substring(0, 20)}...`)
      console.log(`   Created: ${session.created_at}`)
      console.log(`   Last Activity: ${session.last_activity}`)
      console.log(`   Device: ${session.device_info}`)
      console.log(`   Active: ${session.is_active}`)
      console.log('---')
    })
    
    // Also check if we can get any auth sessions
    console.log('🔍 Checking auth sessions...')
    try {
      const { data: authSessions, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) {
        console.error('Auth sessions error:', authError)
      } else {
        console.log(`Auth users count: ${authSessions.users.length}`)
      }
    } catch (e) {
      console.log('Could not check auth sessions:', e)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkSessions()