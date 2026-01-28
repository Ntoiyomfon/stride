import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Supabase client first
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    exchangeCodeForSession: jest.fn()
  }
}

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

import { AuthService } from '../../lib/auth/supabase-auth-service'

describe('OAuth Authentication', () => {
  let authService: AuthService

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
    ;(authService as any).client = mockSupabaseClient
    
    // Mock window.location.origin
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          origin: 'http://localhost:3000'
        }
      },
      writable: true
    })
  })

  describe('signInWithOAuth', () => {
    it('should initiate Google OAuth with correct redirect URL', async () => {
      const mockUrl = 'https://accounts.google.com/oauth/authorize?client_id=test'
      
      ;(mockSupabaseClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: mockUrl },
        error: null
      })

      const result = await authService.signInWithOAuth('google', '/dashboard')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.data?.url).toBe(mockUrl)
      
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback?redirect_to=%2Fdashboard'
        }
      })
    })

    it('should initiate GitHub OAuth with correct redirect URL', async () => {
      const mockUrl = 'https://github.com/login/oauth/authorize?client_id=test'
      
      ;(mockSupabaseClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: mockUrl },
        error: null
      })

      const result = await authService.signInWithOAuth('github', '/settings')

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.data?.url).toBe(mockUrl)
      
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback?redirect_to=%2Fsettings'
        }
      })
    })

    it('should use default redirect when none provided', async () => {
      const mockUrl = 'https://accounts.google.com/oauth/authorize?client_id=test'
      
      ;(mockSupabaseClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: mockUrl },
        error: null
      })

      const result = await authService.signInWithOAuth('google')

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback?redirect_to=/dashboard'
        }
      })
    })

    it('should handle OAuth errors', async () => {
      const mockError = { message: 'OAuth provider not configured' }
      
      ;(mockSupabaseClient.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: null },
        error: mockError
      })

      const result = await authService.signInWithOAuth('google')

      expect(result.success).toBe(false)
      expect(result.error).toEqual(mockError)
      expect(result.data).toBeNull()
    })
  })
})