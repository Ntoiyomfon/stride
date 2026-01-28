import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/utils'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('🔍 OAuth callback hit with code:', code ? 'present' : 'missing')

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      
      console.log('🔄 Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent(error.message)}`)
      }

      console.log('✅ Session exchange successful, user:', data.user?.id)

      if (data.user && data.session) {
        console.log('🚀 Starting user setup for OAuth user:', data.user.id)
        
        // 1. First create user profile (required for RLS policies)
        try {
          console.log('📝 Creating user profile...')
          const { authService } = await import('@/lib/auth/supabase-auth-service')
          await authService.createUserProfile(data.user)
          console.log('✅ User profile created for OAuth user:', data.user.id)
        } catch (profileError) {
          console.error('❌ Error creating user profile:', profileError)
        }

        // 2. Then initialize user board (after profile exists)
        try {
          console.log('🏗️ Initializing user board...')
          const { initializeUserBoard } = await import('@/lib/init-user-board')
          await initializeUserBoard(data.user.id)
          console.log('✅ Board initialized for OAuth user:', data.user.id)
        } catch (setupError) {
          console.error('❌ Error setting up new user board:', setupError)
          // Don't fail the OAuth flow for setup errors
        }

        // 3. Finally create session record for tracking
        try {
          console.log('📊 Creating session record...')
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

      console.log('🎯 Redirecting to:', next)
      // Successful authentication, redirect to the intended page
      return NextResponse.redirect(`${origin}${next}`)
      
    } catch (error) {
      console.error('❌ Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('Authentication failed')}`)
    }
  }

  console.log('❌ No code provided in OAuth callback')
  // No code provided, redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=oauth_error&message=${encodeURIComponent('No authorization code provided')}`)
}