import { describe, it, expect, jest } from '@jest/globals'
import { GET } from '../../app/api/auth/callback/route'
import { NextRequest } from 'next/server'

// Mock the Supabase utilities
const mockSupabaseClient = {
  auth: {
    exchangeCodeForSession: jest.fn()
  },
  from: jest.fn(() => ({
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('../../lib/supabase/utils', () => ({
  createSupabaseServerClient: () => mockSupabaseClient
}))

jest.mock('../../lib/auth/auth', () => ({
  handleNewUserSetup: jest.fn()
}))

describe('/api/auth/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle successful OAuth callback', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      }
    }

    const mockSession = {
      access_token: 'token-123',
      user: mockUser
    }

    ;(mockSupabaseClient.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })

    const mockUpsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123' },
          error: null
        })
      })
    })

    ;(mockSupabaseClient.from as jest.Mock).mockReturnValue({
      upsert: mockUpsert
    })

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=oauth-code-123&redirect_to=/dashboard')
    
    const response = await GET(request)

    expect(response.status).toBe(307) // Temporary Redirect
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth-code-123')
  })

  it('should handle OAuth callback errors', async () => {
    ;(mockSupabaseClient.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid authorization code' }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=invalid-code')
    
    const response = await GET(request)

    expect(response.status).toBe(307) // Temporary Redirect
    expect(response.headers.get('location')).toContain('/sign-in?error=oauth_error')
    expect(response.headers.get('location')).toContain('Invalid%20authorization%20code')
  })

  it('should handle missing authorization code', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/callback')
    
    const response = await GET(request)

    expect(response.status).toBe(307) // Temporary Redirect
    expect(response.headers.get('location')).toContain('/sign-in?error=oauth_error')
    expect(response.headers.get('location')).toContain('No%20authorization%20code%20provided')
  })

  it('should use custom redirect_to parameter', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {}
    }

    ;(mockSupabaseClient.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
      data: { user: mockUser, session: { user: mockUser } },
      error: null
    })

    const mockUpsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123' },
          error: null
        })
      })
    })

    ;(mockSupabaseClient.from as jest.Mock).mockReturnValue({
      upsert: mockUpsert
    })

    const request = new NextRequest('http://localhost:3000/api/auth/callback?code=oauth-code-123&redirect_to=/settings')
    
    const response = await GET(request)

    expect(response.status).toBe(307) // Temporary Redirect
    expect(response.headers.get('location')).toBe('http://localhost:3000/settings')
  })
})