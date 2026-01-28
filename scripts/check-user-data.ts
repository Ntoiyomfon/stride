#!/usr/bin/env tsx

/**
 * Check what data exists for the current user
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

async function checkUserData() {
  try {
    console.log('🔍 Checking current user data...')
    
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`👥 Found ${users.users.length} users:`)
    
    for (const user of users.users) {
      console.log(`\n📋 User: ${user.email} (${user.id})`)
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log('  ❌ No profile found:', profileError.message)
      } else {
        console.log('  ✅ Profile exists:', profile.name)
      }
      
      // Check boards
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
      
      if (boardsError) {
        console.log('  ❌ Error fetching boards:', boardsError.message)
      } else {
        console.log(`  📊 Boards: ${boards.length}`)
        boards.forEach(board => {
          console.log(`    - ${board.name} (ID: ${board.id})`)
        })
      }
      
      // Check columns for each board
      for (const board of boards || []) {
        const { data: columns, error: columnsError } = await supabase
          .from('columns')
          .select('*')
          .eq('board_id', board.id)
          .order('order_index')
        
        if (columnsError) {
          console.log(`    ❌ Error fetching columns for board ${board.name}:`, columnsError.message)
        } else {
          console.log(`    📝 Columns for "${board.name}": ${columns.length}`)
          columns.forEach(col => {
            console.log(`      - ${col.name} (Order: ${col.order_index})`)
          })
        }
        
        // Check job applications
        const { data: jobs, error: jobsError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('board_id', board.id)
        
        if (jobsError) {
          console.log(`    ❌ Error fetching job applications:`, jobsError.message)
        } else {
          console.log(`    💼 Job applications: ${jobs.length}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUserData()