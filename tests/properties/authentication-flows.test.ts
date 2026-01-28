/**
 * Property-Based Tests for Authentication Flows
 * 
 * These tests validate that authentication round-trip operations work correctly
 * and maintain data consistency throughout the authentication lifecycle.
 * 
 * **Property 4: Authentication Round Trip**
 * **Validates: Requirements 2.1, 2.2**
 */

import fc from 'fast-check'
import { AuthService } from '../../lib/auth/supabase-auth-service'
import type { User, Session } from '@supabase/supabase-js'

// Mock Supabase client for property testing
const createMockSupabaseClient = () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockResolvedValue({ data: [], error: null })
  }

  // Allow await on the chain by adding then
  Object.assign(mockChain, {
    then: (resolve: any) => resolve({ data: { id: 'test-id' }, error: null })
  })

  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn()
    },
    from: jest.fn(() => mockChain)
  }
}

// Mock the client and utils
jest.mock('../../lib/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}))

jest.mock('../../lib/supabase/utils', () => ({
  createSupabaseServerClient: jest.fn(() => createMockSupabaseClient()),
  createSupabaseServiceClient: jest.fn(async () => createMockSupabaseClient())
}))


// Test data generators
const emailArbitrary = fc.emailAddress()
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 128 })
const nameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
const userIdArbitrary = fc.uuid()
const tokenArbitrary = fc.string({ minLength: 20, maxLength: 200 })
const oauthProviderArbitrary = fc.constantFrom('google', 'github')

const userArbitrary = fc.record({
  id: userIdArbitrary,
  email: emailArbitrary,
  user_metadata: fc.record({
    name: fc.option(nameArbitrary),
    full_name: fc.option(nameArbitrary),
    avatar_url: fc.option(fc.webUrl())
  }),
  created_at: fc.constant('2023-01-01T00:00:00.000Z'),
  updated_at: fc.constant('2023-01-01T00:00:00.000Z')
})

const sessionArbitrary = fc.record({
  access_token: tokenArbitrary,
  refresh_token: tokenArbitrary,
  expires_in: fc.integer({ min: 3600, max: 86400 }),
  expires_at: fc.integer({ min: Math.floor(Date.now() / 1000), max: Math.floor(Date.now() / 1000) + 86400 }),
  token_type: fc.constant('bearer'),
  user: userArbitrary
})

const signUpDataArbitrary = fc.record({
  name: nameArbitrary,
  email: emailArbitrary,
  password: passwordArbitrary
})

const signInDataArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary
})

// Helper functions for authentication flow validation
function validateUserData(user: User, originalData: { name: string; email: string }): boolean {
  // Verify user email matches
  if (user.email !== originalData.email) return false
  
  // Verify user metadata contains name information (allow for null/undefined)
  const userName = user.user_metadata?.name || user.user_metadata?.full_name
  if (userName && userName !== originalData.name) return false
  
  // Verify user has required fields
  if (!user.id || !user.created_at || !user.updated_at) return false
  
  return true
}

function validateSessionData(session: Session): boolean {
  // Verify session has required tokens
  if (!session.access_token || !session.refresh_token) return false
  
  // Verify session has valid expiration (allow for reasonable ranges)
  if (!session.expires_in || session.expires_in <= 0) return false
  if (!session.expires_at || session.expires_at <= 0) return false
  
  // Verify session has user data
  if (!session.user || !session.user.id) return false
  
  return true
}

function validateAuthResult(result: any, shouldSucceed: boolean): boolean {
  if (shouldSucceed) {
    return result.success === true && result.error == null && result.data != null
  } else {
    return result.success === false && result.error != null
  }
}

