import { supabase } from '../supabase/client'
import { createSupabaseServerClient } from '../supabase/utils'
import type { AuthError } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'

export type MFAResult<T = any> = {
  data?: T | null
  error?: AuthError | Error | null
  success: boolean
}

export type MFAEnrollmentResult = {
  id: string
  type: 'totp'
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
}

export type MFAChallenge = {
  id: string
  type: 'totp'
  expires_at: number
}

export type MFAVerification = {
  access_token: string
  refresh_token: string
  user: any
}

export class MFAService {
  public client = supabase

  /**
   * Enroll a new MFA factor (TOTP)
   */
  async enrollMFA(factorType: 'totp' = 'totp', friendlyName?: string): Promise<MFAResult<MFAEnrollmentResult>> {
    try {
      const { data, error } = await this.client.auth.mfa.enroll({
        factorType,
        friendlyName: friendlyName || 'Authenticator App'
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
        data: data as MFAEnrollmentResult
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
   * Verify MFA enrollment with TOTP code
   */
  async verifyEnrollment(factorId: string, code: string): Promise<MFAResult<any>> {
    try {
      const { data, error } = await this.client.auth.mfa.challengeAndVerify({
        factorId,
        code
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
        data
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
   * Create MFA challenge for login
   */
  async createChallenge(factorId: string): Promise<MFAResult<MFAChallenge>> {
    try {
      const { data, error } = await this.client.auth.mfa.challenge({
        factorId
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
        data: data as MFAChallenge
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
   * Verify MFA challenge with TOTP code
   */
  async verifyChallenge(factorId: string, challengeId: string, code: string): Promise<MFAResult<MFAVerification>> {
    try {
      const { data, error } = await this.client.auth.mfa.verify({
        factorId,
        challengeId,
        code
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
        data: data as MFAVerification
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
   * Get all MFA factors for current user
   */
  async listFactors(): Promise<MFAResult<any[]>> {
    try {
      const { data, error } = await this.client.auth.mfa.listFactors()

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
        data: data.totp || []
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
   * Remove/unenroll an MFA factor
   */
  async unenrollFactor(factorId: string): Promise<MFAResult<void>> {
    try {
      const { data, error } = await this.client.auth.mfa.unenroll({
        factorId
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
   * Generate backup codes for MFA
   * Note: Supabase doesn't have built-in backup codes, so we'll implement our own
   */
  async generateBackupCodes(userId: string): Promise<MFAResult<string[]>> {
    try {
      // Generate 10 random backup codes
      const backupCodes = Array.from({ length: 10 }, () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase()
      })

      // Hash the codes before storing
      const hashedCodes = await Promise.all(
        backupCodes.map(async (code) => {
          const encoder = new TextEncoder()
          const data = encoder.encode(code)
          const hashBuffer = await crypto.subtle.digest('SHA-256', data)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        })
      )

      // Store hashed codes in user profile
      const { error } = await (this.client as any)
        .from('user_profiles')
        .update({
          two_factor_backup_codes: hashedCodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

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
        data: backupCodes // Return unhashed codes to user (one-time display)
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
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<MFAResult<boolean>> {
    try {
      // Get user's backup codes
      const { data: profile, error: fetchError } = await this.client
        .from('user_profiles')
        .select('two_factor_backup_codes')
        .eq('id', userId)
        .single()

      if (fetchError || !profile) {
        return {
          success: false,
          error: fetchError || new Error('User profile not found'),
          data: null
        }
      }

      const backupCodes = (profile as any).two_factor_backup_codes || []
      if (backupCodes.length === 0) {
        return {
          success: false,
          error: new Error('No backup codes available'),
          data: null
        }
      }

      // Hash the provided code
      const encoder = new TextEncoder()
      const data = encoder.encode(code.toUpperCase())
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashedCode = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Check if code exists
      const codeIndex = backupCodes.indexOf(hashedCode)
      if (codeIndex === -1) {
        return {
          success: false,
          error: new Error('Invalid backup code'),
          data: null
        }
      }

      // Remove used code
      const updatedCodes = backupCodes.filter((_: any, index: number) => index !== codeIndex)
      
      const { error: updateError } = await (this.client as any)
        .from('user_profiles')
        .update({
          two_factor_backup_codes: updatedCodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return {
          success: false,
          error: updateError,
          data: null
        }
      }

      return {
        success: true,
        error: null,
        data: true
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
   * Update user profile 2FA status
   */
  async updateUserMFAStatus(userId: string, enabled: boolean): Promise<MFAResult<void>> {
    try {
      const { error } = await (this.client as any)
        .from('user_profiles')
        .update({
          two_factor_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

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
   * Server-side MFA operations
   */
  static async serverListFactors(userId: string): Promise<MFAResult<any[]>> {
    try {
      const supabase = await createSupabaseServerClient()
      
      const { data, error } = await supabase.auth.admin.mfa.listFactors({
        userId
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
        data: data.factors || []
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
   * Server-side factor deletion
   */
  static async serverDeleteFactor(userId: string, factorId: string): Promise<MFAResult<void>> {
    try {
      const supabase = await createSupabaseServerClient()
      
      const { error } = await supabase.auth.admin.mfa.deleteFactor({
        userId,
        id: factorId
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
}

// Export singleton instance
export const mfaService = new MFAService()