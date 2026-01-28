'use client'

import { useState, useEffect } from 'react'
import { mfaService } from '@/lib/auth/mfa-service'
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Smartphone, Copy, Check, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

type EnrollmentStep = 'start' | 'scan' | 'verify' | 'backup-codes' | 'complete'

export function TwoFactorEnrollment() {
  const { user } = useSupabaseAuth()
  const [step, setStep] = useState<EnrollmentStep>('start')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Enrollment data
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handleStartEnrollment = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const result = await mfaService.enrollMFA('totp', 'Authenticator App')
      
      if (result.success && result.data) {
        setEnrollmentData(result.data)
        setStep('scan')
      } else {
        setError(result.error?.message || 'Failed to start enrollment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!enrollmentData || !verificationCode.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await mfaService.verifyEnrollment(enrollmentData.id, verificationCode.trim())
      
      if (result.success) {
        // Update user profile to mark 2FA as enabled
        await mfaService.updateUserMFAStatus(user!.id, true)
        
        // Generate backup codes
        const backupResult = await mfaService.generateBackupCodes(user!.id)
        if (backupResult.success && backupResult.data) {
          setBackupCodes(backupResult.data)
          setStep('backup-codes')
        } else {
          setStep('complete')
        }
        
        setSuccess('Two-factor authentication has been successfully enabled!')
      } else {
        setError(result.error?.message || 'Invalid verification code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCodes = async () => {
    try {
      const codesText = backupCodes.join('\n')
      await navigator.clipboard.writeText(codesText)
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    } catch (err) {
      console.error('Failed to copy backup codes:', err)
    }
  }

  const handleCompleteSetup = () => {
    setStep('complete')
  }

  if (step === 'start') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What you'll need:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                An authenticator app (Google Authenticator, Authy, etc.)
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                A secure place to store backup codes
              </li>
            </ul>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleStartEnrollment} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Started
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'scan') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollmentData?.totp?.qr_code && (
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <Image
                  src={`data:image/svg+xml;base64,${btoa(enrollmentData.totp.qr_code)}`}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="manual-key">Or enter this key manually:</Label>
            <div className="flex items-center gap-2">
              <Input
                id="manual-key"
                value={enrollmentData?.totp?.secret || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(enrollmentData?.totp?.secret || '')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => setStep('verify')}
              className="w-full"
            >
              I've Added the Account
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('scan')}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'backup-codes') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Save Your Backup Codes</CardTitle>
          <CardDescription>
            Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Each backup code can only be used once. Save them securely!
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleCopyBackupCodes}
            className="w-full"
          >
            {copiedCodes ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Backup Codes
              </>
            )}
          </Button>

          <Button 
            onClick={handleCompleteSetup}
            className="w-full"
          >
            I've Saved My Backup Codes
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>2FA Enabled Successfully!</CardTitle>
          <CardDescription>
            Your account is now protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">What's next?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll be asked for a code when signing in</li>
              <li>• Keep your backup codes in a safe place</li>
              <li>• You can disable 2FA anytime in your settings</li>
            </ul>
          </div>

          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}