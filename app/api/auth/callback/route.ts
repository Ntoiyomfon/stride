import { createSupabaseServerClient } from '@/lib/supabase/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

  if (code) {
    const supabase = await createSupabaseServerClient()
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent(error.message)}`)
      }

      if (data.user && data.session) {
        // 1. First create user profile (required for RLS policies)
        try {
          const { authService } = await import('@/lib/auth/supabase-auth-service')
          await authService.createUserProfile(data.user)
          console.log('✅ User profile created for OAuth user:', data.user.id)
        } catch (profileError) {
          console.error('❌ Error creating user profile:', profileError)
        }

        // 2. Then initialize user board (after profile exists)
        try {
          const { initializeUserBoard } = await import('@/lib/init-user-board')
          await initializeUserBoard(data.user.id)
          console.log('✅ Board initialized for OAuth user:', data.user.id)
        } catch (setupError) {
          console.error('❌ Error setting up new user board:', setupError)
          // Don't fail the OAuth flow for setup errors
        }

        // 3. Finally create session record for tracking
        try {
          const { SessionManager } = await import('@/lib/auth/session-manager')
          const userAgent = request.headers.get('user-agent') || 'Unknown'
          const ipAddress = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           '127.0.0.1'
          
          await SessionManager.createServerSessionRecord(
            data.session.access_token,
            data.user.id,
            userAgent,
            ipAddress
          )
          console.log('✅ Session record created for OAuth user:', data.user.id)
        } catch (sessionError) {
          console.error('❌ Error creating session record:', sessionError)
          // Don't fail the OAuth flow for session tracking errors
        }
      }

      // Redirect to the intended destination or dashboard
      const finalRedirect = redirectTo || '/dashboard'
      return NextResponse.redirect(`${origin}${finalRedirect}`)
      
    } catch (error) {
      console.error('OAuth exchange error:', error)
      return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // No code provided, redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('No authorization code provided')}`)
}