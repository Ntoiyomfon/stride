/**
 * Session Initializer
 * 
 * This module handles session initialization and ensures that session records
 * are created for existing authenticated users.
 */

import { authService } from './supabase-auth-service'

let initialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Initialize session tracking for the current user
 * This should be called once when the app loads
 */
export async function initializeSessionTracking(): Promise<void> {
  if (initialized) return
  
  // If already initializing, wait for that to complete
  if (initializationPromise) {
    return initializationPromise
  }
  
  initializationPromise = performInitialization()
  return initializationPromise
}

async function performInitialization(): Promise<void> {
  try {
    console.log('🔄 Initializing session tracking...')
    
    // Get current session
    const sessionResult = await authService.getSession()
    
    if (sessionResult.success && sessionResult.data?.user) {
      const { user } = sessionResult.data
      
      console.log('👤 Found authenticated user:', user.id)
      
      // Check if session record already exists by trying to get sessions
      try {
        const response = await fetch('/api/sessions', {
          method: 'GET',
          credentials: 'include'
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          if (data.sessions && data.sessions.length > 0) {
            console.log('✅ Session record already exists')
          } else {
            console.log('📝 Creating new session record...')
            
            // Create session record via API
            const createResponse = await fetch('/api/sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                action: 'create'
              })
            })
            
            const createData = await createResponse.json()
            
            if (createResponse.ok && createData.success) {
              console.log('✅ Session record created successfully')
            } else {
              console.error('❌ Failed to create session record:', createData.error)
            }
          }
        } else {
          console.error('❌ Failed to check existing sessions:', data.error)
        }
      } catch (apiError) {
        console.error('❌ Error calling sessions API:', apiError)
      }
    } else {
      console.log('👤 No authenticated user found')
    }
    
    initialized = true
    initializationPromise = null
    console.log('✅ Session tracking initialized')
    
  } catch (error) {
    console.error('❌ Error initializing session tracking:', error)
    initialized = true // Mark as initialized even on error to prevent retries
    initializationPromise = null
  }
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetSessionInitialization(): void {
  initialized = false
  initializationPromise = null
}