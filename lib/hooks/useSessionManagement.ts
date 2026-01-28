'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAuth } from './useSupabaseAuth'

export type SessionInfo = {
  sessionId: string
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location: { city?: string; country?: string }
  ipAddress: string
  createdAt: Date
  lastActiveAt: Date
  isCurrent: boolean
}

export type SessionManagementState = {
  sessions: SessionInfo[]
  loading: boolean
  error: string | null
}

export function useSessionManagement() {
  const { user, session } = useSupabaseAuth()
  const [state, setState] = useState<SessionManagementState>({
    sessions: [],
    loading: false,
    error: null
  })

  // Load user sessions via API
  const loadSessions = useCallback(async () => {
    if (!user || !session) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch('/api/sessions', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Convert date strings back to Date objects
        const sessionsWithDates = data.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastActiveAt: new Date(session.lastActiveAt)
        }))
        
        setState(prev => ({
          ...prev,
          loading: false,
          sessions: sessionsWithDates,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to load sessions'
        }))
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Network error - please try again'
      }))
    }
  }, [user, session])

  // Revoke a specific session via API
  const revokeSession = useCallback(async (sessionId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'revoke',
          sessionId
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Reload sessions to reflect changes
        await loadSessions()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to revoke session' }
      }
    } catch (error) {
      console.error('Error revoking session:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [user, loadSessions])

  // Revoke all other sessions via API
  const revokeAllOtherSessions = useCallback(async () => {
    if (!user || !session) return { success: false, error: 'User not authenticated' }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'revokeAllOthers'
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Reload sessions to reflect changes
        await loadSessions()
        return { success: true, revokedCount: data.revokedCount || 0 }
      } else {
        return { success: false, error: data.error || 'Failed to revoke sessions' }
      }
    } catch (error) {
      console.error('Error revoking all other sessions:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [user, session, loadSessions])

  // Update session activity (placeholder - could be implemented via API if needed)
  const updateActivity = useCallback(async () => {
    if (!session) return

    try {
      // For now, we'll skip activity updates to avoid complexity
      // Activity will be updated when sessions are accessed via API
      console.log('Session activity update skipped (handled server-side)')
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }, [session])

  // Load sessions when user changes
  useEffect(() => {
    if (user && session) {
      loadSessions()
    } else {
      setState({
        sessions: [],
        loading: false,
        error: null
      })
    }
  }, [user, session, loadSessions])

  return {
    // State
    ...state,
    
    // Methods
    loadSessions,
    revokeSession,
    revokeAllOtherSessions,
    updateActivity,
    
    // Computed
    currentSession: state.sessions.find(s => s.isCurrent) || null,
    otherSessions: state.sessions.filter(s => !s.isCurrent),
    totalSessions: state.sessions.length
  }
}