describe('Authentication Flow Properties', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>
  let authService: AuthService

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    // Mock the client property
    authService = new AuthService()
    ;(authService as any).client = mockClient
  })

  test('Property 4: Authentication Round Trip - Sign Up Flow', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.1, 2.2
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(signUpDataArbitrary, userArbitrary, sessionArbitrary),
      async ([signUpData, mockUser, mockSession]) => {
        // Ensure mock user matches sign up data
        const user = {
          ...mockUser,
          email: signUpData.email,
          user_metadata: {
            ...mockUser.user_metadata,
            name: signUpData.name,
            full_name: signUpData.name
          }
        }
        
        const session = {
          ...mockSession,
          user
        }

        // Mock successful sign up
        ;(mockClient.auth.signUp as jest.Mock).mockResolvedValue({
          data: { user, session },
          error: null
        })

        // Execute sign up
        const result = await authService.signUp(signUpData)

        // Debug: Log the actual result structure
        if (!result.success) {
          console.log('Sign up failed:', result)
        }

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        expect(result.data).not.toBeNull()
        
        // Verify user data preservation
        expect(validateUserData(result.data!.user!, signUpData)).toBe(true)
        
        // Verify session validity
        expect(validateSessionData(result.data!.session!)).toBe(true)
        
        // Verify API was called with correct parameters
        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: signUpData.email,
          password: signUpData.password,
          options: {
            data: {
              name: signUpData.name,
              full_name: signUpData.name
            }
          }
        })
      }
    ), { numRuns: 10 }) // Reduce runs for debugging
  })

  test('Property 4: Authentication Round Trip - Sign In Flow', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.1, 2.2
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(signInDataArbitrary, userArbitrary, sessionArbitrary),
      async ([signInData, mockUser, mockSession]) => {
        // Ensure mock user matches sign in data
        const user = {
          ...mockUser,
          email: signInData.email
        }
        
        const session = {
          ...mockSession,
          user
        }

        // Mock successful sign in
        ;(mockClient.auth.signInWithPassword as jest.Mock).mockResolvedValue({
          data: { user, session },
          error: null
        })

        // Execute sign in
        const result = await authService.signIn(signInData)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        expect(result.data).not.toBeNull()
        
        // Verify user email matches
        expect(result.data!.user!.email).toBe(signInData.email)
        
        // Verify session validity
        expect(validateSessionData(result.data!.session!)).toBe(true)
        
        // Verify API was called with correct parameters
        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: signInData.email,
          password: signInData.password
        })
      }
    ), { numRuns: 10 })
  })

  test('Property 4: Authentication Round Trip - OAuth Flow', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.3, 3.1, 3.2
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(oauthProviderArbitrary, fc.webUrl()),
      async ([provider, redirectUrl]) => {
        const mockAuthUrl = `https://${provider}.com/oauth/authorize?client_id=test&redirect_uri=${encodeURIComponent(redirectUrl)}`

        // Mock successful OAuth initiation
        ;(mockClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
          data: { url: mockAuthUrl },
          error: null
        })

        // Execute OAuth sign in
        const result = await authService.signInWithOAuth(provider, redirectUrl)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        expect(result.data).not.toBeNull()
        
        // Verify OAuth URL is returned
        expect(result.data!.url).toBe(mockAuthUrl)
        expect(result.data!.url).toContain(provider)
        expect(result.data!.url).toContain(encodeURIComponent(redirectUrl))
        
        // Verify API was called with correct parameters
        const expectedRedirectTo = `http://localhost:3000/api/auth/callback?redirect_to=${encodeURIComponent(redirectUrl)}`
        expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider,
          options: {
            redirectTo: expectedRedirectTo
          }
        })
      }
    ), { numRuns: 10 })
  })

  test('Property 4: Authentication Round Trip - Session Management', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.4, 2.5
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(sessionArbitrary, userArbitrary),
      async ([mockSession, mockUser]) => {
        const session = {
          ...mockSession,
          user: mockUser
        }

        // Test getSession
        ;(mockClient.auth.getSession as jest.Mock).mockResolvedValue({
          data: { session },
          error: null
        })

        const sessionResult = await authService.getSession()
        expect(sessionResult.success).toBe(true)
        expect(sessionResult.error).toBeNull()
        expect(sessionResult.data).not.toBeNull()
        expect(validateSessionData(sessionResult.data!)).toBe(true)

        // Test getUser
        ;(mockClient.auth.getUser as jest.Mock).mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const userResult = await authService.getUser()
        expect(userResult.success).toBe(true)
        expect(userResult.error).toBeNull()
        expect(userResult.data).not.toBeNull()
        expect(userResult.data!.id).toBe(mockUser.id)
        expect(userResult.data!.email).toBe(mockUser.email)

        // Test refreshSession
        const newSession = {
          ...session,
          access_token: `new_${session.access_token}`,
          expires_at: session.expires_at + 3600
        }

        ;(mockClient.auth.refreshSession as jest.Mock).mockResolvedValue({
          data: { user: mockUser, session: newSession },
          error: null
        })

        const refreshResult = await authService.refreshSession()
        expect(refreshResult.success).toBe(true)
        expect(refreshResult.error).toBeNull()
        expect(refreshResult.data).not.toBeNull()
        expect(validateSessionData(refreshResult.data!.session!)).toBe(true)
        expect(refreshResult.data!.session!.access_token).toBe(newSession.access_token)
      }
    ), { numRuns: 10 })
  })

  test('Property 4: Authentication Round Trip - Sign Out Flow', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.1, 2.2
    
    await fc.assert(fc.asyncProperty(
      fc.constant(null), // No input needed for sign out
      async () => {
        // Mock successful sign out
        ;(mockClient.auth.signOut as jest.Mock).mockResolvedValue({
          error: null
        })

        // Execute sign out
        const result = await authService.signOut()

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        
        // Verify API was called
        expect(mockClient.auth.signOut).toHaveBeenCalled()
      }
    ), { numRuns: 5 })
  })

  test('Property 4: Authentication Round Trip - Error Handling', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 2.6, 5.4
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(
        signUpDataArbitrary,
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 200 }),
          status: fc.integer({ min: 400, max: 500 })
        })
      ),
      async ([signUpData, mockError]) => {
        // Mock authentication error
        ;(mockClient.auth.signUp as jest.Mock).mockResolvedValue({
          data: { user: null, session: null },
          error: mockError
        })

        // Execute sign up
        const result = await authService.signUp(signUpData)

        // Verify error handling
        expect(validateAuthResult(result, false)).toBe(true)
        expect(result.error).toEqual(mockError)
        expect(result.data).toBeNull()
      }
    ), { numRuns: 30 })
  })

  test('Property 4: Authentication Round Trip - Password Reset Flow', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 5.1, 5.2, 5.3
    
    await fc.assert(fc.asyncProperty(
      fc.tuple(emailArbitrary, fc.webUrl(), passwordArbitrary, userArbitrary),
      async ([email, redirectUrl, newPassword, mockUser]) => {
        // Test password reset request
        ;(mockClient.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
          error: null
        })

        const resetResult = await authService.resetPassword(email, redirectUrl)
        expect(resetResult.success).toBe(true)
        expect(resetResult.error).toBeNull()
        expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: redirectUrl
        })

        // Test password update
        const updatedUser = {
          ...mockUser,
          updated_at: new Date().toISOString()
        }

        ;(mockClient.auth.updateUser as jest.Mock).mockResolvedValue({
          data: { user: updatedUser },
          error: null
        })

        const updateResult = await authService.updatePassword(newPassword)
        expect(updateResult.success).toBe(true)
        expect(updateResult.error).toBeNull()
        expect(updateResult.data).not.toBeNull()
        expect(updateResult.data!.id).toBe(mockUser.id)
        expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword
        })
      }
    ), { numRuns: 10 })
  })

  test('Property 4: Authentication Round Trip - User Profile Creation', async () => {
    // Feature: nextjs-supabase-migration, Property 4: Authentication Round Trip
    // Validates: Requirements 6.4, 10.4
    
    await fc.assert(fc.asyncProperty(
      userArbitrary,
      async (mockUser) => {
        const expectedProfile = {
          id: mockUser.id,
          name: mockUser.user_metadata?.name || mockUser.user_metadata?.full_name || mockUser.email?.split('@')[0] || '',
          email: mockUser.email!,
          profile_picture_data: mockUser.user_metadata?.avatar_url || null,
          profile_picture_updated_at: mockUser.user_metadata?.avatar_url ? expect.any(String) : null,
          theme: 'system',
          accent_color: 'blue',
          notifications: {
            emailNotifications: true,
            weeklySummary: false,
            defaultBoardView: 'kanban'
          },
          two_factor_enabled: false,
          two_factor_backup_codes: null,
          auth_providers: []
        }

        // Mock successful profile creation
        const mockUpsert = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: expectedProfile,
              error: null
            })
          })
        })

        ;(mockClient.from as jest.Mock).mockReturnValue({
          upsert: mockUpsert
        })

        // Execute profile creation
        const result = await authService.createUserProfile(mockUser)

        // Verify result structure
        expect(result.success).toBe(true)
        expect(result.error).toBeNull()
        expect(result.data).not.toBeNull()
        
        // Verify profile data
        expect(result.data!.id).toBe(mockUser.id)
        expect(result.data!.email).toBe(mockUser.email)
        expect(result.data!.theme).toBe('system')
        expect(result.data!.accent_color).toBe('blue')
        expect(result.data!.two_factor_enabled).toBe(false)
        
        // Verify API was called correctly
        expect(mockClient.from).toHaveBeenCalledWith('user_profiles')
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            theme: 'system',
            accent_color: 'blue'
          }),
          { onConflict: 'id', ignoreDuplicates: false }
        )
      }
    ), { numRuns: 10 })
  })
})