import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock the Supabase client import first
const mockSupabaseClient = {
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
  from: jest.fn(() => ({
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

import { AuthService } from '../../lib/auth/supabase-auth-service'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
  })

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      ;(mockSupabaseClient.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await authService.signUp({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
            full_name: 'Test User'
          }
        }
      })
    })

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already exists' }
      
      ;(mockSupabaseClient.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signUp({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
      expect(result.data).toBeNull()
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      ;(mockSupabaseClient.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' }
      
      ;(mockSupabaseClient.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
      expect(result.data).toBeNull()
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      ;(mockSupabaseClient.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      })

      const result = await authService.signOut()

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' }
      
      ;(mockSupabaseClient.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError
      })

      const result = await authService.signOut()

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
    })
  })

  describe('getSession', () => {
    it('should successfully get current session', async () => {
      const mockSession = { access_token: 'token', user: { id: '123' } }
      
      ;(mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.getSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSession)
    })

    it('should handle session retrieval errors', async () => {
      const mockError = { message: 'Session expired' }
      
      ;(mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await authService.getSession()

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
      expect(result.data).toBeNull()
    })
  })

  describe('signInWithOAuth', () => {
    it('should initiate OAuth sign in', async () => {
      const mockUrl = 'https://oauth-provider.com/auth'
      
      ;(mockSupabaseClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: mockUrl },
        error: null
      })

      const result = await authService.signInWithOAuth('google', '/dashboard')

      expect(result.success).toBe(true)
      expect(result.data?.url).toBe(mockUrl)
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback?redirect_to=%2Fdashboard'
        }
      })
    })
  })
})