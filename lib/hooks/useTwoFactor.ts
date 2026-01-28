'use client'

import { useState, useEffect, useCallback } from 'react'
import { mfaService } from '../auth/mfa-service'
import { useSupabaseAuth } from './useSupabaseAuth'

export type MFAFactor = {
  id: string
  type: 'totp'
  friendly_name: string
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

export type TwoFactorState = {
  enabled: boolean
  factors: MFAFactor[]
  loading: boolean
  error: string | null
}

export function useTwoFactor() {
  const { user, profile } = useSupabaseAuth()
  const [state, setState] = useState<TwoFactorState>({
    enabled: false,
    factors: [],
    loading: false,
    error: null
  })

  // Load MFA factors
  const loadFactors = useCallback(async () => {
    if (!user) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await mfaService.listFactors()
      
      if (result.success) {
        const factors = result.data || []
        const enabled = factors.length > 0 && factors.some(f => f.status === 'verified')
        
        setState(prev => ({
          ...prev,
          loading: false,
          factors,
          enabled,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Failed to load 2FA factors'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [user])

  // Enroll new MFA factor
  const enrollFactor = useCallback(async (friendlyName?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await mfaService.enrollMFA('totp', friendlyName)
      
      if (result.success) {
        // Reload factors after enrollment
        await loadFactors()
        return { success: true, data: result.data }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Failed to enroll MFA factor'
        }))
        return { success: false, error: result.error?.message || 'Failed to enroll MFA factor' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [user, loadFactors])

  // Verify enrollment
  const verifyEnrollment = useCallback(async (factorId: string, code: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await mfaService.verifyEnrollment(factorId, code)
      
      if (result.success) {
        // Update user profile
        if (user) {
          await mfaService.updateUserMFAStatus(user.id, true)
        }
        
        // Reload factors
        await loadFactors()
        return { success: true, data: result.data }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Failed to verify enrollment'
        }))
        return { success: false, error: result.error?.message || 'Failed to verify enrollment' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [user, loadFactors])

  // Unenroll MFA factor
  const unenrollFactor = useCallback(async (factorId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await mfaService.unenrollFactor(factorId)
      
      if (result.success) {
        // Update user profile if no factors remain
        const remainingFactors = state.factors.filter(f => f.id !== factorId)
        if (remainingFactors.length === 0) {
          await mfaService.updateUserMFAStatus(user.id, false)
        }
        
        // Reload factors
        await loadFactors()
        return { success: true }
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Failed to unenroll MFA factor'
        }))
        return { success: false, error: result.error?.message || 'Failed to unenroll MFA factor' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [user, state.factors, loadFactors])

  // Generate backup codes
  const generateBackupCodes = useCallback(async () => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const result = await mfaService.generateBackupCodes(user.id)
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [user])

  // Verify backup code
  const verifyBackupCode = useCallback(async (code: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const result = await mfaService.verifyBackupCode(user.id, code)
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [user])

  // Create MFA challenge
  const createChallenge = useCallback(async (factorId: string) => {
    try {
      const result = await mfaService.createChallenge(factorId)
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [])

  // Verify MFA challenge
  const verifyChallenge = useCallback(async (factorId: string, challengeId: string, code: string) => {
    try {
      const result = await mfaService.verifyChallenge(factorId, challengeId, code)
      return result
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [])

  // Load factors when user changes
  useEffect(() => {
    if (user) {
      loadFactors()
    } else {
      setState({
        enabled: false,
        factors: [],
        loading: false,
        error: null
      })
    }
  }, [user, loadFactors])

  // Sync with profile data
  useEffect(() => {
    if (profile) {
      setState(prev => ({
        ...prev,
        enabled: profile.two_factor_enabled || prev.enabled
      }))
    }
  }, [profile])

  return {
    // State
    ...state,
    
    // Computed
    hasFactors: state.factors.length > 0,
    verifiedFactors: state.factors.filter(f => f.status === 'verified'),
    
    // Methods
    loadFactors,
    enrollFactor,
    verifyEnrollment,
    unenrollFactor,
    generateBackupCodes,
    verifyBackupCode,
    createChallenge,
    verifyChallenge
  }
}