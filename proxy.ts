import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './lib/supabase/database.types'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
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