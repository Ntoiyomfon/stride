import { NextRequest } from 'next/server'

// Security-focused error handler that prevents information leakage
export class SecureErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  // Sanitize error messages to prevent information disclosure
  static sanitizeError(error: any): string {
    if (!error) return 'An unexpected error occurred'

    // In development, show more details
    if (this.isDevelopment) {
      return error.message || error.toString()
    }

    // In production, use generic messages for security
    const message = error.message || error.toString()

    // Database errors
    if (message.includes('duplicate key') || message.includes('unique constraint')) {
      return 'This item already exists'
    }
    
    if (message.includes('foreign key') || message.includes('violates')) {
      return 'Invalid reference or constraint violation'
    }

    if (message.includes('permission denied') || message.includes('access denied')) {
      return 'Access denied'
    }

    if (message.includes('not found') || message.includes('does not exist')) {
      return 'Resource not found'
    }

    // Authentication errors
    if (message.includes('invalid credentials') || message.includes('authentication')) {
      return 'Invalid credentials'
    }

    if (message.includes('token') || message.includes('jwt') || message.includes('session')) {
      return 'Authentication required'
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many requests. Please try again later.'
    }

    // Generic fallback
    return 'An error occurred while processing your request'
  }

  // Log security events without exposing sensitive information
  static logSecurityEvent(
    event: string,
    request: NextRequest,
    details?: any,
    userId?: string
  ): void {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      url: request.url,
      method: request.method,
      userId,
      // Only include non-sensitive details
      details: this.sanitizeLogDetails(details)
    }

    // In production, send to your logging service
    if (this.isDevelopment) {
      console.warn('🔒 Security Event:', logData)
    } else {
      // TODO: Send to your logging service (e.g., Sentry, LogRocket, etc.)
      console.warn('Security event logged:', { event, userId, ip: logData.ip })
    }
  }

  // Get client IP safely
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    return forwarded?.split(',')[0] || realIp || 'unknown'
  }

  // Sanitize log details to prevent sensitive data leakage
  private static sanitizeLogDetails(details: any): any {
    if (!details) return null

    const sanitized = { ...details }

    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'session',
      'email', 'phone', 'ssn', 'credit', 'card', 'account'
    ]

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj

      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        
        // Check if key contains sensitive information
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return sanitizeObject(sanitized)
  }

  // Create secure API response
  static createSecureResponse(
    data: any = null,
    error: any = null,
    status: number = 200,
    request?: NextRequest
  ): Response {
    const response: any = {}

    if (error) {
      response.error = this.sanitizeError(error)
      response.success = false
      
      // Log security-relevant errors
      if (request && (status === 401 || status === 403 || status === 429)) {
        this.logSecurityEvent(
          `HTTP_${status}`,
          request,
          { originalError: error.message }
        )
      }
    } else {
      response.success = true
      if (data !== null) {
        response.data = data
      }
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  }

  // Validate and sanitize input
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Basic XSS prevention
      return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim()
        .substring(0, 1000) // Limit length
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50)
        if (cleanKey) {
          sanitized[cleanKey] = this.sanitizeInput(value)
        }
      }
      return sanitized
    }

    return input
  }

  // Check for suspicious patterns in requests
  static detectSuspiciousActivity(request: NextRequest): {
    suspicious: boolean
    reasons: string[]
  } {
    const reasons: string[] = []
    const url = request.url.toLowerCase()
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''

    // Check for common attack patterns
    const suspiciousPatterns = [
      'script', 'javascript:', 'vbscript:', 'onload', 'onerror',
      'union', 'select', 'drop', 'delete', 'insert', 'update',
      '../', '..\\', '/etc/', '/proc/', 'cmd.exe', 'powershell'
    ]

    for (const pattern of suspiciousPatterns) {
      if (url.includes(pattern)) {
        reasons.push(`Suspicious URL pattern: ${pattern}`)
      }
    }

    // Check for bot-like behavior
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper']
    if (botPatterns.some(pattern => userAgent.includes(pattern))) {
      reasons.push('Bot-like user agent detected')
    }

    // Check for missing or suspicious user agent
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or suspicious user agent')
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    }
  }
}

// Utility function for secure API route handling
export async function secureApiHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<any>
): Promise<Response> {
  try {
    // Check for suspicious activity
    const suspiciousCheck = SecureErrorHandler.detectSuspiciousActivity(request)
    if (suspiciousCheck.suspicious) {
      SecureErrorHandler.logSecurityEvent(
        'SUSPICIOUS_REQUEST',
        request,
        { reasons: suspiciousCheck.reasons }
      )
      
      return SecureErrorHandler.createSecureResponse(
        null,
        new Error('Request blocked for security reasons'),
        403,
        request
      )
    }

    // Execute the handler
    const result = await handler(request)
    return SecureErrorHandler.createSecureResponse(result, null, 200, request)
    
  } catch (error) {
    console.error('API Error:', error)
    
    // Determine appropriate status code
    let status = 500
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        status = 401
      } else if (error.message.includes('forbidden') || error.message.includes('access denied')) {
        status = 403
      } else if (error.message.includes('not found')) {
        status = 404
      } else if (error.message.includes('rate limit')) {
        status = 429
      }
    }

    return SecureErrorHandler.createSecureResponse(null, error, status, request)
  }
}