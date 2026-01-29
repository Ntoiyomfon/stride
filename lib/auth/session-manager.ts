import { supabase } from '../supabase/client'
import { createSupabaseServerClient } from '../supabase/utils'
import type { Database } from '../supabase/database.types'
import { parseUserAgent, getLocationFromIP } from '../utils/device-parser'

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

export type SessionRecord = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']

export class SessionManager {
  private client = supabase

  /**
   * Create a new session record with device and location metadata
   */
  async createSessionRecord(
    sessionId: string, 
    userId: string, 
    userAgent?: string, 
    ipAddress?: string,
    deviceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on the server side
      const isServerSide = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!isServerSide) {
        // Client-side: delegate to API route
        return { success: false, error: 'Session creation must be done server-side via API' }
      }

      // Use service role client to bypass RLS policies
      const { createSupabaseServiceClient } = await import('../supabase/utils')
      const serviceClient = await createSupabaseServiceClient()

      // Double-check for existing session with same session_id
      const { data: existingSession } = await serviceClient
        .from('sessions')
        .select('id')
        .eq('session_id', sessionId)
        .eq('is_revoked', false)
        .single()

      if (existingSession) {
        console.log('Session already exists, skipping creation')
        return { success: true }
      }

      const deviceInfo = parseUserAgent(userAgent || 'Unknown')
      
      const sessionData: SessionInsert = {
        session_id: sessionId,
        user_id: userId,
        device_id: deviceId || 'unknown',
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
        location: {},
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_revoked: false
      }

      console.log('Creating session record for user:', userId, 'device:', deviceId, 'session:', sessionId.substring(0, 20) + '...')

      const { error } = await (serviceClient as any)
        .from('sessions')
        .insert(sessionData)

      if (error) {
        // If it's a duplicate key error, that's fine - session already exists
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('Session already exists (duplicate key), this is fine')
          return { success: true }
        }
        
        console.error('Failed to create session record:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Session record created successfully')

