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
    return this.client.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('🔄 Auth state change:', event, session ? 'with session' : 'no session')
      
      // Handle session management based on auth events
      if (event === 'SIGNED_IN' && session) {
        // Only create session record once per device, not on every SIGNED_IN event
        try {
          const { getDeviceId } = await import('../utils/device-id')
          const deviceId = getDeviceId()
          
          // Use API route to create/update session record
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              action: 'create',
              deviceId: deviceId
            })
          })
          
          const data = await response.json()
          
          if (response.ok && data.success) {
            console.log('✅ Session record created/updated for device:', deviceId)
          } else {
            console.error('Failed to create/update session record:', data.error)
          }
        } catch (error) {
          console.error('Failed to handle session on sign in:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        // Clean up device ID on sign out
        try {
          const { clearDeviceId } = await import('../utils/device-id')
          clearDeviceId()
          console.log('🔄 User signed out, device ID cleared')
        } catch (error) {
          console.error('Failed to cleanup on sign out:', error)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Don't create new sessions on token refresh - just log it
        console.log('🔄 Token refreshed for user:', session.user.id)
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
      const supabase = await createSupabaseServerClient()
      
      // Use getUser() instead of getSession() for security
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { user: null, session: null }
      }

      // Get session after validating user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        return { user: null, session: null }
      }

      return { user, session }
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

      // Check if we're on the server side
      const isServerSide = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!isServerSide) {
        // Client-side: delegate to API route
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(profileData)
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Profile creation API error:', data)
          return {
            success: false,
            error: new Error(data.error || 'Failed to create profile'),
            data: null
          }
        }

        console.log('User profile created via API:', data)
        return {
          success: true,
          error: null,
          data: data.profile
        }
      }

      // Server-side: use service role client to bypass RLS policies
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