import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './lib/supabase/database.types'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add HSTS header for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'http:') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl)
  }
  
  // Block suspicious requests
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const suspiciousPatterns = [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
    'acunetix', 'nessus', 'openvas', 'w3af'
  ]
  
  if (suspiciousPatterns.some(pattern => userAgent.includes(pattern))) {
    console.warn('🚨 Blocked suspicious request:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent,
      url: request.url
    })
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  // Rate limiting for sensitive endpoints
  const sensitiveEndpoints = ['/api/auth/', '/api/profile', '/api/sessions']
  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
    request.nextUrl.pathname.startsWith(endpoint)
  )
  
  if (isSensitiveEndpoint) {
    // Add rate limiting headers (actual rate limiting is handled in individual routes)
    response.headers.set('X-RateLimit-Policy', 'Enabled')
  }
  
  // Prevent access to sensitive files
  const blockedPaths = [
    '/.env', '/.env.local', '/.env.production',
    '/config/', '/logs/', '/.git/', '/node_modules/',
    '/supabase/config.toml'
  ]
  
  if (blockedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Enhance cookie security
            const secureOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            }
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            }
            response.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  )

  // Try to get user from Supabase SSR
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Log security event but don't expose details
    console.error('Session validation error:', error)
    
    // Fallback: check custom cookies
    const accessToken = request.cookies.get('sb-access-token')?.value
    const userCookie = request.cookies.get('sb-user')?.value
    
    if (accessToken && userCookie) {
      try {
        user = JSON.parse(userCookie)
      } catch (parseError) {
        console.error('Error parsing user cookie in proxy:', parseError)
      }
    }
  }

  // Route protection logic
  const isSignInPage = request.nextUrl.pathname.startsWith("/sign-in");
  const isSignUpPage = request.nextUrl.pathname.startsWith("/sign-up");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isSettingsPage = request.nextUrl.pathname.startsWith("/settings");
  const isHomePage = request.nextUrl.pathname === "/";
  const isRecoveryPage = request.nextUrl.pathname.startsWith("/recovery");
  const isResetPasswordPage = request.nextUrl.pathname.startsWith("/reset-password");

  // Redirect authenticated users away from auth pages and home page (except recovery pages)
  if ((isSignInPage || isSignUpPage || isHomePage) && user && !isRecoveryPage && !isResetPasswordPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if ((isDashboardPage || isSettingsPage) && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}