      // Update location asynchronously
      if (ipAddress && ipAddress !== '127.0.0.1') {
        this.updateSessionLocation(sessionId, ipAddress).catch(err => 
          console.error('Failed to update session location:', err)
        )
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to create session record:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (this.client as any)
        .rpc('update_session_activity', { session_id_param: sessionId })

      if (error) {
        console.error('Failed to update session activity:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to update session activity:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId?: string, currentSessionId?: string): Promise<{ 
    sessions?: SessionInfo[]; 
    error?: string 
  }> {
    try {
      if (!userId) {
        return { sessions: [] }
      }

      // Check if we're on the server side
      const isServerSide = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!isServerSide) {
        // Client-side: delegate to API route
        return { error: 'Session retrieval must be done server-side via API' }
      }

      // Auto-cleanup duplicates before returning sessions
      await this.cleanupUserSessions(userId)

      // Use service role client to bypass RLS policies
      const { createSupabaseServiceClient } = await import('../supabase/utils')
      const serviceClient = await createSupabaseServiceClient()

      const { data: sessions, error } = await (serviceClient as any)
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('last_active_at', { ascending: false })

      if (error) {
        console.error('Failed to get user sessions:', error)
        return { error: error.message }
      }

      const sessionInfos: SessionInfo[] = sessions.map((session: any) => ({
        sessionId: session.session_id,
        browser: session.browser || 'Unknown',
        os: session.os || 'Unknown',
        deviceType: session.device_type as 'desktop' | 'mobile' | 'tablet' || 'desktop',
        location: (session.location as { city?: string; country?: string }) || { city: 'Unknown', country: 'Unknown' },
        ipAddress: session.ip_address,
        createdAt: new Date(session.created_at),
        lastActiveAt: new Date(session.last_active_at),
        isCurrent: session.session_id === currentSessionId
      }))

      return { sessions: sessionInfos }
    } catch (error) {
      console.error('Failed to get user sessions:', error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (this.client as any)
        .rpc('revoke_session', { 
          session_id_param: sessionId, 
          user_id_param: userId 
        })

      if (error) {
        console.error('Failed to revoke session:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to revoke session:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Revoke all other sessions for a user (keep current session)
   */
  async revokeAllOtherSessions(currentSessionId: string, userId: string): Promise<{ 
    success: boolean; 
    revokedCount?: number; 
    error?: string 
  }> {
    try {
      const { data: revokedCount, error } = await (this.client as any)
        .rpc('revoke_all_other_sessions', { 
          current_session_id: currentSessionId, 
          user_id_param: userId 
        })

      if (error) {
        console.error('Failed to revoke other sessions:', error)
        return { success: false, error: error.message }
      }

      return { success: true, revokedCount: revokedCount || 0 }
    } catch (error) {
      console.error('Failed to revoke other sessions:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { data: deletedCount, error } = await this.client
        .rpc('cleanup_expired_sessions')

      if (error) {
        console.error('Failed to cleanup expired sessions:', error)
        return { success: false, error: error.message }
      }

      return { success: true, deletedCount: deletedCount || 0 }
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clean up duplicate sessions for a user (keep most recent per device)
   */
  async cleanupUserSessions(userId: string): Promise<{ success: boolean; cleaned?: number; error?: string }> {
    try {
      // Get all active sessions for this user
      const { data: sessions, error: fetchError } = await this.client
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return { success: false, error: fetchError.message }
      }

      if (!sessions || sessions.length <= 1) {
        return { success: true, cleaned: 0 }
      }

      // Group by device fingerprint (user_agent + ip_address)
      const sessionsByDevice = sessions.reduce((acc: any, session: any) => {
        const deviceKey = `${session.user_agent}_${session.ip_address}`
        if (!acc[deviceKey]) {
          acc[deviceKey] = []
        }
        acc[deviceKey].push(session)
        return acc
      }, {} as Record<string, SessionRecord[]>)

      let cleaned = 0

      // For each device, keep only the most recent session
      for (const [deviceKey, deviceSessions] of Object.entries(sessionsByDevice)) {
        const sessions = deviceSessions as any[];
        if (sessions.length <= 1) continue

        // Sort by creation date (most recent first) and keep only the first one
        const sortedSessions = sessions.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        const sessionsToRevoke = sortedSessions.slice(1) // Revoke all but the most recent
        
        for (const sessionToRevoke of sessionsToRevoke) {
          const { error } = await (this.client as any)
            .from('sessions')
            .update({ is_revoked: true, last_active_at: new Date().toISOString() })
            .eq('id', sessionToRevoke.id)

          if (!error) {
            cleaned++
          }
        }
      }

      // Also ensure no user has more than 3 total sessions (hard limit)
      const remainingSessions = await this.client
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('created_at', { ascending: false })

      if (remainingSessions.data && remainingSessions.data.length > 3) {
        const excessSessions = remainingSessions.data.slice(3)
        
        for (const excessSession of excessSessions) {
          const { error } = await (this.client as any)
            .from('sessions')
            .update({ is_revoked: true, last_active_at: new Date().toISOString() })
            .eq('id', (excessSession as any).id)

          if (!error) {
            cleaned++
          }
        }
      }

      return { success: true, cleaned }
    } catch (error) {
      console.error('User session cleanup error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clean up duplicate sessions for same device/IP before creating new session
   */
  private async cleanupDuplicateSessions(
    userId: string, 
    userAgent?: string, 
    ipAddress?: string
  ): Promise<void> {
    try {
      if (!userAgent && !ipAddress) return

      // Check if we're on the server side by checking for process.env.SUPABASE_SERVICE_ROLE_KEY
      const isServerSide = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY

      if (isServerSide) {
        // Use service role client to bypass RLS policies (server-side only)
        const { createSupabaseServiceClient } = await import('../supabase/utils')
        const serviceClient = await createSupabaseServiceClient()

        let query = (serviceClient as any)
          .from('sessions')
          .update({ is_revoked: true, last_active_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_revoked', false)

        if (userAgent && ipAddress) {
          // Match both user agent and IP
          query = query.or(`user_agent.eq.${userAgent},ip_address.eq.${ipAddress}`)
        } else if (userAgent) {
          // Match just user agent
          query = query.eq('user_agent', userAgent)
        } else if (ipAddress) {
          // Match just IP
          query = query.eq('ip_address', ipAddress)
        }

        await query
      } else {
        // Client-side: skip cleanup as it should be handled by API routes
        console.log('Skipping duplicate session cleanup on client side')
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate sessions:', error)
    }
  }

  /**
   * Update session location asynchronously
   */
  private async updateSessionLocation(sessionId: string, ipAddress: string): Promise<void> {
    try {
      const location = await getLocationFromIP(ipAddress)
      
      if (location) {
        await (this.client as any)
          .from('sessions')
          .update({ location })
          .eq('session_id', sessionId)
      }
    } catch (error) {
      console.error('Failed to update session location:', error)
    }
  }

  /**
   * Server-side session management
   */
  static async createServerSessionRecord(
    sessionId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { createSupabaseServerClient } = await import('../supabase/utils')
      const { parseUserAgent } = await import('../utils/device-parser')
      
      const supabase = await createSupabaseServerClient()
      const deviceInfo = parseUserAgent(userAgent || 'Unknown')
      
      const sessionData: SessionInsert = {
        session_id: sessionId,
        user_id: userId,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
        location: {},
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_revoked: false
      }

      const { error } = await (supabase as any)
        .from('sessions')
        .insert(sessionData)

      if (error) {
        console.error('Failed to create server session record:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to create server session record:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()