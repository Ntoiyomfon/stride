import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Apply security headers and session management
  const response = await updateSession(request)
  
  // Add additional security measures
  const url = request.nextUrl.clone()
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
    url.protocol = 'https:'
    return NextResponse.redirect(url)
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
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}