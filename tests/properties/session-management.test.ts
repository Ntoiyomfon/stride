import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import fc from 'fast-check'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn((...args: any[]) => ({
    insert: jest.fn((...args: any[]) => ({ error: null })),
    select: jest.fn((...args: any[]) => ({
      eq: jest.fn((...args: any[]) => ({
        eq: jest.fn((...args: any[]) => ({
          order: jest.fn((...args: any[]) => ({ data: [], error: null }))
        }))
      }))
    })),
    update: jest.fn((...args: any[]) => ({
      eq: jest.fn((...args: any[]) => ({ error: null }))
    }))
  })),
  rpc: jest.fn((...args: any[]) => ({ data: 0, error: null }))
}

// Mock the supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

// Mock the server client
jest.mock('@/lib/supabase/utils', () => ({
  createSupabaseServerClient: () => mockSupabaseClient
}))

// Mock device parser
jest.mock('@/lib/utils/device-parser', () => ({
  parseUserAgent: jest.fn((userAgent: string) => ({
    browser: 'Chrome',
    os: 'Windows',
    deviceType: 'desktop'
  })),
  getLocationFromIP: jest.fn(async (ip: string) => ({
    city: 'Test City',
    country: 'Test Country'
  }))
}))

// Import after mocking
import { sessionManager } from '@/lib/auth/session-manager'
import type { SessionInfo } from '@/lib/auth/session-manager'

