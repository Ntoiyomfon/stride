#!/usr/bin/env tsx

/**
 * Test Session Management System
 */

import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '../lib/auth/session-manager'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSessionSystem() {
  try {
    console.log('🧪 Testing session management system...')
    
    // Get current users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.users.length) {
      console.log('❌ No users found to test with')
      return
    }
    
    const testUser = users.users[0]
    console.log(`👤 Testing with user: ${testUser.email} (${testUser.id})`)
    
    // Test creating a session record
    const testSessionId = 'test-session-' + Date.now()
    const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    
    console.log('📝 Creating test session record...')
    const createResult = await sessionManager.createSessionRecord(
      testSessionId,
      testUser.id,
      testUserAgent,
      '127.0.0.1'
    )
    
    if (createResult.success) {
      console.log('✅ Session record created successfully')
    } else {
      console.error('❌ Failed to create session record:', createResult.error)
      return
    }
    
    // Test getting user sessions
    console.log('📋 Getting user sessions...')
    const sessionsResult = await sessionManager.getUserSessions(testUser.id, testSessionId)
    
    if (sessionsResult.error) {
      console.error('❌ Failed to get user sessions:', sessionsResult.error)
    } else {
      console.log(`✅ Found ${sessionsResult.sessions?.length || 0} sessions:`)
      sessionsResult.sessions?.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.browser} on ${session.os} (${session.isCurrent ? 'Current' : 'Other'})`)
        console.log(`     IP: ${session.ipAddress}, Last active: ${session.lastActiveAt.toISOString()}`)
      })
    }
    
    // Test revoking the session
    console.log('🗑️ Revoking test session...')
    const revokeResult = await sessionManager.revokeSession(testSessionId, testUser.id)
    
    if (revokeResult.success) {
      console.log('✅ Session revoked successfully')
    } else {
      console.error('❌ Failed to revoke session:', revokeResult.error)
    }
    
    // Verify session was revoked
    console.log('🔍 Verifying session was revoked...')
    const finalSessionsResult = await sessionManager.getUserSessions(testUser.id, testSessionId)
    
    if (finalSessionsResult.error) {
      console.error('❌ Failed to get final sessions:', finalSessionsResult.error)
    } else {
      const activeCount = finalSessionsResult.sessions?.length || 0
      console.log(`✅ Final active sessions: ${activeCount}`)
    }
    
    console.log('🎉 Session system test completed!')
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testSessionSystem()