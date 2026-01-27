import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth/auth";

export default async function proxy(request: NextRequest) {
  const session = await getSession();

  const isSignInPage = request.nextUrl.pathname.startsWith("/sign-in");
  const isSignUpPage = request.nextUrl.pathname.startsWith("/sign-up");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isSettingsPage = request.nextUrl.pathname.startsWith("/settings");
  const isHomePage = request.nextUrl.pathname === "/";

  // Update session activity for authenticated users (async, don't wait)
  if (session?.session?.id && session?.user?.id) {
    // Import dynamically to avoid circular imports
    import('./lib/actions/session-management').then(({ updateSessionActivity }) => {
      updateSessionActivity(session.session.id).catch(error => {
        console.error('Failed to update session activity:', error);
      });
    }).catch(error => {
      console.error('Failed to import session management:', error);
    });
  }

  // Enhanced security: Check if user exists in database for protected routes
  if ((isDashboardPage || isSettingsPage) && session?.user?.id) {
    try {
      // Verify user still exists in database
      const { getUser } = await import('./lib/actions/user');
      const user = await getUser();
      
      if (!user) {
        // User was deleted, clear session and redirect to sign-in
        console.log(`User ${session.user.id} not found in database, redirecting to sign-in`);
        
        const response = NextResponse.redirect(new URL("/sign-in", request.url));
        
        // Clear auth cookies
        const cookiesToClear = [
          'better-auth.session_token',
          'better-auth.csrf_token', 
          'better-auth.session',
          'better-auth.csrf'
        ];
        
        cookiesToClear.forEach(cookieName => {
          response.cookies.set(cookieName, '', {
            expires: new Date(0),
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
        });
        
        return response;
      }
    } catch (error) {
      console.error('Error verifying user existence:', error);
      // On error, redirect to sign-in for security
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if ((isSignInPage || isSignUpPage) && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if ((isDashboardPage || isSettingsPage) && !session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}