'use client'

import { useState } from 'react'
import { mfaService } from '@/lib/auth/mfa-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertTriangle, Key } from 'lucide-react'

interface TwoFactorVerificationProps {
  factorId: string
  challengeId: string
  onSuccess: (tokens: any) => void
  onError: (error: string) => void
  onCancel?: () => void
}

export function TwoFactorVerification({ 
  factorId, 
  challengeId, 
  onSuccess, 
  onError,
  onCancel 
}: TwoFactorVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleVerifyTOTP = async () => {
    if (!verificationCode.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await mfaService.verifyChallenge(factorId, challengeId, verificationCode.trim())
      
      if (result.success && result.data) {
        onSuccess(result.data)
      } else {
        setError(result.error?.message || 'Invalid verification code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) return

    setLoading(true)
    setError(null)

    try {
      // First verify the backup code
      const user = await mfaService.client.auth.getUser()
      if (!user.data.user) {
        setError('User not found')
        return
      }

      const backupResult = await mfaService.verifyBackupCode(user.data.user.id, backupCode.trim())
      
      if (backupResult.success) {
        // If backup code is valid, we need to bypass MFA for this session
        // This is a simplified approach - in production you might want to handle this differently
        onSuccess({ bypass_mfa: true })
      } else {
        setError(backupResult.error?.message || 'Invalid backup code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (useBackupCode) {
        handleVerifyBackupCode()
      } else {
        handleVerifyTOTP()
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {useBackupCode 
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!useBackupCode ? (
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              id="backup-code"
              type="text"
              placeholder="Enter backup code"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              onKeyPress={handleKeyPress}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={8}
              autoFocus
            />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button 
            onClick={useBackupCode ? handleVerifyBackupCode : handleVerifyTOTP}
            disabled={loading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode.trim())}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setUseBackupCode(!useBackupCode)
              setVerificationCode('')
              setBackupCode('')
              setError(null)
            }}
            className="w-full text-sm"
          >
            {useBackupCode ? (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Use Authenticator App
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Use Backup Code
              </>
            )}
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>Having trouble? Contact support for assistance.</p>
        </div>
      </CardContent>
    </Card>
  )
}