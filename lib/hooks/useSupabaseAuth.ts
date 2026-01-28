'use client'

import { useState, useEffect, useCallback } from 'react'
import { authService } from '../auth/supabase-auth-service'
import { supabase } from '../supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'

export type AuthState = {
  user: User | null
  session: Session | null
  profile: Database['public']['Tables']['user_profiles']['Row'] | null
  loading: boolean
  initialized: boolean
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false
  })

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setAuthState(prev => ({
        ...prev,
        profile: profile || null
      }))
    } catch (error) {
      console.error('Error loading user profile:', error)
      setAuthState(prev => ({
        ...prev,
        profile: null
      }))
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const sessionResult = await authService.getSession()
        
        if (!mounted) return

        if (sessionResult.success && sessionResult.data) {
          const { user } = sessionResult.data
          
          setAuthState({
            user,
            session: sessionResult.data,
            profile: null,
            loading: false,
            initialized: true
          })

          // Load user profile
          if (user) {
            await loadUserProfile(user.id)
          }
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true
          })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            initialized: true
          })
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [loadUserProfile])

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (event === 'SIGNED_IN' && session) {
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          loading: false
        }))

        // Load user profile
        await loadUserProfile(session.user.id)

        // Create/update user profile if needed
        try {
          const response = await fetch('/api/profile', {
            method: 'POST',
            credentials: 'include'
          })
          
          if (!response.ok) {
            const data = await response.json()
            console.error('Error creating user profile:', data.error)
          }
        } catch (error) {
          console.error('Error creating user profile:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          initialized: true
        })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          loading: false
        }))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  // Auth methods
  const signUp = useCallback(async (data: { name: string; email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    const result = await authService.signUp(data)
    
    if (!result.success) {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
    
    return result
  }, [])

  const signIn = useCallback(async (data: { email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    const result = await authService.signIn(data)
    
    if (!result.success) {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
    
    return result
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github', redirectTo?: string) => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    const result = await authService.signInWithOAuth(provider, redirectTo)
    
    if (!result.success) {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
    
    return result
  }, [])

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    const result = await authService.signOut()
    
    // State will be updated by the auth state change listener
    return result
  }, [])

  const refreshSession = useCallback(async () => {
    const result = await authService.refreshSession()
    return result
  }, [])

  const resetPassword = useCallback(async (email: string, redirectTo?: string) => {
    return await authService.resetPassword(email, redirectTo)
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    return await authService.updatePassword(newPassword)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (authState.user?.id) {
      await loadUserProfile(authState.user.id)
    }
  }, [authState.user?.id, loadUserProfile])

  return {
    // State
    ...authState,
    
    // Computed
    isAuthenticated: !!authState.user,
    
    // Methods
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    refreshSession,
    resetPassword,
    updatePassword,
    refreshProfile
  }
}