describe('Session Management Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Arbitraries for property-based testing
  const sessionIdArbitrary = fc.string({ minLength: 10, maxLength: 50 })
  const userIdArbitrary = fc.uuid()
  const userAgentArbitrary = fc.string({ minLength: 10, maxLength: 200 })
  const ipAddressArbitrary = fc.ipV4()
  
  const sessionInfoArbitrary = fc.record({
    sessionId: sessionIdArbitrary,
    browser: fc.string({ minLength: 1, maxLength: 50 }),
    os: fc.string({ minLength: 1, maxLength: 50 }),
    deviceType: fc.constantFrom('desktop', 'mobile', 'tablet'),
    location: fc.record({
      city: fc.string({ minLength: 1, maxLength: 50 }),
      country: fc.string({ minLength: 1, maxLength: 50 })
    }),
    ipAddress: ipAddressArbitrary,
    createdAt: fc.date(),
    lastActiveAt: fc.date(),
    isCurrent: fc.boolean()
  })

  test('Property 5: Session Management Consistency - Session Creation', async () => {
    // **Validates: Requirements 2.4, 2.5, 8.1, 8.2, 8.3, 8.4**
    // Property: Creating a session record should always succeed with valid inputs
    // and should handle device information parsing consistently
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(sessionIdArbitrary, userIdArbitrary, userAgentArbitrary, ipAddressArbitrary),
      async ([sessionId, userId, userAgent, ipAddress]) => {
        // Mock successful session creation
        const mockInsert = jest.fn(() => ({ error: null }))
        const mockFrom = jest.fn(() => ({
          insert: mockInsert
        }))
        mockSupabaseClient.from = mockFrom

        // Execute session creation
        const result = await sessionManager.createSessionRecord(sessionId, userId, userAgent, ipAddress)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()

        // Verify database interaction
        expect(mockFrom).toHaveBeenCalledWith('sessions')
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            session_id: sessionId,
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            browser: 'Chrome',
            os: 'Windows',
            device_type: 'desktop',
            is_revoked: false
          })
        )
      }
    ), { numRuns: 20 })
  })

  test('Property 5: Session Management Consistency - Session Activity Updates', async () => {
    // **Validates: Requirements 2.4, 8.2**
    // Property: Updating session activity should always call the correct RPC function
    // and handle both success and failure cases consistently
    
    await fc.assert(fc.asyncProperty(
      sessionIdArbitrary,
      async (sessionId) => {
        // Mock successful activity update
        const mockRpc = jest.fn(() => ({ data: true, error: null }))
        mockSupabaseClient.rpc = mockRpc

        // Execute activity update
        const result = await sessionManager.updateSessionActivity(sessionId)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()

        // Verify RPC call
        expect(mockRpc).toHaveBeenCalledWith('update_session_activity', {
          session_id_param: sessionId
        })
      }
    ), { numRuns: 15 })
  })

  test('Property 5: Session Management Consistency - Session Retrieval', async () => {
    // **Validates: Requirements 2.4, 8.1, 8.3**
    // Property: Retrieving user sessions should return consistent data structure
    // and properly identify current session
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(userIdArbitrary, sessionIdArbitrary, fc.array(sessionInfoArbitrary, { minLength: 1, maxLength: 5 })),
      async ([userId, currentSessionId, mockSessions]) => {
        // Mark one session as current
        const sessionsWithCurrent = mockSessions.map((session, index) => ({
          ...session,
          session_id: index === 0 ? currentSessionId : session.sessionId,
          user_id: userId,
          created_at: session.createdAt.toISOString(),
          last_active_at: session.lastActiveAt.toISOString()
        }))

        // Mock successful session retrieval
        const mockSelect = jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({ data: sessionsWithCurrent, error: null }))
            }))
          }))
        }))
        const mockFrom = jest.fn(() => ({ select: mockSelect }))
        mockSupabaseClient.from = mockFrom

        // Execute session retrieval
        const result = await sessionManager.getUserSessions(userId, currentSessionId)

        // Verify result structure
        expect(result.error).toBeUndefined()
        expect(result.sessions).toBeDefined()
        expect(Array.isArray(result.sessions)).toBe(true)

        if (result.sessions && result.sessions.length > 0) {
          // Verify current session is properly identified
          const currentSession = result.sessions.find(s => s.isCurrent)
          expect(currentSession).toBeDefined()
          expect(currentSession?.sessionId).toBe(currentSessionId)

          // Verify all sessions have required properties
          result.sessions.forEach(session => {
            expect(session).toHaveProperty('sessionId')
            expect(session).toHaveProperty('browser')
            expect(session).toHaveProperty('os')
            expect(session).toHaveProperty('deviceType')
            expect(session).toHaveProperty('location')
            expect(session).toHaveProperty('ipAddress')
            expect(session).toHaveProperty('createdAt')
            expect(session).toHaveProperty('lastActiveAt')
            expect(session).toHaveProperty('isCurrent')
            expect(typeof session.isCurrent).toBe('boolean')
          })
        }

        // Verify database query
        expect(mockFrom).toHaveBeenCalledWith('sessions')
      }
    ), { numRuns: 15 })
  })

  test('Property 5: Session Management Consistency - Session Revocation', async () => {
    // **Validates: Requirements 8.3, 8.4**
    // Property: Revoking sessions should always call the correct RPC function
    // and handle authorization properly
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(sessionIdArbitrary, userIdArbitrary),
      async ([sessionId, userId]) => {
        // Mock successful session revocation
        const mockRpc = jest.fn(() => ({ data: true, error: null }))
        mockSupabaseClient.rpc = mockRpc

        // Execute session revocation
        const result = await sessionManager.revokeSession(sessionId, userId)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()

        // Verify RPC call
        expect(mockRpc).toHaveBeenCalledWith('revoke_session', {
          session_id_param: sessionId,
          user_id_param: userId
        })
      }
    ), { numRuns: 15 })
  })

  test('Property 5: Session Management Consistency - Bulk Session Revocation', async () => {
    // **Validates: Requirements 8.3, 8.4**
    // Property: Revoking all other sessions should preserve current session
    // and return accurate count of revoked sessions
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(sessionIdArbitrary, userIdArbitrary, fc.integer({ min: 0, max: 10 })),
      async ([currentSessionId, userId, revokedCount]) => {
        // Mock successful bulk revocation
        const mockRpc = jest.fn(() => ({ data: revokedCount, error: null }))
        mockSupabaseClient.rpc = mockRpc

        // Execute bulk session revocation
        const result = await sessionManager.revokeAllOtherSessions(currentSessionId, userId)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
        expect(result.revokedCount).toBe(revokedCount)

        // Verify RPC call
        expect(mockRpc).toHaveBeenCalledWith('revoke_all_other_sessions', {
          current_session_id: currentSessionId,
          user_id_param: userId
        })
      }
    ), { numRuns: 15 })
  })

  test('Property 5: Session Management Consistency - Session Cleanup', async () => {
    // **Validates: Requirements 8.1, 8.2**
    // Property: Session cleanup should always return a non-negative count
    // and handle database operations consistently
    
    await fc.assert(fc.asyncProperty(
      fc.integer({ min: 0, max: 100 }),
      async (deletedCount) => {
        // Mock successful cleanup
        const mockRpc = jest.fn(() => ({ data: deletedCount, error: null }))
        mockSupabaseClient.rpc = mockRpc

        // Execute session cleanup
        const result = await sessionManager.cleanupExpiredSessions()

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeUndefined()
        expect(result.deletedCount).toBe(deletedCount)
        expect(result.deletedCount).toBeGreaterThanOrEqual(0)

        // Verify RPC call
        expect(mockRpc).toHaveBeenCalledWith('cleanup_expired_sessions')
      }
    ), { numRuns: 10 })
  })

  test('Property 5: Session Management Consistency - Error Handling', async () => {
    // **Validates: Requirements 2.6, 8.3**
    // Property: All session management operations should handle errors gracefully
    // and return consistent error structures
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(sessionIdArbitrary, userIdArbitrary, fc.string({ minLength: 1, maxLength: 100 })),
      async ([sessionId, userId, errorMessage]) => {
        // Mock database error
        const mockError = { message: errorMessage }
        const mockRpc = jest.fn(() => ({ data: null, error: mockError }))
        mockSupabaseClient.rpc = mockRpc

        // Test error handling in different operations
        const operations = [
          () => sessionManager.updateSessionActivity(sessionId),
          () => sessionManager.revokeSession(sessionId, userId),
          () => sessionManager.revokeAllOtherSessions(sessionId, userId),
          () => sessionManager.cleanupExpiredSessions()
        ]

        for (const operation of operations) {
          const result = await operation()

          // Verify error handling
          expect(result.success).toBe(false)
          expect(result.error).toBe(errorMessage)
        }
      }
    ), { numRuns: 10 })
  })
})