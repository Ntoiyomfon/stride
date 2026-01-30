import { createSupabaseServerClient } from '@/lib/supabase/utils'
import { NextRequest, NextResponse } from 'next/server'
import { SecureErrorHandler } from '@/lib/utils/secure-error-handler'
import { withRateLimit, authRateLimiter } from '@/lib/utils/rate-limiter'

export async function GET(request: NextRequest) {
  return withRateLimit(request, authRateLimiter, async () => {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

    // Validate redirect_to parameter to prevent open redirects
    const isValidRedirect = (url: string): boolean => {
      try {
        const redirectUrl = new URL(url, origin)
        return redirectUrl.origin === origin && !url.includes('..')
      } catch {
        return false
      }
    }

    const safeRedirectTo = redirectTo && isValidRedirect(redirectTo) ? redirectTo : '/dashboard'

    if (!code) {
      SecureErrorHandler.logSecurityEvent('OAUTH_NO_CODE', request)
      return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('No authorization code provided')}`)
    }

    const supabase = await createSupabaseServerClient()
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        SecureErrorHandler.logSecurityEvent('OAUTH_EXCHANGE_FAILED', request, { error: error.message })
        return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('Authentication failed')}`)
      }

      if (data.user && data.session) {
        // 1. First create user profile (required for RLS policies)
        try {
          const { authService } = await import('@/lib/auth/supabase-auth-service')
          await authService.createUserProfile(data.user)
          console.log('✅ User profile created for OAuth user:', data.user.id)
        } catch (profileError) {
          console.error('❌ Error creating user profile:', profileError)
          SecureErrorHandler.logSecurityEvent('PROFILE_CREATION_FAILED', request, { userId: data.user.id })
        }

        // 2. Then initialize user board (after profile exists)
        try {
          const { initializeUserBoard } = await import('@/lib/init-user-board')
          await initializeUserBoard(data.user.id)
          console.log('✅ Board initialized for OAuth user:', data.user.id)
        } catch (setupError) {
          console.error('❌ Error setting up new user board:', setupError)
          SecureErrorHandler.logSecurityEvent('BOARD_INIT_FAILED', request, { userId: data.user.id })
          // Don't fail the OAuth flow for setup errors
        }

        // 3. Finally create session record for tracking
        try {
          const { SessionManager } = await import('@/lib/auth/session-manager')
          const userAgent = request.headers.get('user-agent') || 'Unknown'
          const forwardedFor = request.headers.get('x-forwarded-for')
          const realIp = request.headers.get('x-real-ip')
          const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1'
          
          await SessionManager.createServerSessionRecord(
            data.session.access_token,
            data.user.id,
            userAgent,
            ipAddress
          )
          console.log('✅ Session record created for OAuth user:', data.user.id)
          
          SecureErrorHandler.logSecurityEvent('OAUTH_SUCCESS', request, { userId: data.user.id })
        } catch (sessionError) {
          console.error('❌ Error creating session record:', sessionError)
          SecureErrorHandler.logSecurityEvent('SESSION_CREATION_FAILED', request, { userId: data.user.id })
          // Don't fail the OAuth flow for session tracking errors
        }
      }

      // Redirect to the intended destination or dashboard
      return NextResponse.redirect(`${origin}${safeRedirectTo}`)
      
    } catch (error) {
      console.error('OAuth exchange error:', error)
      SecureErrorHandler.logSecurityEvent('OAUTH_EXCHANGE_ERROR', request, { error })
      return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('Authentication failed')}`)
    }
  })
}