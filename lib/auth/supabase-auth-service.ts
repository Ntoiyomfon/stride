import { supabase } from '../supabase/client'
import { createSupabaseServerClient } from '../supabase/utils'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'

export type AuthResult<T = any> = {
  data?: T | null
  error?: AuthError | Error | null
  success: boolean
}

export type SignUpData = {
  name: string
  email: string
  password: string
}

export type SignInData = {
  email: string
  password: string
}

export type OAuthProvider = 'google' | 'github'

export class AuthService {
  private client = supabase

  /**
   * Sign up with email and password
   */
  async signUp({ name, email, password }: SignUpData): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name
          }
        }
      })

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      // If user is created and confirmed, initialize their profile and board
      if (data.user && data.session) {
        try {
          // 1. First create user profile
          await this.createUserProfile(data.user)
          console.log('✅ User profile created for new signup:', data.user.id)
          
          // 2. Then initialize user board
          const { initializeUserBoard } = await import('../init-user-board')
          await initializeUserBoard(data.user.id)
          console.log('✅ Board initialized for new signup:', data.user.id)
        } catch (setupError) {
          console.error('❌ Error setting up new user:', setupError)
          // Don't fail the signup for setup errors
        }
      }

      return {
        success: true,
        error: null,
        data: {
          user: data.user,
          session: data.session
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInData): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: {
          user: data.user,
          session: data.session
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<AuthResult<{ url: string }>> {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(redirectTo || '/dashboard')}`
        }
      })

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      // For OAuth, we need to redirect the user to the provider
      if (data.url && typeof window !== 'undefined') {
        window.location.href = data.url
      }

      return {
        success: true,
        error: null,
        data: {
          url: data.url
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.signOut()

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: null
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResult<Session | null>> {
    try {
      const { data: { session }, error } = await this.client.auth.getSession()

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: session
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<AuthResult<User | null>> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser()

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: user
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await this.client.auth.refreshSession()

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: {
          user: data.user,
          session: data.session
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Reset password - send reset email
   */
  async resetPassword(email: string, redirectTo?: string): Promise<AuthResult<void>> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${window.location.origin}/reset-password`
      })

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: null
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Update password (requires current session)
   */
  async updatePassword(newPassword: string): Promise<AuthResult<User | null>> {
    try {
      const { data, error } = await this.client.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return {
          success: false,
          error,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: data.user
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(async (event, session) => {
      // Handle session management based on auth events
      if (event === 'SIGNED_IN' && session) {
        // Create session record when user signs in (only once per session)
        try {
          // Use API route to create session record (works from both client and server)
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              action: 'create'
            })
          })
          
          const data = await response.json()
          
          if (response.ok && data.success) {
            console.log('✅ Session record created for user:', session.user.id)
          } else {
            // Don't log error if session already exists
            if (!data.error || !data.error.includes('already exists')) {
              console.error('Failed to create session record:', data.error)
            }
          }
        } catch (error) {
          console.error('Failed to create session record on sign in:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        // Clean up session record when user signs out
        try {
          const { sessionManager } = await import('./session-manager')
          // Note: We can't revoke the specific session here since we don't have the session ID
          // The session will be cleaned up by the periodic cleanup process
          console.log('🔄 User signed out, sessions will be cleaned up automatically')
        } catch (error) {
          console.error('Failed to cleanup session on sign out:', error)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update session activity when token is refreshed
        try {
          // For now, skip session activity updates on token refresh to avoid client-side issues
          // Session activity will be updated when user navigates or performs actions
          console.log('🔄 Token refreshed for user:', session.user.id)
        } catch (error) {
          console.error('Failed to update session activity on token refresh:', error)
        }
      }
      
      // Call the original callback
      callback(event, session)
    })
  }

  /**
   * Server-side session validation
   */
  static async validateServerSession(): Promise<{ user: User | null; session: Session | null }> {
    try {
      // First try the standard Supabase SSR approach
      const supabase = await createSupabaseServerClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!error && session) {
        return { user: session.user, session }
      }

      // Fallback: Try to read from custom cookies
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      
      const accessToken = cookieStore.get('sb-access-token')?.value
      const refreshToken = cookieStore.get('sb-refresh-token')?.value
      const userCookie = cookieStore.get('sb-user')?.value

      if (accessToken && userCookie) {
        try {
          const user = JSON.parse(userCookie)
          const mockSession = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            expires_in: 3600,
            token_type: 'bearer',
            user: user
          }
          
          return { user, session: mockSession as Session }
        } catch (parseError) {
          console.error('Error parsing user cookie:', parseError)
        }
      }

      return { user: null, session: null }
    } catch (error) {
      console.error('Error validating server session:', error)
      return { user: null, session: null }
    }
  }

  /**
   * Create or update user profile after authentication
   */
  async createUserProfile(user: User): Promise<AuthResult<Database['public']['Tables']['user_profiles']['Row']>> {
    try {
      // Extract auth providers from user metadata
      const authProviders: string[] = []
      
      // Check app_metadata for providers
      if (user.app_metadata?.providers && Array.isArray(user.app_metadata.providers)) {
        authProviders.push(...user.app_metadata.providers)
      } else if (user.app_metadata?.provider) {
        authProviders.push(user.app_metadata.provider)
      }
      
      // Always include email if user has email
      if (user.email && !authProviders.includes('email')) {
        authProviders.push('email')
      }
      
      console.log('Detected auth providers for user:', user.id, authProviders)

      const profileData: Database['public']['Tables']['user_profiles']['Insert'] = {
        id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email!,
        profile_picture_data: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        profile_picture_updated_at: (user.user_metadata?.avatar_url || user.user_metadata?.picture) ? new Date().toISOString() : null,
        theme: 'system',
        accent_color: 'pink',
        notifications: {
          emailNotifications: true,
          weeklySummary: false,
          defaultBoardView: 'kanban'
        },
        two_factor_enabled: false,
        two_factor_backup_codes: [],
        auth_providers: authProviders
      }

      console.log('Creating user profile for:', user.id, 'with data:', profileData)

      // Use service role client to bypass RLS policies for user profile creation
      const { createSupabaseServiceClient } = await import('../supabase/utils')
      const supabaseAdmin = await createSupabaseServiceClient()

      const { data, error } = await (supabaseAdmin
        .from('user_profiles') as any)
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('User profile creation error:', error)
        return {
          success: false,
          error,
          data: null
        }
      }

      console.log('User profile created successfully:', data)
      return {
        success: true,
        error: null,
        data
      }
    } catch (error) {
      console.error('User profile creation exception:', error)
      return {
        success: false,
        error: error as Error,
        data: null
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()